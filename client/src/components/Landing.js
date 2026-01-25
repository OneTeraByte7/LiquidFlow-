import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiUsers, FiGlobe, FiCpu, FiStar } from 'react-icons/fi';

// Clean, centered landing built from scratch.
const Landing = () => {
  return (
    <div className="landing clean-landing">
      <div className="hero-bg" />

      <header className="hero">
      <div className="hero-inner fade-in-up">
          <h1 className="hero-title">liquidflow</h1>
          <p className="hero-sub">A futuristic trading dashboard blending speed, clarity and on-chain power.</p>

          <div className="hero-actions">
            <Link to="/trading" className="btn-primary">
              Enter Dashboard <FiArrowRight className="icon" />
            </Link>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-label">Markets</div>
                <div className="stat-value">228</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="landing-main">
        <section className="about">
          <div className="hero-inner about-grid">
            <div className="about-icon" aria-hidden>
              <FiStar size={36} />
            </div>
            <div className="about-content fade-in-up">
              <h2>About liquidflow — MVP</h2>
              <p>
                liquidflow is an MVP trading dashboard delivering the core trading experience
                — <span className="accent-pill">real-time market data</span>, <span className="accent-pill">low-latency execution</span>,
                <span className="accent-pill">client-side signing</span>, and integrated chat & trade history.
              </p>

              <ul className="about-features">
                <li><FiGlobe className="li-icon" /> Discover markets with live updates</li>
                <li><FiCpu className="li-icon" /> Fast, optimized order paths</li>
                <li><FiUsers className="li-icon" /> Integrated chat & trade history</li>
              </ul>

              <p className="about-owner"><strong>Owner:</strong> <span className="owner-name">Soham J Suryawanshi</span> — <span className="owner-badge">Project Owner</span></p>
            </div>
          </div>
        </section>
        <section className="features">
          <div className="feature fade-in-up">
            <FiGlobe className="feature-icon" />
            <h3>Global Markets</h3>
            <p>Access dozens of markets with real-time updates and low-latency data.</p>
          </div>
          <div className="feature fade-in-up">
            <FiCpu className="feature-icon" />
            <h3>Fast Execution</h3>
            <p>Optimized order paths and client-side signing for safe, fast trades.</p>
          </div>
          <div className="feature fade-in-up">
            <FiUsers className="feature-icon" />
            <h3>Community</h3>
            <p>Integrated chat, history and collaborative features for traders.</p>
          </div>
        </section>

        <section className="team">
          <h2>Team</h2>
          <div className="team-grid">
            <div className="team-card owner fade-in-up">
              <div className="team-avatar">SJ</div>
              <div className="team-name">Soham J Suryawanshi</div>
              <div className="team-role">Project Owner</div>
              <div className="owner-badge">Owner</div>
            </div>
            <div className="team-card fade-in-up">
              <div className="team-avatar">CO</div>
              <div className="team-name">Contributor</div>
              <div className="team-role">Frontend / UX</div>
            </div>
            <div className="team-card fade-in-up">
              <div className="team-avatar">CI</div>
              <div className="team-name">Contributor</div>
              <div className="team-role">Backend / Integrations</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
