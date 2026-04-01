// Landing page HTML — self-contained with inline CSS
// Served by the worker for GET /

export const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>personallog.ai — Your AI, Living in Your Repo</title>
  <meta name="description" content="Fork. Add keys. Deploy. Your personal AI agent is alive. Open source, self-hosted, multi-channel.">
  <meta property="og:title" content="personallog.ai — Your AI, Living in Your Repo">
  <meta property="og:description" content="Open source personal AI agent. Self-hosted. Multi-channel. Repo-native.">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#3b82f6">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✨</text></svg>">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0a0a0a; --bg-card: #111111; --bg-hover: #1a1a1a; --bg-input: #1a1a1a;
      --border: #222222; --border-light: #333333;
      --text: #e5e5e5; --text-muted: #888888; --text-dim: #555555;
      --accent: #3b82f6; --accent-hover: #2563eb; --accent-glow: rgba(59, 130, 246, 0.15);
      --success: #22c55e; --warning: #f59e0b; --danger: #ef4444;
      --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      --radius: 12px; --radius-sm: 8px;
      --shadow: 0 4px 24px rgba(0,0,0,0.4);
      --transition: 0.2s ease;
    }
    html { scroll-behavior: smooth; }
    body { font-family: var(--font); background: var(--bg); color: var(--text); line-height: 1.6; -webkit-font-smoothing: antialiased; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .landing { overflow-x: hidden; }
    .nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; position: fixed; top: 0; width: 100%; z-index: 100; background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); }
    .nav-brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 1.1rem; }
    .nav-icon { font-size: 1.4rem; }
    .nav-links { display: flex; gap: 1.5rem; align-items: center; }
    .nav-links a { color: var(--text-muted); font-size: 0.9rem; transition: color var(--transition); }
    .nav-links a:hover { color: var(--text); text-decoration: none; }
    .nav-cta { background: var(--accent) !important; color: #fff !important; padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-weight: 600; transition: background var(--transition); }
    .nav-cta:hover { background: var(--accent-hover) !important; text-decoration: none; }
    .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 6rem 2rem 4rem; background: radial-gradient(ellipse at 50% 0%, var(--accent-glow) 0%, transparent 60%); }
    .hero-badge { display: inline-block; padding: 0.4rem 1rem; border: 1px solid var(--border-light); border-radius: 999px; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2rem; letter-spacing: 0.02em; }
    .hero-title { font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 800; line-height: 1.1; margin-bottom: 1.5rem; letter-spacing: -0.03em; }
    .gradient-text { background: linear-gradient(135deg, var(--accent), #8b5cf6, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-subtitle { font-size: 1.25rem; color: var(--text-muted); margin-bottom: 2.5rem; max-width: 500px; }
    .hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.95rem; transition: all var(--transition); border: none; cursor: pointer; text-decoration: none; }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-primary:hover { background: var(--accent-hover); text-decoration: none; transform: translateY(-1px); }
    .btn-secondary { background: transparent; color: var(--text); border: 1px solid var(--border-light); }
    .btn-secondary:hover { border-color: var(--text-muted); text-decoration: none; }
    .btn-large { padding: 1rem 2rem; font-size: 1.05rem; }
    .hero-stats { display: flex; gap: 3rem; margin-top: 3rem; justify-content: center; }
    .stat { display: flex; flex-direction: column; align-items: center; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: var(--accent); }
    .stat-label { font-size: 0.8rem; color: var(--text-dim); }
    .section-title { text-align: center; font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; margin-bottom: 0.75rem; letter-spacing: -0.02em; }
    .section-subtitle { text-align: center; color: var(--text-muted); margin-bottom: 3rem; font-size: 1.05rem; }
    .features { padding: 6rem 2rem; max-width: 1100px; margin: 0 auto; }
    .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .feature-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; transition: all var(--transition); }
    .feature-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(59, 130, 246, 0.1); }
    .feature-icon { font-size: 2rem; margin-bottom: 1rem; }
    .feature-card h3 { font-size: 1.15rem; margin-bottom: 0.5rem; font-weight: 700; }
    .feature-card p { color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; }
    .quickstart { padding: 6rem 2rem; max-width: 800px; margin: 0 auto; }
    .steps { display: flex; flex-direction: column; gap: 2rem; }
    .step { display: flex; gap: 1.5rem; align-items: flex-start; }
    .step-number { flex-shrink: 0; width: 48px; height: 48px; background: var(--accent); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; }
    .step-content h3 { font-size: 1.15rem; margin-bottom: 0.4rem; }
    .step-content p { color: var(--text-muted); margin-bottom: 0.75rem; font-size: 0.9rem; }
    .code-block { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.75rem 1rem; font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent); overflow-x: auto; }
    .code-block code { white-space: pre; }
    .demo { padding: 6rem 2rem; max-width: 700px; margin: 0 auto; }
    .demo-container { max-width: 600px; margin: 0 auto; }
    .demo-window { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
    .demo-titlebar { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: var(--bg-hover); border-bottom: 1px solid var(--border); }
    .demo-dot { width: 12px; height: 12px; border-radius: 50%; }
    .demo-url { margin-left: 0.5rem; font-size: 0.8rem; color: var(--text-dim); font-family: var(--font-mono); }
    .demo-chat { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; min-height: 250px; }
    .demo-msg { display: flex; gap: 0.5rem; align-items: flex-start; }
    .demo-msg-user { justify-content: flex-end; }
    .demo-msg-agent { justify-content: flex-start; }
    .demo-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--accent-glow); display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
    .demo-bubble { max-width: 80%; padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-size: 0.85rem; line-height: 1.5; }
    .demo-msg-user .demo-bubble { background: var(--accent); color: #fff; }
    .demo-msg-agent .demo-bubble { background: var(--bg-hover); color: var(--text); }
    .demo-input { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-top: 1px solid var(--border); }
    .demo-placeholder { color: var(--text-dim); font-size: 0.85rem; }
    .demo-send { color: var(--accent); font-size: 1.2rem; }
    .cta { padding: 6rem 2rem; text-align: center; background: radial-gradient(ellipse at 50% 100%, var(--accent-glow) 0%, transparent 60%); }
    .cta-title { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.75rem; letter-spacing: -0.02em; }
    .cta-subtitle { color: var(--text-muted); margin-bottom: 2rem; font-size: 1.1rem; }
    .cta-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .footer { border-top: 1px solid var(--border); padding: 2rem; }
    .footer-content { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .footer-brand { font-weight: 700; font-size: 1rem; }
    .footer-links { display: flex; gap: 1.5rem; }
    .footer-links a { color: var(--text-muted); font-size: 0.85rem; }
    .footer-note { color: var(--text-dim); font-size: 0.8rem; }
    .fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .fade-in.visible { opacity: 1; transform: translateY(0); }
    @media (max-width: 768px) {
      .nav-links a:not(.nav-cta) { display: none; }
      .hero-stats { gap: 1.5rem; }
      .hero-title { font-size: 2rem; }
    }
    @media (max-width: 480px) {
      .hero-actions { flex-direction: column; width: 100%; }
      .btn { width: 100%; justify-content: center; }
      .cta-actions { flex-direction: column; width: 80%; margin: 0 auto; }
    }
  </style>
</head>
<body class="landing">
  <section class="hero">
    <nav class="nav">
      <div class="nav-brand">
        <span class="nav-icon">✨</span>
        <span class="nav-title">personallog.ai</span>
      </div>
      <div class="nav-links">
        <a href="#features">Features</a>
        <a href="#quickstart">Quick Start</a>
        <a href="https://github.com/Lucineer/personallog-ai" target="_blank">GitHub</a>
        <a href="/app" class="nav-cta">Open App</a>
      </div>
    </nav>

    <div class="hero-content fade-in">
      <div class="hero-badge">Open Source · Self-Hosted · Multi-Channel</div>
      <h1 class="hero-title">
        Your AI,<br>
        <span class="gradient-text">Living in Your Repo</span>
      </h1>
      <p class="hero-subtitle">
        Fork. Add keys. Deploy. Your personal agent is alive.
      </p>
      <div class="hero-actions">
        <a href="https://github.com/Lucineer/personallog-ai/fork" class="btn btn-primary">
          Fork on GitHub
        </a>
        <a href="/app" class="btn btn-secondary">
          Try Live Demo
        </a>
      </div>
      <div class="hero-stats">
        <div class="stat">
          <span class="stat-value">60s</span>
          <span class="stat-label">to deploy</span>
        </div>
        <div class="stat">
          <span class="stat-value">5+</span>
          <span class="stat-label">channels</span>
        </div>
        <div class="stat">
          <span class="stat-value">MIT</span>
          <span class="stat-label">license</span>
        </div>
      </div>
    </div>
  </section>

  <section id="features" class="features">
    <h2 class="section-title">Everything you need in a personal AI</h2>
    <p class="section-subtitle">Built on cocapn — the paradigm where the repo IS the agent</p>

    <div class="feature-grid">
      <div class="feature-card fade-in">
        <div class="feature-icon">🧠</div>
        <h3>Persistent Memory</h3>
        <p>Remembers every conversation, preference, and fact across sessions. KV-backed storage that grows with you.</p>
      </div>

      <div class="feature-card fade-in">
        <div class="feature-icon">💬</div>
        <h3>Multi-Channel</h3>
        <p>Chat via web, Telegram, Discord, WhatsApp, or email. Your agent meets you where you are.</p>
      </div>

      <div class="feature-card fade-in">
        <div class="feature-icon">🤝</div>
        <h3>Agent-to-Agent</h3>
        <p>Your agent can talk to other agents via the A2A protocol. Build a network of AI assistants.</p>
      </div>

      <div class="feature-card fade-in">
        <div class="feature-icon">📁</div>
        <h3>Repo-Aware</h3>
        <p>Reads your files, understands your code, generates CLAUDE.md files. The agent IS the repo.</p>
      </div>

      <div class="feature-card fade-in">
        <div class="feature-icon">🏠</div>
        <h3>Self-Hosted</h3>
        <p>Runs on Cloudflare Workers. Your data stays on your infrastructure. No third-party data harvesting.</p>
      </div>

      <div class="feature-card fade-in">
        <div class="feature-icon">🔓</div>
        <h3>Open Source</h3>
        <p>MIT licensed. Fork it, modify it, make it yours. No vendor lock-in, no hidden costs.</p>
      </div>
    </div>
  </section>

  <section id="quickstart" class="quickstart">
    <h2 class="section-title">Get Started in 60 Seconds</h2>
    <p class="section-subtitle">Three steps to your personal AI agent</p>

    <div class="steps">
      <div class="step fade-in">
        <div class="step-number">1</div>
        <div class="step-content">
          <h3>Fork the Repo</h3>
          <p>Click fork on GitHub. Clone your fork locally.</p>
          <div class="code-block">
            <code>git clone https://github.com/YOU/personallog-ai.git</code>
          </div>
        </div>
      </div>

      <div class="step fade-in">
        <div class="step-number">2</div>
        <div class="step-content">
          <h3>Add Your Secrets</h3>
          <p>Set your API key and a JWT secret for auth.</p>
          <div class="code-block">
            <code>npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler secret put JWT_SECRET</code>
          </div>
        </div>
      </div>

      <div class="step fade-in">
        <div class="step-number">3</div>
        <div class="step-content">
          <h3>Deploy</h3>
          <p>One command. Your agent is live.</p>
          <div class="code-block">
            <code>npm run deploy</code>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="demo">
    <h2 class="section-title">See It In Action</h2>
    <p class="section-subtitle">Try it right now — no signup needed</p>
    <div class="demo-container fade-in">
      <div class="demo-window">
        <div class="demo-titlebar">
          <span class="demo-dot" style="background:#ef4444"></span>
          <span class="demo-dot" style="background:#f59e0b"></span>
          <span class="demo-dot" style="background:#22c55e"></span>
          <span class="demo-url">personallog.ai/app</span>
        </div>
        <div class="demo-chat">
          <div class="demo-msg demo-msg-user">
            <div class="demo-bubble">What do you know about me?</div>
          </div>
          <div class="demo-msg demo-msg-agent">
            <div class="demo-avatar">✨</div>
            <div class="demo-bubble">
              Based on our conversations, I know you're a developer who loves clean architecture.
              You prefer TypeScript, work with Cloudflare Workers, and your current project is cocapn.
              You also mentioned you're learning guitar — how's that going?
            </div>
          </div>
          <div class="demo-msg demo-msg-user">
            <div class="demo-bubble">Can you summarize my repo structure?</div>
          </div>
          <div class="demo-msg demo-msg-agent">
            <div class="demo-avatar">✨</div>
            <div class="demo-bubble">
              Your repo has 24 files across 6 directories. Main modules: worker (entry), agent (core),
              channels (connectors), and cocapn (config). TypeScript throughout, strict mode enabled.
              Want me to generate a CLAUDE.md for it?
            </div>
          </div>
        </div>
        <div class="demo-input">
          <span class="demo-placeholder">Type a message...</span>
          <a href="/app" class="demo-send" style="text-decoration:none">➤</a>
        </div>
      </div>
    </div>
  </section>

  <section class="cta">
    <h2 class="cta-title">Ready to meet your agent?</h2>
    <p class="cta-subtitle">It takes 60 seconds. Seriously.</p>
    <div class="cta-actions">
      <a href="https://github.com/Lucineer/personallog-ai/fork" class="btn btn-primary btn-large">
        Fork on GitHub
      </a>
      <a href="/app" class="btn btn-secondary btn-large">
        Try Live Demo
      </a>
    </div>
  </section>

  <footer class="footer">
    <div class="footer-content">
      <div class="footer-brand">
        <span>✨</span> personallog.ai
      </div>
      <div class="footer-links">
        <a href="https://github.com/Lucineer/personallog-ai">GitHub</a>
        <a href="https://github.com/Lucineer/personallog-ai/blob/main/LICENSE">MIT License</a>
        <a href="https://github.com/Lucineer/personallog-ai/issues">Issues</a>
      </div>
      <div class="footer-note">
        Built on <a href="https://github.com/nichochar/cocapn" target="_blank">cocapn</a> — the repo IS the agent.
      </div>
    </div>
  </footer>

  <script>
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  </script>
</body>
</html>`;
