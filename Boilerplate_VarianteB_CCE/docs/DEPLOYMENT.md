# Deployment

This boilerplate is optimized for **Vercel** but can be deployed anywhere that supports Next.js.

## Deploying to Vercel

1. **Push to GitHub**
   Ensure your code is committed and pushed.

2. **Import Project**
   - Go to Vercel Dashboard -> Add New -> Project.
   - Select your repository.

3. **Environment Variables**
   Vercel requires the environment variables to build portions of the app (though mostly runtime).
   Add the following:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_POSTHOG_KEY` (Optional)
   - `NEXT_PUBLIC_POSTHOG_HOST` (Optional)

4. **Deploy**
   Click **Deploy**.

## Linking Supabase (Alternative)
If using Vercel Integrations:
1. Go to Project Settings -> Integrations.
2. Add "Supabase".
3. This will automatically inject `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` into your environment.

## Post-Deployment
- **Usage**: Visit your production URL.
- **Auth**: Ensure your "Site URL" in Supabase Auth Settings matches your Vercel domain (e.g., `https://my-app.vercel.app`) to allows redirects to work.

## CI/CD (GitHub Actions)
The repository includes a pre-configured workflow `.github/workflows/ci.yml`.
- **Triggers**: On Push to `main` and all Pull Requests.
- **Checks**:
  - `npm run lint`: Code style.
  - `tsc`: Type checking.
  - `npm run build`: Production build verification.

