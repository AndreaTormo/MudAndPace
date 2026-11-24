const { AppError } = require('../utils/appError');
const agentIaRepository = require('../repositories/agent_ia_repository');
const commentaryRepository = require('../repositories/commentAnalysis.repository');
const ratingRepository = require('../repositories/ratingAnalysis.repository');
const contextRepository = require('../repositories/analysisContext.repository');
const aiAnalysisRepository = require('../repositories/aiAnalysis.repository');
const { sentimentQuerySchema } = require('../validators/commentAnalysis.validator');
const { chunk, unique, cleanText, cleanList, hashContent, buildFingerprint } = require('../utils/analysis.util');
const { resolveVariantName } = require('../utils/variant.util');

const BATCH_SIZE = 40;
const MIN_RANKING_COMMENTS = 5;
const MAX_RANKING_ITEMS = 5;
const MAX_THEMES = 10;
const MAX_COMMENT_LENGTH = 1200;
const MAX_REVIEW_LENGTH = 600;
const LABELS = ['positive', 'neutral', 'negative'];
const RATING_SCORES = [1, 2, 3, 4, 5];
const CACHE_VERSION = 'v2';

const CLASSIFY_SYSTEM = `Eres analista de sentimiento de comentarios de trail running. Clasifica CADA comentario.
Devuelve SOLO un objeto JSON con esta forma:
{"labels":[{"id":"id-del-comentario","label":"positive|neutral|negative","themes":["tema"]}]}
Reglas:
- Devuelve exactamente un objeto "labels" por cada comentario recibido, en el mismo orden.
- "label" solo puede ser positive, neutral o negative.
- "themes" incluye hasta 3 temas cortos en minúsculas, solo si aparecen en el comentario.
- No incluyas nombres, correos, teléfonos ni datos personales.`;

const TREND_SYSTEM = `Eres analista de comentarios de trail running. Redacta en español.
Devuelve SOLO un objeto JSON con esta forma: {"summary":"..."}.
Describe en una frase la evolución mensual del sentimiento usando los datos recibidos. No inventes datos.`;

function validateQuery(rawQuery) {
  const result = sentimentQuerySchema.safeParse(rawQuery || {});
  if (!result.success) {
    throw new AppError(
      'Filtros de análisis inválidos',
      400,
      'VALIDATION_ERROR',
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
    );
  }
  return result.data;
}

async function callGroq(options) {
  try {
    return await agentIaRepository.completeJson(options);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('El servicio IA no está disponible', 502, 'AI_UNAVAILABLE');
  }
}

function emptyCounts() {
  return { positive: 0, neutral: 0, negative: 0 };
}

function scoreFrom(counts, total) {
  if (!total) return 0;
  return Math.round(((counts.positive + counts.neutral * 0.5) / total) * 100);
}

function aggregateFrom(counts, total) {
  return {
    total,
    distribution: Object.fromEntries(
      LABELS.map((label) => [
        label,
        { count: counts[label], percentage: total ? Math.round((counts[label] / total) * 100) : 0 }
      ])
    ),
    score: scoreFrom(counts, total)
  };
}

function emptyRatingsReport() {
  return {
    total: 0,
    average: null,
    distribution: Object.fromEntries(
      RATING_SCORES.map((score) => [score, { count: 0, percentage: 0 }])
    ),
    reviewCount: 0,
    sentiment: aggregateFrom(emptyCounts(), 0),
    byVariant: []
  };
}

function emptyReport(scope, targetId, targetName, targetVariant = '') {
  return {
    scope,
    target: { id: targetId ? String(targetId) : null, name: targetName, variant: targetVariant },
    state: 'no_data',
    total: 0,
    distribution: aggregateFrom(emptyCounts(), 0).distribution,
    score: 0,
    topThemes: [],
    trend: [],
    trendSummary: '',
    rankings: { departures: [], events: [], variants: [] },
    ratings: emptyRatingsReport(),
    commentCount: 0,
    model: ''
  };
}

function rankGroups(groups, nameFor) {
  return [...groups.entries()]
    .map(([id, counts]) => ({
      id,
      name: nameFor(id) || id,
      ...aggregateFrom(counts, counts.positive + counts.neutral + counts.negative)
    }))
    .filter((item) => item.total >= MIN_RANKING_COMMENTS)
    .sort((a, b) => b.score - a.score || b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, MAX_RANKING_ITEMS);
}

function buildRatingsReport(ratings, labels, variantFor) {
  const labelsById = new Map(labels.map((label) => [String(label.commentId), label]));
  const scoreCounts = Object.fromEntries(RATING_SCORES.map((score) => [score, 0]));
  const reviewCounts = emptyCounts();
  const byVariant = new Map();
  let scoreSum = 0;
  let scoreTotal = 0;
  let reviewTotal = 0;

  const newBucket = () => ({ total: 0, scoreSum: 0, scoreTotal: 0, reviewCounts: emptyCounts(), reviewTotal: 0 });
  const average = (sum, total) => (total ? Math.round((sum / total) * 10) / 10 : null);

  for (const rating of ratings) {
    const score = Number(rating.score);
    const variant = variantFor(rating.departureId) || 'Sin modalidad';
    if (!byVariant.has(variant)) byVariant.set(variant, newBucket());

    const bucket = byVariant.get(variant);
    bucket.total += 1;

    if (RATING_SCORES.includes(score)) {
      scoreCounts[score] += 1;
      scoreSum += score;
      scoreTotal += 1;
      bucket.scoreSum += score;
      bucket.scoreTotal += 1;
    }

    const label = labelsById.get(String(rating._id));
    if (label && LABELS.includes(label.label)) {
      reviewCounts[label.label] += 1;
      bucket.reviewCounts[label.label] += 1;
      reviewTotal += 1;
      bucket.reviewTotal += 1;
    }
  }

  return {
    total: ratings.length,
    average: average(scoreSum, scoreTotal),
    distribution: Object.fromEntries(
      RATING_SCORES.map((score) => [
        score,
        {
          count: scoreCounts[score],
          percentage: scoreTotal ? Math.round((scoreCounts[score] / scoreTotal) * 100) : 0
        }
      ])
    ),
    reviewCount: reviewTotal,
    sentiment: aggregateFrom(reviewCounts, reviewTotal),
    byVariant: [...byVariant.entries()]
      .map(([name, bucket]) => ({
        name,
        total: bucket.total,
        average: average(bucket.scoreSum, bucket.scoreTotal),
        reviewCount: bucket.reviewTotal,
        sentiment: aggregateFrom(bucket.reviewCounts, bucket.reviewTotal)
      }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  };
}

function buildReport(
  comments,
  labels,
  ratings,
  { scope, targetId, targetName, targetVariant = '', departures = [], events = [], model = '' }
) {
  const commentsById = new Map(comments.map((comment) => [String(comment._id), comment]));
  const departureById = new Map(departures.map((departure) => [String(departure._id), departure]));
  const eventById = new Map(events.map((event) => [String(event._id), event]));
  const eventByDeparture = new Map(departures.map((departure) => [String(departure._id), String(departure.eventId)]));
  const variantFor = (departureId) => {
    const departure = departureById.get(String(departureId));
    const event = departure ? eventById.get(String(departure.eventId)) : null;
    return resolveVariantName(departure, event) || '';
  };

  const counts = emptyCounts();
  const themeCounts = new Map();
  const byDeparture = new Map();
  const byEvent = new Map();
  const byVariant = new Map();
  const byMonth = new Map();

  const increase = (map, key, label) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, emptyCounts());
    map.get(key)[label] += 1;
  };

  for (const label of labels) {
    if (label.source === 'rating') continue;
    const comment = commentsById.get(String(label.commentId));
    if (!comment || !LABELS.includes(label.label)) continue;

    counts[label.label] += 1;
    for (const theme of label.themes || []) {
      themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
    }

    const departureId = String(comment.departureId);
    const eventId = eventByDeparture.get(departureId);
    increase(byDeparture, departureId, label.label);
    if (eventId) increase(byEvent, eventId, label.label);
    increase(byVariant, variantFor(departureId) || 'Sin modalidad', label.label);

    const createdAt = comment.created_At instanceof Date ? comment.created_At : new Date(comment.created_At);
    const month = Number.isNaN(createdAt.getTime()) ? 'unknown' : createdAt.toISOString().slice(0, 7);
    increase(byMonth, month, label.label);
  }

  const total = LABELS.reduce((sum, label) => sum + counts[label], 0);
  const trend = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, monthCounts]) => ({
      month,
      ...aggregateFrom(monthCounts, monthCounts.positive + monthCounts.neutral + monthCounts.negative)
    }));

  const topThemes = [...themeCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_THEMES)
    .map(([theme, count]) => ({ theme, count }));

  return {
    scope,
    target: { id: targetId ? String(targetId) : null, name: targetName, variant: targetVariant },
    state: 'ready',
    total,
    ...aggregateFrom(counts, total),
    topThemes,
    trend,
    trendSummary: '',
    rankings: {
      departures: rankGroups(byDeparture, (id) => departureById.get(id)?.slug || id),
      events: rankGroups(byEvent, (id) => eventById.get(id)?.name || id),
      variants: rankGroups(byVariant, (name) => name)
    },
    ratings: buildRatingsReport(ratings, labels, variantFor),
    commentCount: total,
    model
  };
}

function serializeSentiment(document) {
  const aggregate = document.aggregate || {};
  const generatedAt = document.generatedAt || document.created_At || new Date();
  return {
    ...emptyReport(document.scope, document.targetId, aggregate.target?.name || '', aggregate.target?.variant || ''),
    ...aggregate,
    state: document.state || 'ready',
    model: document.model || '',
    generatedAt: generatedAt instanceof Date ? generatedAt.toISOString() : generatedAt
  };
}

async function classifyAll(items) {
  const labels = [];

  for (const batch of chunk(items, BATCH_SIZE)) {
    const result = await callGroq({
      system: CLASSIFY_SYSTEM,
      user: JSON.stringify({
        comments: batch.map((item) => ({
          id: String(item.id),
          content: cleanText(item.content).slice(
            0,
            item.source === 'rating' ? MAX_REVIEW_LENGTH : MAX_COMMENT_LENGTH
          ),
          ...(item.variant ? { variant: item.variant } : {}),
          ...(item.ratingScore ? { ratingScore: item.ratingScore } : {})
        }))
      }),
      maxTokens: Math.min(4000, 160 + batch.length * 140)
    });

    const returnedLabels = Array.isArray(result?.labels) ? result.labels : [];
    if (returnedLabels.length !== batch.length) {
      throw new AppError('El servicio IA ha devuelto un número incorrecto de clasificaciones', 502, 'AI_INVALID_RESPONSE');
    }

    returnedLabels.forEach((classified, index) => {
      if (!LABELS.includes(classified?.label)) {
        throw new AppError('El servicio IA ha devuelto una clasificación desconocida', 502, 'AI_INVALID_RESPONSE');
      }

      const source = batch[index];
      labels.push({
        commentId: String(classified.id || source.id),
        source: source.source || 'comment',
        contentHash: source.contentHash || '',
        label: classified.label,
        themes: cleanList(classified.themes, 3),
        variant: source.variant || '',
        ratingScore: source.ratingScore ?? null,
        classifiedAt: new Date()
      });
    });
  }

  return labels;
}

class SentimentAnalysisService {
  async getReport(rawQuery) {
    const query = validateQuery(rawQuery);
    const { scope, includeDeleted, includeRatings } = query;

    let targetId = null;
    let targetName = 'Todas las salidas';
    let targetVariant = '';
    let departureIds = [];

    if (scope === 'departure') {
      targetId = query.departureId;
      const departure = await contextRepository.findDepartureById(targetId);
      if (!departure) {
        throw new AppError('No se ha encontrado la salida', 404, 'DEPARTURE_NOT_FOUND');
      }
      const event = departure.eventId
        ? await contextRepository.findEventById(departure.eventId)
        : null;
      targetVariant = resolveVariantName(departure, event) || '';
      targetName = event
        ? `${event.name || event.slug || departure.slug}${targetVariant ? ` · ${targetVariant}` : ''}`
        : departure.slug || String(departure._id);
      departureIds = [targetId];
    }

    if (scope === 'event') {
      targetId = query.eventId;
      const event = await contextRepository.findEventById(targetId);
      if (!event) {
        throw new AppError('No se ha encontrado el evento', 404, 'EVENT_NOT_FOUND');
      }
      targetName = event.name || event.slug || String(event._id);
      const eventDepartures = await contextRepository.findDeparturesByEventId(targetId);
      departureIds = eventDepartures.map((departure) => departure._id);
    }

    const [comments, ratings] = await Promise.all([
      commentaryRepository.findForSentiment({ departureIds, includeDeleted }),
      includeRatings
        ? ratingRepository.findForSentiment({ departureIds, includeDeleted })
        : Promise.resolve([])
    ]);

    const fingerprint = buildFingerprint(
      `${CACHE_VERSION}:sentiment:${scope}:${targetId || 'all'}`,
      comments,
      {
        includeStatus: true,
        meta: `${includeDeleted ? 'all' : 'active'}:${includeRatings ? 'ratings' : 'comments'}:p1:${targetVariant}`
      },
      ratings
    );
    const key = `${CACHE_VERSION}:${scope}:${targetId ? String(targetId) : 'all'}:${
      includeDeleted ? 'all' : 'active'
    }:${includeRatings ? 'ratings' : 'comments'}`;
    const cached = await aiAnalysisRepository.findSentiment(key);

    if (cached && cached.fingerprint === fingerprint) {
      return serializeSentiment(cached);
    }

    if (comments.length === 0 && ratings.length === 0) {
      const saved = await aiAnalysisRepository.upsertSentiment(key, {
        scope,
        targetId,
        fingerprint,
        state: 'no_data',
        labels: [],
        aggregate: emptyReport(scope, targetId, targetName, targetVariant),
        model: ''
      });
      return serializeSentiment(saved);
    }

    const scopeDepartureIds = unique(
      [...comments, ...ratings].map((item) => String(item.departureId))
    );
    const departures = scopeDepartureIds.length
      ? await contextRepository.findDeparturesByIds(scopeDepartureIds)
      : [];
    const eventIds = unique(departures.map((departure) => String(departure.eventId)));
    const events = eventIds.length ? await contextRepository.findEventsByIds(eventIds) : [];

    const variantFor = (departureId) => {
      const departure = departures.find((item) => String(item._id) === String(departureId));
      const event = departure
        ? events.find((item) => String(item._id) === String(departure.eventId))
        : null;
      return resolveVariantName(departure, event) || '';
    };

    const items = [
      ...comments.map((comment) => ({
        id: String(comment._id),
        source: 'comment',
        content: comment.content,
        contentHash: comment.contentHash || '',
        variant: variantFor(comment.departureId)
      })),
      ...ratings
        .filter((rating) => cleanText(rating.review))
        .map((rating) => ({
          id: String(rating._id),
          source: 'rating',
          content: rating.review,
          contentHash: hashContent(rating.review),
          variant: variantFor(rating.departureId),
          ratingScore: Number(rating.score)
        }))
    ];
    const labels = items.length ? await classifyAll(items) : [];

    const report = buildReport(comments, labels, ratings, {
      scope,
      targetId,
      targetName,
      targetVariant,
      departures,
      events,
      model: agentIaRepository.modelName()
    });

    if (report.trend.length >= 2) {
      try {
        const result = await callGroq({
          system: TREND_SYSTEM,
          user: JSON.stringify({ trend: report.trend }),
          maxTokens: 150
        });
        report.trendSummary = cleanText(result.summary);
      } catch {
        report.trendSummary = '';
      }
    }

    const saved = await aiAnalysisRepository.upsertSentiment(key, {
      scope,
      targetId,
      fingerprint,
      state: 'ready',
      labels,
      aggregate: report,
      model: agentIaRepository.modelName()
    });

    return serializeSentiment(saved);
  }
}

module.exports = new SentimentAnalysisService();
