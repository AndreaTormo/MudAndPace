export type CommentStatus = 'visible' | 'hidden' | 'reported';

export interface CommentAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  deleted?: boolean;
}

export interface CommentEventRef {
  _id: string;
  name: string;
  slug: string;
}

export interface Comment {
  _id: string;
  departureId: string;
  userId: string;
  content: string;
  status: CommentStatus;
  reportCount: number;
  reportedByMe?: boolean;
  author: CommentAuthor;
  variant?: string | null;
  event?: CommentEventRef | null;
  departureSlug?: string | null;
  deleted_at?: string | null;
  created_At: string;
  updated_at: string;
}

export interface CommentPagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CommentList {
  data: Comment[];
  pagination: CommentPagination;
}

export interface CreateCommentPayload {
  content: string;
}

export type UpdateCommentPayload = CreateCommentPayload;
