import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const [typedWord, setTypedWord] = useState("Explain.");
  const [decisionState, setDecisionState] = useState(0);
  const [decisionText, setDecisionText] = useState("APPROVED");
  const [reasonText, setReasonText] = useState(
    "All critical underwriting rules passed. Applicant qualifies for straight-through approval."
  );

  const heroVisualRef = useRef(null);
  const decisionBoxRef = useRef(null);

  // 1. PARTICLES INITIALIZATION
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const generated = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${8 + Math.random() * 15}s`,
      delay: `${Math.random() * 10}s`,
      opacity: Math.random() * 0.5,
    }));
    setParticles(generated);
  }, []);

  // 2. HERO TYPEWRITER LOOP
  useEffect(() => {
    const heroWords = ["Explain.", "Automate.", "Govern.", "Audit.", "Scale."];
    let wordIndex = 0;
    let charIndex = heroWords[0].length;
    let isDeleting = true;
    let timer;

    const typeLoop = () => {
      const currentWord = heroWords[wordIndex];

      if (isDeleting) {
        setTypedWord(currentWord.substring(0, charIndex - 1));
        charIndex--;
      } else {
        setTypedWord(currentWord.substring(0, charIndex + 1));
        charIndex++;
      }

      let speed = isDeleting ? 60 : 130;

      if (!isDeleting && charIndex === currentWord.length) {
        speed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % heroWords.length;
        speed = 400;
      }

      timer = setTimeout(typeLoop, speed);
    };

    timer = setTimeout(typeLoop, 1800);
    return () => clearTimeout(timer);
  }, []);

  // 3. SCROLL REVEAL & COUNTERS OBSERVER
  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const counter = entry.target;
          const target = Number(counter.getAttribute("data-target"));
          let current = 0;
          const step = target / (1200 / 16);
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            counter.textContent =
              target === 98 || target === 100
                ? Math.floor(current) + "%"
                : Math.floor(current);
          }, 16);
          counterObserver.unobserve(counter);
        });
      },
      { threshold: 0.4 }
    );

    document.querySelectorAll(".counter").forEach((c) => counterObserver.observe(c));

    return () => {
      revealObserver.disconnect();
      counterObserver.disconnect();
    };
  }, []);

  // 4. HERO 3D TILT WITH RAF + LERP
  useEffect(() => {
    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;
    let animFrameId;

    const handleMouseMove = (e) => {
      if (window.innerWidth > 900) {
        mouseX = e.clientX / window.innerWidth - 0.5;
        mouseY = e.clientY / window.innerHeight - 0.5;
      }
    };

    const animateHeroTilt = () => {
      if (heroVisualRef.current && window.innerWidth > 900) {
        currentX += (mouseX - currentX) * 0.06;
        currentY += (mouseY - currentY) * 0.06;
        heroVisualRef.current.style.transform = `perspective(1200px) rotateX(${currentY * 14}deg) rotateY(${currentX * -14
          }deg) translate3d(${currentX * 25}px, ${currentY * 25}px, 0)`;
      }
      animFrameId = requestAnimationFrame(animateHeroTilt);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animFrameId = requestAnimationFrame(animateHeroTilt);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  // 5. TEXT SCRAMBLE LOGIC
  const scramble = (finalVal, duration, setter) => {
    const chars = "!<>-_\\/[]{}—=+*^?#_010101";
    let iteration = 0;
    const maxIterations = duration / 30;
    const interval = setInterval(() => {
      const scrambled = finalVal
        .split("")
        .map((letter, index) => {
          if (index < iteration) return finalVal[index];
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join("");

      setter(scrambled);

      if (iteration >= finalVal.length) {
        clearInterval(interval);
        setter(finalVal);
      }
      iteration += 1 / (maxIterations / finalVal.length);
    }, 30);
  };

  const simulateDecision = () => {
    const nextState = decisionState + 1;
    setDecisionState(nextState);

    let nextDec, nextReason;
    if (nextState % 3 === 1) {
      nextDec = "APPROVED";
      nextReason = "All critical underwriting rules passed. Applicant qualifies for straight-through approval.";
    } else if (nextState % 3 === 2) {
      nextDec = "EXCEPTION";
      nextReason = "Borderline bureau score detected. Strong cash flow supports an L1 exception review.";
    } else {
      nextDec = "HARD REJECT";
      nextReason = "Critical risk condition triggered. Application cannot be overridden by normal approval rules.";
    }

    scramble(nextDec, 1200, setDecisionText);
    scramble(nextReason, 1800, setReasonText);

    if (decisionBoxRef.current) {
      decisionBoxRef.current.animate(
        [
          { transform: "scale(0.98)", opacity: 0.8 },
          { transform: "scale(1)", opacity: 1 },
        ],
        { duration: 500, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
      );
    }
  };

  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleLogin = () => {
    navigate('/dashboard');
  };

  return (
    <div className="credexa-root">
      <div className="grid-bg"></div>
      <div id="particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              animationDuration: p.duration,
              animationDelay: p.delay,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      <div className="nav-wrap">
        <nav className="navbar">
          <div className="logo cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="logo-box">NB</div>
            <span>NBFC Smart Underwriting</span>
          </div>
          <div className="nav-links">
            <a href="#engine">BRE Engine</a>
            <a href="#workflow">Exception Workflow</a>
            <a href="#rules">Central Rules</a>
            <a href="#security">Explainability</a>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="nav-button" onClick={() => navigate('/login')} style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
              Log In
            </button>
            <button className="nav-button" onClick={() => navigate('/signup')}>
              Sign Up
            </button>
          </div>
        </nav>
      </div>

      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">

          </div>
          <h1>
            Decide.<br />
            <span className="dynamic-line">
              <span>{typedWord}</span>
            </span>
            <span className="hero-typewriter-cursor"></span>
            <br />
            Execute.
          </h1>
          <p className="hero-description">
            A unified, transparent Business Rule Engine (BRE) for modern lending. Centrally manage credit rules, evaluate repayment capacity instantly, and automate approvals without writing a single line of code.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => navigate('/login')}>
              Access Credit Dashboard →
            </button>
            <a href="#workflow" className="secondary-btn">
              Explore Engine ↓
            </a>
          </div>
        </div>

        <div className="hero-visual" id="engine" ref={heroVisualRef}>
          <div className="quantum-core">
            <div className="q-ring q-ring-1"></div>
            <div className="q-ring q-ring-2"></div>
            <div className="q-ring q-ring-3"></div>
            <div className="q-orb">
              <div className="q-orb-text">
                BRE
                <small>NODE ACTIVE</small>
              </div>
            </div>
            <div className="q-scan-plane"></div>
          </div>

          <div className="system-status">
            <span className="status-dot"></span>
            Real-time underwriting matrix online
          </div>
        </div>
      </section>

      {/* METRICS */}
      <div className="metrics reveal">
        <div className="metric">
          <div className="metric-number counter" data-target="98">0%</div>
          <div className="metric-label">Automated Decisions</div>
        </div>
        <div className="metric">
          <div className="metric-number counter" data-target="42">0</div>
          <div className="metric-label">Configurable Rules</div>
        </div>
        <div className="metric">
          <div className="metric-number counter" data-target="100">0%</div>
          <div className="metric-label">Decision Traceability</div>
        </div>
        <div className="metric">
          <div className="metric-number counter" data-target="3">0</div>
          <div className="metric-label">Decision Paths</div>
        </div>
      </div>

      {/* WORKFLOW */}
      <section className="section reveal" id="workflow">
        <div className="section-label">Credit Evaluation Workflow</div>
        <h2 className="section-title">
          From varied financial docs<br />to a unified decision.
        </h2>
        <p className="section-subtitle">
          Every loan application passes through a rigorous underwriting pipeline to securely evaluate repayment capacity using aggregated financial data.
        </p>
        <div className="process-grid">
          <div className="process-card">
            <div className="step">01 / INGEST</div>
            <div className="process-icon">◇</div>
            <h3>Normalize Docs</h3>
            <p>Seamlessly ingest and extract data from diverse financial documents into a single, standardized profile.</p>
          </div>
          <div className="process-card">
            <div className="step">02 / COMPUTE</div>
            <div className="process-icon">∑</div>
            <h3>Evaluate Capacity</h3>
            <p>Instantly derive cash-flow indicators, FOIR, and asset metrics to understand true borrower health.</p>
          </div>
          <div className="process-card">
            <div className="step">03 / ORCHESTRATE</div>
            <div className="process-icon">⟐</div>
            <h3>Execute Rules</h3>
            <p>Deploy centrally managed business rules. Modify your credit policy on the fly via our visual editor.</p>
          </div>
          <div className="process-card">
            <div className="step">04 / DECIDE</div>
            <div className="process-icon">✓</div>
            <h3>Final Outcome</h3>
            <p>Automatically route applications for straight-through processing or escalate complex cases to specialized teams.</p>
          </div>
        </div>
      </section>

      {/* BRE LIVE PANEL */}
      <section className="section bre-section reveal" id="rules">
        <div>
          <div className="section-label">Rule-By-Rule Explainability</div>
          <h2 className="section-title">
            Total transparency<br />for Credit Teams.
          </h2>
          <p className="section-subtitle">
            The decision engine provides a granular explainability breakdown. See exactly why an application was approved, rejected, or flagged with specific reason codes.
          </p>
        </div>
        <div className="bre-panel" id="demo">
          <div className="panel-top">
            <div className="panel-title">Application #CR-1048</div>
            <div className="live">
              <span></span>LIVE EVALUATION
            </div>
          </div>
          <div className="rule">
            <span className="rule-name">Minimum Bureau Score</span>
            <span className="rule-value pass">780 / 700 ✓</span>
          </div>
          <div className="rule">
            <span className="rule-name">Maximum FOIR</span>
            <span className="rule-value pass">32% / 50% ✓</span>
          </div>
          <div className="rule">
            <span className="rule-name">Recent Delinquency</span>
            <span className="rule-value pass">0 DPD ✓</span>
          </div>
          <div className="rule">
            <span className="rule-name">Bank Bounces</span>
            <span className="rule-value pass">0 / 2 ✓</span>
          </div>
          <div className="rule">
            <span className="rule-name">Income Stability</span>
            <span className="rule-value pass">Strong ✓</span>
          </div>
          <div className="decision-box" ref={decisionBoxRef}>
            <div className="decision-label">Final Decision</div>
            <div className="decision">{decisionText}</div>
            <div className="reason">{reasonText}</div>
          </div>
          <button className="primary-btn" style={{ marginTop: 20 }} onClick={simulateDecision}>
            Re-evaluate Application
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section reveal" id="security">
        <div className="section-label">Platform Capabilities</div>
        <h2 className="section-title">
          Built for scalable<br />credit operations.
        </h2>
        <div className="feature-grid">
          <div className="feature">
            <div className="feature-icon">⚙</div>
            <h3>Configurable BRE</h3>
            <p>Empower your credit risk teams to visually adjust thresholds and decision logic without relying on engineering.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">◉</div>
            <h3>Decision Explainability</h3>
            <p>Access comprehensive audit trails showing exact parameter statuses and reason codes for every automated decision.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">↗</div>
            <h3>Exception Routing</h3>
            <p>Intelligently route borderline applications to tiered manual review queues based on predefined risk factors.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">◌</div>
            <h3>Unified Applicant View</h3>
            <p>Consolidate disparate data sources into a single pane of glass, automatically masking sensitive PII for compliance.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">⛨</div>
            <h3>Dynamic Pricing</h3>
            <p>Automatically calculate and propose optimal loan amounts, interest rates, and tenures based on risk profiling.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">∞</div>
            <h3>Compliance by Design</h3>
            <p>Maintain immutable logs of all configuration changes and manual overrides for strict regulatory compliance.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta reveal">
        <div className="section-label">ENTERPRISE CREDIT INFRASTRUCTURE</div>
        <h2>
          Automate Decisions.<br />Empower Credit Teams.
        </h2>
        <p>A transparent, scalable platform to evaluate borrower risk.</p>
        <button className="primary-btn" onClick={() => navigate('/login')}>
          Start Underwriting Today →
        </button>
      </section>

      <footer>
        <span>© 2026 NBFC Smart Underwriting Platform</span>
        <span>Enterprise Credit Solutions</span>
      </footer>

      {/* INLINE STYLES */}
      <style>{`
        .credexa-root {
          background: #050505;
          color: #fff;
          font-family: Inter, Arial, Helvetica, sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
          perspective: 1200px;
          -webkit-font-smoothing: antialiased;
          position: relative;
        }

        .credexa-root a { color: inherit; text-decoration: none; }
        .credexa-root button { font-family: inherit; }

        .credexa-root::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          background:
            radial-gradient(circle at 75% 20%, rgba(255,255,255,0.08), transparent 28%),
            radial-gradient(circle at 15% 70%, rgba(255,255,255,0.035), transparent 25%);
        }

        .grid-bg {
          position: fixed;
          inset: 0;
          z-index: 1;
          opacity: 0.15;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 70px 70px;
          mask-image: linear-gradient(to bottom, black, transparent 90%);
          -webkit-mask-image: linear-gradient(to bottom, black, transparent 90%);
        }

        #particles {
          position: fixed;
          inset: 0;
          z-index: 2;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          animation: floatParticle linear infinite;
          will-change: transform, opacity;
        }

        @keyframes floatParticle {
          from { transform: translateY(110vh); opacity: 0; }
          20% { opacity: 0.5; }
          80% { opacity: 0.5; }
          to { transform: translateY(-10vh); opacity: 0; }
        }

        .nav-wrap {
          width: min(1200px, calc(100% - 40px));
          margin: 25px auto 0;
          position: relative;
          z-index: 10;
        }

        .navbar {
          height: 78px;
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 50px;
          background: rgba(10,10,10,0.72);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px 0 22px;
          box-shadow: 0 20px 70px rgba(0,0,0,0.4), inset 0 1px rgba(255,255,255,0.05);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          font-size: 18px;
        }

        .logo-box {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 10px;
          font-size: 12px;
          letter-spacing: -1px;
          background: #090909;
          box-shadow: 0 0 20px rgba(255,255,255,0.05);
        }

        .nav-links {
          display: flex;
          gap: 34px;
          color: #888;
          font-size: 14px;
        }

        .nav-links a { transition: color 0.3s ease; }
        .nav-links a:hover { color: white; }

        .nav-button {
          background: white;
          color: black;
          border: none;
          border-radius: 30px;
          padding: 13px 24px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
        }

        .nav-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255,255,255,0.15);
        }

        .hero {
          width: min(1200px, calc(100% - 40px));
          min-height: 750px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 50px;
          position: relative;
          z-index: 5;
        }

        .hero-content { position: relative; z-index: 2; }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 8px 13px;
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 30px;
          background: rgba(255,255,255,0.035);
          color: #aaa;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 28px;
          animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .eyebrow-dot {
          width: 6px;
          height: 6px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 12px white;
          animation: pulse 1.8s infinite ease-in-out;
        }

        @keyframes pulse { 50% { transform: scale(1.7); opacity: 0.5; } }

        .hero h1 {
          font-size: clamp(55px, 7vw, 96px);
          line-height: 0.92;
          letter-spacing: -5px;
          font-weight: 750;
          animation: fadeUp 1s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .hero h1 .dynamic-line {
          display: inline-block;
          background: linear-gradient(110deg, #fff 20%, #888 50%, #fff 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shineText 6s linear infinite;
        }

        .hero-typewriter-cursor {
          display: inline-block;
          width: 4px;
          height: 0.8em;
          background-color: #fff;
          margin-left: 6px;
          vertical-align: middle;
          animation: blinkCursor 0.8s infinite;
        }

        @keyframes blinkCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @keyframes shineText { to { background-position: 200% center; } }

        .hero-description {
          max-width: 570px;
          margin-top: 30px;
          color: #8b8b8b;
          font-size: 17px;
          line-height: 1.8;
          animation: fadeUp 1s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 35px;
          animation: fadeUp 1s 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .primary-btn {
          background: white;
          color: black;
          padding: 16px 27px;
          border-radius: 30px;
          border: none;
          font-weight: 700;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease;
        }

        .primary-btn::after {
          content: "";
          position: absolute;
          top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          transform: skewX(-20deg);
          transition: left 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .primary-btn:hover::after { left: 140%; }
        .primary-btn:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 45px rgba(255,255,255,0.12);
        }

        .secondary-btn { color: #aaa; font-size: 14px; transition: color 0.3s ease; }
        .secondary-btn:hover { color: white; }

        .hero-visual {
          height: 600px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-style: preserve-3d;
          will-change: transform;
        }

        .quantum-core {
          position: relative;
          width: 320px;
          height: 320px;
          transform-style: preserve-3d;
          animation: slowCoreRotate 25s linear infinite;
          z-index: 1;
        }

        @keyframes slowCoreRotate {
          0% { transform: rotateX(20deg) rotateY(0deg); }
          100% { transform: rotateX(20deg) rotateY(360deg); }
        }

        .q-ring {
          position: absolute;
          inset: 0;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          transform-style: preserve-3d;
        }

        .q-ring::before, .q-ring::after {
          content: "";
          position: absolute;
          width: 8px;
          height: 8px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 15px #fff, 0 0 30px rgba(255,255,255,0.5);
          top: calc(50% - 4px);
        }
        .q-ring::before { left: -4px; }
        .q-ring::after { right: -4px; }

        .q-ring-1 { transform: rotateX(90deg) rotateY(0deg); border-color: rgba(255,255,255,0.4); border-style: solid; }
        .q-ring-2 { transform: rotateX(45deg) rotateY(45deg); animation: ringSpin1 8s linear infinite; }
        .q-ring-3 { transform: rotateX(-45deg) rotateY(45deg); animation: ringSpin2 12s linear infinite reverse; }

        @keyframes ringSpin1 { to { transform: rotateX(45deg) rotateY(405deg); } }
        @keyframes ringSpin2 { to { transform: rotateX(-45deg) rotateY(405deg); } }

        .q-orb {
          position: absolute;
          inset: 70px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(10,10,10,0.8) 60%);
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 0 60px rgba(255,255,255,0.1), inset 0 0 40px rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotateX(-20deg);
          animation: orbPulse 4s ease-in-out infinite;
        }

        @keyframes orbPulse {
          50% { 
            transform: rotateX(-20deg) scale(1.05); 
            box-shadow: 0 0 80px rgba(255,255,255,0.15), inset 0 0 50px rgba(255,255,255,0.08); 
          }
        }

        .q-orb-text {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: 2px;
          text-align: center;
          line-height: 1.2;
        }

        .q-orb-text small {
          display: block;
          font-size: 9px;
          color: #888;
          letter-spacing: 4px;
          margin-top: 5px;
        }

        .q-scan-plane {
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-bottom: 2px solid rgba(255,255,255,0.5);
          transform: rotateX(90deg) translateZ(-160px);
          box-shadow: 0 10px 30px rgba(255,255,255,0.2);
          animation: scanSweep 4s ease-in-out infinite alternate;
        }

        @keyframes scanSweep {
          0% { transform: rotateX(90deg) translateZ(-150px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: rotateX(90deg) translateZ(150px); opacity: 0; }
        }

        .system-status {
          position: absolute;
          bottom: 20px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 15px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 30px;
          color: #888;
          font-size: 11px;
          background: rgba(255,255,255,0.025);
        }

        .status-dot {
          width: 7px;
          height: 7px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 12px white;
        }

        .metrics {
          width: min(1050px, calc(100% - 40px));
          margin: -20px auto 120px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          background: rgba(255,255,255,0.025);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          overflow: hidden;
          position: relative;
          z-index: 5;
        }
        .metric { padding: 30px; text-align: center; border-right: 1px solid rgba(255,255,255,0.08); }
        .metric:last-child { border-right: none; }
        .metric-number { font-size: 30px; font-weight: 700; }
        .metric-label { color: #666; font-size: 11px; margin-top: 7px; text-transform: uppercase; letter-spacing: 1px; }

        .section { width: min(1200px, calc(100% - 40px)); margin: 0 auto 150px; position: relative; z-index: 5; }
        .section-label { color: #a3a3a3; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 18px; }
        .section-title { font-size: clamp(40px, 5vw, 70px); letter-spacing: -3px; line-height: 1; color: #fff; }
        .section-subtitle { color: #b3b3b3; max-width: 600px; margin-top: 20px; line-height: 1.7; }

        .process-grid { margin-top: 55px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

        .process-card {
          min-height: 260px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 22px;
          padding: 25px;
          background: linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.015));
          position: relative;
          overflow: hidden;
          transition: border-color 0.4s ease, box-shadow 0.4s ease, opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
          opacity: 0;
          transform: translateY(60px) rotateX(-15deg) scale(0.9);
          transform-origin: top center;
        }

        .process-card::before {
          content: ""; position: absolute; width: 180px; height: 180px; right: -80px; bottom: -80px;
          border-radius: 50%; background: rgba(255,255,255,0.05); filter: blur(25px); transition: transform 0.6s ease;
        }

        .process-card:hover { border-color: rgba(255,255,255,0.25); box-shadow: 0 25px 60px rgba(0,0,0,0.4); }
        .process-card:hover::before { transform: scale(2); }
        .step { color: #888; font-size: 12px; display: inline-block; }
        .process-icon { font-size: 35px; margin: 35px 0 20px; display: inline-block; color: #e5e5e5; }
        .process-card h3 { font-size: 20px; color: #fff; }
        .process-card p { color: #a3a3a3; font-size: 13px; line-height: 1.6; margin-top: 10px; }

        .bre-section { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 70px; align-items: center; }
        .bre-panel { 
          border: 1px solid rgba(255,255,255,0.11); 
          border-radius: 25px; 
          background: #090909; 
          padding: 28px; 
          box-shadow: 0 30px 100px rgba(0,0,0,0.5); 
        }
        .panel-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .panel-title { font-weight: 600; color: #e5e5e5; }
        .live { color: #a3a3a3; font-size: 10px; display: flex; gap: 7px; align-items: center; }
        .live span { width: 6px; height: 6px; background: white; border-radius: 50%; }
        .rule { padding: 17px 0; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
        .rule:last-child { border-bottom: none; }
        .rule-name { color: #b3b3b3; }
        .rule-value { font-weight: 600; color: #e5e5e5; }
        .pass { color: #fff; }
        .decision-box { margin-top: 22px; padding: 22px; border-radius: 17px; border: 1px solid rgba(255,255,255,0.12); background: radial-gradient(circle at 90% 10%, rgba(255,255,255,0.07), transparent 40%); }
        .decision-label { color: #a3a3a3; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .decision { font-size: 30px; margin-top: 6px; color: #fff; }
        .reason { color: #b3b3b3; margin-top: 10px; font-size: 12px; }

        .feature-grid { margin-top: 55px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }

        .feature { 
          padding: 30px; 
          border: 1px solid rgba(255,255,255,0.09); 
          border-radius: 22px; 
          background: rgba(255,255,255,0.025); 
          transition: background 0.4s ease, border-color 0.4s ease, opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1); 
          will-change: transform;
          opacity: 0;
          transform: translateY(60px) rotateX(-15deg) scale(0.9);
          transform-origin: top center;
        }
        .feature:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); }
        .feature-icon { width: 45px; height: 45px; border: 1px solid rgba(255,255,255,0.12); border-radius: 13px; display: grid; place-items: center; margin-bottom: 25px; color: #e5e5e5; }
        .feature h3 { font-size: 18px; color: #e5e5e5; }
        .feature p { color: #a3a3a3; line-height: 1.7; font-size: 13px; margin-top: 10px; }

        .cta { 
          width: min(1100px, calc(100% - 40px)); 
          margin: 0 auto 100px; 
          min-height: 360px; 
          border: 1px solid rgba(255,255,255,0.12); 
          border-radius: 30px; 
          position: relative; 
          overflow: hidden; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          text-align: center; 
          background: radial-gradient(circle at center, rgba(255,255,255,0.08), transparent 55%);
          z-index: 5;
        }
        .cta::before { content: ""; position: absolute; width: 500px; height: 500px; border: 1px solid rgba(255,255,255,0.05); border-radius: 50%; animation: ctaRotate 20s linear infinite; }
        @keyframes ctaRotate { to { transform: rotate(360deg); } }
        .cta h2 { position: relative; font-size: clamp(40px, 6vw, 75px); letter-spacing: -4px; color: #fff; }
        .cta p { position: relative; color: #b3b3b3; max-width: 550px; margin: 20px 0 30px; line-height: 1.7; }

        footer { 
          width: min(1200px, calc(100% - 40px)); 
          margin: auto; 
          padding: 35px 0; 
          border-top: 1px solid rgba(255,255,255,0.08); 
          display: flex; 
          justify-content: space-between; 
          color: #888; 
          font-size: 12px; 
          position: relative;
          z-index: 5;
        }

        @keyframes fadeUp { 
          from { opacity: 0; transform: translateY(30px); } 
          to { opacity: 1; transform: translateY(0); } 
        }

        .reveal { 
          opacity: 0; 
          transform: translateY(45px); 
          transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1); 
          will-change: opacity, transform;
        }
        .reveal.show { 
          opacity: 1; 
          transform: translateY(0); 
        }

        .reveal.show .process-card,
        .reveal.show .feature {
          opacity: 1;
          transform: translateY(0) rotateX(0deg) scale(1);
        }

        .reveal.show .process-card:nth-child(1),
        .reveal.show .feature:nth-child(1) { transition-delay: 0.1s; }
        .reveal.show .process-card:nth-child(2),
        .reveal.show .feature:nth-child(2) { transition-delay: 0.2s; }
        .reveal.show .process-card:nth-child(3),
        .reveal.show .feature:nth-child(3) { transition-delay: 0.3s; }
        .reveal.show .process-card:nth-child(4),
        .reveal.show .feature:nth-child(4) { transition-delay: 0.4s; }
        .reveal.show .feature:nth-child(5) { transition-delay: 0.5s; }
        .reveal.show .feature:nth-child(6) { transition-delay: 0.6s; }

        @media (max-width: 900px) {
          .nav-links { display: none; }
          .hero { grid-template-columns: 1fr; padding-top: 80px; }
          .hero-visual { height: 450px; }
          .metrics { grid-template-columns: repeat(2, 1fr); }
          .metric:nth-child(2) { border-right: none; }
          .metric:nth-child(-n+2) { border-bottom: 1px solid rgba(255,255,255,0.08); }
          .process-grid { grid-template-columns: repeat(2, 1fr); }
          .bre-section { grid-template-columns: 1fr; }
          .feature-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .navbar { height: 68px; }
          .nav-button { padding: 11px 17px; font-size: 12px; }
          .hero h1 { font-size: 55px; letter-spacing: -3px; }
          .hero-description { font-size: 15px; }
          .hero-visual { transform: scale(0.8); }
          .metrics { grid-template-columns: 1fr 1fr; }
          .metric { padding: 22px 10px; }
          .metric-number { font-size: 23px; }
          .process-grid, .feature-grid { grid-template-columns: 1fr; }
          .section-title { font-size: 45px; }
          footer { flex-direction: column; gap: 10px; }
        }
      `}</style>
    </div>
  );
}
