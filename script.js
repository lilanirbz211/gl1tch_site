/* ═══════════════════════════════════════════════
   GLITCH MOTORE PRINCIPALE — script.js
   Database condiviso via JSONBin.io (online, visibile a tutti).
═══════════════════════════════════════════════ */

const GLITCH = (function () {

  /* ── CREDENZIALI STAFF ── */
  const STAFF_USERNAME = 'GLITCH_SYS_CORE_99X!';
  const STAFF_PASSWORD = 'K4yn3#S1lv3r';
  const KEY_SESSION    = 'glitch_staff_session';

  /* ── JSONBIN CONFIG ── */
  const BIN_ID  = '6a285c38f5f4af5e29d39a84';
  const API_KEY = '$2a$10$Acovl/Avg5lkOB/dMuocD.Lh8EhZF1HrTK6P.YfHC4NXB0yGp3rbe';
  const BIN_URL = 'https://api.jsonbin.io/v3/b/' + BIN_ID;

  /* ── CACHE IN-MEMORY ── */
  let DB = { news: [], tickets: [], leaderboard: [], users: [] };

  async function fetchDB() {
    try {
      const res  = await fetch(BIN_URL + '/latest', {
        headers: { 'X-Master-Key': API_KEY }
      });
      const data = await res.json();
      if (data && data.record) DB = data.record;
    } catch (e) { /* usa cache locale */ }
    return DB;
  }

  async function saveDB() {
    try {
      await fetch(BIN_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY
        },
        body: JSON.stringify(DB)
      });
    } catch (e) { /* silenzioso */ }
  }

  /* ── HELPERS SINCRONI (leggono dalla cache) ── */
  function getUsers()       { return DB.users       || []; }
  function getTickets()     { return DB.tickets     || []; }
  function getNews()        { return DB.news        || []; }
  function getLeaderboard() { return DB.leaderboard || []; }

  /* ── SESSIONE STAFF ── */
  function isStaffLoggedIn() { return sessionStorage.getItem(KEY_SESSION) === 'authenticated'; }
  function setStaffSession()   { sessionStorage.setItem(KEY_SESSION, 'authenticated'); }
  function clearStaffSession() { sessionStorage.removeItem(KEY_SESSION); }

  /* ── LOGIN STAFF (sincrono, credenziali hardcoded) ── */
  function staffLogin(username, password) {
    return username === STAFF_USERNAME && password === STAFF_PASSWORD;
  }

  /* ── REGISTRAZIONE UTENTE ── */
  async function registerUser(username, email, password) {
    await fetchDB();
    const users  = DB.users || [];
    const exists = users.find(u => u.username === username || u.email === email);
    if (exists) return { success: false, message: 'Nome utente o email già esistente.' };
    const newUser = {
      id: Date.now(), username, email, password,
      registeredAt: new Date().toISOString()
    };
    DB.users = [...users, newUser];
    await saveDB();
    return { success: true, user: newUser };
  }

  async function findUser(username, password) {
    await fetchDB();
    return (DB.users || []).find(u => u.username === username && u.password === password) || null;
  }

  /* ── GESTIONE TICKET ── */
  async function createTicket(username, subject, message) {
    await fetchDB();
    const ticket = {
      id: Date.now(), username, subject, status: 'open',
      createdAt: new Date().toISOString(),
      messages: [{ sender: username, role: 'user', text: message, time: new Date().toISOString() }]
    };
    DB.tickets = [...(DB.tickets || []), ticket];
    await saveDB();
    return ticket;
  }

  async function addTicketMessage(ticketId, sender, role, text) {
    await fetchDB();
    const ticket = (DB.tickets || []).find(t => t.id === ticketId);
    if (!ticket) return false;
    ticket.messages.push({ sender, role, text, time: new Date().toISOString() });
    await saveDB();
    return true;
  }

  async function closeTicket(ticketId) {
    await fetchDB();
    const ticket = (DB.tickets || []).find(t => t.id === ticketId);
    if (!ticket) return false;
    ticket.status = 'closed';
    await saveDB();
    return true;
  }

  /* ── CLASSIFICA ── */
  async function updateLeaderboard(username, points) {
    await fetchDB();
    const lb  = DB.leaderboard || [];
    const idx = lb.findIndex(e => e.username === username);
    if (idx > -1) { lb[idx].points = points; }
    else { lb.push({ username, points: parseInt(points, 10) || 0 }); }
    lb.sort((a, b) => b.points - a.points);
    DB.leaderboard = lb;
    await saveDB();
    return lb;
  }

  /* ── NOTIZIE ── */
  async function publishNews(content) {
    await fetchDB();
    const news = DB.news || [];
    news.unshift({ id: Date.now(), content, publishedAt: new Date().toISOString() });
    if (news.length > 20) news.pop();
    DB.news = news;
    await saveDB();
    return news;
  }

  /* ── LOOP RENDER DASHBOARD ── */
  function startDashboardLoop() {
    async function tick() {
      await fetchDB();
      renderUserTable();
      renderTicketPanel();
      renderLeaderboardAdmin();
    }
    tick();
    setInterval(tick, 3000);
  }

  function renderUserTable() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    const users = getUsers();
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="color:var(--text-dim);text-align:center;padding:20px">Nessun utente registrato.</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td style="color:var(--neon-red);letter-spacing:2px;">${u.password}</td>
        <td>${new Date(u.registeredAt).toLocaleString('it-IT')}</td>
      </tr>
    `).join('');
  }

  function buildTicketMessages(messages) {
    return messages.map(m => `
      <div class="chat-msg">
        <span class="msg-${m.role === 'staff' ? 'staff' : 'user'}">[${m.sender}]</span>
        <span class="msg-text"> ${m.text}</span>
        <span style="font-size:0.65rem;color:rgba(180,160,220,0.4);margin-left:8px;">${new Date(m.time).toLocaleTimeString('it-IT')}</span>
      </div>
    `).join('');
  }

  function renderTicketPanel() {
    const container = document.getElementById('tickets-list');
    if (!container) return;
    const tickets = getTickets();

    if (tickets.length === 0) {
      container.innerHTML = '<p style="color:var(--text-dim);font-size:0.8rem;">Nessun ticket aperto.</p>';
      return;
    }

    const currentIds = new Set(tickets.map(t => String(t.id)));
    Array.from(container.querySelectorAll('[id^="ticket-"]')).forEach(el => {
      if (!currentIds.has(el.id.replace('ticket-', ''))) el.remove();
    });

    tickets.forEach(t => {
      let panel = document.getElementById('ticket-' + t.id);

      if (!panel) {
        panel = document.createElement('div');
        panel.className = 'panel';
        panel.style.cssText = 'margin-bottom:16px;padding:16px;';
        panel.id = 'ticket-' + t.id;
        panel.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-family:Orbitron,sans-serif;font-size:0.75rem;letter-spacing:2px;color:var(--neon-blue);">
              #${t.id} — ${t.subject}
            </span>
            <span class="badge ${t.status === 'open' ? 'badge-open' : 'badge-closed'}" data-badge="${t.id}">${t.status === 'open' ? 'APERTO' : 'CHIUSO'}</span>
          </div>
          <div style="font-size:0.78rem;color:var(--text-dim);margin-bottom:12px;">Utente: <strong style="color:#e0d0ff">${t.username}</strong></div>
          <div class="chat-box" id="chat-${t.id}">${buildTicketMessages(t.messages)}</div>
          ${t.status === 'open' ? `
            <div class="admin-input-row" id="reply-row-${t.id}">
              <input type="text" id="reply-${t.id}" placeholder="Scrivi risposta staff..." />
              <button class="btn btn-green" onclick="GLITCH.staffReply(${t.id})">Rispondi</button>
              <button class="btn btn-red" onclick="GLITCH.staffClose(${t.id})">Chiudi</button>
            </div>
          ` : ''}
        `;
        container.appendChild(panel);
      } else {
        const badge = panel.querySelector('[data-badge]');
        if (badge) {
          badge.className = 'badge ' + (t.status === 'open' ? 'badge-open' : 'badge-closed');
          badge.textContent = t.status === 'open' ? 'APERTO' : 'CHIUSO';
        }
        const chatBox = document.getElementById('chat-' + t.id);
        if (chatBox) {
          const newHTML = buildTicketMessages(t.messages);
          if (chatBox.innerHTML !== newHTML) {
            const wasAtBottom = chatBox.scrollTop + chatBox.clientHeight >= chatBox.scrollHeight - 4;
            chatBox.innerHTML = newHTML;
            if (wasAtBottom) chatBox.scrollTop = chatBox.scrollHeight;
          }
        }
        if (t.status === 'closed') {
          const row = document.getElementById('reply-row-' + t.id);
          if (row) row.remove();
        }
      }
    });
  }

  function renderLeaderboardAdmin() {
    const tbody = document.getElementById('lb-admin-tbody');
    if (!tbody) return;
    const lb = getLeaderboard();
    if (lb.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" style="color:var(--text-dim);text-align:center;padding:16px;">Nessuna voce ancora.</td></tr>';
      return;
    }
    tbody.innerHTML = lb.map((e, i) => `
      <tr>
        <td>${i + 1}. ${e.username}</td>
        <td style="color:var(--neon-green);">${e.points}</td>
      </tr>
    `).join('');
  }

  /* ── API PUBBLICA ── */
  async function staffReply(ticketId) {
    const input = document.getElementById('reply-' + ticketId);
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = '';
    await addTicketMessage(ticketId, 'STAFF', 'staff', text);
  }

  async function staffClose(ticketId) {
    if (confirm('Vuoi chiudere questo ticket?')) {
      await closeTicket(ticketId);
    }
  }

  return {
    fetchDB,
    staffLogin,
    registerUser,
    findUser,
    createTicket,
    addTicketMessage,
    closeTicket,
    updateLeaderboard,
    publishNews,
    getNews,
    getLeaderboard,
    getTickets,
    getUsers,
    isStaffLoggedIn,
    setStaffSession,
    clearStaffSession,
    startDashboardLoop,
    staffReply,
    staffClose
  };
})();

window.GLITCH = GLITCH;
