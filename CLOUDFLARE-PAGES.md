# Cloudflare Pages Deployment Instructions

This guide explains how to deploy the MultiTools site to Cloudflare Pages (recommended).

1. Go to the Cloudflare Dashboard → Pages → Create a project → Connect GitHub → select `faheemahmed24/MultiTools`.

2. Settings (Build & Deploy):
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment: set `GEMINI_API_KEY` in Pages environment variables if you use Gemini features.
   - Leave the Deploy command field empty (Pages will upload `dist/`).

3. Node version: set to 18.x (or higher) in Pages settings.

4. Branches and triggers: select `main` (or your production branch) to deploy on push.

5. After the deployment completes, visit your Pages domain or the custom domain `https://multitools.click`.

Troubleshooting:
- If the build succeeds but the site is blank, check build logs for errors and ensure `index.html` in `dist/` doesn't reference `.tsx`.
- You can run locally:
  ```bash
  npm install
  npm run build
  npm run check:dist
  npm run preview
  ```

Alternative: If your Cloudflare setup uses Wrangler (Workers) today, `wrangler.jsonc` is present and points to `./dist` so `npx wrangler deploy` will upload static assets. For long-term reliability and preview deployments, Pages is recommended.
