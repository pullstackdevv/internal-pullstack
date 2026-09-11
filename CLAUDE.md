# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Laravel 10 + Inertia.js + Vue 3 documentation/marketing site ("Pullstack") with two pages: a home/landing page and a `/docs` page walking through VPS deployment (Ubuntu 22.04, aaPanel, Nginx, Docker services like Grafana/Jenkins/n8n). See `blueprint.md` for the actual deployment runbook this site documents — treat it as reference content, not application logic.

## Commands

```bash
# Install
composer install
npm install
cp .env.example .env
php artisan key:generate

# Dev
php artisan serve       # backend
npm run watch           # asset rebuild on change (or `npm run hot`)
npm run dev             # one-off dev build (alias for `development`)

# Production build
npm run production      # or npm run prod

# Tests
php artisan test                          # full suite
php artisan test --filter=ExampleTest     # single test
vendor/bin/phpunit tests/Feature/ExampleTest.php

# Lint/format (PHP)
vendor/bin/pint
```

There is no JS linter/formatter configured (no ESLint/Prettier).

## Build tooling: Mix, not Vite

This project uses **Laravel Mix** (`webpack.mix.js`), not Vite, despite `vite.config.js` and `laravel-vite-plugin` being present in the repo — those are unused leftovers. Evidence: `package.json` scripts all call `mix`; `resources/views/app.blade.php` loads assets via `mix('css/app.css')` / `mix('js/app.js')`, not `@vite(...)`; `public/mix-manifest.json` is the manifest actually read at runtime. When changing build config or adding JS dependencies, edit `webpack.mix.js`, not `vite.config.js`.

Vue pages are resolved via webpack's `require.context` in `resources/js/app.js` (Options API style `createInertiaApp`), not the dynamic `import.meta.glob` pattern used in newer Vite-based Inertia starters.

## Architecture

- **Routing**: `routes/web.php` defines page routes directly as closures returning `Inertia::render('PageName')` — no controllers are used for the two existing pages. Follow this pattern (closure + `Inertia::render`) for simple additional pages unless real backend logic is needed, in which case add a controller under `app/Http/Controllers`.
- **Pages**: Inertia page components live in `resources/js/Pages/*.vue` and are matched by name to the string passed to `Inertia::render()`. Currently: `Home.vue`, `Documentation.vue`.
- **No shared layout component yet** — each page composes its own full markup (header/sidebar/content). If adding new pages, check whether extracting a shared layout makes sense before duplicating structure from `Documentation.vue`.
- **Styling**: Tailwind CSS (v3 config in `tailwind.config.js`, but `@tailwindcss/postcss` v4 package is also installed — check `postcss.config.js` for which is actually wired in if Tailwind behavior seems off). Utility classes are used inline in Vue templates; no component library.
- **Icons**: `lucide-vue-next`.
- **No API/backend data layer**: `routes/api.php` is stock/empty, no models beyond the default `User`, no migrations beyond Laravel defaults. This is a static-content site — most work will be in the Vue page components, not PHP.
- **Tests**: only the default Laravel `ExampleTest` stubs exist in `tests/Feature` and `tests/Unit` — no real test coverage of app behavior yet.
