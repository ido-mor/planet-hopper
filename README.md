# Planet Hopper

A landscape math rocket game. Solve problems to fly toward the next planet.

Play it here: **https://ido-mor.github.io/planet-hopper/**

This is a progressive web app (PWA). It is not an App Store or Play Store app. On a phone it installs as a Home Screen icon and can run full-screen.

## Install on a phone

1. Open **https://ido-mor.github.io/planet-hopper/** in **Safari** (iPhone) or **Chrome** (Android).
2. Rotate to **landscape**.
3. Play once so sounds and assets load.
4. Add it to the Home Screen:
   - **iPhone:** Share → **Add to Home Screen** → Add
   - **Android:** menu (⋮) → **Install app** or **Add to Home Screen**
5. Launch it from that icon. It should open like an app, without the browser chrome.

iOS only treats it as a real install (including offline) from an **https** site. The GitHub Pages URL already qualifies.

## Share with others

Send them the same link: **https://ido-mor.github.io/planet-hopper/**

They open it in a mobile browser, then Add to Home Screen if they want an icon. Anyone with the link can play; no App Store account needed.

## Play on your phone from this Mac (same Wi-Fi only)

This is for local testing, not for sharing:

```bash
npm run iphone
```

Then open the `http://192.168.x.x:8000` URL it prints, on a phone on the same Wi-Fi. That HTTP address will **not** install as a proper offline Home Screen app on iPhone.

See [LOCAL_IPHONE_SETUP.md](LOCAL_IPHONE_SETUP.md) for more detail.

## Run locally on this computer

```bash
npm start
```

Then open **http://127.0.0.1:8000** in a browser.
