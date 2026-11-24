const mongoose = require('mongoose');
const { AppError } = require('../utils/appError');
const agentIaRepository = require('../repositories/agent_ia_repository');
const commentaryRepository = require('../repositories/commentAnalysis.repository');
const contextRepository = require('../repositories/analysisContext.repository');
const aiAnalysisRepository = require('../repositories/aiAnalysis.repository');
const { summaryParamsSchema } = require('../validators/commentAnalysis.validator');
const { chunk, cleanText, cleanList, buildFingerprint } = require('../utils/analysis.util');

const BATCH_SIZE = 30;
const MAX_COMMENT_LENGTH = 1200;
const SUMMARY_MAX_TOKENS = 1200;
const MERGE_MAX_TOKENS = 1600;

const SUMMARIZE_SYSTEM = `Eres analista de comentarios de trail running. Redacta en español.
Devuelve SOLO un objeto JSON con esta forma:
{"summary":"...","highlights":["..."],"improvements":["..."]}
Reglas:
- "summary" debe tener entre 2 y 4 frases y resumir la opinión mayoritaria.
- "highlights" y "improvements" pueden tener hasta 3 elementos; inclúyelos solo si hay evidencia clara.
- No incluyas nombres, correos, teléfonos ni datos personales.
- No inventes experiencias que no aparezcan en los comentarios.`;

const MERGE_SYSTEM = `Eres analista de comentarios de trail running. Combina varios resúmenes parciales en uno solo.
Devuelve SOLO un objeto JSON con esta forma:
{"summary":"...","highlights":["..."],"improvements":["..."]}
El resumen final debe tener entre 2 y 4 frases. Máximo 3 highlights y 3 improvements.
No incluyas datos personales ni inventes información que no aparezca en los resúmenes parciales.`;

function validateDepartureId(rawId) {
  const result = summaryParamsSchema.safeParse({ departureId: rawId });
  if (!result.success) {
    throw new AppError('Identificador de salida inválido', 400, 'VALIDATION_ERROR');
  }
  return result.data.departureId;
}

function serializeSummary(document) {
  const generatedAt = document.generatedAt || document.created_At || new Date();
  return {
    state: document.state || 'ready',
    summary: document.summary || '',
    highlights: document.highlights || [],
    improvements: document.improvements || [],
    commentCount: document.commentCount || 0,
    model: document.model || '',
    generatedAt: generatedAt instanceof Date ? generatedAt.toISOString() : generatedAt
  };
}

function sanitizeComments(comments) {
  return comments.map((comment) => ({
    id: String(comment._id),
    content: cleanText(comment.content).slice(0, MAX_COMMENT_LENGTH)
  }));
}

async function callGroq(options) {
  try {
    return await agentIaRepository.completeJson(options);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('El servicio IA no está disponible', 502, 'AI_UNAVAILABLE');
  }
}

class CommentSummaryService {
  async getForDeparture(rawDepartureId) {
    const departureId = validateDepartureId(rawDepartureId);
    if (!mongoose.isValidObjectId(departureId)) {
      throw new AppError('Identificador de salida inválido', 400, 'VALIDATION_ERROR');
    }

    const departure = await contextRepository.findDepartureById(departureId);
    if (!departure) {
      throw new AppError('No se ha encontrado la salida', 404, 'DEPARTURE_NOT_FOUND');
    }

    const comments = await commentaryRepository.findForSummary(departureId);
    const fingerprint = buildFingerprint(`summary:${departureId}`, comments);
    const cached = await aiAnalysisRepository.findSummary(departureId);

    if (cached && cached.fingerprint === fingerprint) {
      return serializeSummary(cached);
    }

    if (comments.length === 0) {
      const saved = await aiAnalysisRepository.upsertSummary(departureId, {
        fingerprint,
        state: 'no_data',
        summary: '',
        highlights: [],
        improvements: [],
        commentCount: 0,
        model: ''
      });
      return serializeSummary(saved);
    }

    let event = null;
    if (departure.eventId) {
      event = await contextRepository.findEventById(departure.eventId);
    }
    const context = {
      eventName: event?.name || '',
      departureSlug: departure.slug || ''
    };

    const partials = [];
    for (const batch of chunk(sanitizeComments(comments), BATCH_SIZE)) {
      partials.push(
        await callGroq({
          system: SUMMARIZE_SYSTEM,
          user: JSON.stringify({ context, comments: batch }),
          maxTokens: SUMMARY_MAX_TOKENS
        })
      );
    }

    let result = partials[0] || {};
    if (partials.length > 1) {
      result = await callGroq({
        system: MERGE_SYSTEM,
        user: JSON.stringify({ commentCount: comments.length, partials }),
        maxTokens: MERGE_MAX_TOKENS
      });
    }

    const summary = cleanText(result.summary);
    if (!summary) {
      throw new AppError('El servicio IA no ha generado un resumen', 502, 'AI_INVALID_RESPONSE');
    }

    const saved = await aiAnalysisRepository.upsertSummary(departureId, {
      fingerprint,
      state: 'ready',
      summary,
      highlights: cleanList(result.highlights, 3),
      improvements: cleanList(result.improvements, 3),
      commentCount: comments.length,
      model: agentIaRepository.modelName()
    });

    return serializeSummary(saved);
  }
}

module.exports = new CommentSummaryService();
