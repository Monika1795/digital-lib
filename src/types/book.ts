export interface OpenLibraryDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  edition_count?: number;
  ratings_average?: number;
  ratings_count?: number;
}

export interface OpenLibrarySearchResponse {
  numFound?: number;
  num_found?: number;
  start?: number;
  docs?: OpenLibraryDoc[];
}

export interface Book {
  id: string;
  title: string;
  authors: string[];
  firstPublishYear: number | null;
  coverUrl: string | null;
  subjects: string[];
  editionCount: number | null;
  rating: number | null;
  openLibraryUrl: string;
}

export type SortOption = 'relevance' | 'new' | 'old' | 'editions';

export interface SearchParams {
  query: string;
  page: number;
  limit: number;
  sort: SortOption;
}

export interface SearchResult {
  books: Book[];
  total: number;
  page: number;
}
