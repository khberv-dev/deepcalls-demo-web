# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Vite + React 19 app (plain JavaScript/JSX, not TypeScript): the web client for the DeepCalls CRM backend (sources, pipelines with stages, contacts, call recordings analyzed by AI, comments, users and roles). Routing uses React Router (`react-router` v8, declarative `<Routes>` in `src/App.jsx`) and icons come from `lucide-react`. There's no UI kit or CSS framework: all styles are plain CSS in the single `src/index.css`, using CSS variables and BEM-ish class names (`.button--ghost`, `.kanban-column--over`). The interface language is Uzbek (Latin script, using `ʻ`/`ʼ` for oʻ, gʻ and the tutuq belgisi). Translations of enum values from the API (sentiment, level, speaker, intent category, call status, stage type, language) live in `src/labels.js`.

## Commands

- `npm run dev`: start the Vite dev server with HMR
- `npm run build`: production build to `dist/`
- `npm run preview`: serve the built `dist/` locally
- `npm run lint`: run ESLint over the whole project (`npx eslint path/to/file.jsx` lints a single file)

There is no test runner configured. If tests are needed, Vitest fits this Vite setup, but it would have to be added.

## Architecture

- **Backend:** the API base URL (including the `/api` prefix) comes from `VITE_API_URL` in `.env` (currently `http://192.168.1.35:8000/api`). Vite only reads `.env` at startup, so restart the dev server after changing it.
- **Request layers:**
  - `src/api/client.js`: the shared axios instance (adds the Bearer token, 30 s timeout) and `getErrorMessage`. Server errors look like `{ statusCode, message, error }`, where `message` is an array of strings for 400 validation errors.
  - `src/api/*.js`: one plain async function per endpoint, returning `response.data`.
  - `src/hooks/`: TanStack Query wrappers around those functions (`useMutation` / `useQuery`).
  - Components only use the hooks.
  - `src/api/queryKeys.js`: all query keys. Contact mutations invalidate both contacts and pipelines, because pipelines carry `contactsCount` per stage. Pipeline and stage mutations return the whole pipeline, which is written straight into the cache.
- **Auth:** `src/auth/tokenStore.js` keeps the access token in memory and in localStorage. Components read it with `useAuthToken()` (from `src/hooks/useAuth.js`). There is no refresh token and no logout endpoint: logging out just clears the token. Any 401 (other than from `/auth/*`) clears the token, and clearing the token clears the query cache (`src/queryClient.js`).
- **Roles and permissions:**
  - A user has zero or one role. A role holds read and write flags for `User`, `Role`, `Contact` and `Comment`, and write implies read.
  - Your own records are always accessible; the flags only grant access to other users' records. Pipelines and sources are always private to their owner.
  - `usePermissions()` (`src/hooks/usePermissions.js`) reads `permissions` from `GET /user/me`. It is only for showing and hiding UI; the server enforces everything and answers 403 or 404.
  - `/user/me` is reloaded on window focus and every 5 minutes, because an admin can change a role at any time.
  - `RequirePermission` guards `/users` (`canReadUser`) and `/roles` (`canReadRole`).
- **Other users' contacts:**
  - `GET /contacts?owner=me|all|<userId>`; anything other than `me` needs `canReadContact`.
  - A contact's source, pipeline and stage refer to the owner's own records, which we can't list. So for someone else's contact, the source, pipeline and stage filters and fields are hidden: `ContactModal` gets `restrictPlacement`, and the stage is shown read-only.
  - Uploading, retrying and deleting calls on someone else's contact needs `canWriteContact`.
  - Comments by others are editable only with `canWriteComment`. Comment authors are shown through `useUserNames()`, which only works with `canReadUser`.
- **Server rules the client relies on:** the server rejects unknown fields with 400, so send only documented fields. It normalizes phones and emails, so always render what it returns. Deleting a stage or pipeline that still has contacts returns 409. To move a contact, send `PATCH /contacts/:id` with `{ stageId }`.
- **Query client:** `QueryClient` is defined in `src/queryClient.js` and provided in `main.jsx`.
- **Calls and AI analysis:** calls are uploaded per contact with `POST /contacts/:id/calls` (multipart, field `file`, no timeout). The response comes back immediately with `status: "created"`. A background job on the server analyzes the call, which then becomes `done` or `failed`. On `done`, the server adds a `call_analysis` comment to the contact; its `details` field holds the full analysis, which `src/components/AnalysisResult.jsx` renders. AI free text is in Uzbek; enum values stay in English.
- **Recordings:** `GET /calls/:id/audio` needs the auth header, so `AudioPlayer` fetches the file as a Blob and plays it from an object URL, which it revokes on unmount.
- **WebSocket** (`src/realtime/notifications.js` and `src/hooks/useRealtime.js`, mounted once in `Layout`):
  - The URL is `ws(s)://…/api/ws`, built from `VITE_API_URL`; `VITE_WS_URL` overrides it.
  - The token goes in the first message (`{ event: 'auth', data: { token } }`). Close code 4401 means the token is bad: log out and don't reconnect. Other disconnects reconnect with backoff.
  - The `call.status_changed` event updates the call in the cache, adds the new comment to the feed and shows a toast.
  - Events sent while disconnected are lost, so after a reconnect all calls and comments queries are reloaded.
  - The server doesn't push the `created` → `analyzing` change, so `useContactCalls` also reloads every 15 s while any call is still pending.
- **Comments:** `useContactComments` is an infinite query that pages 20 at a time. New comments, from the composer or the WebSocket, are added to the top of the first cached page, and `select` removes duplicates that shifted onto the next page.
- **Phones:** the server stores phones as digits only (`998901234567`). Always display them through `formatPhone` (`src/utils/format.js`), which shows `+998 90 123 45 67`.

## UI structure

- **Look:** light theme only, styled after amoCRM: a dark sidebar, a gray workspace, gray panels (`--surface-2`) for kanban columns, stat tiles, the filter bar and table headers, white cards on top, small corner radii and a dense layout (13.5px base font, 30px-tall buttons and inputs). The primary colour is `--accent`. Each kanban column header gets its stage colour through the `--stage-color` CSS variable.

- `src/pages/`: one component per route: login, register, the pipeline board (`/pipelines/:pipelineId`), the contacts list, the contact card (`/contacts/:contactId`), sources and settings.
- `src/components/`: shared pieces (`Layout`, `Modal`, `ConfirmDialog`, `Toaster`, `SourceIcon`) and the form modals (`ContactModal`, `StageModal`, `PipelineModal`, `SourceModal`). Each form modal handles both create and edit, depending on whether an existing entity is passed in.
- **Route guards** (`src/components/RouteGuards.jsx`):
  - `RequireAuth` redirects to `/login` when there is no token.
  - `PublicOnly` sends signed-in users into the app.
  - After a successful login, the redirect also happens in `PublicOnly`, not in the login page: setting the token re-renders the guard right away, which unmounts the page.
- **Kanban board** (`PipelinePage` + `KanbanColumn`):
  - Each column loads its own cards with `useContacts({ stageId, limit: 100 })`, as the API doc recommends.
  - Drag and drop uses the native HTML5 API with two custom `dataTransfer` types, one for contact cards and one for column headers.
  - Moving a card uses `useMoveContact`, which updates the cached column lists and stage counts optimistically and rolls back on error.
- **Contact card** (`ContactPage`): details, a quick stage selector and `CallsPanel` on the left; `CommentFeed` on the right, with the note composer, the call upload button and the timeline of notes and AI analyses. Clicking a kanban card or a contacts-table row opens this page.
- **Contacts page:** filters and the page number are kept in the URL query string, so a kanban column can link to `/contacts?pipelineId=…&stageId=…`.
- **Errors:** mutation errors show inside the modal or form that started them. Errors from actions that have no form, such as drag and drop, show as toasts (`toastError` from `src/toast/toastStore.js`).
- Forms that start from server data get their initial `useState` from props and are remounted with a `key` rather than synced in an effect. The `react-hooks` v7 lint rules flag setting state inside effects.

## Conventions

- Entry point: `index.html` → `src/main.jsx` (mounts `<App/>` into `#root` with `createRoot`; it is not wrapped in `<StrictMode>`) → `src/App.jsx`.
- Global CSS is imported once in `main.jsx` (`src/index.css`).
- ESLint uses the flat config (`eslint.config.js`) with `@eslint/js` recommended, `react-hooks` recommended, and `react-refresh/vite`. The `react-refresh` rule warns when a module exports something other than components, so keep non-component exports (helpers, constants, contexts) in separate files so HMR keeps working.
- `index.html` points to `/favicon.svg`, but there's no `public/` directory yet, so the favicon currently 404s.
- Source files in `src/` use 4-space indentation; config files use 2 spaces.
