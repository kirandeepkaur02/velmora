# Velmora

Premium natural beauty e-commerce, built with the MERN stack.

## Project layout

- `client/` — React (Vite) storefront
- `server/` — Express API under `/api/v1`
- Specs at the repository root (`product-requirements.md`, `architecture.md`, `phase.md`, and related files)

## Prerequisites

- Node.js 22+
- npm 10+
- MongoDB locally, MongoDB Atlas, or `USE_IN_MEMORY_DB=true` for local foundation work

## Setup

```bash
cp .env.example .env
npm install
npm install --prefix client
npm install --prefix server
```

Configure `MONGODB_URI` in `.env`. For local work without MongoDB installed, keep `USE_IN_MEMORY_DB=true`. Do not use the in-memory database in production.

## Development

```bash
npm run dev:server
npm run dev:client
```

- Client: http://localhost:5173
- API health: http://localhost:5000/api/v1/health

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev:client` | Start the Vite app |
| `npm run dev:server` | Start the Express API |
| `npm run lint` | Lint client and server |
| `npm run build:client` | Production client build |

## Environment variables

See `.env.example`. Never commit `.env` or secrets.

## Documentation

- `product-requirements.md` — what the product must do
- `architecture.md` — technical architecture
- `rules.md` — implementation rules
- `phase.md` — roadmap and acceptance criteria
- `commands.md` — phase prompts
- `design.md` — visual system
- `decisions.md` — ADRs
