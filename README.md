# ORACLE — Live Camera Widget System

This repository contains three main components:

- `backend/` — Next.js App Router backend deployable to Vercel
- `mobile/` — Expo React Native app for streaming frames from Android
- `electron/` — Electron macOS widget (WODGET EVERYTHING ORACLE)

Quick start:

1. Backend

```bash
cd backend
npm install
npm run dev
```

2. Mobile (in separate terminal)

```bash
cd mobile
npm install
npx expo start
```

3. Electron (macOS)

```bash
cd electron
npm install
npm start
```

Deployment:
- Backend: push `backend/` to Vercel, set `JWT_SECRET` in Vercel environment variables.
- Electron: build with `npm run dist` (requires macOS environment for DMG signing/build).
- Mobile: use `expo build` or EAS for production builds.

See each subfolder README for more details.
