# Smart Home Gardening and Decoration System

A React Native (Expo) Android app with a Node.js API. This build covers the first three modules:

| # | Module | What's included |
|---|--------|-----------------|
| 1 | **User & Role Management** | Login for 4 roles: home owner, gardener and decorator sign up in the app; admins are seeded or promoted by another admin · profile and saved addresses · garden profile · separate screens for each role · account recovery with a 6-digit code |
| 2 | **Flower Knowledge Base** | 39-flower catalogue · care guides, precautions and common problems · search and filters · favourites · "Flora" care chatbot |
| 3 | **Seasonal Recommender** | In-season flowers · city and climate matching (16 Pakistani cities) · live weather tips (Open-Meteo) · space and sunlight suitability · 12-month seasonal calendar |

```
.
├── backend/            Express API (JSON-file database, JWT auth)
│   ├── public/images/  Flower & hero photos served to the app
│   └── src/            routes/, services/ (recommender, weather, chatbot), data/
├── frontend/           Expo SDK 58 app (expo-router, TypeScript)
│   └── src/            app/ (screens by route), components/, screens/, context/, lib/
└── scripts/dev.js      Starts emulator + API + Expo with one command
```

## Getting started

Prerequisites: Node.js 20+, Android Studio with at least one emulator (AVD).

```bash
npm i        # installs root, backend and frontend
npm start    # (or: npm run dev) boots the emulator, starts the API, opens the app
```

`npm start` will:
1. Use a connected device, or boot your first Android emulator (to pick a specific one: `$env:AVD="Pixel_7a_API_35"; npm start` in PowerShell, or `AVD=Pixel_7a_API_35 npm start` in bash).
2. Start the API on port 4000 with auto-reload.
3. Run `expo start --android`, which installs **Expo Go** on the emulator the first time and opens the app.

In the Expo terminal, press `r` to reload and `a` to reopen on Android.

### Other scripts

| Command | Purpose |
|---|---|
| `npm run backend` | API only |
| `npm run frontend` | Expo only |
| `npm run emulator` | Boot the emulator only |
| `npm run reset-db` | Wipe local data and re-seed the demo accounts (stop the API first) |
| `npm run typecheck` | TypeScript check of the app |

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Home owner | sara@demo.com | Demo@123 |
| Gardener | ali@demo.com | Demo@123 |
| Decorator | hina@demo.com | Demo@123 |
| Admin | admin@shgds.app | Admin@123 |

The login screen has one-tap buttons for each account.

**Password reset:** no email service is connected, so in demo mode the 6-digit code is shown in the app and printed in the API log. Set `DEMO_MODE=false` to hide it.

## Notes

- Data is stored in `backend/data/db.json` (created on first run, git-ignored).
- `dev.js` runs `adb reverse tcp:4000 tcp:4000`, so the app (emulator or USB phone) reaches the API at `localhost:4000`. If that fails it falls back to the emulator's host address `10.0.2.2:4000`.
- To use another API port: `$env:PORT="5000"; npm start` (PowerShell) or `PORT=5000 npm start` (bash).
- `JWT_SECRET` and `DEMO_MODE` can be set as environment variables for the backend; the defaults are for local development only.
- Weather comes from [Open-Meteo](https://open-meteo.com) (free, no key). When offline, the app falls back to climate averages.
- Flower photos are from Wikimedia Commons (CC licences), via Wikipedia.

## Troubleshooting

- **"Can't reach the server"**: check that the `[api]` lines appear in the terminal and that port 4000 is free.
- **Emulator not found**: set `ANDROID_HOME` to your SDK path (default on Windows: `%LOCALAPPDATA%\Android\Sdk`).
- **Stale bundle**: `cd frontend && npx expo start -c` clears Metro's cache.
