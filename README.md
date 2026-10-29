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

The default API is the shared HTTPS server at `https://kwavepknu.me`.
To override it, create `.env.local` and restart `yarn dev` (or rebuild a production preview):

```bash
VITE_API_BASE_URL=https://kwavepknu.me
```

The frontend fetches K-Video lists and details, K-POP artists, members, and songs from the backend. K-Food remains on mock data until its backend dataset is ready.

The backend must allow `http://localhost:5173` and `http://127.0.0.1:5173` in CORS.
Video exploration uses 12-item server pages with infinite scrolling, deduplication and retry.
Search uses 12-item server pages. Video details include the server's OST and related-video previews.
K-POP has separate Tracks and Artists views, with 24-item server pages. Songs use
releaseDate descending; artists use debutYear descending. Home fetches only the
first page of each collection. Browsing respects the backend's 10,000-offset limit.
Older deployments returning arrays are supported through a cached local snapshot;
only after deploying the paged backend does this reduce download size.
Member information is fetched when an artist detail is opened.
Song previews use previewUrl when provided, play only on user request, and stop
at 60 seconds or when leaving the detail. Artist profiles use the API biography,
agency, debut year and fandom information. Instagram URLs are not challenge URLs.
Video cards use thumbnail images and vote data where present. Details keep the
original poster and disclose resolved-language fallbacks when the API supplies them.
New fields require both backend deployment and populated DB columns. The CSV
importer's duplicate-skip behavior means existing rows need an explicit backfill.

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
Google OAuth is wired to the backend code-exchange, JWT refresh and logout APIs.
See [GOOGLE_AUTH.md](GOOGLE_AUTH.md) for local callback configuration and verification limits.
Preferences are stored per user on this browser, not synchronized through a server API.
The recommendation implementation uses server categories/tags with local scoring on request failure.
