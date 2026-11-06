import type { Book } from '../types/book';
import { isSaved } from '../services/libraryStorage';

function formatAuthors(authors: string[]): string {
  if (authors.length === 0) return 'Unknown author';
  return authors.join(', ');
}

function formatYear(year: number | null): string {
  return year === null ? 'Year unknown' : String(year);
}

function attachCover(
  container: HTMLElement,
  book: Book,
  className: string,
): void {
  if (book.coverUrl) {
    const img = document.createElement('img');
    img.className = className;
    img.src = book.coverUrl;
    img.alt = `${book.title} cover`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => {
      img.remove();
      container.append(createCoverFallback(book.title));
    });
    container.append(img);
    return;
  }

  container.append(createCoverFallback(book.title));
}

function createCoverFallback(title: string): HTMLElement {
  const fallback = document.createElement('div');
  fallback.className = 'cover-fallback';
  fallback.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.textContent = title;
  fallback.append(label);
  return fallback;
}

export function createBookCard(
  book: Book,
  onOpen: (book: Book) => void,
): HTMLElement {
  const article = document.createElement('article');
  article.className = 'book-card';
  article.tabIndex = 0;
  article.setAttribute('role', 'button');
  article.setAttribute(
    'aria-label',
    `${book.title} by ${formatAuthors(book.authors)}`,
  );
  article.dataset.bookId = book.id;

  const cover = document.createElement('div');
  cover.className = 'book-card__cover';
  attachCover(cover, book, 'book-card__image');

  const body = document.createElement('div');
  body.className = 'book-card__body';

  const title = document.createElement('h3');
  title.className = 'book-card__title';
  title.textContent = book.title;

  const author = document.createElement('p');
  author.className = 'book-card__author';
  author.textContent = formatAuthors(book.authors);

  const meta = document.createElement('p');
  meta.className = 'book-card__meta';
  meta.textContent = formatYear(book.firstPublishYear);

  body.append(title, author, meta);

  if (book.rating !== null) {
    const rating = document.createElement('p');
    rating.className = 'book-card__rating';
    rating.textContent = `★ ${book.rating.toFixed(1)}`;
    body.append(rating);
  }

  if (isSaved(book.id)) {
    const badge = document.createElement('span');
    badge.className = 'book-card__saved';
    badge.textContent = 'Saved';
    body.append(badge);
  }

  article.append(cover, body);

  const open = (): void => onOpen(book);
  article.addEventListener('click', open);
  article.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });

  return article;
}

export function renderBookGrid(
  container: HTMLElement,
  books: Book[],
  onOpen: (book: Book) => void,
  options: { append?: boolean } = {},
): void {
  if (!options.append) {
    container.replaceChildren();
  }

  if (books.length === 0 && !options.append) {
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const book of books) {
    fragment.append(createBookCard(book, onOpen));
  }
  container.append(fragment);
}

export function renderCategories(
  container: HTMLElement,
  categories: readonly string[],
  activeCategory: string | null,
  onSelect: (category: string | null) => void,
): void {
  container.replaceChildren();

  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = 'category-chip';
  allBtn.textContent = 'All';
  allBtn.setAttribute('aria-pressed', activeCategory === null ? 'true' : 'false');
  allBtn.addEventListener('click', () => onSelect(null));
  container.append(allBtn);

  for (const category of categories) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'category-chip';
    btn.textContent = category;
    btn.setAttribute(
      'aria-pressed',
      activeCategory === category ? 'true' : 'false',
    );
    btn.addEventListener('click', () => onSelect(category));
    container.append(btn);
  }
}
