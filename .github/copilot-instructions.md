<!--
Short, focused instructions for AI coding agents working on the `aeternity/web-downloads` repo.
Keep this file ~20-50 lines. Only include patterns discoverable in the repo.
-->

# Guidance for AI coding agents — Aeternity web-downloads

This repository is a small VuePress site that builds the downloads page for aeternity. Use these notes to make safe, minimal, and consistent code changes.

Key files to inspect
- `index.md` — top-level page that mounts three custom components: `<Releases />`, `<Backups />`, `<Builds />`.
- `.vuepress/config.js` — site config; `base` can be set via `BASE_PATH` env var during build.
- `.vuepress/components/*.vue` — core logic. These components fetch XML listings from S3-style endpoints and GitHub API at runtime.
- `package.json` — scripts: `npm run dev` (dev server) and `npm run build` (static build).

Big-picture architecture and data flows
- Static-site content (Markdown) is enhanced with client-side Vue components under `.vuepress/components`. The site is built with VuePress v1 and outputs a `./.vuepress/dist` static site.
- Components perform client-side fetches to remote endpoints (examples in code):
  - Releases.vue: default `baseUrl` -> `https://releases.aeternity.io` and also calls GitHub API `https://api.github.com/repos/aeternity/aeternity/releases/latest`.
  - Builds.vue: default `baseUrl` -> `https://builds.aeternity.io`.
  - Backups.vue: default `baseUrl` -> `https://aeternity-database-backups.s3.eu-central-1.amazonaws.com` and reads `.md5` checksum files.

Project-specific conventions
- Client-only fetching: The components assume DOM APIs (e.g. DOMParser) and use fetch in `created()` lifecycle hooks. Avoid server-side logic changes that break hydration or static build expectations.
- Base path handling: `.vuepress/config.js` reads `process.env.BASE_PATH` and exposes it as `base` for `vuepress build`. Set `BASE_PATH` when building for sub-path deployment (example in `README.md`).
- Build & deploy flow: building for production uses `NODE_ENV=production npm run build`. The README documents a subtree push to `gh-pages` and writing `downloads.aeternity.io` to the build CNAME.

Testing, dev and debug workflows
- Run locally: `npm install` then `npm run dev` to start a hot-reload VuePress dev server.
- Build static site: `BASE_PATH='/path/' npm run build` (omit or set BASE_PATH as needed). Output is `./.vuepress/dist`.
- To preview the built static output, serve the `./.vuepress/dist` directory with any static server (not provided in repo). The `.gitignore` excludes `.vuepress/dist` by default.

Safety and change policy for AI edits
- Prefer small, localized edits: update components under `.vuepress/components` or the Markdown files.
- Do not add server-side Node services or new build tooling without explicit human review (this is a simple static site).
- Network calls in components are to external public endpoints. If adding tests or mocks, keep them client-side, and do not commit secrets.

Concrete examples to reference
- To change how releases are parsed, edit `.vuepress/components/Releases.vue` — parsing lives in `parseXml(xml)` and `extractVersion/extractArch` helpers.
- To add a new column to the builds table, update `.vuepress/components/Builds.vue` template and possibly `parseXml()` if the data comes from S3 listings.

If you need more context
- There are no other agent instruction files in the repo. If you modify the build or deployment workflow, update `README.md` with the exact commands used and any environment variables.

When done
- Make minimal commits with descriptive messages. If you change output filenames or base path handling, include a short deploy checklist in the PR description (update CNAME, set BASE_PATH if not root).

If anything above is unclear or you want me to expand any section (tests, more examples, or CI), tell me which part to improve.
