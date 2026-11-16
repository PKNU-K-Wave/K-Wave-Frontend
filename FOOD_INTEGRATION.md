# K-Food integration

Verified against https://kwavepknu.me on 2026-11-16: 200 foods and 1,156 recipes. Counts are live data, not hard-coded UI values.

- Foods use /api/v1/foods, server popularity order, category/vegetarian/exclude filters and 24-item pagination. Categories and translated labels come from /foods/categories.
- Recipes use /api/v1/recipes, dishType/cookingMethod filters and independent pagination. They are Korean-only in the current API; no automatic translation is claimed.
- Food details use /foods/{contentId}?lang=... and show actual description, ingredients, taste, serving guidance, dietary flags, nutrition and image attribution. Linked recipes load /recipes/{recipeId} only when selected.
- Recipe cards and direct links use food-recipe-{recipeId}; they do not fabricate a central content ID. Food IDs use food-{contentId}. Both work with the existing modal/history/share flow and local saved-content collections.
- Home food previews now use live food data. Food failures do not fall back to sample dishes. The catalog has retry, empty and loading states; filter changes reset page one, and stale requests are aborted.
- Recipe steps retain their actual order numbers and images. Recipe attribution identifies the Ministry of Food and Drug Safety; Wikimedia image author/license/source remain available in food details. Missing cook time, difficulty or nutrition is not invented.
- Dietary labels reflect the supplied data and can vary by recipe; they are not an allergy-safety guarantee. Wikipedia language count is the server's food popularity proxy, not a real-time consumption chart.

Verification: TypeScript/Vite build, ESLint and 35 frontend unit tests. Live browser checks at 320/390/1440px cover food/detail/linked recipe, dietary/category requests, recipe filters, recipe deep links, Chinese UI, image loading, failure/retry and page navigation. No production deployment was performed.

This frontend work does not deploy the K-POP generation/OST backend changes. Those changes are tracked separately in https://github.com/PKNU-K-Wave/K-Wave-Backend/pull/87 and require a backend release before the matching controls become available.
