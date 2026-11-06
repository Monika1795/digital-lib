import type { Book } from '../types/book';
import { isSaved, toggleSaved } from '../services/libraryStorage';
import { requireElement } from '../utils/dom';

export interface ModalController {
  open: (book: Book) => void;
  close: () => void;
}

function formatAuthors(authors: string[]): string {
  return authors.length > 0 ? authors.join(', ') : 'Unknown author';
}

export function createModalController(
  onLibraryChange: () => void,
): ModalController {
  const dialog = requireElement<HTMLDialogElement>('[data-book-modal]');
  const titleEl = requireElement<HTMLElement>('[data-modal-title]', dialog);
  const authorEl = requireElement<HTMLElement>('[data-modal-authors]', dialog);
  const yearEl = requireElement<HTMLElement>('[data-modal-year]', dialog);
  const editionsEl = requireElement<HTMLElement>('[data-modal-editions]', dialog);
  const ratingEl = requireElement<HTMLElement>('[data-modal-rating]', dialog);
  const subjectsEl = requireElement<HTMLElement>('[data-modal-subjects]', dialog);
  const coverEl = requireElement<HTMLElement>('[data-modal-cover]', dialog);
  const linkEl = requireElement<HTMLAnchorElement>('[data-modal-link]', dialog);
  const saveBtn = requireElement<HTMLButtonElement>('[data-modal-save]', dialog);
  const closeBtns = dialog.querySelectorAll<HTMLButtonElement>('[data-modal-close]');

  let current: Book | null = null;

  const syncSaveButton = (): void => {
    if (!current) return;
    const saved = isSaved(current.id);
    saveBtn.textContent = saved ? 'Remove from My Library' : 'Save to My Library';
    saveBtn.setAttribute('aria-pressed', String(saved));
  };

  const render = (book: Book): void => {
    current = book;
    titleEl.textContent = book.title;
    authorEl.textContent = formatAuthors(book.authors);
    yearEl.textContent =
      book.firstPublishYear === null
        ? 'Publication year unknown'
        : `First published ${book.firstPublishYear}`;
    editionsEl.textContent =
      book.editionCount === null
        ? 'Edition count unavailable'
        : `${book.editionCount} edition${book.editionCount === 1 ? '' : 's'}`;

    if (book.rating === null) {
      ratingEl.hidden = true;
      ratingEl.textContent = '';
    } else {
      ratingEl.hidden = false;
      ratingEl.textContent = `Average rating ★ ${book.rating.toFixed(1)}`;
    }

    subjectsEl.replaceChildren();
    if (book.subjects.length === 0) {
      const none = document.createElement('li');
      none.textContent = 'No subjects listed';
      subjectsEl.append(none);
    } else {
      for (const subject of book.subjects.slice(0, 6)) {
        const li = document.createElement('li');
        li.textContent = subject;
        subjectsEl.append(li);
      }
    }

    coverEl.replaceChildren();
    if (book.coverUrl) {
      const img = document.createElement('img');
      img.src = book.coverUrl;
      img.alt = `${book.title} cover`;
      img.addEventListener('error', () => {
        coverEl.replaceChildren();
        const fallback = document.createElement('div');
        fallback.className = 'cover-fallback cover-fallback--modal';
        fallback.textContent = book.title;
        coverEl.append(fallback);
      });
      coverEl.append(img);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'cover-fallback cover-fallback--modal';
      fallback.textContent = book.title;
      coverEl.append(fallback);
    }

    linkEl.href = book.openLibraryUrl;
    syncSaveButton();
  };

  const close = (): void => {
    if (dialog.open) dialog.close();
  };

  const open = (book: Book): void => {
    render(book);
    if (!dialog.open) dialog.showModal();
  };

  closeBtns.forEach((btn) => btn.addEventListener('click', close));

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  saveBtn.addEventListener('click', () => {
    if (!current) return;
    toggleSaved(current);
    syncSaveButton();
    onLibraryChange();
  });

  return { open, close };
}
