<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/13TyrNh1XXvSvltSdNcdyqTW0C26-145h

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env](.env) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Production

This project is configured for automatic deployment to Hostinger via GitHub integration.

1. Ensure `GEMINI_API_KEY` is set in your Hostinger environment variables or GitHub secrets
2. Push changes to the main branch
3. Hostinger will automatically build and deploy the site to https://multitools.click

The build output is in the `dist` folder, served as a static site.

## Cloudflare Deployment (recommended: Pages)

This repository can be deployed to Cloudflare in two ways:

- Recommended (Cloudflare Pages - static site):
   1. In Cloudflare Dashboard → Pages → Create project → Connect your GitHub repo
   2. Framework preset: `Vite`
   3. Build command: `npm run build`
   4. Build output directory: `dist`
   5. Remove any custom Deploy command (leave blank)
   6. Ensure Node version is 18+

- Alternative (Workers static assets using Wrangler):
   - If your Cloudflare integration runs `npx wrangler deploy`, this repo includes `wrangler.jsonc` which points to `./dist` so Wrangler will upload the built assets.

After pushing changes, Cloudflare will build and publish the `dist/` directory.
