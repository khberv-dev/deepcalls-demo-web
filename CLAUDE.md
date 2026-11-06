# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Vite + React 19 app (plain JavaScript/JSX, not TypeScript) that uploads call recordings to a backend and displays the AI analysis. There's no routing or styling library; styles are plain CSS in `src/index.css`, using CSS variables with a dark-mode override.

## Commands

- `npm run dev`: start the Vite dev server with HMR
- `npm run build`: production build to `dist/`
- `npm run preview`: serve the built `dist/` locally
- `npm run lint`: run ESLint over the whole project (`npx eslint path/to/file.jsx` lints a single file)

There is no test runner configured. If tests are needed, Vitest fits this Vite setup, but it would have to be added.

## Architecture

- **Backend:** the API host comes from `VITE_API_URL` in `.env` (currently `http://192.168.1.35:8000`). Vite only reads `.env` at startup, so restart the dev server after changing it.
- **Request layers:**
  - `src/api/client.js`: the shared axios instance and `getErrorMessage` (handles FastAPI-style `detail`).
  - `src/api/*.js`: one plain async function per endpoint, returning `response.data`.
  - `src/hooks/`: TanStack Query wrappers around those functions (`useMutation` / `useQuery`).
  - Components only use the hooks.
- **Query client:** `QueryClient` is defined in `src/queryClient.js` and provided in `main.jsx`.
- **`POST /calls/analyze`:** multipart upload with the form field `file`. It returns the analysis JSON that `src/components/AnalysisResult.jsx` renders (summary, clientIntent, purchaseLikelihood, operatorPerformance, keyMoments, and so on). `UploadCard` shows upload progress through axios `onUploadProgress`.

## Conventions

- Entry point: `index.html` → `src/main.jsx` (mounts `<App/>` into `#root` with `createRoot`; it is not wrapped in `<StrictMode>`) → `src/App.jsx`.
- Global CSS is imported once in `main.jsx` (`src/index.css`).
- ESLint uses the flat config (`eslint.config.js`) with `@eslint/js` recommended, `react-hooks` recommended, and `react-refresh/vite`. The `react-refresh` rule warns when a module exports something other than components, so keep non-component exports (helpers, constants, contexts) in separate files so HMR keeps working.
- `index.html` points to `/favicon.svg`, but there's no `public/` directory yet, so the favicon currently 404s.
- Source files in `src/` use 4-space indentation; config files use 2 spaces.
