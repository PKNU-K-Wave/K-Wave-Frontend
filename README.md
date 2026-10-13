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

The default API is the shared development server at `http://13.209.94.227`.
To override it, create `.env.local` and restart `yarn dev` (or rebuild a production preview):

```bash
VITE_API_BASE_URL=http://13.209.94.227
```

The frontend fetches K-Video lists and details, K-POP artists, members, and songs from the backend. K-Food remains on mock data until its backend dataset is ready.

The backend must allow `http://localhost:5173` and `http://127.0.0.1:5173` in CORS.
Video exploration uses 12-item server pages with infinite scrolling, deduplication and retry.
Search uses 12-item server pages. Video details include the server's OST and related-video previews.
K-POP currently downloads artist and song lists in two requests and renders 24 cards per section/page.
The deployed K-POP endpoints return arrays, so pagination here limits rendering, not download size.
Member information is fetched when an artist detail is opened.

## Verification

Run `yarn build`, `yarn lint`, and `yarn test`.
Against the shared server, verify Home -> K-Video -> detail -> OST/related video,
K-POP page navigation, and search -> result -> detail. API failure falls back to sample content;
an empty successful search remains empty. Missing translations and profile images need dataset updates.

## Ask K-Wave

The chat API may return catalog, llm or web response modes. Web responses include
URL citation annotations, rendered as inline links opening a new tab. General culture
explanations can use LLM knowledge; locations/current facts require verified search
sources in the matching backend upgrade. Without a provider key or after provider failure,
the server reports that verification is unavailable. The frontend never contains API keys.
Deploy the matching backend chat upgrade before testing real web answers.

## Recommendations

Guests can browse, search and open details. For You opens the sign-in screen for guests.
Google OAuth and account preference persistence are not connected yet; the sign-in screen is a UI draft.
The recommendation implementation uses server categories/tags with local scoring on request failure.
