export interface RatingSummary {
  average: number | null;
  total: number;
  mine: number | null;
}

export interface RatingRecord {
  _id: string;
  userId: string;
  departureId: string;
  eventId: string;
  score: number;
  review: string;
  mine: boolean;
  created_At: string;
  updated_at: string;
}

export interface RatingMutation {
  rating: RatingRecord | null;
  summary: RatingSummary;
}

export interface RatePayload {
  score: number;
  review?: string;
}

export const EMPTY_RATING_SUMMARY: RatingSummary = {
  average: null,
  total: 0,
  mine: null
};
