// App page HTML — self-contained with inline CSS & JS
// Served by the worker for GET /app

export const APP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>personallog.ai — Chat</title>
  <meta name="theme-color" content="#0a0a0a">
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
    html, body { height: 100%; overflow: hidden; }
    body { font-family: var(--font); background: var(--bg); color: var(--text); line-height: 1.6; -webkit-font-smoothing: antialiased; }
    a { color: var(--accent); text-decoration: none; }

    .app { height: 100vh; height: 100dvh; display: flex; flex-direction: column; }

    /* Loading screen */
    .loading-screen {
      position: fixed; inset: 0; z-index: 999; background: var(--bg);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 1rem; transition: opacity 0.4s ease, visibility 0.4s ease;
    }
    .loading-screen.hidden { opacity: 0; visibility: hidden; pointer-events: none; }
    .loading-logo { font-size: 2.5rem; animation: loadingPulse 1.5s ease-in-out infinite; }
    .loading-bar { width: 120px; height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; }
    .loading-bar-fill { height: 100%; background: var(--accent); border-radius: 2px; animation: loadingFill 1.2s ease-in-out infinite; }
    @keyframes loadingPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.95); } }
    @keyframes loadingFill { 0% { width: 0; margin-left: 0; } 50% { width: 70%; margin-left: 15%; } 100% { width: 0; margin-left: 100%; } }

    .app-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.75rem 1rem; background: var(--bg-card);
      border-bottom: 1px solid var(--border); flex-shrink: 0; gap: 0.5rem;
    }
    .app-brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 0.95rem; }
    .app-status { display: flex; align-items: center; gap: 1rem; font-size: 0.75rem; color: var(--text-muted); }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); display: inline-block; animation: pulseDot 2s ease-in-out infinite; }
    @keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .app-toggle { background: none; border: 1px solid var(--border); color: var(--text-muted); padding: 0.4rem 0.8rem; border-radius: var(--radius-sm); cursor: pointer; font-size: 0.8rem; transition: all var(--transition); text-decoration: none; display: inline-block; }
    .app-toggle:hover { border-color: var(--accent); color: var(--accent); }

    .guest-counter {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.4rem 0.8rem; background: var(--bg-hover);
      border-bottom: 1px solid var(--border); font-size: 0.8rem; color: var(--text-muted);
      transition: all 0.3s ease;
    }
    .guest-counter.limit-warning { color: var(--warning); background: rgba(245, 158, 11, 0.08); }
    .guest-counter.limit-reached { color: var(--danger); background: rgba(239, 68, 68, 0.08); }
    .guest-counter a { font-weight: 600; }
    .guest-counter.hidden { display: none; }

    .app-body { display: flex; flex: 1; overflow: hidden; }

    .sidebar { width: 260px; background: var(--bg-card); border-right: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; }
    .sidebar-header { padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .sidebar-header h3 { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .sidebar-list { flex: 1; overflow-y: auto; list-style: none; }
    .sidebar-item { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: background var(--transition); }
    .sidebar-item:hover { background: var(--bg-hover); }
    .sidebar-item.active { background: var(--accent-glow); border-left: 3px solid var(--accent); }
    .sidebar-item-title { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sidebar-item-preview { font-size: 0.75rem; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .chat-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .messages { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; -webkit-overflow-scrolling: touch; }

    .message { display: flex; gap: 0.75rem; max-width: 75%; animation: msgSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes msgSlideIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .message.user { align-self: flex-end; flex-direction: row-reverse; }
    .message.agent { align-self: flex-start; }
    .message-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1rem; }
    .message.user .message-avatar { background: var(--accent); }
    .message.agent .message-avatar { background: var(--accent-glow); }
    .message-bubble { padding: 0.75rem 1rem; border-radius: var(--radius); font-size: 0.9rem; line-height: 1.6; word-break: break-word; }
    .message.user .message-bubble { background: var(--accent); color: #fff; }
    .message.agent .message-bubble { background: var(--bg-card); border: 1px solid var(--border); }
    .message.agent.error .message-bubble { border-color: var(--danger); background: rgba(239, 68, 68, 0.08); }
    .message.agent.warning .message-bubble { border-color: var(--warning); background: rgba(245, 158, 11, 0.08); }
    .error-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .error-actions button { background: var(--bg-hover); border: 1px solid var(--border); color: var(--text); padding: 0.3rem 0.7rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: all var(--transition); }
    .error-actions button:hover { border-color: var(--accent); color: var(--accent); }
    .message-bubble pre { background: var(--bg); padding: 0.75rem; border-radius: var(--radius-sm); overflow-x: auto; margin: 0.5rem 0; font-family: var(--font-mono); font-size: 0.82rem; }
    .message-bubble code { font-family: var(--font-mono); font-size: 0.85em; background: var(--bg); padding: 0.15em 0.35em; border-radius: 4px; }
    .message-bubble pre code { background: none; padding: 0; }

    .typing-indicator { display: flex; gap: 4px; padding: 0.5rem 0; align-items: center; }
    .typing-indicator span { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: typingBounce 1.4s infinite ease-in-out; }
    .typing-indicator span:nth-child(2) { animation-delay: 0.16s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.32s; }
    @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-8px); opacity: 1; } }

    .chat-input { display: flex; gap: 0.5rem; padding: 0.75rem 1rem; border-top: 1px solid var(--border); background: var(--bg-card); }
    .chat-input textarea { flex: 1; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.65rem 0.9rem; color: var(--text); font-family: var(--font); font-size: 0.9rem; resize: none; outline: none; max-height: 120px; transition: border-color var(--transition); }
    .chat-input textarea:focus { border-color: var(--accent); }
    .chat-input textarea::placeholder { color: var(--text-dim); }
    .send-btn { background: var(--accent); border: none; color: #fff; width: 44px; height: 44px; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: background var(--transition), transform 0.15s ease; flex-shrink: 0; }
    .send-btn:hover { background: var(--accent-hover); }
    .send-btn:active { transform: scale(0.95); }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .attach-btn { background: none; border: 1px solid var(--border); color: var(--text-muted); width: 44px; height: 44px; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; transition: all var(--transition); flex-shrink: 0; }
    .attach-btn:hover { border-color: var(--accent); color: var(--accent); }

    .file-panel { width: 320px; background: var(--bg-card); border-left: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; transition: width 0.3s ease, opacity 0.3s ease; overflow: hidden; }
    .file-panel.collapsed { width: 0; opacity: 0; }
    .file-panel-header { padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .file-panel-header h3 { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .file-tree { flex: 1; overflow-y: auto; padding: 0.5rem; list-style: none; }
    .file-tree-item { padding: 0.4rem 0.75rem; font-size: 0.82rem; font-family: var(--font-mono); color: var(--text-muted); cursor: pointer; border-radius: 4px; transition: all var(--transition); display: flex; align-items: center; gap: 0.5rem; }
    .file-tree-item:hover { background: var(--bg-hover); color: var(--text); }
    .file-tree-item.active { background: var(--accent-glow); color: var(--accent); }
    .file-viewer { flex: 1; overflow-y: auto; padding: 1rem; }
    .file-viewer pre { font-family: var(--font-mono); font-size: 0.8rem; line-height: 1.5; color: var(--text); white-space: pre-wrap; word-break: break-all; }
    .file-viewer-empty { color: var(--text-dim); text-align: center; padding: 2rem; font-size: 0.85rem; }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .file-panel { display: none; }
      .message { max-width: 88%; }
      .app-header { padding: 0.5rem 0.75rem; }
      .chat-input { padding: 0.5rem 0.75rem; }
      .messages { padding: 0.75rem; }
    }
    @media (max-width: 480px) {
      .app-status { display: none; }
      .message { max-width: 92%; }
    }
  </style>
</head>
<body class="app">
  <!-- Loading screen -->
  <div class="loading-screen" id="loadingScreen">
    <div class="loading-logo">✨</div>
    <div class="loading-bar"><div class="loading-bar-fill"></div></div>
  </div>

  <!-- Header -->
  <header class="app-header">
    <div class="app-brand">
      <span style="font-size:1.3rem">✨</span>
      <strong>personallog.ai</strong>
    </div>
    <div class="app-status" id="statusBar">
      <span><span class="status-dot"></span> Online</span>
      <span id="statusInfo">loading...</span>
    </div>
    <div style="display:flex;gap:0.5rem">
      <button class="app-toggle" id="toggleFiles" title="Toggle file browser">Files</button>
      <a href="/" class="app-toggle">Home</a>
    </div>
  </header>

  <!-- Guest counter -->
  <div class="guest-counter hidden" id="guestCounter"></div>

  <!-- Body -->
  <div class="app-body">
    <!-- Sidebar: Conversations -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <h3>Chats</h3>
        <button class="app-toggle" id="newChat" title="New chat">+ New</button>
      </div>
      <ul class="sidebar-list" id="chatList">
        <!-- Populated by JS -->
      </ul>
    </aside>

    <!-- Chat Area -->
    <main class="chat-area">
      <div class="messages" id="messages">
        <!-- Populated by JS -->
      </div>

      <div class="chat-input">
        <button class="attach-btn" id="attachBtn" title="Attach file (coming soon)">📎</button>
        <textarea id="input" rows="1" placeholder="Message your agent..." autofocus></textarea>
        <button class="send-btn" id="sendBtn">➤</button>
      </div>
    </main>

    <!-- File Browser -->
    <aside class="file-panel collapsed" id="filePanel">
      <div class="file-panel-header">
        <h3>Repo Files</h3>
        <button class="app-toggle" id="closeFiles">✕</button>
      </div>
      <ul class="file-tree" id="fileTree">
        <!-- Populated by JS -->
      </ul>
      <div class="file-viewer" id="fileViewer" style="display:none">
        <div class="file-panel-header" style="padding:0.5rem 0">
          <h3 id="fileViewerTitle">file.ts</h3>
        </div>
        <pre id="fileViewerContent"></pre>
      </div>
      <div class="file-viewer-empty" id="fileViewerEmpty">
        Click a file to view its contents
      </div>
    </aside>
  </div>

  <script>
    // personallog.ai — Web App (self-contained)
    (function () {
      'use strict';

      const state = {
        conversations: [],
        currentConvo: null,
        messages: [],
        guestUsed: 0,
        guestLimit: 5,
        isGuest: true,
        token: null,
        files: [],
        streaming: false,
        status: { name: 'PersonalAgent', avatar: '✨', files: 0, memories: 0 }
      };

      const $ = (sel) => document.querySelector(sel);
      const $$ = (sel) => document.querySelectorAll(sel);

      const messagesEl = $('#messages');
      const inputEl = $('#input');
      const sendBtn = $('#sendBtn');
      const chatList = $('#chatList');
      const statusInfo = $('#statusInfo');
      const filePanel = $('#filePanel');
      const fileTree = $('#fileTree');
      const fileViewer = $('#fileViewer');
      const fileViewerContent = $('#fileViewerContent');
      const fileViewerTitle = $('#fileViewerTitle');
      const fileViewerEmpty = $('#fileViewerEmpty');
      const guestCounter = $('#guestCounter');
      const loadingScreen = $('#loadingScreen');

      async function init() {
        loadState();
        await Promise.all([fetchStatus(), fetchFiles(), fetchDemoStatus()]);
        renderChatList();
        renderStatus();
        renderGuestCounter();

        if (state.conversations.length === 0) {
          addWelcomeMessage();
        } else if (state.currentConvo) {
          loadConversation(state.currentConvo);
        }

        bindEvents();

        // Hide loading screen
        requestAnimationFrame(() => {
          loadingScreen.classList.add('hidden');
        });
      }

      function loadState() {
        try {
          const saved = localStorage.getItem('personallog_state');
          if (saved) {
            const parsed = JSON.parse(saved);
            state.conversations = parsed.conversations || [];
            state.currentConvo = parsed.currentConvo || null;
            state.token = parsed.token || null;
          }
        } catch { /* ignore */ }
      }

      function saveState() {
        try {
          localStorage.setItem('personallog_state', JSON.stringify({
            conversations: state.conversations,
            currentConvo: state.currentConvo,
            token: state.token,
          }));
        } catch { /* ignore */ }
      }

      async function fetchStatus() {
        try {
          const res = await fetch('/api/status');
          if (res.ok) state.status = await res.json();
        } catch { /* offline */ }
      }

      async function fetchFiles() {
        try {
          const res = await fetch('/api/files');
          if (res.ok) {
            state.files = await res.json();
            renderFileTree();
          }
        } catch { /* offline */ }
      }

      async function fetchDemoStatus() {
        try {
          const headers = {};
          if (state.token) headers['Authorization'] = \`Bearer \${state.token}\`;
          const res = await fetch('/api/demo/status', { headers });
          if (res.ok) {
            const data = await res.json();
            state.isGuest = data.guest;
            state.guestUsed = data.used;
            state.guestLimit = data.limit;
          }
        } catch { /* offline */ }
      }

      function renderGuestCounter() {
        if (!state.isGuest) {
          guestCounter.classList.add('hidden');
          return;
        }
        guestCounter.classList.remove('hidden');
        const remaining = state.guestLimit - state.guestUsed;
        guestCounter.textContent = \`\${state.guestUsed}/\${state.guestLimit} free messages used\`;

        guestCounter.classList.remove('limit-warning', 'limit-reached');
        if (remaining <= 0) {
          guestCounter.classList.add('limit-reached');
          guestCounter.innerHTML = \`\${state.guestUsed}/\${state.guestLimit} free messages used — <a href="https://github.com/Lucineer/personallog-ai/fork" target="_blank">Fork this repo for unlimited access</a>\`;
        } else if (remaining <= 2) {
          guestCounter.classList.add('limit-warning');
        }
      }

      async function sendMessage(text) {
        if (!text.trim() || state.streaming) return;

        if (!state.token && state.isGuest && state.guestUsed >= state.guestLimit) {
          addMessage('agent', \`You've used all \${state.guestLimit} free messages. **[Fork this repo](https://github.com/Lucineer/personallog-ai/fork)** for unlimited access!\`, 'warning');
          return;
        }

        addMessage('user', text);
        const typingEl = showTyping();
        state.streaming = true;
        sendBtn.disabled = true;

        try {
          const headers = { 'Content-Type': 'application/json' };
          if (state.token) headers['Authorization'] = \`Bearer \${state.token}\`;

          const res = await fetch('/api/chat', {
            method: 'POST',
            headers,
            body: JSON.stringify({ message: text, stream: true })
          });

          typingEl.remove();

          // Update guest counter from headers
          const guestUsed = res.headers.get('X-Guest-Used');
          const guestLimit = res.headers.get('X-Guest-Limit');
          if (guestUsed) state.guestUsed = parseInt(guestUsed);
          if (guestLimit) state.guestLimit = parseInt(guestLimit);
          renderGuestCounter();

          if (!res.ok) {
            let errorMsg = \`Error \${res.status}\`;
            try {
              const errData = await res.json();
              errorMsg = errData.error || errorMsg;
            } catch {
              try { errorMsg = await res.text(); } catch { /* use default */ }
            }

            const msgType = res.status === 429 ? 'warning' : 'error';
            const bubble = addMessage('agent', errorMsg, msgType);
            return;
          }

          if (res.headers.get('content-type')?.includes('text/event-stream')) {
            await streamResponse(res);
          } else {
            const data = await res.json();
            addMessage('agent', data.response || data.message || JSON.stringify(data));
          }
        } catch (err) {
          typingEl?.remove();
          addMessage('agent', \`Connection error: \${err.message}. Is the agent running?\`, 'error');
        } finally {
          state.streaming = false;
          sendBtn.disabled = false;
          inputEl.focus();
        }
      }

      async function streamResponse(res) {
        const msgEl = addMessage('agent', '');
        const bubbleEl = msgEl.querySelector('.message-bubble');
        let content = '';

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  bubbleEl.innerHTML = renderMarkdown(parsed.error);
                  msgEl.classList.add(parsed.retryable ? 'warning' : 'error');
                  return;
                }
                if (parsed.content) {
                  content += parsed.content;
                  bubbleEl.innerHTML = renderMarkdown(content);
                  messagesEl.scrollTop = messagesEl.scrollHeight;
                }
              } catch { /* skip malformed */ }
            }
          }
        }

        saveToConversation(content);
      }

      function addMessage(role, text, type) {
        const div = document.createElement('div');
        div.className = \`message \${role}\${type ? ' ' + type : ''}\`;
        div.innerHTML = \`
          <div class="message-avatar">\${role === 'user' ? '👤' : state.status.avatar}</div>
          <div class="message-bubble">\${text ? renderMarkdown(text) : ''}</div>
        \`;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return div;
      }

      function showTyping() {
        const div = document.createElement('div');
        div.className = 'message agent';
        div.id = 'typing';
        div.innerHTML = \`
          <div class="message-avatar">\${state.status.avatar}</div>
          <div class="message-bubble">
            <div class="typing-indicator"><span></span><span></span><span></span></div>
          </div>
        \`;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return div;
      }

      function renderMarkdown(text) {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="\$2" target="_blank">\$1</a>')
          .replace(/\`\`\`(\w*)\\n([\\s\\S]*?)\`\`\`/g, '<pre><code>\$2</code></pre>')
          .replace(/\`([^\`]+)\`/g, '<code>\$1</code>')
          .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>\$1</strong>')
          .replace(/\\*(.+?)\\*/g, '<em>\$1</em>')
          .replace(/\\n/g, '<br>');
      }

      function renderStatus() {
        const { name, avatar, files, memories } = state.status;
        statusInfo.textContent = \`\${avatar} \${name} · \${files} files · \${memories} memories\`;
      }

      function renderChatList() {
        chatList.innerHTML = '';
        for (const convo of state.conversations) {
          const li = document.createElement('li');
          li.className = 'sidebar-item' + (convo.id === state.currentConvo ? ' active' : '');
          li.innerHTML = \`
            <div class="sidebar-item-title">\${escapeHtml(convo.title)}</div>
            <div class="sidebar-item-preview">\${escapeHtml(convo.preview)}</div>
          \`;
          li.addEventListener('click', () => loadConversation(convo.id));
          chatList.appendChild(li);
        }
      }

      function renderFileTree() {
        fileTree.innerHTML = '';
        for (const file of state.files) {
          const li = document.createElement('li');
          li.className = 'file-tree-item';
          const icon = file.type === 'dir' ? '📁' : file.path.endsWith('.ts') ? '📘' : file.path.endsWith('.md') ? '📝' : file.path.endsWith('.json') ? '📋' : '📄';
          li.innerHTML = \`\${icon} \${escapeHtml(file.path)}\`;
          li.addEventListener('click', () => openFile(file.path));
          fileTree.appendChild(li);
        }
      }

      async function openFile(path) {
        try {
          const res = await fetch(\`/api/files/\${encodeURIComponent(path)}\`);
          if (!res.ok) throw new Error('File not found');
          const content = await res.text();

          fileViewerEmpty.style.display = 'none';
          fileViewer.style.display = 'block';
          fileViewerTitle.textContent = path;
          fileViewerContent.textContent = content;

          $$('.file-tree-item').forEach(el => el.classList.remove('active'));
          $$('.file-tree-item').forEach(el => {
            if (el.textContent.includes(path)) el.classList.add('active');
          });
        } catch (err) {
          fileViewerEmpty.style.display = 'block';
          fileViewer.style.display = 'none';
          fileViewerEmpty.textContent = \`Error: \${err.message}\`;
        }
      }

      function addWelcomeMessage() {
        addMessage('agent', \`Hey! I'm \${state.status.name} \${state.status.avatar}\\n\\nI'm your personal AI agent, living in this repo. I remember our conversations, understand your files, and I'm available on multiple channels.\\n\\nWhat would you like to talk about?\`);
      }

      function saveToConversation(response) {
        const lastUserMsg = [...state.messages].reverse().find(m => m.role === 'user');
        const title = lastUserMsg?.text?.slice(0, 40) || 'New Chat';
        const preview = response.slice(0, 60);

        if (!state.currentConvo) {
          const convo = {
            id: Date.now().toString(),
            title,
            preview,
            messages: [...state.messages, { role: 'agent', text: response }],
            created: Date.now()
          };
          state.conversations.unshift(convo);
          state.currentConvo = convo.id;
        } else {
          const convo = state.conversations.find(c => c.id === state.currentConvo);
          if (convo) {
            convo.messages.push({ role: 'agent', text: response });
            convo.preview = preview;
          }
        }

        state.messages = [];
        saveState();
        renderChatList();
      }

      function loadConversation(id) {
        const convo = state.conversations.find(c => c.id === id);
        if (!convo) return;

        state.currentConvo = id;
        messagesEl.innerHTML = '';

        for (const msg of convo.messages) {
          addMessage(msg.role, msg.text);
        }

        saveState();
        renderChatList();
      }

      function newChat() {
        state.currentConvo = null;
        state.messages = [];
        messagesEl.innerHTML = '';
        addWelcomeMessage();
        saveState();
        renderChatList();
      }

      function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      function bindEvents() {
        sendBtn.addEventListener('click', () => {
          sendMessage(inputEl.value);
          inputEl.value = '';
          inputEl.style.height = 'auto';
        });

        inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputEl.value);
            inputEl.value = '';
            inputEl.style.height = 'auto';
          }
        });

        inputEl.addEventListener('input', () => {
          inputEl.style.height = 'auto';
          inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
        });

        $('#toggleFiles').addEventListener('click', () => {
          filePanel.classList.toggle('collapsed');
        });

        $('#closeFiles').addEventListener('click', () => {
          filePanel.classList.add('collapsed');
        });

        $('#newChat').addEventListener('click', newChat);

        $('#attachBtn').addEventListener('click', () => {
          addMessage('agent', 'File attachments coming soon! For now, paste code or text directly.');
        });
      }

      init();
    })();
  </script>
</body>
</html>`;
