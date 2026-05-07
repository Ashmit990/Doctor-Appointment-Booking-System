(function () {
  'use strict';

  // ── Inject CSS ──────────────────────────────────────────────────────────
  const CSS = `
    #hc-chat-widget * { box-sizing: border-box; font-family: inherit; }
    #hc-chat-toggle {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #007E85, #005f65);
      border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,126,133,0.45);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #hc-chat-toggle:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,126,133,0.55); }
    #hc-chat-toggle svg { width: 26px; height: 26px; color: #fff; }
    #hc-chat-badge {
      position: absolute; top: -4px; right: -4px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #ef4444; color: #fff; font-size: 10px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #fff;
    }
    #hc-chat-panel {
      position: fixed; bottom: 92px; right: 24px; z-index: 9998;
      width: 370px; height: 520px; max-height: 80vh;
      background: #fff; border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18); overflow: hidden;
      display: flex; flex-direction: column;
      transform: translateY(16px) scale(0.97); opacity: 0;
      pointer-events: none;
      transition: transform 0.25s cubic-bezier(.4,0,.2,1), opacity 0.25s;
    }
    #hc-chat-panel.hc-open {
      transform: translateY(0) scale(1); opacity: 1; pointer-events: all;
    }
    @media (max-width: 480px) {
      #hc-chat-panel {
        width: calc(100vw - 16px); right: 8px; bottom: 84px; height: 70vh;
      }
    }
    .hc-header {
      background: linear-gradient(135deg, #007E85, #005060);
      padding: 14px 16px; display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    }
    .hc-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .hc-avatar svg { width: 20px; height: 20px; color: #fff; }
    .hc-header-info { flex: 1; }
    .hc-header-title { color: #fff; font-size: 14px; font-weight: 700; margin: 0; }
    .hc-header-sub { color: rgba(255,255,255,0.75); font-size: 11px; margin: 0; display: flex; align-items: center; gap: 4px; }
    .hc-online-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; }
    .hc-close-btn {
      background: rgba(255,255,255,0.15); border: none; cursor: pointer;
      width: 30px; height: 30px; border-radius: 50%; color: #fff; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .hc-close-btn:hover { background: rgba(255,255,255,0.3); }
    #hc-messages {
      flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px;
      scrollbar-width: thin; scrollbar-color: #007E85 #f1f5f9;
    }
    #hc-messages::-webkit-scrollbar { width: 4px; }
    #hc-messages::-webkit-scrollbar-thumb { background: #007E85; border-radius: 99px; }
    .hc-msg { display: flex; gap: 8px; max-width: 88%; }
    .hc-msg.hc-user { align-self: flex-end; flex-direction: row-reverse; }
    .hc-msg.hc-ai { align-self: flex-start; }
    .hc-msg-avatar {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #007E85, #005060);
      display: flex; align-items: center; justify-content: center; margin-top: 2px;
    }
    .hc-msg-avatar svg { width: 14px; height: 14px; color: #fff; }
    .hc-bubble {
      padding: 9px 13px; border-radius: 14px; font-size: 13px; line-height: 1.5;
      word-break: break-word; white-space: pre-wrap;
    }
    .hc-user .hc-bubble {
      background: linear-gradient(135deg, #007E85, #005f65); color: #fff;
      border-bottom-right-radius: 4px;
    }
    .hc-ai .hc-bubble {
      background: #f1f5f9; color: #1e293b;
      border: 1px solid #e2e8f0; border-bottom-left-radius: 4px;
    }
    .hc-typing { display: flex; align-items: center; gap: 4px; padding: 10px 13px; }
    .hc-dot {
      width: 7px; height: 7px; border-radius: 50%; background: #94a3b8;
      animation: hc-bounce 1.2s infinite ease-in-out;
    }
    .hc-dot:nth-child(2) { animation-delay: 0.2s; }
    .hc-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes hc-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }
    .hc-input-area {
      padding: 10px 12px; border-top: 1px solid #e2e8f0;
      display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0; background: #fff;
    }
    #hc-input {
      flex: 1; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 9px 12px; font-size: 13px; outline: none; resize: none;
      max-height: 80px; line-height: 1.4; color: #1e293b;
      transition: border-color 0.15s;
      background: #f8fafc;
    }
    #hc-input:focus { border-color: #007E85; background: #fff; }
    #hc-input::placeholder { color: #94a3b8; }
    #hc-send-btn {
      width: 38px; height: 38px; border-radius: 10px; border: none; cursor: pointer;
      background: #007E85; color: #fff; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, transform 0.1s; flex-shrink: 0;
    }
    #hc-send-btn:hover { background: #005f65; transform: scale(1.05); }
    #hc-send-btn:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; }
    #hc-send-btn svg { width: 17px; height: 17px; }
    .hc-error-msg { color: #ef4444; font-size: 12px; font-style: italic; }
  `;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // ── Build HTML ──────────────────────────────────────────────────────────
  const widget = document.createElement('div');
  widget.id = 'hc-chat-widget';
  widget.innerHTML = `
    <button id="hc-chat-toggle" aria-label="Open AI Assistant" title="Healthcare AI Assistant">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <div id="hc-chat-panel" role="dialog" aria-label="Healthcare AI Assistant">
      <div class="hc-header">
        <div class="hc-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div class="hc-header-info">
          <p class="hc-header-title">Healthcare AI</p>
          <p class="hc-header-sub"><span class="hc-online-dot"></span> Online · Medical Assistant</p>
        </div>
        <button class="hc-close-btn" id="hc-close-btn" aria-label="Close">✕</button>
      </div>

      <div id="hc-messages"></div>

      <div class="hc-input-area">
        <textarea id="hc-input" rows="1" placeholder="Ask about symptoms, doctors…" maxlength="500"></textarea>
        <button id="hc-send-btn" aria-label="Send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  // ── State ───────────────────────────────────────────────────────────────
  const panel = document.getElementById('hc-chat-panel');
  const toggle = document.getElementById('hc-chat-toggle');
  const closeBtn = document.getElementById('hc-close-btn');
  const messagesEl = document.getElementById('hc-messages');
  const input = document.getElementById('hc-input');
  const sendBtn = document.getElementById('hc-send-btn');

  let isOpen = false;
  let isLoading = false;
  let chatHistory = []; // [{role:'user'|'ai', text:'...'}]

  const API_SEG = window.location.pathname.split('/').filter(Boolean)[0];
  const API_BASE = API_SEG ? `/${API_SEG}/api` : '/api';
  const ENDPOINT = window.HC_CHAT_ENDPOINT || (API_BASE + '/gemini_chat_public.php');

  // ── Helpers ─────────────────────────────────────────────────────────────
  function openPanel() {
    isOpen = true;
    panel.classList.add('hc-open');
    toggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;color:#fff"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    input.focus();
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('hc-open');
    toggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;color:#fff"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendMessage(role, text, isError) {
    const div = document.createElement('div');
    div.className = `hc-msg hc-${role === 'user' ? 'user' : 'ai'}`;
    const avatarHTML = role !== 'user' ? `<div class="hc-msg-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>` : '';
    div.innerHTML = `${avatarHTML}<div class="hc-bubble${isError ? ' hc-error-msg' : ''}">${escapeHtml(text)}</div>`;
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'hc-msg hc-ai';
    div.id = 'hc-typing-indicator';
    div.innerHTML = `<div class="hc-msg-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div><div class="hc-bubble hc-typing"><div class="hc-dot"></div><div class="hc-dot"></div><div class="hc-dot"></div></div>`;
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function removeTyping() {
    const el = document.getElementById('hc-typing-indicator');
    if (el) el.remove();
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function autoResize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  }

  // ── Welcome message ─────────────────────────────────────────────────────
  appendMessage('ai', "Hello! I'm your Healthcare AI assistant 👋\n\nI can help you understand symptoms, suggest the right specialist to see, and answer general health questions.\n\nHow can I help you today?");

  // ── Send message ────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isLoading) return;

    isLoading = true;
    sendBtn.disabled = true;
    input.value = '';
    input.style.height = 'auto';

    appendMessage('user', text);
    showTyping();

    // Build history for API (only last 10 exchanges to keep context manageable)
    const historyPayload = chatHistory.slice(-20).map(h => ({ role: h.role === 'user' ? 'user' : 'model', text: h.text }));

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: historyPayload })
      });
      const data = await res.json();
      removeTyping();

      if (data.status === 'success') {
        chatHistory.push({ role: 'user', text });
        chatHistory.push({ role: 'ai', text: data.reply });
        appendMessage('ai', data.reply);
      } else {
        appendMessage('ai', data.message || 'Something went wrong. Please try again.', true);
      }
    } catch (err) {
      removeTyping();
      appendMessage('ai', 'Network error. Please check your connection and try again.', true);
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ── Events ──────────────────────────────────────────────────────────────
  toggle.addEventListener('click', (e) => { e.stopPropagation(); isOpen ? closePanel() : openPanel(); });
  closeBtn.addEventListener('click', closePanel);

  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  input.addEventListener('input', autoResize);

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (isOpen && !widget.contains(e.target)) closePanel();
  });

})();
