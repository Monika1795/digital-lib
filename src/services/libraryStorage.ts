import type { Book } from '../types/book';

const STORAGE_KEY = 'booknest.myLibrary';

function readRaw(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBookLike);
  } catch {
    return [];
  }
}

function isBookLike(value: unknown): value is Book {
  if (!value || typeof value !== 'object') return false;
  const book = value as Partial<Book>;
  return typeof book.id === 'string' && typeof book.title === 'string';
}

function writeAll(books: Book[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch {
    // Quota or private mode — fail silently for UX.
  }
}

export function getSavedBooks(): Book[] {
  return readRaw();
}

export function isSaved(id: string): boolean {
  return readRaw().some((book) => book.id === id);
}

export function saveBook(book: Book): void {
  const books = readRaw().filter((item) => item.id !== book.id);
  books.unshift(book);
  writeAll(books);
}

export function removeBook(id: string): void {
  writeAll(readRaw().filter((book) => book.id !== id));
}

export function toggleSaved(book: Book): boolean {
  if (isSaved(book.id)) {
    removeBook(book.id);
    return false;
  }
  saveBook(book);
  return true;
}
