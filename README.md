# jour fixe — deployment guide

A shared video queue for friend group movie nights. Host on a TV/laptop, guests join from their phones, everyone votes/rates/reacts.

This guide gets it running on the internet, free, in about 20 minutes.

## Architecture (one paragraph)

Two pieces. The **frontend** (React app you click around) is static HTML/CSS/JS that lives on **GitHub Pages**. The **backend** (the Node.js server that holds sessions in memory and syncs guests) lives on **Render.com's free tier**. Both deploy automatically from your GitHub repo. The frontend talks to the backend via HTTPS, so it works from anywhere on the internet — friends don't need to be on your WiFi.

## Project structure

```
jour-fixe/
├── .github/workflows/deploy.yml   # auto-deploys frontend on push
├── src/
│   ├── App.jsx                    # the whole app
│   └── main.jsx                   # React entry
├── server/
│   ├── server.js                  # Express backend
│   └── package.json
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## Part 1 — Put the code on GitHub

1. Create a new public repo on GitHub. Call it whatever you like — for the rest of this guide I'll assume **`jour-fixe`**. Don't initialize with a README (we have files already).

2. **Edit `vite.config.js`** and change the `base` to match your repo name:
   ```js
   base: '/jour-fixe/',  // if your repo is "movie-night", use '/movie-night/'
   ```

3. From your project folder, push the code:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/jour-fixe.git
   git push -u origin main
   ```

---

## Part 2 — Deploy the backend on Render

1. Sign up at [render.com](https://render.com) with your GitHub account.

2. Dashboard → **New +** → **Web Service**.

3. Connect your `jour-fixe` repo. Render reads it directly.

4. Configure:

   | Field | Value |
   |---|---|
   | Name | `jour-fixe-server` (becomes part of your URL) |
   | Region | pick one near you/your friends |
   | Branch | `main` |
   | **Root Directory** | `server` ← **important** |
   | Runtime | `Node` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance Type | **Free** |

5. Scroll to **Environment Variables** and add:

   - Key: `ALLOWED_ORIGINS`
   - Value: `https://YOUR_USERNAME.github.io` (we'll come back and adjust this if needed)

6. Click **Create Web Service**. Wait ~2 minutes for the first deploy.

7. When it's live, copy the URL at the top — looks like `https://jour-fixe-server-abc123.onrender.com`. **Keep this URL handy.**

8. Test it: open `https://jour-fixe-server-abc123.onrender.com/api/health` in your browser. You should see `{"ok":true,...}`. If yes, backend is live.

---

## Part 3 — Connect the frontend to the backend

1. Back on GitHub, go to your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

2. Add:
   - Name: `VITE_API_URL`
   - Value: your Render URL from step 7 above (no trailing slash, e.g. `https://jour-fixe-server-abc123.onrender.com`)

---

## Part 4 — Turn on GitHub Pages

1. In your repo → **Settings** → **Pages**.

2. Under **Build and deployment**, set **Source** to **GitHub Actions** (not "Deploy from a branch").

3. Go to **Actions** tab. The deploy workflow should already be running from your initial push. If not, push any small change to trigger it (or click "Run workflow" manually).

4. When the workflow finishes (green checkmark, ~1 minute), your site is live at:
   ```
   https://YOUR_USERNAME.github.io/jour-fixe/
   ```

5. Open it. The pill in the top left should say "● server online" (it might say "waking server…" first if Render was asleep — that takes ~30 seconds).

---

## Part 5 — Sanity test

- Open the URL on your laptop → click "Host a session" → get a code.
- Open the URL on your phone (cellular, NOT WiFi) → click "Join with a code" → enter the code.
- The phone should show the join screen. The laptop should show "1 guest" in the top bar.
- Add a YouTube link from your phone. Hit play on the laptop. The video plays for both. Reactions float up. You're live.

---

## Smart TV / TV display

For the actual jour fixe night, you have three solid options:

1. **HDMI cable** — open the host URL in a browser on a laptop, connect that laptop to your TV via HDMI, hit fullscreen on the video. Most reliable.

2. **Chromecast / AirPlay** — cast the browser tab to the TV. Works fine but adds a bit of input lag for the host UI.

3. **Smart TV browser** — Samsung Tizen, LG webOS, and Android TV all have browsers. Open the URL directly on the TV. The host view is built with TV viewing distance in mind: bigger fonts, prominent code display, no hover-dependent UI, scales up cleanly on 4K.

For mobile guests, just send them the URL via WhatsApp/Discord/whatever. They tap → join with the code → done. The sticky emote dock at the bottom of the phone screen means reactions are always one tap away.

---

## Things to know (caveats)

- **First request after sleep is slow.** Render's free tier puts the server to sleep after 15 minutes of inactivity. The next request wakes it up — takes ~30 seconds. The landing page pings the backend on load, so the warm-up happens while people are reading the home screen.
- **Sessions are in-memory.** If Render restarts the server (rare, but happens on free tier), active sessions vanish. For a single evening this is essentially never an issue.
- **24-hour auto-cleanup.** Inactive sessions get garbage-collected hourly.
- **Free tier limits.** Render free tier gives you 750 hours/month and is plenty for occasional jour fixe nights. GitHub Pages is free for public repos with generous limits.

---

## Updating the app later

Make code changes locally, then:
```bash
git add .
git commit -m "what changed"
git push
```

GitHub Actions rebuilds and redeploys the frontend automatically. Render watches for backend changes (anything in `server/`) and redeploys those automatically too.

---

## Local development

Two terminals from the project root:

**Terminal 1 (backend):**
```bash
cd server
npm install
npm start
```

**Terminal 2 (frontend):**
```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/jour-fixe/`).

In dev, the frontend talks to `localhost:3001` via Vite's proxy. In production, it talks to your Render URL because `VITE_API_URL` is set at build time.

---

## Troubleshooting

**"can't reach the backend" on the landing page**
The Render service is sleeping or down. Visit `https://your-render-url.onrender.com/api/health` directly. If that fails, check Render dashboard → Logs.

**CORS errors in the browser console**
The `ALLOWED_ORIGINS` env var on Render doesn't match your GitHub Pages URL. Open Render dashboard → your service → Environment → fix the value → save (this triggers a redeploy).

**Site loads but shows a blank screen**
Probably the `base:` in `vite.config.js` doesn't match your repo name. Check the browser console for 404s on `.js` files.

**GitHub Action fails**
Check the Actions tab logs. Most common cause: missing the `VITE_API_URL` secret.

---

Built with React + Vite (frontend) and Express (backend). Have fun.
