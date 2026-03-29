# Run on iPhone 14 (Landscape)

## 1) Start with one command

From the project folder:

```bash
npm run iphone
```

This starts the local server and prints the exact URL for your iPhone.

## 2) Open on iPhone (same Wi-Fi)

Use the URL printed in the terminal, for example:

`http://192.168.1.23:8000`

## 3) Use landscape

- Rotate iPhone to horizontal.
- If phone is vertical, the game shows a "Rotate your iPhone to landscape" screen.

## 4) (Optional) Add to Home Screen

In Safari, tap Share -> Add to Home Screen for a cleaner full-screen app feel.

## 5) Offline install (important)

This game is now PWA-ready (manifest + service worker), but iPhone will only enable offline caching from a **secure origin**:

- `https://...` (recommended), or
- `http://localhost` (not usable from phone to Mac over Wi-Fi)

So for true offline use on iPhone:

1. Host the game once on an HTTPS URL (for example GitHub Pages, Netlify, or Vercel).
2. Open that HTTPS URL on iPhone Safari.
3. Play once so assets cache.
4. Tap Share -> Add to Home Screen.
5. Turn on Airplane Mode and reopen from Home Screen to verify offline launch.

Note: `npm run iphone` over `http://<mac-ip>:8000` is perfect for local testing, but iOS may not allow service-worker offline install from that non-HTTPS URL.

## 6) Manual fallback (if needed)

If you do not want to use npm:

```bash
./start-iphone.sh
```
