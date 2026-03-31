// personallog.ai — Web App Logic
// Messenger-style chat with streaming, file browser, and conversation memory

(function () {
  'use strict';

  // ===== State =====
  const state = {
    conversations: [],
    currentConvo: null,
    messages: [],
    guestUsed: 0,
    guestLimit: 5,
    token: null,
    files: [],
    streaming: false,
    status: { name: 'PersonalAgent', avatar: '✨', files: 0, memories: 0 }
  };

  // ===== DOM =====
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

  // ===== Init =====
  async function init() {
    loadState();
    await fetchStatus();
    await fetchFiles();
    renderChatList();
    renderStatus();

    if (state.conversations.length === 0) {
      addWelcomeMessage();
    } else if (state.currentConvo) {
      loadConversation(state.currentConvo);
    }

    bindEvents();
  }

  function loadState() {
    try {
      const saved = localStorage.getItem('personallog_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        state.conversations = parsed.conversations || [];
        state.currentConvo = parsed.currentConvo || null;
        state.token = parsed.token || null;
        state.guestUsed = parsed.guestUsed || 0;
      }
    } catch { /* ignore */ }
  }

  function saveState() {
    try {
      localStorage.setItem('personallog_state', JSON.stringify({
        conversations: state.conversations,
        currentConvo: state.currentConvo,
        token: state.token,
        guestUsed: state.guestUsed
      }));
    } catch { /* ignore */ }
  }

  // ===== API =====
  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        state.status = await res.json();
      }
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

  async function sendMessage(text) {
    if (!text.trim() || state.streaming) return;

    // Guest limit check
    if (!state.token && state.guestUsed >= state.guestLimit) {
      addMessage('agent', `You've used all ${state.guestLimit} free messages. Set a JWT_SECRET and get a token for unlimited access.`);
      return;
    }

    // Add user message
    addMessage('user', text);
    state.guestUsed++;
    saveState();

    // Show typing
    const typingEl = showTyping();
    state.streaming = true;
    sendBtn.disabled = true;

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: text, stream: true })
      });

      typingEl.remove();

      if (!res.ok) {
        const err = await res.text();
        addMessage('agent', `Error: ${err}`);
        return;
      }

      // Stream SSE
      if (res.headers.get('content-type')?.includes('text/event-stream')) {
        await streamResponse(res);
      } else {
        const data = await res.json();
        addMessage('agent', data.response || data.message || JSON.stringify(data));
      }
    } catch (err) {
      typingEl?.remove();
      addMessage('agent', `Connection error: ${err.message}. Is the agent running?`);
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
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              content += parsed.content;
              bubbleEl.innerHTML = renderMarkdown(content);
              messagesEl.scrollTop = messagesEl.scrollHeight;
            }
          } catch { /* skip malformed */ }
        }
      }
    }

    // Save to conversation
    saveToConversation(content);
  }

  // ===== Renderers =====
  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.innerHTML = `
      <div class="message-avatar">${role === 'user' ? '👤' : state.status.avatar}</div>
      <div class="message-bubble">${text ? renderMarkdown(text) : ''}</div>
    `;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'message agent';
    div.id = 'typing';
    div.innerHTML = `
      <div class="message-avatar">${state.status.avatar}</div>
      <div class="message-bubble">
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>
    `;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function renderMarkdown(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  function renderStatus() {
    const { name, avatar, files, memories } = state.status;
    statusInfo.textContent = `${avatar} ${name} · ${files} files · ${memories} memories`;
  }

  function renderChatList() {
    chatList.innerHTML = '';
    for (const convo of state.conversations) {
      const li = document.createElement('li');
      li.className = 'sidebar-item' + (convo.id === state.currentConvo ? ' active' : '');
      li.innerHTML = `
        <div class="sidebar-item-title">${escapeHtml(convo.title)}</div>
        <div class="sidebar-item-preview">${escapeHtml(convo.preview)}</div>
      `;
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
      li.innerHTML = `${icon} ${file.path}`;
      li.addEventListener('click', () => openFile(file.path));
      fileTree.appendChild(li);
    }
  }

  async function openFile(path) {
    try {
      const res = await fetch(`/api/files/${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('File not found');
      const content = await res.text();

      fileViewerEmpty.style.display = 'none';
      fileViewer.style.display = 'block';
      fileViewerTitle.textContent = path;
      fileViewerContent.textContent = content;

      // Highlight active file
      $$('.file-tree-item').forEach(el => el.classList.remove('active'));
      const items = $$('.file-tree-item');
      items.forEach(el => {
        if (el.textContent.includes(path)) el.classList.add('active');
      });
    } catch (err) {
      fileViewerEmpty.style.display = 'block';
      fileViewer.style.display = 'none';
      fileViewerEmpty.textContent = `Error: ${err.message}`;
    }
  }

  function addWelcomeMessage() {
    addMessage('agent', `Hey! I'm ${state.status.name} ${state.status.avatar}\n\nI'm your personal AI agent, living in this repo. I remember our conversations, understand your files, and I'm available on multiple channels.\n\nWhat would you like to talk about?`);
  }

  // ===== Conversation Management =====
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

  // ===== Helpers =====
  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ===== Events =====
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

  // ===== Go =====
  init();
})();
