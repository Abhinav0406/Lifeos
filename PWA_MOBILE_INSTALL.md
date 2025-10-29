# PWA Mobile Installation Guide

## Current Status
✅ PWA is configured and enabled
✅ Service Worker is registered
✅ Manifest.json is configured
⚠️ Icons need to be generated (currently using SVG fallback)

## To Install on Mobile:

### Requirements:
1. **HTTPS Connection** - PWAs require HTTPS (except localhost)
   - Use your deployed URL (Vercel/Netlify) which provides HTTPS automatically
   - Localhost works for development/testing

2. **Browser Compatibility:**
   - **Chrome/Edge (Android)**: Full support
   - **Safari (iOS)**: Requires iOS 16.4+ with "Add to Home Screen"
   - **Samsung Internet**: Full support

### Installation Steps:

#### Android (Chrome):
1. Open the app in Chrome
2. Wait for the install prompt OR
3. Tap the menu (3 dots) → "Install app" / "Add to Home Screen"
4. Confirm installation

#### iOS (Safari):
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Customize the name if desired
5. Tap "Add"

### To Generate PNG Icons (Optional but Recommended):

You can use online tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

Or use ImageMagick:
```bash
# Convert SVG to PNG at different sizes
convert -background none -resize 72x72 icon.svg icon-72x72.png
convert -background none -resize 96x96 icon.svg icon-96x96.png
convert -background none -resize 128x128 icon.svg icon-128x128.png
convert -background none -resize 144x144 icon.svg icon-144x144.png
convert -background none -resize 152x152 icon.svg icon-152x152.png
convert -background none -resize 192x192 icon.svg icon-192x192.png
convert -background none -resize 384x384 icon.svg icon-384x384.png
convert -background none -resize 512x512 icon.svg icon-512x512.png
```

Place all PNG files in `public/icons/` and update `manifest.json` to reference them.

### Testing PWA:
1. Open DevTools → Application → Service Workers
2. Check if service worker is registered
3. View Manifest → Check if all fields are correct
4. Test offline mode by going offline in DevTools

### Troubleshooting:

**Install button not showing:**
- Ensure you're using HTTPS (not HTTP)
- Clear browser cache
- Check DevTools Console for errors
- Verify service worker is registered

**Icons not showing:**
- Ensure icon files exist at the specified paths
- Check manifest.json icon paths are correct
- Use absolute paths starting with `/`

**Not installable:**
- Check Chrome DevTools → Application → Manifest
- Look for errors or warnings
- Ensure `display: "standalone"` or `display: "standalone"` is set
- Verify start_url is valid

