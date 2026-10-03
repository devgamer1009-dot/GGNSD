# Deployment Guide - CrownFall

## Overview

This guide covers deploying CrownFall to static hosting services. The game is a single-page application (SPA) that can be hosted on any static file server.

## Build Output

After running `npm run build`, the following files are generated in the `dist/` directory:

```
dist/
├── index.html              # Main entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── assets/
│   ├── index-[hash].js     # Main JavaScript bundle
│   └── index-[hash].css    # Main CSS bundle
├── icons/
│   ├── icon-192.png        # PWA icon (192x192)
│   └── icon-512.png        # PWA icon (512x512)
└── screenshots/
    └── gameplay-1.png      # PWA screenshot
```

**Total Size:** ~276 KB gzipped (982 KB uncompressed)

## Deployment Options

### Option 1: Netlify (Recommended)

**Automatic Deployment:**

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18 or higher

3. Add `netlify.toml` to project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

4. Deploy:
```bash
npm run build
netlify deploy --prod
```

**Manual Deployment:**

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Option 2: Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
npm run build
vercel --prod
```

3. Add `vercel.json` to project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

### Option 3: GitHub Pages

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add to `package.json`:
```json
{
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}
```

3. Add to `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/repository-name/', // Replace with your repo name
  // ... other config
})
```

4. Deploy:
```bash
npm run build
npm run deploy
```

### Option 4: AWS S3 + CloudFront

1. Create S3 bucket:
```bash
aws s3 mb s3://crownfall-game --region us-east-1
```

2. Enable static website hosting:
```bash
aws s3 website s3://crownfall-game --index-document index.html --error-document index.html
```

3. Upload files:
```bash
npm run build
aws s3 sync dist/ s3://crownfall-game --acl public-read
```

4. Create CloudFront distribution:
```bash
aws cloudfront create-distribution \
  --origin-domain-name crownfall-game.s3.amazonaws.com \
  --default-root-object index.html
```

5. Configure CloudFront caching:
- Default TTL: 86400 seconds (1 day)
- Maximum TTL: 31536000 seconds (1 year)
- Minimum TTL: 0 seconds

### Option 5: Self-Hosted (Nginx)

1. Build the project:
```bash
npm run build
```

2. Copy `dist/` to web server

3. Nginx configuration:

```nginx
server {
    listen 80;
    server_name crownfall.example.com;
    root /var/www/crownfall;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - no caching
    location = /sw.js {
        expires 0;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

## PWA Configuration

### Service Worker

The Service Worker (`sw.js`) provides offline support:

**Caching Strategy:**
- Core assets: Cache First
- Dynamic content: Network First with cache fallback
- Static assets: Immutable caching (1 year)

**Cache Invalidation:**
- Version-based cache names (`crownfall-v1`)
- Old caches automatically deleted on update
- Manual cache clear via `CLEAR_CACHE` message

**Update Flow:**
1. New version deployed
2. Service Worker detects update
3. User prompted to reload
4. New Service Worker activates
5. Old cache cleared

### Manifest

The `manifest.json` enables PWA installation:

**Features:**
- App name and description
- Theme colors
- Icons (192x192, 512x512)
- Screenshots
- Shortcuts (Continue, New Game)

**Installation:**
- Desktop: Install button in browser
- Mobile: "Add to Home Screen" prompt

## Performance Optimization

### Build Optimization

The production build includes:
- ✅ Tree shaking (unused code removed)
- ✅ Code minification (Terser)
- ✅ CSS optimization
- ✅ Asset hashing (cache busting)
- ✅ Gzip/Brotli compression

### Runtime Optimization

**Bundle Size:**
- JavaScript: ~276 KB gzipped
- CSS: ~2.5 KB gzipped
- Total: ~278 KB gzipped

**Loading Strategy:**
1. HTML loads first (critical path)
2. CSS loads in parallel
3. JavaScript loads and executes
4. Service Worker registers
5. Game initializes

**Caching:**
- Static assets: 1 year (immutable)
- Service Worker: No cache (always check for updates)
- HTML: No cache (always fetch fresh)

## Environment Variables

Create `.env` files for different environments:

**.env.production:**
```
VITE_API_URL=https://api.crownfall.com
VITE_ANALYTICS_ID=UA-XXXXXXXX-X
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

**.env.development:**
```
VITE_API_URL=http://localhost:3000
VITE_ANALYTICS_ID=
VITE_SENTRY_DSN=
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

## SSL/HTTPS

**Required for:**
- Service Worker
- PWA installation
- Geolocation API (if used)

**Free SSL Options:**
- Netlify: Automatic SSL via Let's Encrypt
- Vercel: Automatic SSL via Let's Encrypt
- GitHub Pages: Automatic SSL via Let's Encrypt
- Cloudflare: Free SSL proxy

## Monitoring

### Error Tracking

Integrate error tracking service:

```typescript
// In ErrorBoundary.tsx
if (import.meta.env.PROD) {
  Sentry.captureException(error, { extra: errorInfo });
}
```

### Analytics

Track user engagement:

```typescript
// In main.tsx
if (import.meta.env.VITE_ANALYTICS_ID) {
  // Initialize analytics
}
```

### Performance Monitoring

Use Web Vitals:

```typescript
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(console.log);  // Cumulative Layout Shift
getFID(console.log);  // First Input Delay
getLCP(console.log);  // Largest Contentful Paint
```

## Troubleshooting

### Service Worker Issues

**Problem:** Old version cached
**Solution:**
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
window.location.reload();
```

### PWA Installation Issues

**Problem:** Install prompt not showing
**Solution:**
- Check manifest.json is valid
- Ensure HTTPS
- Verify Service Worker is registered
- Check browser console for errors

### Build Failures

**Problem:** TypeScript errors
**Solution:**
```bash
npm run typecheck
```

**Problem:** Linting errors
**Solution:**
```bash
npm run lint:fix
```

### Performance Issues

**Problem:** Slow loading
**Solution:**
- Enable gzip compression on server
- Use CDN for static assets
- Optimize images (if any)
- Code split large bundles

## Deployment Checklist

Before deploying:

- [ ] Run `npm run check` (typecheck + lint + test + build)
- [ ] Verify build output in `dist/`
- [ ] Test locally with `npm run preview`
- [ ] Check PWA manifest is valid
- [ ] Verify Service Worker registers
- [ ] Test offline functionality
- [ ] Check all routes work (SPA routing)
- [ ] Verify caching headers
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Check performance metrics
- [ ] Verify error tracking works
- [ ] Update version number
- [ ] Create release notes

## Post-Deployment

After deploying:

1. **Verify Deployment:**
   - Visit production URL
   - Check browser console for errors
   - Test core functionality
   - Verify PWA installation

2. **Monitor:**
   - Check error tracking service
   - Monitor performance metrics
   - Review user feedback

3. **Update Documentation:**
   - Update CHANGELOG.md
   - Create release notes
   - Update version in package.json

## Rollback

If deployment has issues:

**Netlify:**
```bash
netlify deploy --prod --dir=dist-previous
```

**Vercel:**
```bash
vercel rollback
```

**Manual:**
```bash
# Revert to previous build
git checkout previous-tag
npm run build
# Redeploy
```

## Support

For deployment issues:
- Check browser console for errors
- Verify server configuration
- Review deployment logs
- Contact hosting provider support

---

**Last Updated:** 2026-03-19  
**Version:** 1.0.0
