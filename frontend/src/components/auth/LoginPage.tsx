import React, { useEffect, useRef, useState } from 'react';

interface LoginPageProps {
  onLogin: (e: React.FormEvent) => void;
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  isLoggingIn: boolean;
  isRegistering: boolean;
  setIsRegistering: (val: boolean | ((prev: boolean) => boolean)) => void;
  loginError: string | null;
  setLoginError: (val: string | null) => void;
  backendHealth: 'online' | 'degraded' | 'offline' | 'checking';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  isLoggingIn,
  isRegistering,
  setIsRegistering,
  loginError,
  setLoginError,
  backendHealth,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

  useEffect(() => {
    // Detect system reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Ambient Airspace Radar & Trajectory Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Simulated aircraft flight trajectory parameters
    let t = 0;
    const speed = reduceMotion ? 0 : 0.0012;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle tactical grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 64;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw subtle range rings centered on left hero area
      const centerX = width * 0.35;
      const centerY = height * 0.5;
      const maxRadius = Math.min(width, height) * 0.45;

      [0.33, 0.66, 1.0].forEach((fraction) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * fraction, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 3. Define Bezier Flight Path
      const p0 = { x: width * 0.08, y: height * 0.78 };
      const p1 = { x: width * 0.28, y: height * 0.22 };
      const p2 = { x: width * 0.48, y: height * 0.72 };
      const p3 = { x: width * 0.68, y: height * 0.18 };

      // Draw historical trajectory route line
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Waypoint markers
      [p0, p1, p2, p3].forEach((wp, idx) => {
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = idx === 0 || idx === 3 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(148, 163, 184, 0.3)';
        ctx.fill();
      });

      // 4. Calculate current aircraft position along cubic Bezier curve
      t = (t + speed) % 1.0;
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      const curX = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
      const curY = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;

      // Calculate tangent for aircraft heading
      const dx = 3 * uu * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * tt * (p3.x - p2.x);
      const dy = 3 * uu * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * tt * (p3.y - p2.y);
      const heading = Math.atan2(dy, dx);

      // Draw subtle telemetry trail breadcrumbs
      for (let i = 1; i <= 6; i++) {
        const trailT = Math.max(0, t - i * 0.025);
        const trU = 1 - trailT;
        const trX = trU * trU * trU * p0.x + 3 * trU * trU * trailT * p1.x + 3 * trU * trailT * trailT * p2.x + trailT * trailT * trailT * p3.x;
        const trY = trU * trU * trU * p0.y + 3 * trU * trU * trailT * p1.y + 3 * trU * trailT * trailT * p2.y + trailT * trailT * trailT * p3.y;

        ctx.beginPath();
        ctx.arc(trX, trY, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${0.35 - i * 0.05})`;
        ctx.fill();
      }

      // Draw aircraft silhouette
      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(heading);

      // Plane icon
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-6, -7);
      ctx.lineTo(-4, -2);
      ctx.lineTo(-10, -2);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-10, 2);
      ctx.lineTo(-4, 2);
      ctx.lineTo(-6, 7);
      ctx.closePath();
      ctx.fill();

      // Subtle pulse ring
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      // Draw live telemetry callout tag beside aircraft
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      const tagX = curX + 18;
      const tagY = curY - 26;
      ctx.fillRect(tagX, tagY, 110, 28);
      ctx.strokeRect(tagX, tagY, 110, 28);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px Inter, monospace, sans-serif';
      ctx.fillText('AG-704 // TRUST: 98', tagX + 6, tagY + 12);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '9px Inter, monospace, sans-serif';
      ctx.fillText('FL320 • 460KT • NOMINAL', tagX + 6, tagY + 23);

      if (!reduceMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [reduceMotion]);

  return (
    <div className="relative min-h-screen w-full bg-[#060913] text-slate-100 flex items-center justify-center overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Background Tactical Airspace Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 opacity-75"
      />

      {/* Ambient Gradient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Grid Container */}
      <div className="relative z-10 w-full max-w-5xl px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Hero & Identity Column */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6 pr-0 lg:pr-8">
          {/* Logo & Tagline */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md shadow-sm">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono tracking-wider text-cyan-300 font-semibold uppercase">
                Airspace Trust & Threat Intelligence
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-sans">
              AirGuard<span className="text-cyan-400">.</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed max-w-xl">
              Next-generation explainable airspace surveillance. Real-time telemetry trust evaluation, multi-tier anomaly detection, and forensic threat investigation.
            </p>
          </div>

          {/* Key Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-xs font-semibold text-cyan-300 uppercase font-mono mb-1">
                01. Trust Engine
              </div>
              <div className="text-xs text-slate-400 leading-snug">
                Temporal EMA scoring distinguishing noise from spoofing.
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-xs font-semibold text-sky-300 uppercase font-mono mb-1">
                02. Multi-Tier ML
              </div>
              <div className="text-xs text-slate-400 leading-snug">
                Kinematics, deep autoencoders & ensemble models with SHAP.
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
              <div className="text-xs font-semibold text-emerald-300 uppercase font-mono mb-1">
                03. Forensics
              </div>
              <div className="text-xs text-slate-400 leading-snug">
                Airspace correlation, event narrative & PDF dossiers.
              </div>
            </div>
          </div>

          {/* System Status Pill */}
          <div className="flex items-center gap-3 pt-2">
            <div
              role="status"
              aria-live="polite"
              className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md border text-xs font-mono ${
                backendHealth === 'online'
                  ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-300'
                  : backendHealth === 'checking'
                  ? 'border-slate-700 bg-slate-900/60 text-slate-400'
                  : backendHealth === 'degraded'
                  ? 'border-amber-800/80 bg-amber-950/40 text-amber-300'
                  : 'border-rose-900/80 bg-rose-950/40 text-rose-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth === 'online'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                    : backendHealth === 'checking'
                    ? 'bg-slate-500'
                    : backendHealth === 'degraded'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
              <span>
                {backendHealth === 'online'
                  ? 'SURVEILLANCE BACKEND ONLINE'
                  : backendHealth === 'checking'
                  ? 'CONNECTING TO GROUND STATION...'
                  : backendHealth === 'degraded'
                  ? 'STREAM DEGRADED — DB ACTIVE'
                  : 'BACKEND SERVICES OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Authentication Card Column */}
        <div className="lg:col-span-5 w-full">
          <div className="w-full bg-[#0b1220]/95 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isRegistering ? 'Create Operator Account' : 'Operator Authentication'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isRegistering
                  ? 'Register as an airspace analyst or viewer'
                  : 'Sign in with your verified ground station credentials'}
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-md bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2"
              >
                <span className="font-bold">▲</span>
                <span>{loginError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Operator Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="analyst@airguard.sec"
                  className="w-full h-10 bg-[#060913] border border-slate-700/80 rounded-lg px-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 bg-[#060913] border border-slate-700/80 rounded-lg px-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-11 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-500 text-black font-bold text-xs sm:text-sm rounded-lg transition-all shadow-md mt-2 flex items-center justify-center cursor-pointer"
              >
                {isLoggingIn ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </div>
                ) : isRegistering ? (
                  'CREATE VIEWER ACCOUNT'
                ) : (
                  'AUTHENTICATE & ENTER AIRSPACE'
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering((prev) => !prev);
                  setLoginError(null);
                }}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
              >
                {isRegistering
                  ? 'Already registered? Sign in with existing credentials'
                  : 'Need access? Create a viewer account'}
              </button>
            </div>

            {/* Security Badge Footer */}
            <div className="mt-4 text-center">
              <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
                SECURE ACCESS // ENCRYPTED SESSION TOKEN
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
