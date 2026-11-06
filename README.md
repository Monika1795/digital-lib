# BookNest

A responsive Digital Library for discovering books with the Open Library Search API.

## Tech stack

- HTML5, CSS3 (vanilla), TypeScript (strict), Vite
- Open Library Search API
- localStorage for My Library (no backend)

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## Features

- Search, category filters, sort, Load more
- Featured books shelf
- Book details modal
- Save / remove books in My Library (this device)
- Loading, error, and empty states
- Responsive + accessible UI

## Structure

```
├── index.html
└── src/
    ├── main.ts
    ├── data/categories.ts
    ├── types/book.ts
    ├── services/
    │   ├── bookApi.ts
    │   └── libraryStorage.ts
    ├── ui/
    │   ├── renderBooks.ts
    │   ├── modal.ts
    │   └── states.ts
    ├── utils/
    │   ├── debounce.ts
    │   └── dom.ts
    └── styles/style.css
```
