# Getting Started

Follow these steps to get your local environment running.

## Prerequisites
- Node.js 22+ (see .nvmrc)
- npm or pnpm
- A Supabase Project

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/molten-filament.git
   cd molten-filament
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Duplicate the example file:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```ini
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # Optional for local dev
   NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
   SENTRY_AUTH_TOKEN=your-auth-token-here
   NEXT_PUBLIC_POSTHOG_KEY=your-key-here
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```

4. **Setup Database**
   - Go to your Supabase Dashboard -> SQL Editor.
   - Copy the contents of `supabase/schema.sql`.
   - Run the query to create the `profiles` table and enable RLS.

   **Note:** This is initial setup only. For schema changes, see [MIGRATIONS.md](MIGRATIONS.md).

5. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

6. **Run Tests (Optional)**
   ```bash
   npm run test
   ```
   Runs basic setup test. See [TESTING.md](TESTING.md) for contributing tests.

## Common Issues

**Build fails with type errors?**
Ensure you are in Strict Mode. Run `npm run type-check` (if configured) or `tsc --noEmit` to verify.

**Supabase 401 Unauthorized?**
Check if you have RLS enabled but no policies. Our boilerplates requires specific RLS policies (see Step 4).
