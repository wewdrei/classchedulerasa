<!-- .github/copilot-instructions.md -->
# Repo-specific instructions for AI coding agents

Goal: help an AI agent get immediately productive in this mono-repo which contains a React frontend and a Laravel backend.

- Big picture
  - Two main components:
    - `frontend/` — Create React App (React + react-scripts). Key files: `frontend/package.json`, `frontend/src/`, `frontend/public/`.
    - `backend/` — Laravel PHP app. Key files: `backend/artisan`, `backend/composer.json`, `backend/routes/`, `backend/app/`, `backend/resources/`, `backend/public/`.
  - The frontend is a separate app (served with `npm start` on port 3000). The backend exposes API endpoints under `backend/routes/api.php` (e.g. POST `/upload`, `/select`, `/insert`, `/update`, `/delete`, `/custom`).

- Developer workflows (concrete commands)
  - Frontend (in `frontend/`):
    - Install: `cd frontend && npm install`
    - Dev server: `npm start` (opens http://localhost:3000)
    - Build: `npm run build`
    - Tests: `npm test`
  - Backend (Laravel, in `backend/`):
    - PHP deps: `cd backend && composer install`
    - Environment: copy `.env.example` → `.env`, then `php artisan key:generate`
    - Database: migrations live in `backend/database/migrations` and can be run with `php artisan migrate`
    - Dev server: `php artisan serve` (defaults to http://127.0.0.1:8000)
    - Tests: `php artisan test` (wrapper around PHPUnit)

- Important repo-specific notes
  - API surface: inspect `backend/routes/api.php` for server endpoints and `backend/app/Http/Controllers` for implementation. Example: `Route::post('/upload', [FileUploadController::class, 'upload']);`
  - Frontend components follow a `src/components` and `src/pages` pattern (see `frontend/src/components/*` and `frontend/src/pages/*`). Use these folders when adding or modifying UI pieces.
  - Static/public assets that get served are in `frontend/public/` and `backend/public/` (the backend's public folder is the Laravel webroot).

- Project quirks and gotchas agents must know
  - There is an inconsistent `package.json` under `backend/` that contains merge conflict markers and mixed content — do NOT assume the backend `package.json` is authoritative for frontend scripts. Prefer `frontend/package.json` when working on the SPA.
  - The backend also contains `resources/js` and a `vite.config.js` — this repo mixes classic Laravel asset pipelines with a separate `frontend/` CRA app. Confirm which app you're modifying before changing build tooling.
  - Routes: web UI pages are served from `routes/web.php`, APIs from `routes/api.php`. Modifying controllers requires corresponding updates to route files and sometimes to JS clients in `frontend/src`.

- Where to make changes (quick map)
  - Add API endpoints: `backend/routes/api.php` and `backend/app/Http/Controllers/*`
  - Database models: `backend/app/Models/*`
  - DB schema changes: `backend/database/migrations/*`
  - Frontend UI: `frontend/src/components/` and `frontend/src/pages/`

- How to run quick local smoke tests
  - Full local dev: run backend (`php artisan serve`) and frontend (`cd frontend && npm start`) simultaneously. The frontend expects APIs under the backend domain — confirm `fetch`/`axios` base URLs in `frontend/src` or `.env` files.
  - Run backend tests quickly: from `backend/` run `php artisan test`
  - Frontend unit tests: from `frontend/` run `npm test`

- Examples to reference in-code
  - Backend API: `backend/routes/api.php` — POST `/upload` -> `FileUploadController::upload`
  - Frontend routing: `frontend/src/index.js` and `frontend/src/App.js` use `react-router-dom`; pages live in `frontend/src/pages/`.

- When you are unsure
  - Prefer inspecting `backend/routes/*.php`, `backend/app/Http/Controllers/`, and `frontend/src/` before changing API signatures.
  - If a `package.json` appears inconsistent (merge markers or conflicting scripts), look for the canonical place for that app (`frontend/package.json` for the SPA, `backend/composer.json` for PHP deps).

If any section is unclear or you want more examples (controller signatures, example requests, or common test patterns), tell me which area to expand and I will update this file.
