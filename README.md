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

The app uses backend data when available and keeps mock content as a development fallback.

## Backend Integration

Create a local `.env` file if the backend is not running on the default URL:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

The frontend fetches K-Video lists and details, K-POP artists, members, and songs from the backend. K-Food remains on mock data until its backend dataset is ready.

## Recommendations

The `For You` page requests server recommendations using selected categories and taste tags. Preferences remain in local storage, and the frontend scoring logic is used automatically when the backend is unavailable or has no matching data.
