# Progressive Web App (PWA) Guide

This boilerplate includes full PWA support using **@ducanh2912/next-pwa** with Workbox integration.

## What is PWA?

A Progressive Web App combines the best of web and native apps:
- **Installable**: Users can add your app to their home screen
- **Offline Support**: Works without internet connection (with cached content)
- **Fast**: Aggressive caching makes subsequent loads nearly instant
- **Native-like**: Runs in standalone mode without browser UI
- **Cross-platform**: One codebase works on iOS, Android, and desktop

## Current Implementation

### Package

**@ducanh2912/next-pwa** v10.2.9
- Modern PWA solution for Next.js
- Built on Google's Workbox library
- Automatic service worker generation
- Zero-config for basic setup

### Configuration

**File:** `next.config.ts`

```typescript
const withPWA = withPWAInit({
  dest: "public",                          // Service worker output directory
  cacheOnFrontEndNav: true,                // Cache client-side navigation
  aggressiveFrontEndNavCaching: true,      // Aggressive caching strategy
  reloadOnOnline: true,                    // Auto-reload when back online
  workboxOptions: {
    disableDevLogs: true,                  // Disable Workbox logs in dev
  },
});
```

**What this does:**
- Generates service worker automatically during build
- Caches all Next.js pages and static assets
- Enables offline browsing for previously visited pages
- Detects when user comes back online and reloads

### Web Manifest

**File:** `public/manifest.json`

```json
{
  "name": "Componentes Corporativos Externos",
  "short_name": "CCE Portal",
  "description": "Plataforma de Gestión Corporativa CCE",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/web-app-manifest-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/web-app-manifest-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "orientation": "portrait"
}
```

**Key fields:**
- `display: "standalone"`: Hides browser UI when installed
- `theme_color`: Colors the status bar on mobile
- `icons`: App icons for installation (see setup section below)
- `purpose: "maskable"`: Adaptive icons that work with shaped icons on Android

### Metadata Configuration

**File:** `app/layout.tsx`

PWA metadata in root layout:
```typescript
export const metadata: Metadata = {
  manifest: "/manifest.json",             // Links to web manifest
  appleWebApp: {
    capable: true,                        // Enables iOS installation
    statusBarStyle: "default",            // iOS status bar style
    title: "CCE Portal",
  },
  formatDetection: {
    telephone: false,                     // Disable auto phone number linking
  },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
```

## Setup Instructions

### 1. Create App Icons (Required)

The PWA requires two icon files. Create them and add to `public/` directory:

**Required files:**
- `public/web-app-manifest-192x192.png` (192x192 pixels)
- `public/web-app-manifest-512x512.png` (512x512 pixels)

**Icon requirements:**
- PNG format
- Transparent background recommended
- Square aspect ratio
- Should look good when masked (adaptive icons)

**Tools for generating icons:**
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Figma](https://www.figma.com/) - Design custom icons

**Quick example using ImageMagick:**
```bash
# Resize existing logo
convert logo.png -resize 192x192 public/web-app-manifest-192x192.png
convert logo.png -resize 512x512 public/web-app-manifest-512x512.png
```

### 2. Customize Manifest (Optional)

Edit `public/manifest.json` to match your branding:

```json
{
  "name": "Your App Name",              // Full name (shown during install)
  "short_name": "App",                  // Short name (shown under icon)
  "description": "Your app description",
  "theme_color": "#your-brand-color",   // Update to match your theme
  "background_color": "#ffffff"         // Background while app loads
}
```

### 3. Build and Test

```bash
npm run build
npm start
```

Visit `http://localhost:3000` and check:
1. Browser developer tools → Application tab → Manifest
2. Service Worker should be registered
3. Install prompt should appear (Chrome: address bar icon, Safari: Share → Add to Home Screen)

## Testing PWA

### Desktop (Chrome/Edge)

1. Open DevTools → Application tab
2. Check **Manifest** section - should show your manifest.json
3. Check **Service Workers** - should show registered worker
4. Install app: Click install icon in address bar (or +)

### Mobile (Android Chrome)

1. Visit site on mobile Chrome
2. Banner "Add to Home Screen" should appear
3. Tap "Add" to install
4. App appears on home screen like native app

### Mobile (iOS Safari)

1. Visit site on Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. App installs with standalone mode

### Offline Testing

1. Visit app while online
2. Navigate to a few pages (to cache them)
3. Enable Airplane Mode or DevTools → Network → Offline
4. Refresh page - should still work (with cached content)
5. Navigate to previously visited pages - should load from cache

## How It Works

### Service Worker Lifecycle

1. **Build time**: Workbox generates service worker in `public/sw.js`
2. **First visit**: Browser downloads and registers service worker
3. **Subsequent visits**: Service worker intercepts requests
4. **Caching**: Static assets and pages cached according to strategy
5. **Updates**: New service worker downloaded when app updates

### Caching Strategies

**Configured strategies:**

1. **Aggressive Front-End Nav Caching** (`aggressiveFrontEndNavCaching: true`)
   - All Next.js pages cached on first visit
   - Client-side navigation uses cache first
   - Result: Near-instant page transitions

2. **Cache on Navigation** (`cacheOnFrontEndNav: true`)
   - Pages cached as user navigates
   - No need to pre-cache entire app

3. **Auto-reload on Online** (`reloadOnOnline: true`)
   - Detects when connection restored
   - Automatically reloads to fetch fresh content

### Generated Files

After build, these files appear in `public/`:
- `sw.js` - Main service worker
- `workbox-*.js` - Workbox runtime libraries
- `sw.js.map` - Source map for debugging

**Note:** These are auto-generated. Never edit manually.

## Customization

### Custom Service Worker

If you need custom caching logic, create `worker/index.ts`:

```typescript
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry } from '@serwist/precaching';
import { installSerwist } from '@serwist/sw';

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  // Add custom runtime caching here
});
```

Then update `next.config.ts`:
```typescript
withPWA({
  swSrc: 'worker/index.ts',  // Use custom worker
  // ... other options
})
```

### Custom Install Prompt

Create a component to control install timing:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    })
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-background border rounded-lg shadow-lg">
      <p className="mb-2">Install CCE Portal for quick access!</p>
      <Button onClick={handleInstall}>Install App</Button>
    </div>
  )
}
```

### Disable PWA in Development

PWA is enabled in all environments by default. To disable in dev:

```typescript
// next.config.ts
const withPWA = withPWAInit({
  disable: process.env.NODE_ENV === 'development',  // Disable in dev
  // ... other options
})
```

## Production Checklist

Before deploying PWA to production:

- [ ] App icons created (192x192 and 512x512)
- [ ] Icons placed in `public/` directory
- [ ] Manifest customized with your branding
- [ ] Theme color matches your app design
- [ ] HTTPS enabled (required for service workers)
- [ ] Tested installation on Android
- [ ] Tested installation on iOS
- [ ] Tested offline functionality
- [ ] Verified service worker registration in production

## Troubleshooting

### Install Prompt Not Showing

**Causes:**
1. App already installed
2. Missing manifest.json
3. Missing app icons
4. Not using HTTPS (production)
5. Insufficient engagement (browser heuristics)

**Solutions:**
- Clear browser data and revisit
- Check DevTools → Application → Manifest for errors
- Ensure icons exist at specified paths
- Use HTTPS (even localhost with self-signed cert)

### Service Worker Not Registering

**Causes:**
1. Not running production build (`npm run build`)
2. Service worker file not generated
3. Scope issues

**Solutions:**
```bash
# Ensure production build
npm run build
npm start

# Check public directory
ls -la public/sw.js

# DevTools → Application → Service Workers
# Should show registered worker
```

### Offline Not Working

**Causes:**
1. Pages not visited while online (not cached)
2. Dynamic content that requires server
3. Service worker not active

**Solutions:**
- Visit pages while online first
- Check cached resources: DevTools → Application → Cache Storage
- Implement offline fallback UI

### Icons Not Showing

**Causes:**
1. Wrong file paths in manifest.json
2. Wrong image dimensions
3. Incorrect MIME type

**Solutions:**
```bash
# Verify icon files exist
ls -la public/web-app-manifest-*.png

# Check dimensions
file public/web-app-manifest-192x192.png
# Should output: PNG image data, 192 x 192

# Test manifest
# DevTools → Application → Manifest
# Icons section should show images
```

### App Not Updating

Service workers cache aggressively. To force update:

1. **Development:**
   ```bash
   # DevTools → Application → Service Workers
   # Click "Unregister" then refresh
   ```

2. **Production:**
   - New deployments auto-update service worker
   - Users get update on next visit (within 24 hours)
   - Force: Set `skipWaiting: true` in config

## Resources

- [next-pwa Documentation](https://github.com/DuCanhGH/next-pwa)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA Checklist](https://web.dev/pwa-checklist/)
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)

## Advanced Features (Future)

These are not yet implemented but supported by the PWA infrastructure:

- **Push Notifications**: Send notifications to installed users
- **Background Sync**: Sync data when connection restored
- **Periodic Background Sync**: Update content in background
- **Share Target**: Let users share content to your app
- **File Handling**: Open specific file types with your app
