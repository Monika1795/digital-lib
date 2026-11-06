import './styles/style.css';
import {
  CATEGORIES,
  DEFAULT_QUERY,
  FEATURED_QUERY,
} from './data/categories';
import { ApiError, searchBooks, subjectQuery } from './services/bookApi';
import { getSavedBooks } from './services/libraryStorage';
import type { Book, SortOption } from './types/book';
import { createModalController } from './ui/modal';
import { renderBookGrid, renderCategories } from './ui/renderBooks';
import { setPanelState } from './ui/states';
import { debounce } from './utils/debounce';
import { requireElement } from './utils/dom';

const PAGE_SIZE = 12;

interface AppState {
  query: string;
  category: string | null;
  sort: SortOption;
  page: number;
  total: number;
  books: Book[];
  requestId: number;
}

const state: AppState = {
  query: '',
  category: null,
  sort: 'relevance',
  page: 1,
  total: 0,
  books: [],
  requestId: 0,
};

let featuredBooks: Book[] = [];
let modal: ReturnType<typeof createModalController>;

function activeQuery(): string {
  if (state.category) return subjectQuery(state.category);
  const trimmed = state.query.trim();
  return trimmed || DEFAULT_QUERY;
}

function syncSearchInputs(value: string): void {
  document
    .querySelectorAll<HTMLInputElement>('[data-search-input]')
    .forEach((input) => {
      input.value = value;
    });
}

function updateExploreStatus(): void {
  const status = requireElement<HTMLElement>('[data-explore-status]');
  const parts: string[] = [];

  if (state.category) parts.push(`category “${state.category}”`);
  if (state.query.trim()) parts.push(`“${state.query.trim()}”`);

  const shown = state.books.length;
  if (parts.length === 0) {
    status.textContent = `Showing ${shown} of ${state.total.toLocaleString()} books.`;
  } else {
    status.textContent = `${shown} of ${state.total.toLocaleString()} results for ${parts.join(' · ')}.`;
  }
}

function updateLoadMore(): void {
  const btn = requireElement<HTMLButtonElement>('[data-load-more]');
  const hasMore = state.books.length < state.total;
  btn.hidden = !hasMore || state.books.length === 0;
  btn.disabled = false;
}

function openBook(book: Book): void {
  modal.open(book);
}

function refreshVisibleGrids(): void {
  renderLibrary();

  if (featuredBooks.length > 0) {
    const featuredPanel = requireElement<HTMLElement>('[data-featured-panel]');
    setPanelState(featuredPanel, 'idle');
    renderBookGrid(
      requireElement<HTMLElement>('[data-featured-grid]', featuredPanel),
      featuredBooks,
      openBook,
    );
  }

  if (state.books.length > 0) {
    const explorePanel = requireElement<HTMLElement>('[data-explore-panel]');
    setPanelState(explorePanel, 'idle');
    renderBookGrid(
      requireElement<HTMLElement>('[data-explore-grid]', explorePanel),
      state.books,
      openBook,
    );
  }
}

async function loadFeatured(): Promise<void> {
  const panel = requireElement<HTMLElement>('[data-featured-panel]');
  setPanelState(panel, 'loading');

  try {
    const result = await searchBooks({
      query: FEATURED_QUERY,
      page: 1,
      limit: 8,
      sort: 'editions',
    });

    featuredBooks = result.books;

    if (result.books.length === 0) {
      setPanelState(panel, 'empty');
      return;
    }

    setPanelState(panel, 'idle');
    renderBookGrid(
      requireElement<HTMLElement>('[data-featured-grid]', panel),
      result.books,
      openBook,
    );
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : 'Could not load featured books.';
    setPanelState(panel, 'error', message);
  }
}

async function loadExplore(options: { append?: boolean } = {}): Promise<void> {
  const panel = requireElement<HTMLElement>('[data-explore-panel]');
  const loadMoreBtn = requireElement<HTMLButtonElement>('[data-load-more]');
  const requestId = ++state.requestId;
  const append = options.append === true;

  if (!append) {
    state.page = 1;
    state.books = [];
    setPanelState(panel, 'loading');
    loadMoreBtn.hidden = true;
  } else {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading…';
  }

  try {
    const result = await searchBooks({
      query: activeQuery(),
      page: state.page,
      limit: PAGE_SIZE,
      sort: state.sort,
    });

    if (requestId !== state.requestId) return;

    state.total = result.total;
    state.books = append ? [...state.books, ...result.books] : result.books;

    if (state.books.length === 0) {
      setPanelState(panel, 'empty');
      updateExploreStatus();
      updateLoadMore();
      return;
    }

    setPanelState(panel, 'idle');
    const grid = requireElement<HTMLElement>('[data-explore-grid]', panel);
    if (append) {
      renderBookGrid(grid, result.books, openBook, { append: true });
    } else {
      renderBookGrid(grid, state.books, openBook);
    }
    updateExploreStatus();
    updateLoadMore();
  } catch (error) {
    if (requestId !== state.requestId) return;
    const message =
      error instanceof ApiError
        ? error.message
        : 'Could not load books right now.';
    if (!append) {
      setPanelState(panel, 'error', message);
    } else {
      state.page = Math.max(1, state.page - 1);
      loadMoreBtn.disabled = false;
      window.alert(message);
    }
  } finally {
    loadMoreBtn.textContent = 'Load more';
  }
}

function renderLibrary(): void {
  const panel = requireElement<HTMLElement>('[data-library-panel]');
  const books = getSavedBooks();
  const countEl = requireElement<HTMLElement>('[data-library-count]');
  countEl.textContent =
    books.length === 0
      ? 'Save books from the details panel to build your shelf.'
      : `${books.length} saved book${books.length === 1 ? '' : 's'} on this device.`;

  if (books.length === 0) {
    setPanelState(panel, 'empty');
    return;
  }

  setPanelState(panel, 'idle');
  renderBookGrid(
    requireElement<HTMLElement>('[data-library-grid]', panel),
    books,
    openBook,
  );
}

function renderCategoryChips(): void {
  const list = requireElement<HTMLElement>('[data-category-list]');
  renderCategories(list, CATEGORIES, state.category, (category) => {
    state.category = category;
    if (category) {
      state.query = '';
      syncSearchInputs('');
    }
    renderCategoryChips();
    void loadExplore();
    document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
  });
}

function applySearch(value: string): void {
  state.query = value;
  state.category = null;
  syncSearchInputs(value);
  renderCategoryChips();
  void loadExplore();
  document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
}

function setupSearchForms(): void {
  const debouncedLive = debounce((value: string) => {
    state.query = value;
    state.category = null;
    renderCategoryChips();
    void loadExplore();
  }, 400);

  document
    .querySelectorAll<HTMLFormElement>('[data-search-form]')
    .forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = form.querySelector<HTMLInputElement>('[data-search-input]');
        applySearch(input?.value ?? '');
      });
    });

  document
    .querySelectorAll<HTMLInputElement>('[data-search-input]')
    .forEach((input) => {
      input.addEventListener('input', () => {
        syncSearchInputs(input.value);
        debouncedLive(input.value);
      });
    });
}

function setupSort(): void {
  const select = requireElement<HTMLSelectElement>('[data-explore-sort]');
  select.value = state.sort;
  select.addEventListener('change', () => {
    state.sort = select.value as SortOption;
    void loadExplore();
  });
}

function setupLoadMore(): void {
  const btn = requireElement<HTMLButtonElement>('[data-load-more]');
  btn.addEventListener('click', () => {
    state.page += 1;
    void loadExplore({ append: true });
  });
}

function setupRetries(): void {
  document
    .querySelectorAll<HTMLButtonElement>('[data-retry]')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.retry;
        if (target === 'featured') void loadFeatured();
        if (target === 'explore') void loadExplore();
      });
    });
}

function setupNavToggle(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const nav = document.querySelector<HTMLElement>('[data-site-nav]');
  if (!toggle || !nav) return;

  const setOpen = (open: boolean): void => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });
}

function setupFooterYear(): void {
  const year = document.querySelector<HTMLElement>('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
}

function init(): void {
  modal = createModalController(refreshVisibleGrids);

  setupFooterYear();
  setupNavToggle();
  setupSearchForms();
  setupSort();
  setupLoadMore();
  setupRetries();
  renderCategoryChips();
  renderLibrary();
  void loadFeatured();
  void loadExplore();
}

init();
