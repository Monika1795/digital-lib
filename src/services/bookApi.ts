import type {
  Book,
  OpenLibraryDoc,
  OpenLibrarySearchResponse,
  SearchParams,
  SearchResult,
  SortOption,
} from '../types/book';

const API_BASE = 'https://openlibrary.org/search.json';
const FIELDS = [
  'key',
  'title',
  'author_name',
  'first_publish_year',
  'cover_i',
  'subject',
  'edition_count',
  'ratings_average',
  'ratings_count',
].join(',');

const MIN_RATINGS_COUNT = 5;
const cache = new Map<string, SearchResult>();

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function coverUrlFromId(coverId: number | undefined): string | null {
  if (typeof coverId !== 'number') return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

function openLibraryUrl(key: string): string {
  const path = key.startsWith('/') ? key : `/${key}`;
  return `https://openlibrary.org${path}`;
}

function reliableRating(doc: OpenLibraryDoc): number | null {
  const average = doc.ratings_average;
  const count = doc.ratings_count;
  if (
    typeof average !== 'number' ||
    typeof count !== 'number' ||
    count < MIN_RATINGS_COUNT
  ) {
    return null;
  }
  return Math.round(average * 10) / 10;
}

export function mapDocToBook(doc: OpenLibraryDoc): Book | null {
  if (!doc.key || !doc.title?.trim()) return null;

  return {
    id: doc.key,
    title: doc.title.trim(),
    authors: doc.author_name?.filter(Boolean) ?? [],
    firstPublishYear:
      typeof doc.first_publish_year === 'number' ? doc.first_publish_year : null,
    coverUrl: coverUrlFromId(doc.cover_i),
    subjects: (doc.subject ?? []).slice(0, 8),
    editionCount:
      typeof doc.edition_count === 'number' ? doc.edition_count : null,
    rating: reliableRating(doc),
    openLibraryUrl: openLibraryUrl(doc.key),
  };
}

function apiSortValue(sort: SortOption): string | undefined {
  switch (sort) {
    case 'new':
      return 'new';
    case 'old':
      return 'old';
    case 'editions':
      return 'edition_count desc';
    case 'relevance':
    default:
      return undefined;
  }
}

function cacheKey(params: SearchParams): string {
  return [params.query, params.page, params.limit, params.sort].join('|');
}

function totalFromResponse(data: OpenLibrarySearchResponse): number {
  if (typeof data.numFound === 'number') return data.numFound;
  if (typeof data.num_found === 'number') return data.num_found;
  return data.docs?.length ?? 0;
}

export async function searchBooks(params: SearchParams): Promise<SearchResult> {
  const key = cacheKey(params);
  const cached = cache.get(key);
  if (cached) return cached;

  const url = new URL(API_BASE);
  url.searchParams.set('q', params.query);
  url.searchParams.set('page', String(params.page));
  url.searchParams.set('limit', String(params.limit));
  url.searchParams.set('fields', FIELDS);

  const sort = apiSortValue(params.sort);
  if (sort) url.searchParams.set('sort', sort);

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new ApiError('Network error. Check your connection and try again.');
  }

  if (!response.ok) {
    throw new ApiError(
      `Open Library request failed (${response.status}).`,
      response.status,
    );
  }

  let data: OpenLibrarySearchResponse;
  try {
    data = (await response.json()) as OpenLibrarySearchResponse;
  } catch {
    throw new ApiError('Could not read the Open Library response.');
  }

  const books = (data.docs ?? [])
    .map(mapDocToBook)
    .filter((book): book is Book => book !== null);

  const result: SearchResult = {
    books,
    total: totalFromResponse(data),
    page: params.page,
  };

  cache.set(key, result);
  return result;
}

/** Build a subject-scoped Open Library query. */
export function subjectQuery(category: string): string {
  return `subject:${category}`;
}
