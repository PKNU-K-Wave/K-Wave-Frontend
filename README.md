# K-Wave Frontend

K-Wave is a culture discovery platform for international fans of Korean movies, dramas, music, idols, and everyday home food.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Yarn

## Getting Started

```bash
yarn install
yarn dev
```

The app currently uses mock data while backend DTOs and content relationships are still being finalized.

## Backend Integration

Create a local `.env` file if the backend is not running on the default URL:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

The frontend currently fetches K-POP artist, member, and song data from the backend when available. K-Video and K-Food still use mock data until list/detail APIs are ready.

## Recommendation Prototype

The `For You` page includes a frontend recommendation prototype. It scores available content by selected category and taste tags, stores preferences in local storage, and can later be replaced by a backend recommendation API without changing the main UI flow.
