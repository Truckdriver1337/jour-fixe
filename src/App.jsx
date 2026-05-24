import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/* ---------- BACKEND CONFIG ---------- */
// In dev: empty string, Vite proxy handles /api → localhost:3001
// In prod: set VITE_API_URL in GitHub Actions secret to your Render URL
const API_BASE = import.meta.env.VITE_API_URL || '';

/* ---------- THEME ---------- */

const C = {
  bg: '#1a0e0a',
  bgLight: '#231512',
  card: '#2a1a15',
  border: '#4a2d24',
  borderLight: '#6b443a',
  text: '#f5ecd9',
  textDim: '#a89484',
  accent: '#ff6b35',
  accentHover: '#ff8456',
  warm: '#ffb84d',
  green: '#7eb069',
  red: '#d65a4a',
  pink: '#e89ab5',
};

const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,600&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body, #root { margin: 0; padding: 0; background: ${C.bg}; color: ${C.text}; font-family: 'Inter Tight', system-ui, sans-serif; min-height: 100vh; -webkit-font-smoothing: antialiased; overscroll-behavior: none; }
body { padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
.fd { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
.fm { font-family: 'JetBrains Mono', monospace; }

.grain { position: fixed; inset: 0; pointer-events: none; z-index: 100; opacity: 0.05; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>"); }

@keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.fu { animation: fadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
.fu-2 { animation-delay: 0.08s; } .fu-3 { animation-delay: 0.16s; } .fu-4 { animation-delay: 0.24s; }

@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.pulse { animation: pulse 2s ease-in-out infinite; }

@keyframes glow { 0%, 100% { box-shadow: 0 0 40px rgba(255, 107, 53, 0.15); } 50% { box-shadow: 0 0 70px rgba(255, 107, 53, 0.35); } }
.glow { animation: glow 4s ease-in-out infinite; }

/* Emote animation — bigger drift for TV display */
@keyframes emote-rise {
  0% { transform: translate(0, 30px) scale(0.4) rotate(0deg); opacity: 0; }
  10% { opacity: 1; transform: translate(calc(var(--dx) * 0.3), -40px) scale(1.4) rotate(var(--r1)); }
  60% { opacity: 1; transform: translate(calc(var(--dx) * 0.7), -260px) scale(1.1) rotate(var(--r2)); }
  100% { transform: translate(var(--dx), -520px) scale(0.85) rotate(var(--r3)); opacity: 0; }
}
.emote { animation: emote-rise 4.5s cubic-bezier(0.2, 0.6, 0.4, 1) forwards; will-change: transform, opacity; }

@keyframes pop-in { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
.pop { animation: pop-in 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

@keyframes skip-flash { 0%, 100% { background: ${C.bgLight}; } 50% { background: rgba(214, 90, 74, 0.18); } }
.skip-flash { animation: skip-flash 1.4s ease-in-out infinite; }

input:focus, button:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 3px; }
input:focus { border-color: ${C.accent} !important; }
input::placeholder { color: ${C.textDim}; opacity: 0.5; }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: ${C.borderLight}; }

button { font-family: inherit; cursor: pointer; }
button:disabled { cursor: not-allowed; }

/* ---------- HOST VIEW (TV-optimized layout) ---------- */
.host-grid { display: grid; grid-template-columns: minmax(0, 1fr) clamp(380px, 28vw, 520px); flex: 1; min-height: 0; }
@media (max-width: 900px) {
  .host-grid { grid-template-columns: 1fr !important; }
  .host-grid > .queue-panel { border-left: none !important; border-top: 1px solid ${C.border}; }
}

.btn-primary { transition: transform 0.18s, box-shadow 0.18s, background 0.18s; }
.btn-primary:hover:not(:disabled), .btn-primary:focus-visible:not(:disabled) { transform: translateY(-1px); background: ${C.accentHover} !important; box-shadow: 0 8px 24px rgba(255, 107, 53, 0.25); }
.btn-ghost { transition: background 0.18s, border-color 0.18s, color 0.18s; }
.btn-ghost:hover:not(:disabled), .btn-ghost:focus-visible:not(:disabled) { background: ${C.bgLight} !important; border-color: ${C.accent} !important; color: ${C.text} !important; }

.rating-dot { transition: transform 0.15s, background 0.15s, color 0.15s, border-color 0.15s; }
.rating-dot:hover:not(:disabled), .rating-dot:focus-visible:not(:disabled) { transform: translateY(-3px); border-color: ${C.warm} !important; }

.emote-btn { transition: transform 0.18s, background 0.18s; }
.emote-btn:active { transform: scale(0.88); }
.emote-btn:hover:not(:disabled), .emote-btn:focus-visible:not(:disabled) { background: ${C.card} !important; }

/* Fullscreen player wrapper — emote overlay travels with it */
.player-wrap:fullscreen, .player-wrap:-webkit-full-screen {
  background: #000; padding: 0; display: flex; align-items: center; justify-content: center; width: 100vw; height: 100vh;
}
.player-wrap:fullscreen .player-inner, .player-wrap:-webkit-full-screen .player-inner { width: 100%; height: 100%; }
.player-wrap:fullscreen .player-inner iframe, .player-wrap:-webkit-full-screen .player-inner iframe {
  width: 100%; height: 100%; aspect-ratio: unset;
}
.player-wrap:fullscreen .fs-controls, .player-wrap:-webkit-full-screen .fs-controls {
  opacity: 0; transition: opacity 0.25s;
}
.player-wrap:fullscreen:hover .fs-controls, .player-wrap:-webkit-full-screen:hover .fs-controls { opacity: 1; }

/* Mobile guest view: sticky emote dock + safe spacing */
.guest-wrap { padding-bottom: calc(120px + env(safe-area-inset-bottom)); }
.guest-dock {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 14px 16px calc(14px + env(safe-area-inset-bottom));
  background: linear-gradient(to bottom, rgba(26, 14, 10, 0.7), ${C.bg} 40%);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid ${C.border};
  z-index: 50;
}
`;

/* ---------- HELPERS ---------- */

function generateCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function generateId() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function parseVideoUrl(raw) {
  if (!raw) return null;
  const url = raw.trim();
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) {
    const id = yt[1];
    const isShort = /youtube\.com\/shorts\//.test(url);
    return {
      platform: isShort ? 'YouTube Shorts' : 'YouTube',
      platformKey: isShort ? 'youtube-shorts' : 'youtube',
      videoId: id,
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`,
      originalUrl: url,
    };
  }
  return null;
}

function videoStats(video) {
  const ratings = video.ratings || [];
  if (!ratings.length) return { avg: 0, count: 0, sum: 0 };
  const sum = ratings.reduce((a, r) => a + r.score, 0);
  return { avg: sum / ratings.length, count: ratings.length, sum };
}

function computeScores(session) {
  const totals = {};
  for (const v of session.queue) {
    const { sum, count } = videoStats(v);
    if (!totals[v.addedById]) totals[v.addedById] = { id: v.addedById, name: v.addedBy, points: 0, videoCount: 0, ratingCount: 0 };
    totals[v.addedById].points += sum;
    totals[v.addedById].videoCount += 1;
    totals[v.addedById].ratingCount += count;
  }
  return Object.values(totals).sort((a, b) => b.points - a.points || b.ratingCount - a.ratingCount);
}

function getLeader(session) {
  const board = computeScores(session);
  if (!board.length || board[0].points === 0) return null;
  return board[0];
}

/* ---------- API CLIENT ---------- */

async function apiGet(key) {
  try {
    const r = await fetch(`${API_BASE}/api/storage/${encodeURIComponent(key)}`);
    if (r.status === 404) return null;
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    console.error('apiGet failed', e);
    return null;
  }
}

async function apiSet(key, value) {
  try {
    const r = await fetch(`${API_BASE}/api/storage/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    return r.ok;
  } catch (e) {
    console.error('apiSet failed', e);
    return false;
  }
}

async function getSession(code) {
  const r = await apiGet(`session:${code}`);
  return r ? JSON.parse(r.value) : null;
}

async function saveSession(code, data) {
  if (data.emotes && data.emotes.length > 50) data.emotes = data.emotes.slice(-50);
  return apiSet(`session:${code}`, JSON.stringify(data));
}

// Warm up backend on app load (Render free tier sleeps after 15min)
async function pingBackend() {
  try { await fetch(`${API_BASE}/api/health`); } catch {}
}

/* ---------- LANDING ---------- */

function Landing({ onCreate, onJoin, loading, error, backendStatus }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 'clamp(20px, 4vw, 48px)',
      background: `radial-gradient(ellipse at 30% 0%, ${C.bgLight}, ${C.bg} 60%)`,
    }}>
      <div className="fu" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span className="fm pulse" style={{ fontSize: 11, letterSpacing: '0.2em', color: backendStatus === 'ok' ? C.green : C.warm, textTransform: 'uppercase' }}>
          ● {backendStatus === 'ok' ? 'server online' : backendStatus === 'warming' ? 'waking server…' : 'connecting…'}
        </span>
        <span className="fm" style={{ fontSize: 11, letterSpacing: '0.2em', color: C.textDim }}>EST. 2026</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 900, margin: '0 auto', width: '100%', padding: '40px 0' }}>
        <div className="fd fu fu-2" style={{ fontSize: 'clamp(64px, 14vw, 180px)', fontWeight: 600, lineHeight: 0.88, fontStyle: 'italic', letterSpacing: '-0.04em' }}>
          jour
        </div>
        <div className="fd fu fu-3" style={{ fontSize: 'clamp(64px, 14vw, 180px)', fontWeight: 700, lineHeight: 0.88, letterSpacing: '-0.04em', color: C.accent, marginBottom: 32 }}>
          fixe.
        </div>
        <div className="fm fu fu-3" style={{ fontSize: 13, letterSpacing: '0.1em', color: C.textDim, textTransform: 'uppercase', marginBottom: 64, maxWidth: 560, lineHeight: 1.7 }}>
          A shared queue for the videos that <span style={{ color: C.warm }}>must</span> be shown tonight.<br />
          Vote. Rate. React. One screen wins.
        </div>

        <div className="fu fu-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, maxWidth: 720 }}>
          <button onClick={onCreate} disabled={loading} className="btn-primary glow" style={{
            background: C.accent, color: C.bg, border: 'none', padding: '28px 28px', textAlign: 'left',
            fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 600, opacity: loading ? 0.6 : 1,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span>Host a session</span>
              <span style={{ fontSize: 36, lineHeight: 0.8 }}>→</span>
            </div>
            <div className="fm" style={{ fontSize: 11, fontWeight: 500, marginTop: 12, opacity: 0.75, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              the big screen
            </div>
          </button>

          <button onClick={onJoin} disabled={loading} className="btn-ghost" style={{
            background: 'transparent', color: C.text, border: `1px solid ${C.border}`,
            padding: '28px', textAlign: 'left', fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 600,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span>Join with a code</span>
              <span style={{ fontSize: 36, lineHeight: 0.8 }}>→</span>
            </div>
            <div className="fm" style={{ fontSize: 11, fontWeight: 500, marginTop: 12, opacity: 0.6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              your phone
            </div>
          </button>
        </div>

        {error && <div className="fm" style={{ color: C.accent, marginTop: 24, fontSize: 13, letterSpacing: '0.05em' }}>{error}</div>}
      </div>

      <div className="fu fu-4" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 32 }}>
        <div className="fm" style={{ fontSize: 10, letterSpacing: '0.2em', color: C.textDim }}>YOUTUBE · SHORTS</div>
        <div className="fm" style={{ fontSize: 10, letterSpacing: '0.2em', color: C.textDim }}>BYO BEVERAGE</div>
      </div>
    </div>
  );
}

/* ---------- JOIN FORM ---------- */

function JoinForm({ onJoin, onBack, loading, error, initialCode = '' }) {
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState('');
  const submit = () => onJoin(code, name);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 24, maxWidth: 520, margin: '0 auto', width: '100%' }}>
      <button onClick={onBack} className="fm fu" style={{
        background: 'transparent', border: 'none', color: C.textDim, padding: '8px 0', textAlign: 'left',
        fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 48,
      }}>← back</button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="fd fu fu-2" style={{ fontSize: 'clamp(48px, 11vw, 72px)', fontStyle: 'italic', fontWeight: 600, lineHeight: 1, marginBottom: 12, letterSpacing: '-0.03em' }}>
          join the<br /><span style={{ color: C.accent }}>session.</span>
        </div>
        <div className="fm fu fu-3" style={{ fontSize: 11, color: C.textDim, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 56 }}>
          ask the host for the code
        </div>

        <label className="fm fu fu-3" style={{ fontSize: 10, color: C.textDim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
          session code
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="••••••" maxLength={6} inputMode="text" autoComplete="off"
          className="fm fu fu-3"
          style={{
            background: C.bgLight, border: `1px solid ${C.border}`, padding: '22px 20px', color: C.warm,
            fontSize: 32, letterSpacing: '0.4em', textAlign: 'center', outline: 'none',
            marginBottom: 24, fontWeight: 700, width: '100%',
          }}
        />

        <label className="fm fu fu-4" style={{ fontSize: 10, color: C.textDim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
          your name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 20))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="what should we call you?"
          className="fu fu-4"
          style={{
            background: C.bgLight, border: `1px solid ${C.border}`, padding: '18px 20px', color: C.text,
            fontSize: 17, outline: 'none', marginBottom: 32, fontFamily: 'Inter Tight', width: '100%',
          }}
        />

        <button onClick={submit} disabled={loading || code.length !== 6} className="btn-primary fu fu-4" style={{
          background: C.accent, color: C.bg, border: 'none', padding: 20,
          fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600,
          opacity: code.length !== 6 || loading ? 0.4 : 1,
        }}>
          {loading ? 'joining…' : 'Join the session →'}
        </button>

        {error && <div className="fm" style={{ color: C.accent, marginTop: 20, fontSize: 13, letterSpacing: '0.05em' }}>{error}</div>}
      </div>
    </div>
  );
}

/* ---------- VIDEO PLAYER (with fullscreen wrapper that includes emotes) ---------- */

function VideoPlayer({ video, emotes }) {
  const wrapRef = useRef(null);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFs(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const toggleFs = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    }
  };

  if (!video.embedUrl) {
    return (
      <div style={{
        aspectRatio: '16/9', background: C.bgLight, border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24,
      }}>
        <div className="fd" style={{ fontSize: 28, fontStyle: 'italic' }}>can&apos;t embed this one</div>
        <a href={video.originalUrl} target="_blank" rel="noopener noreferrer" className="fm" style={{
          color: C.accent, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
          border: `1px solid ${C.accent}`, padding: '10px 20px',
        }}>open externally ↗</a>
      </div>
    );
  }

  const isVertical = video.platformKey === 'youtube-shorts';

  return (
    <div ref={wrapRef} className="player-wrap" style={{ position: 'relative', background: '#000' }}>
      <div className="player-inner" style={{
        width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: isVertical ? '16px 0' : 0,
      }}>
        {isVertical ? (
          <div style={{ width: 'min(420px, 90%)', aspectRatio: '9/16', maxHeight: isFs ? '95vh' : '78vh' }}>
            <iframe
              key={video.id} src={video.embedUrl}
              style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
              allow="autoplay; encrypted-media; picture-in-picture" title={video.platform}
            />
          </div>
        ) : (
          <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative' }}>
            <iframe
              key={video.id} src={video.embedUrl}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; encrypted-media; picture-in-picture" title={video.platform}
            />
          </div>
        )}
      </div>

      <EmoteOverlay emotes={emotes || []} />

      <button onClick={toggleFs} className="fs-controls fm" title={isFs ? 'exit fullscreen (Esc)' : 'fullscreen'} style={{
        position: 'absolute', bottom: 14, right: 14, zIndex: 10,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
        border: `1px solid rgba(255,255,255,0.15)`, color: C.text,
        padding: '10px 16px', fontSize: 12, letterSpacing: '0.1em',
        textTransform: 'uppercase', fontWeight: 600,
      }}>
        {isFs ? '⤡ exit' : '⤢ fullscreen'}
      </button>
    </div>
  );
}

/* ---------- EMOTE OVERLAY (lives inside player so it goes fullscreen too) ---------- */

function emoteVisual(type) {
  if (type === 'up') return { glyph: '👍', color: C.green };
  if (type === 'down') return { glyph: '👎', color: C.red };
  return { glyph: 'UwU', color: C.pink, isText: true };
}

function EmoteOverlay({ emotes }) {
  const now = Date.now();
  const live = emotes.filter((e) => now - e.ts < 4800);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 5 }}>
      {live.map((e) => {
        const { glyph, color, isText } = emoteVisual(e.type);
        const seed = e.id.charCodeAt(0) + e.id.charCodeAt(e.id.length - 1);
        const startLeft = 12 + ((seed * 7) % 76);
        const dx = ((seed * 13) % 100) - 50;
        const r1 = ((seed * 3) % 30) - 15;
        const r2 = ((seed * 5) % 40) - 20;
        const r3 = ((seed * 11) % 30) - 15;
        return (
          <div key={e.id} className="emote" style={{
            position: 'absolute', bottom: 30, left: `${startLeft}%`,
            fontSize: isText ? 'clamp(38px, 5vw, 80px)' : 'clamp(56px, 7vw, 110px)',
            fontFamily: isText ? 'Fraunces, serif' : 'inherit',
            fontStyle: isText ? 'italic' : 'normal', fontWeight: isText ? 700 : 400,
            color, textShadow: '0 4px 30px rgba(0,0,0,0.7)',
            filter: isText ? 'none' : 'drop-shadow(0 6px 16px rgba(0,0,0,0.6))',
            '--dx': `${dx}px`, '--r1': `${r1}deg`, '--r2': `${r2}deg`, '--r3': `${r3}deg`,
            userSelect: 'none',
          }}>
            {glyph}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- LEADER BADGE ---------- */

function LeaderBadge({ session, big = false, compact = false }) {
  const leader = getLeader(session);
  if (!leader) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="fm" style={{ fontSize: big ? 12 : 9, letterSpacing: '0.25em', color: C.textDim, textTransform: 'uppercase' }}>leaderboard</span>
        <span className="fm" style={{ fontSize: big ? 14 : 11, color: C.textDim, letterSpacing: '0.08em' }}>awaiting ratings…</span>
      </div>
    );
  }
  return (
    <div className="pop" style={{ display: 'flex', flexDirection: 'column', gap: big ? 4 : 2 }} key={`${leader.id}-${leader.points}`}>
      <span className="fm" style={{ fontSize: big ? 12 : 9, letterSpacing: '0.25em', color: C.warm, textTransform: 'uppercase', fontWeight: 700 }}>
        ★ leading
      </span>
      <span className="fd" style={{ fontSize: big ? 'clamp(28px, 2.6vw, 42px)' : (compact ? 16 : 18), fontWeight: 700, color: C.text, fontStyle: 'italic', lineHeight: 1 }}>
        {leader.name}
        <span className="fm" style={{ fontSize: big ? 16 : 11, marginLeft: big ? 14 : 8, color: C.warm, fontStyle: 'normal', letterSpacing: '0.05em', fontWeight: 600 }}>
          {leader.points} pts
        </span>
      </span>
    </div>
  );
}

/* ---------- FINAL SCORES ---------- */

function FinalScores({ session, onPlayMore }) {
  const board = computeScores(session);
  const winner = board[0];

  return (
    <div style={{
      minHeight: '50vh', padding: 'clamp(32px, 5vw, 64px)', display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: `radial-gradient(ellipse at center top, ${C.bgLight}, ${C.bg})`,
    }}>
      <div className="fm fu" style={{ fontSize: 'clamp(11px, 1vw, 14px)', letterSpacing: '0.3em', color: C.warm, textTransform: 'uppercase', marginBottom: 16 }}>
        ★ the verdict ★
      </div>
      <div className="fd fu fu-2" style={{
        fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: 700, fontStyle: 'italic',
        textAlign: 'center', lineHeight: 1, marginBottom: 8,
      }}>
        {winner ? <>tonight goes to<br /><span style={{ color: C.accent }}>{winner.name}.</span></> : 'no one rated anything.'}
      </div>
      {winner && (
        <div className="fm fu fu-3" style={{ fontSize: 'clamp(12px, 1.1vw, 16px)', color: C.textDim, letterSpacing: '0.15em', marginBottom: 40 }}>
          {winner.points} POINTS · {winner.videoCount} VIDEO{winner.videoCount === 1 ? '' : 'S'} · {winner.ratingCount} RATING{winner.ratingCount === 1 ? '' : 'S'}
        </div>
      )}

      {board.length > 0 && (
        <div className="fu fu-4" style={{ width: '100%', maxWidth: 600, marginBottom: 32 }}>
          {board.map((entry, i) => (
            <div key={entry.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: 'clamp(14px, 1.5vw, 20px)', borderBottom: `1px solid ${C.border}`,
              background: i === 0 ? 'rgba(255, 184, 77, 0.06)' : 'transparent',
              borderLeft: i === 0 ? `4px solid ${C.warm}` : '4px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <span className="fm" style={{ fontSize: 'clamp(12px, 1.1vw, 16px)', color: C.textDim, fontWeight: 700, minWidth: 28 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="fd" style={{ fontSize: 'clamp(18px, 1.8vw, 26px)', fontWeight: 600, color: i === 0 ? C.warm : C.text, fontStyle: 'italic' }}>
                  {entry.name}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                <span className="fm" style={{ fontSize: 'clamp(10px, 0.9vw, 13px)', color: C.textDim, letterSpacing: '0.08em' }}>
                  {entry.videoCount} vid · {entry.ratingCount} rat
                </span>
                <span className="fd" style={{ fontSize: 'clamp(22px, 2vw, 32px)', fontWeight: 700, color: i === 0 ? C.warm : C.text }}>
                  {entry.points}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={onPlayMore} className="btn-ghost fm fu fu-4" style={{
        background: 'transparent', border: `1px solid ${C.border}`, color: C.textDim,
        padding: '16px 32px', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
      }}>
        keep adding videos →
      </button>
    </div>
  );
}

/* ---------- QUEUE ITEM (host) ---------- */

function QueueItem({ video, index, isPlaying, onPlay, onRemove }) {
  const { avg, count } = videoStats(video);

  return (
    <div style={{
      padding: 'clamp(14px, 1.3vw, 20px) clamp(18px, 1.6vw, 24px)',
      borderBottom: `1px solid ${C.border}`,
      background: isPlaying ? C.bgLight : 'transparent',
      borderLeft: `4px solid ${isPlaying ? C.accent : 'transparent'}`,
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      <div className="fm" style={{
        color: isPlaying ? C.accent : C.textDim, fontSize: 'clamp(12px, 0.95vw, 14px)',
        fontWeight: 700, minWidth: 24, paddingTop: 3,
      }}>
        {String(index + 1).padStart(2, '0')}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="fm" style={{ fontSize: 'clamp(9px, 0.75vw, 11px)', color: C.warm, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
          {video.platform}{isPlaying && ' · now playing'}
        </div>
        <div style={{ fontSize: 'clamp(13px, 1vw, 16px)', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
          {video.originalUrl}
        </div>
        <div className="fm" style={{ fontSize: 'clamp(10px, 0.8vw, 12px)', color: C.textDim, display: 'flex', gap: 12, alignItems: 'baseline' }}>
          <span>via {video.addedBy}</span>
          {count > 0 && <span style={{ color: C.warm }}>★ {avg.toFixed(1)} ({count})</span>}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {!isPlaying && (
            <button onClick={onPlay} className="fm" style={{
              background: C.accent, color: C.bg, border: 'none', padding: '8px 14px',
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
            }}>▶ play</button>
          )}
          <button onClick={onRemove} className="fm" style={{
            background: 'transparent', color: C.textDim, border: `1px solid ${C.border}`,
            padding: '8px 14px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>remove</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- HOST VIEW (TV-optimized) ---------- */

function HostView({ code, userId, onLeave }) {
  const [session, setSession] = useState(null);
  const [copied, setCopied] = useState(false);
  const lastSkipAdvance = useRef(0);

  useEffect(() => {
    let active = true;
    const fetch = async () => {
      const s = await getSession(code);
      if (active && s) setSession(s);
    };
    fetch();
    const id = setInterval(fetch, 2000);
    return () => { active = false; clearInterval(id); };
  }, [code]);

  const update = useCallback(async (mut) => {
    const latest = await getSession(code);
    if (!latest) return null;
    const updated = mut(latest);
    updated.lastUpdated = Date.now();
    await saveSession(code, updated);
    setSession(updated);
    return updated;
  }, [code]);

  const playVideo = (vid) => update((s) => ({ ...s, currentVideoId: vid, skipVotes: [], emotes: [] }));
  const removeVideo = (vid) => update((s) => ({
    ...s, queue: s.queue.filter((v) => v.id !== vid),
    currentVideoId: s.currentVideoId === vid ? null : s.currentVideoId,
    skipVotes: s.currentVideoId === vid ? [] : s.skipVotes,
    emotes: s.currentVideoId === vid ? [] : s.emotes,
  }));
  const playNext = () => update((s) => {
    const i = s.queue.findIndex((v) => v.id === s.currentVideoId);
    const n = s.queue[i + 1];
    return { ...s, currentVideoId: n ? n.id : null, skipVotes: [], emotes: [] };
  });
  const playPrev = () => update((s) => {
    const i = s.queue.findIndex((v) => v.id === s.currentVideoId);
    if (i <= 0) return s;
    return { ...s, currentVideoId: s.queue[i - 1].id, skipVotes: [], emotes: [] };
  });

  useEffect(() => {
    if (!session || !session.currentVideoId) return;
    const guests = session.members.filter((m) => !m.isHost);
    if (guests.length === 0) return;
    const validVotes = (session.skipVotes || []).filter((v) => guests.find((g) => g.id === v));
    const threshold = Math.floor(guests.length / 2) + 1;
    if (validVotes.length >= threshold && Date.now() - lastSkipAdvance.current > 2000) {
      lastSkipAdvance.current = Date.now();
      playNext();
    }
  }, [session]);

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  if (!session) {
    return <div style={{ padding: 40, color: C.textDim }} className="fm">loading session…</div>;
  }

  const current = session.queue.find((v) => v.id === session.currentVideoId);
  const idx = session.queue.findIndex((v) => v.id === session.currentVideoId);
  const guests = session.members.filter((m) => !m.isHost);
  const validVotes = (session.skipVotes || []).filter((v) => guests.find((g) => g.id === v));
  const skipThreshold = guests.length > 0 ? Math.floor(guests.length / 2) + 1 : 0;
  const hasRatings = session.queue.some((v) => (v.ratings || []).length > 0);

  // TV-safe padding: 3vw inset prevents content getting clipped by overscan
  const tvPad = 'clamp(16px, 3vw, 48px)';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* TOP BAR — TV optimized: huge code, prominent leader */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: `clamp(18px, 1.8vw, 28px) ${tvPad}`,
        borderBottom: `1px solid ${C.border}`, gap: 'clamp(16px, 2vw, 32px)', flexWrap: 'wrap', background: C.bg,
      }}>
        <div className="fd" style={{ fontSize: 'clamp(26px, 2.5vw, 42px)', fontStyle: 'italic', fontWeight: 600 }}>
          jour <span style={{ color: C.accent }}>fixe.</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="fm" style={{ fontSize: 'clamp(10px, 0.85vw, 12px)', letterSpacing: '0.25em', color: C.textDim, textTransform: 'uppercase' }}>code</span>
          <button onClick={copyCode} className="fm" style={{
            background: C.bgLight, border: `2px solid ${C.warm}`, padding: 'clamp(10px, 1vw, 18px) clamp(16px, 1.5vw, 24px)',
            color: C.warm, fontSize: 'clamp(20px, 2.4vw, 40px)', letterSpacing: '0.4em', fontWeight: 700,
          }} title="click to copy">
            {copied ? '✓ copied' : code}
          </button>
          <div style={{ padding: 6, background: '#fff', borderRadius: 4, lineHeight: 0 }} title="scan to join">
            <QRCodeSVG
              value={`${window.location.origin}${window.location.pathname}?join=${code}`}
              size={Math.round(Math.min(window.innerWidth * 0.045, 72))}
              bgColor="#ffffff"
              fgColor="#1a0e0a"
              level="M"
            />
          </div>
        </div>

        <div className="fm" style={{ fontSize: 'clamp(11px, 0.95vw, 14px)', letterSpacing: '0.15em', color: C.textDim, textTransform: 'uppercase' }}>
          <span className="pulse" style={{ color: C.green }}>●</span> {guests.length} guest{guests.length === 1 ? '' : 's'}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 20 }}>
          <LeaderBadge session={session} big />
          <button onClick={onLeave} className="btn-ghost fm" style={{
            background: 'transparent', border: `1px solid ${C.border}`,
            padding: '10px 16px', color: C.textDim, fontSize: 11, letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>end session</button>
        </div>
      </div>

      {/* MAIN */}
      <div className="host-grid">
        <div style={{ padding: `clamp(24px, 2.8vw, 48px) ${tvPad}`, display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 1.8vw, 28px)', minHeight: 0 }}>
          {current ? (
            <>
              <VideoPlayer video={current} emotes={session.emotes || []} />

              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'baseline' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="fm" style={{ fontSize: 'clamp(11px, 1vw, 14px)', letterSpacing: '0.2em', color: C.textDim, textTransform: 'uppercase', marginBottom: 8 }}>
                    <span style={{ color: C.accent }}>● now playing</span> · {current.platform} · added by {current.addedBy}
                  </div>
                  <div className="fd" style={{ fontSize: 'clamp(22px, 2.2vw, 36px)', fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {current.originalUrl}
                  </div>
                </div>

                {guests.length > 0 && validVotes.length > 0 && (
                  <div className="skip-flash" style={{ padding: '12px 20px', border: `2px solid ${C.red}` }}>
                    <div className="fm" style={{ fontSize: 10, color: C.red, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 2 }}>
                      skip vote
                    </div>
                    <div className="fm" style={{ fontSize: 'clamp(16px, 1.5vw, 22px)', color: C.text, fontWeight: 700, letterSpacing: '0.05em' }}>
                      {validVotes.length} / {skipThreshold} needed
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={playPrev} disabled={idx <= 0} className="btn-ghost fm" style={{
                  background: 'transparent', color: idx > 0 ? C.text : C.textDim,
                  border: `1px solid ${C.border}`, padding: 'clamp(12px, 1.2vw, 18px) clamp(20px, 2vw, 28px)',
                  fontSize: 'clamp(11px, 0.95vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase',
                  opacity: idx > 0 ? 1 : 0.4, fontWeight: 600,
                }}>← previous</button>
                <button onClick={playNext} disabled={idx === session.queue.length - 1 || idx === -1} className="btn-primary fm" style={{
                  background: C.accent, color: C.bg, border: 'none',
                  padding: 'clamp(12px, 1.2vw, 18px) clamp(24px, 2.4vw, 36px)',
                  fontSize: 'clamp(11px, 0.95vw, 13px)', letterSpacing: '0.12em', textTransform: 'uppercase',
                  opacity: idx < session.queue.length - 1 ? 1 : 0.3, fontWeight: 700,
                }}>next video →</button>
              </div>
            </>
          ) : hasRatings ? (
            <FinalScores session={session} onPlayMore={() => {
              if (session.queue.length > 0) playVideo(session.queue[0].id);
            }} />
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 28, padding: 'clamp(32px, 4vw, 64px)', background: C.bgLight,
              border: `1px dashed ${C.border}`, minHeight: '60vh',
            }}>
              <div className="fd" style={{
                fontSize: 'clamp(40px, 6vw, 80px)', fontStyle: 'italic', fontWeight: 500,
                textAlign: 'center', maxWidth: 720, lineHeight: 1.05,
              }}>
                {session.queue.length > 0 ? 'ready when you are.' : 'waiting for the\nfirst masterpiece.'}
              </div>
              {session.queue.length > 0 ? (
                <button onClick={() => playVideo(session.queue[0].id)} className="btn-primary" style={{
                  background: C.accent, color: C.bg, border: 'none', padding: 'clamp(18px, 2vw, 28px) clamp(32px, 3.5vw, 56px)',
                  fontFamily: 'Fraunces, serif', fontSize: 'clamp(20px, 2vw, 32px)', fontWeight: 600,
                }}>▶ start the show</button>
              ) : (
                <div className="fm" style={{
                  fontSize: 'clamp(13px, 1.2vw, 18px)', letterSpacing: '0.15em', color: C.textDim,
                  textTransform: 'uppercase', textAlign: 'center', lineHeight: 2,
                }}>
                  guests join with code:<br />
                  <span style={{ color: C.warm, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 56px)', letterSpacing: '0.4em' }}>{code}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* QUEUE PANEL */}
        <div className="queue-panel" style={{ borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', minHeight: 0, background: C.bg }}>
          <div style={{ padding: 'clamp(20px, 1.8vw, 28px) clamp(22px, 2vw, 32px)', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div className="fd" style={{ fontSize: 'clamp(24px, 2.2vw, 36px)', fontWeight: 700, fontStyle: 'italic' }}>the queue</div>
            <div className="fm" style={{ fontSize: 'clamp(11px, 0.9vw, 13px)', color: C.textDim, letterSpacing: '0.2em' }}>
              {session.queue.length} {session.queue.length === 1 ? 'item' : 'items'}
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {session.queue.length === 0 ? (
              <div className="fm" style={{ padding: '48px 32px', textAlign: 'center', color: C.textDim, fontSize: 13, letterSpacing: '0.12em', lineHeight: 2 }}>
                nothing yet.
              </div>
            ) : (
              session.queue.map((v, i) => (
                <QueueItem key={v.id} video={v} index={i}
                  isPlaying={v.id === session.currentVideoId}
                  onPlay={() => playVideo(v.id)}
                  onRemove={() => removeVideo(v.id)} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- RATING PANEL (mobile) ---------- */

function RatingPanel({ video, userId, onRate }) {
  const existingRating = (video.ratings || []).find((r) => r.userId === userId);
  const [pending, setPending] = useState(false);

  const submitRating = async (score) => {
    setPending(true); await onRate(score); setPending(false);
  };

  return (
    <div style={{
      background: C.bgLight, border: `1px solid ${C.border}`,
      padding: 18, borderLeft: `4px solid ${C.warm}`,
    }}>
      <div className="fm" style={{ fontSize: 10, color: C.warm, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>
        ★ rate this one
      </div>
      <div className="fm" style={{ fontSize: 10, color: C.textDim, letterSpacing: '0.08em', marginBottom: 16 }}>
        anonymous · 1 (trash) to 10 (masterpiece)
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const isSelected = existingRating && existingRating.score === n;
          return (
            <button key={n} onClick={() => submitRating(n)} disabled={pending} className="rating-dot fm" style={{
              aspectRatio: '1', background: isSelected ? C.warm : 'transparent',
              color: isSelected ? C.bg : C.text,
              border: `1px solid ${isSelected ? C.warm : C.border}`,
              fontSize: 18, fontWeight: 700,
            }}>{n}</button>
          );
        })}
      </div>

      {existingRating && (
        <div className="fm" style={{ marginTop: 14, fontSize: 11, color: C.green, letterSpacing: '0.08em' }}>
          ✓ you rated {existingRating.score}/10 · tap another to change
        </div>
      )}
    </div>
  );
}

/* ---------- STICKY EMOTE DOCK (mobile) ---------- */

function EmoteDock({ onEmote, cooldown, hasCurrentVideo }) {
  const emotes = [
    { type: 'up', glyph: '👍', color: C.green },
    { type: 'down', glyph: '👎', color: C.red },
    { type: 'uwu', glyph: 'UwU', color: C.pink, isText: true },
  ];

  return (
    <div className="guest-dock">
      <div className="fm" style={{
        fontSize: 9, color: C.textDim, letterSpacing: '0.25em',
        textTransform: 'uppercase', marginBottom: 8, textAlign: 'center', fontWeight: 600,
      }}>
        {hasCurrentVideo ? 'react live →' : 'waiting for video'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {emotes.map((e) => (
          <button key={e.type} onClick={() => onEmote(e.type)}
            disabled={cooldown || !hasCurrentVideo}
            className="emote-btn" aria-label={e.type}
            style={{
              background: C.bgLight, border: `1px solid ${C.border}`,
              padding: '20px 0', opacity: (cooldown || !hasCurrentVideo) ? 0.35 : 1,
              fontSize: e.isText ? 26 : 36, color: e.color,
              fontFamily: e.isText ? 'Fraunces, serif' : 'inherit',
              fontStyle: e.isText ? 'italic' : 'normal', fontWeight: e.isText ? 700 : 400,
            }}>{e.glyph}</button>
        ))}
      </div>
    </div>
  );
}

/* ---------- GUEST VIEW (mobile-optimized with sticky dock) ---------- */

function GuestView({ code, userId, userName, onLeave }) {
  const [session, setSession] = useState(null);
  const [sessionGone, setSessionGone] = useState(false);
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [justAdded, setJustAdded] = useState(false);
  const [emoteCooldown, setEmoteCooldown] = useState(false);
  const hadSessionRef = useRef(false);

  useEffect(() => {
    let active = true;
    const fetch = async () => {
      const s = await getSession(code);
      if (!active) return;
      if (s) { hadSessionRef.current = true; setSession(s); }
      else if (hadSessionRef.current) setSessionGone(true);
    };
    fetch();
    const id = setInterval(fetch, 2200);
    return () => { active = false; clearInterval(id); };
  }, [code]);

  const update = useCallback(async (mut) => {
    const latest = await getSession(code);
    if (!latest) return null;
    const updated = mut(latest);
    updated.lastUpdated = Date.now();
    const ok = await saveSession(code, updated);
    if (ok) setSession(updated);
    return ok ? updated : null;
  }, [code]);

  const addVideo = async () => {
    setAddError('');
    const parsed = parseVideoUrl(url);
    if (!parsed) { setAddError("only YouTube and YouTube Shorts links work."); return; }
    setAdding(true);
    const ok = await update((s) => {
      const newVideo = { id: generateId(), ...parsed, addedBy: userName, addedById: userId, addedAt: Date.now(), ratings: [] };
      return { ...s, queue: [...s.queue, newVideo] };
    });
    if (ok) { setUrl(''); setJustAdded(true); setTimeout(() => setJustAdded(false), 2200); }
    else setAddError("couldn't save. try again?");
    setAdding(false);
  };

  const rateVideo = async (videoId, score) => {
    await update((s) => ({
      ...s, queue: s.queue.map((v) => {
        if (v.id !== videoId) return v;
        const existing = (v.ratings || []).filter((r) => r.userId !== userId);
        return { ...v, ratings: [...existing, { userId, score }] };
      }),
    }));
  };

  const voteSkip = async () => {
    if (!session?.currentVideoId) return;
    const already = (session.skipVotes || []).includes(userId);
    await update((s) => already
      ? { ...s, skipVotes: (s.skipVotes || []).filter((v) => v !== userId) }
      : { ...s, skipVotes: [...(s.skipVotes || []), userId] });
  };

  const sendEmote = async (type) => {
    if (!session?.currentVideoId || emoteCooldown) return;
    setEmoteCooldown(true);
    setTimeout(() => setEmoteCooldown(false), 600);
    await update((s) => {
      if (!s.currentVideoId) return s;
      const emote = { id: generateId(), userId, type, ts: Date.now() };
      return { ...s, emotes: [...(s.emotes || []), emote] };
    });
  };

  if (sessionGone) {
    return (
      <div style={{ padding: 40, textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="fd" style={{ fontSize: 40, fontStyle: 'italic', marginBottom: 16 }}>session ended.</div>
        <div className="fm" style={{ fontSize: 12, color: C.textDim, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 32 }}>
          the host closed the room
        </div>
        <button onClick={onLeave} className="btn-primary" style={{
          background: C.accent, color: C.bg, border: 'none', padding: '14px 28px',
          fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, margin: '0 auto',
        }}>← back home</button>
      </div>
    );
  }

  if (!session) {
    return <div style={{ padding: 40, color: C.textDim }} className="fm">loading…</div>;
  }

  const current = session.queue.find((v) => v.id === session.currentVideoId);
  const myAdds = session.queue.filter((v) => v.addedById === userId).length;
  const guests = session.members.filter((m) => !m.isHost);
  const validVotes = (session.skipVotes || []).filter((v) => guests.find((g) => g.id === v));
  const skipThreshold = guests.length > 0 ? Math.floor(guests.length / 2) + 1 : 0;
  const hasMyVote = (session.skipVotes || []).includes(userId);

  return (
    <div className="guest-wrap" style={{ minHeight: '100vh', maxWidth: 600, margin: '0 auto', padding: '20px 18px 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="fd" style={{ fontSize: 24, fontStyle: 'italic', fontWeight: 600 }}>
          jour <span style={{ color: C.accent }}>fixe.</span>
        </div>
        <button onClick={onLeave} className="btn-ghost fm" style={{
          background: 'transparent', border: `1px solid ${C.border}`, color: C.textDim,
          padding: '8px 14px', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
        }}>leave</button>
      </div>

      <div className="fu" style={{
        background: C.bgLight, border: `1px solid ${C.border}`, padding: 18, marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ minWidth: 0 }}>
          <div className="fm" style={{ fontSize: 9, color: C.textDim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
            connected · {userName}
          </div>
          <div className="fm" style={{ fontSize: 20, letterSpacing: '0.35em', color: C.warm, fontWeight: 700 }}>
            {code}
          </div>
        </div>
        <LeaderBadge session={session} compact />
        <div style={{ textAlign: 'right' }}>
          <div className="fd" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: C.text }}>{myAdds}</div>
          <div className="fm" style={{ fontSize: 9, color: C.textDim, letterSpacing: '0.18em', textTransform: 'uppercase' }}>your picks</div>
        </div>
      </div>

      <div className="fu fu-2" style={{ marginBottom: 28 }}>
        <label className="fm" style={{ fontSize: 10, color: C.textDim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
          drop a video link
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={url} onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addVideo()}
            placeholder="youtube.com / youtu.be"
            inputMode="url" autoComplete="off" autoCapitalize="off"
            style={{
              background: C.bgLight,
              border: `1px solid ${justAdded ? C.green : C.border}`,
              padding: '18px 20px', color: C.text, fontFamily: 'Inter Tight',
              fontSize: 16, outline: 'none', transition: 'border-color 0.3s', width: '100%',
            }}
          />
          <button onClick={addVideo} disabled={!url || adding} className="btn-primary" style={{
            background: justAdded ? C.green : C.accent, color: C.bg, border: 'none', padding: '18px',
            fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600,
            opacity: !url || adding ? 0.4 : 1, transition: 'background 0.3s, opacity 0.2s',
          }}>
            {adding ? 'adding…' : (justAdded ? '✓ added to the queue' : 'add to the queue →')}
          </button>
        </div>
        {addError && <div className="fm" style={{ marginTop: 12, color: C.accent, fontSize: 12 }}>{addError}</div>}
      </div>

      {current && (
        <>
          <div className="fu fu-3" style={{ marginBottom: 20 }}>
            <div className="fm" style={{ fontSize: 10, color: C.textDim, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
              <span className="pulse" style={{ color: C.green }}>●</span> now on the big screen
            </div>
            <div style={{ background: C.bgLight, padding: 16, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.accent}` }}>
              <div className="fm" style={{ fontSize: 9, color: C.warm, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
                {current.platform}
              </div>
              <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4, color: C.text }}>
                {current.originalUrl}
              </div>
              <div className="fm" style={{ fontSize: 10, color: C.textDim }}>
                via {current.addedById === userId ? 'YOU' : current.addedBy}
              </div>
            </div>
          </div>

          <div className="fu fu-4" style={{ marginBottom: 18 }}>
            <RatingPanel video={current} userId={userId} onRate={(score) => rateVideo(current.id, score)} />
          </div>

          <div className="fu fu-4" style={{ marginBottom: 28 }}>
            <button onClick={voteSkip} className="btn-ghost" style={{
              width: '100%',
              background: hasMyVote ? 'rgba(214, 90, 74, 0.12)' : 'transparent',
              border: `1px solid ${hasMyVote ? C.red : C.border}`,
              color: hasMyVote ? C.red : C.textDim,
              padding: '16px 20px',
              fontFamily: 'JetBrains Mono', fontSize: 11,
              letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600,
            }}>
              {hasMyVote ? '✓ voted to skip' : 'vote to skip'}
              {guests.length > 0 && <span style={{ marginLeft: 12, opacity: 0.7 }}>· {validVotes.length}/{skipThreshold}</span>}
            </button>
            <div className="fm" style={{ fontSize: 9, color: C.textDim, letterSpacing: '0.12em', marginTop: 8, textAlign: 'center' }}>
              majority wins · host can&apos;t override
            </div>
          </div>
        </>
      )}

      <div className="fu fu-4" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div className="fd" style={{ fontSize: 22, fontWeight: 700, fontStyle: 'italic' }}>the queue</div>
          <div className="fm" style={{ fontSize: 10, color: C.textDim, letterSpacing: '0.2em' }}>
            {session.queue.length} {session.queue.length === 1 ? 'item' : 'items'}
          </div>
        </div>
        {session.queue.length === 0 ? (
          <div className="fm" style={{ fontSize: 12, color: C.textDim, padding: '24px 0', letterSpacing: '0.1em' }}>
            queue&apos;s empty. be the first to add something cursed.
          </div>
        ) : (
          session.queue.map((v, i) => {
            const { avg, count } = videoStats(v);
            return (
              <div key={v.id} style={{
                padding: '14px 0', borderBottom: `1px solid ${C.border}`,
                display: 'flex', gap: 12, alignItems: 'flex-start',
                opacity: v.id === session.currentVideoId ? 1 : 0.65,
              }}>
                <div className="fm" style={{
                  fontSize: 11, color: v.id === session.currentVideoId ? C.accent : C.textDim,
                  fontWeight: 700, paddingTop: 2, minWidth: 22,
                }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fm" style={{ fontSize: 9, color: C.warm, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 3 }}>
                    {v.platform}{v.id === session.currentVideoId && ' · playing'}
                  </div>
                  <div style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>
                    {v.originalUrl}
                  </div>
                  <div className="fm" style={{ fontSize: 10, color: C.textDim, display: 'flex', gap: 10 }}>
                    <span>via {v.addedById === userId ? 'YOU' : v.addedBy}</span>
                    {count > 0 && <span style={{ color: C.warm }}>★ {avg.toFixed(1)}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* STICKY EMOTE DOCK */}
      <EmoteDock onEmote={sendEmote} cooldown={emoteCooldown} hasCurrentVideo={!!current} />
    </div>
  );
}

/* ---------- APP ---------- */

export default function App() {
  const [initialJoinCode] = useState(() => new URLSearchParams(window.location.search).get('join') || '');
  const [screen, setScreen] = useState(() => new URLSearchParams(window.location.search).get('join') ? 'joinForm' : 'landing');
  const [sessionCode, setSessionCode] = useState('');
  const [userName, setUserName] = useState('');
  const [userId] = useState(() => generateId());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('connecting');

  // Warm up backend on mount (Render free tier sleeps after 15min inactivity)
  useEffect(() => {
    let cancelled = false;
    setBackendStatus('warming');
    const check = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/health`);
        if (!cancelled) setBackendStatus(r.ok ? 'ok' : 'error');
      } catch {
        if (!cancelled) setBackendStatus('error');
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  const createSession = async () => {
    setLoading(true); setError('');
    let code = generateCode();
    for (let i = 0; i < 5; i++) {
      const existing = await getSession(code);
      if (!existing) break;
      code = generateCode();
    }
    const session = {
      code, createdAt: Date.now(), hostId: userId,
      queue: [], currentVideoId: null, skipVotes: [], emotes: [],
      members: [{ id: userId, name: 'Host', joinedAt: Date.now(), isHost: true }],
      lastUpdated: Date.now(),
    };
    let ok = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        setError('server is waking up, retrying…');
        await new Promise((res) => setTimeout(res, 3000));
      }
      ok = await saveSession(code, session);
      if (ok) break;
    }
    if (ok) { setSessionCode(code); setScreen('host'); }
    else setError(backendStatus === 'error' ? "can't reach the backend. is it deployed and online?" : "couldn't open a session. try again.");
    setLoading(false);
  };

  const joinSession = async (rawCode, name) => {
    setLoading(true); setError('');
    const code = (rawCode || '').toUpperCase().trim();
    if (code.length !== 6) { setError('codes are 6 characters.'); setLoading(false); return; }
    const session = await getSession(code);
    if (!session) { setError("can't find that session. double-check the code?"); setLoading(false); return; }
    const finalName = (name || '').trim() || 'Anonymous';
    if (!session.members.find((m) => m.id === userId)) {
      session.members.push({ id: userId, name: finalName, joinedAt: Date.now(), isHost: false });
      session.lastUpdated = Date.now();
      await saveSession(code, session);
    }
    setSessionCode(code); setUserName(finalName); setScreen('guest');
    setLoading(false);
  };

  const leave = () => { setScreen('landing'); setSessionCode(''); setUserName(''); setError(''); };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div className="grain" />
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
        {screen === 'landing' && (
          <Landing onCreate={createSession} onJoin={() => { setError(''); setScreen('joinForm'); }}
            loading={loading} error={error} backendStatus={backendStatus} />
        )}
        {screen === 'joinForm' && (
          <JoinForm onJoin={joinSession} onBack={() => { setError(''); setScreen('landing'); }}
            loading={loading} error={error} initialCode={initialJoinCode} />
        )}
        {screen === 'host' && <HostView code={sessionCode} userId={userId} onLeave={leave} />}
        {screen === 'guest' && <GuestView code={sessionCode} userId={userId} userName={userName} onLeave={leave} />}
      </div>
    </>
  );
}
