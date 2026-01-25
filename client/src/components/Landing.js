import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiShield, FiZap, FiBarChart2 } from 'react-icons/fi';

const Landing = () => {
  useEffect(() => {
    const el = document.querySelector('.landing');
    if (!el) return;
    const onScroll = () => {
      const s = window.scrollY || document.documentElement.scrollTop;
      const v = Math.min(1, s / (window.innerHeight || 800));
      el.style.setProperty('--scroll', String(v));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const canvasRef = useRef(null);
  const [metaCount, setMetaCount] = useState(0);
  const [tradeCount, setTradeCount] = useState(0);
  const [marketCount, setMarketCount] = useState(0);

  // Count-up animation
  const animateCount = (setter, from, to, duration = 1200) => {
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // eased
      const val = Math.floor(from + (to - from) * eased);
      setter(val);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Fetch stats from backend and animate counts
  useEffect(() => {
    const base = process.env.REACT_APP_API_URL || '';
    const metaUrl = `${base}/api/meta`;
    const tradesUrl = `${base}/api/trades`;
    const marketUrl = `${base}/api/market`;

    const fetchStats = async () => {
      try {
        const [mRes, tRes, mkRes] = await Promise.all([
          fetch(metaUrl).then(r => r.ok ? r.json() : { universe: [] }).catch(() => ({ universe: [] })),
          fetch(tradesUrl).then(r => r.ok ? r.json() : { trades: [] }).catch(() => ({ trades: [] })),
          fetch(marketUrl).then(r => r.ok ? r.json() : { data: {} }).catch(() => ({ data: {} })),
        ]);

        const metaN = (mRes.universe && Array.isArray(mRes.universe)) ? mRes.universe.length : 0;
        const tradesN = (tRes.trades && Array.isArray(tRes.trades)) ? tRes.trades.length : 0;
        const mkN = mkRes.data ? Object.keys(mkRes.data).length : 0;

        animateCount(setMetaCount, 0, metaN);
        animateCount(setTradeCount, 0, tradesN);
        animateCount(setMarketCount, 0, mkN);
      } catch (err) {
        // ignore
      }
    };

    fetchStats();
  }, []);

  // Simple particle field on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const getSize = () => {
      const w = Math.max(1, canvas.clientWidth || window.innerWidth);
      const h = Math.max(1, canvas.clientHeight || window.innerHeight);
      canvas.width = Math.floor(w * devicePixelRatio);
      canvas.height = Math.floor(h * devicePixelRatio);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      return { w, h };
    };

    let { w, h } = getSize();
    const particles = [];
    const P = 80;
    for (let i = 0; i < P; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        alpha: 0.12 + Math.random() * 0.5,
      });
    }

    let raf = null;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -50) p.x = w + 50;
        if (p.x > w + 50) p.x = -50;
        if (p.y < -50) p.y = h + 50;
        if (p.y > h + 50) p.y = -50;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 12);
        g.addColorStop(0, `rgba(99,102,241,${p.alpha})`);
        g.addColorStop(1, 'rgba(99,102,241,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      const size = getSize();
      w = size.w; h = size.h;
      // reposition particles proportionally
      particles.forEach(p => {
        p.x = Math.min(w, Math.max(0, p.x));
        p.y = Math.min(h, Math.max(0, p.y));
      });
    };
    window.addEventListener('resize', onResize);
    draw();
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="landing relative text-white">
      <canvas ref={canvasRef} className="particle-canvas absolute inset-0 -z-20" />
      <div className="absolute inset-0 animated-gradient -z-10" />

      <section className="landing-section hero flex-col px-6">
        <div className="container mx-auto lg:px-20 text-center">
          <h1 className="text-6xl lg:text-8xl font-extrabold tracking-tight neon mb-4 hero-title">
            liquidlfow
            <span className="title-accent" />
          </h1>

          <p className="text-lg lg:text-2xl text-teal-100 mb-8 max-w-3xl mx-auto fade-up">
            A futuristic trading dashboard blending speed, clarity and on-chain power.
          </p>

          <div className="hero-ctas fade-up">
            <Link to="/trading" className="cta inline-flex items-center gap-3 px-10 py-4 rounded-full bg-teal-500 hover:bg-teal-400 text-white font-semibold shadow-2xl transition-transform transform hover:-translate-y-1">
              Enter Dashboard <FiArrowRight className="ml-2 animate-arrow" />
            </Link>
            <div className="stat-pill ml-4">
              <div className="stat-label">Markets</div>
              <div className="stat-value">{metaCount}</div>
            </div>
          </div>
        </div>

        <svg className="swoosh" viewBox="0 0 800 200" preserveAspectRatio="none" aria-hidden>
          <path d="M0,100 C200,0 600,200 800,100 L800,200 L0,200 Z" fill="rgba(255,255,255,0.02)" />
        </svg>

        <div className="floating-orbs pointer-events-none">
          <div className="orb o1" />
          <div className="orb o2" />
          <div className="orb o3" />
        </div>
      </section>

      <section className="landing-section features bg-transparent">
        <div className="container mx-auto lg:px-20 py-20">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-8">Experience</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5 fade-up">
              <div className="icon-wrap mb-4"><FiZap className="icon-lg" /></div>
              <h3 className="text-xl font-semibold mb-2">Speed</h3>
              <p className="text-sm text-teal-100">Low-latency market updates and fast order placement.</p>
              <div className="mt-4 stat-small"><span className="stat-num">{marketCount}</span> live markets</div>
            </div>

            <div className="feature-card p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5 fade-up delay-100">
              <div className="icon-wrap mb-4"><FiShield className="icon-lg" /></div>
              <h3 className="text-xl font-semibold mb-2">Secure</h3>
              <p className="text-sm text-teal-100">Sign orders client-side and interact with wallets safely.</p>
              <div className="mt-4 stat-small"><span className="stat-num">{tradeCount}</span> recent trades</div>
            </div>

            <div className="feature-card p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5 fade-up delay-200">
              <div className="icon-wrap mb-4"><FiBarChart2 className="icon-lg" /></div>
              <h3 className="text-xl font-semibold mb-2">Insight</h3>
              <p className="text-sm text-teal-100">Real-time charts, trade history, and strategy tools.</p>
              <div className="mt-4 stat-small">Analytics & live funding info</div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section footer py-12">
        <div className="container mx-auto text-center">
          <p className="text-sm text-teal-100">© {new Date().getFullYear()} liquidlfow — Built for traders.</p>
        </div>
      </section>
    </div>
  );
};

export default Landing;
