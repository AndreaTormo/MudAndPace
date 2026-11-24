export type CommentSummaryState = 'ready' | 'no_data';

export interface CommentSummary {
  state: CommentSummaryState;
  summary: string;
  highlights: string[];
  improvements: string[];
  commentCount: number;
  model: string;
  generatedAt: string;
}

export const EMPTY_COMMENT_SUMMARY: CommentSummary = {
  state: 'no_data',
  summary: '',
  highlights: [],
  improvements: [],
  commentCount: 0,
  model: '',
  generatedAt: ''
};

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface SentimentBucket {
  count: number;
  percentage: number;
}

export interface SentimentDistribution {
  positive: SentimentBucket;
  neutral: SentimentBucket;
  negative: SentimentBucket;
}

export interface SentimentRankingItem {
  id: string;
  name: string;
  total: number;
  score: number;
  distribution: SentimentDistribution;
}

export interface SentimentAggregate {
  total: number;
  distribution: SentimentDistribution;
  score: number;
}

export interface SentimentTrendPoint extends SentimentAggregate {
  month: string;
}

export interface RatingVariantReport {
  name: string;
  total: number;
  average: number | null;
  reviewCount: number;
  sentiment: SentimentAggregate;
}

export interface RatingReport {
  total: number;
  average: number | null;
  distribution: Record<1 | 2 | 3 | 4 | 5, SentimentBucket>;
  reviewCount: number;
  sentiment: SentimentAggregate;
  byVariant: RatingVariantReport[];
}

export interface SentimentReport {
  scope: 'global' | 'departure' | 'event';
  target: { id: string | null; name: string; variant: string };
  state: 'ready' | 'no_data';
  total: number;
  distribution: SentimentDistribution;
  score: number;
  topThemes: { theme: string; count: number }[];
  trend: SentimentTrendPoint[];
  trendSummary: string;
  rankings: {
    departures: SentimentRankingItem[];
    events: SentimentRankingItem[];
    variants: SentimentRankingItem[];
  };
  ratings: RatingReport;
  commentCount: number;
  model: string;
  generatedAt: string;
}

const EMPTY_DISTRIBUTION: SentimentDistribution = {
  positive: { count: 0, percentage: 0 },
  neutral: { count: 0, percentage: 0 },
  negative: { count: 0, percentage: 0 }
};

const EMPTY_RATING_DISTRIBUTION: RatingReport['distribution'] = {
  1: { count: 0, percentage: 0 },
  2: { count: 0, percentage: 0 },
  3: { count: 0, percentage: 0 },
  4: { count: 0, percentage: 0 },
  5: { count: 0, percentage: 0 }
};

const EMPTY_AGGREGATE: SentimentAggregate = {
  total: 0,
  distribution: EMPTY_DISTRIBUTION,
  score: 0
};

export const EMPTY_SENTIMENT_REPORT: SentimentReport = {
  scope: 'global',
  target: { id: null, name: 'Todas las salidas', variant: '' },
  state: 'no_data',
  total: 0,
  distribution: EMPTY_DISTRIBUTION,
  score: 0,
  topThemes: [],
  trend: [],
  trendSummary: '',
  rankings: { departures: [], events: [], variants: [] },
  ratings: {
    total: 0,
    average: null,
    distribution: EMPTY_RATING_DISTRIBUTION,
    reviewCount: 0,
    sentiment: EMPTY_AGGREGATE,
    byVariant: []
  },
  commentCount: 0,
  model: '',
  generatedAt: ''
};
