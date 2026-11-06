export const CATEGORIES = [
  'Fiction',
  'Technology',
  'Science',
  'History',
  'Business',
  'Biography',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Default explore query when nothing is selected. */
export const DEFAULT_QUERY = 'popular literature';

/** Featured shelf seed query. */
export const FEATURED_QUERY = 'award winning';
