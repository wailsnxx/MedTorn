/* =============================================
   MedTorn — Portal del Metge (MongoDB backend)
   App Logic & Data
   ============================================= */

const API = '/api';

// Identificador del metge logat (num. col·legiat fix per al prototip)
const ME_COLLEGIAT = '080012345';

// ========== ESTAT (s'omple des del backend) ==========
let ME = {
    id: null,
    name: "Dr. Jordi Puig Fernández",
    shortName: "Dr. Puig",
    specialty: "Cardiologia",
    subspecialty: "Cardiologia Intervencionista",
    unit: "Planta 2 — Cardiologia",
    collegiat: ME_COLLEGIAT,
    experience: 14,
    languages: ["Català", "Castellà", "Anglès"],
    competences: [
        { name: "Cateterisme cardíac", level: "Expert" },
        { name: "Ecocardiografia", level: "Expert" },
        { name: "Ecografia avançada", level: "Avançat" },
        { name: "Sedació conscient", level: "Acreditat" },
        { name: "Atenció al pacient crític", level: "Avançat" },
        { name: "Telemedicina", level: "Acreditat" }
    ],
    avatar: "https://ui-avatars.com/api/?name=Jordi+Puig&background=1a5276&color=fff&size=160&rounded=true&bold=true"
};

// Torns del mes carregats des del backend  { "YYYY-MM-DD": "M"|"T"|"N"|"G"|"L"|"B" }
let MY_SHIFTS = {};

// ── Carrega el perfil del metge des del backend ──────────────
async function loadMeFromAPI() {
    try {
        // Usa el metge_id del token JWT (posat per auth-guard.js a window.AUTH)
        const metge_id = window.AUTH && window.AUTH.metge_id;
        if (!metge_id) { console.warn('AUTH.metge_id no disponible'); return; }

        const res = await fetch(`${API}/metges/${metge_id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const metge = await res.json();

        ME.id         = metge.id;
        ME.name       = metge.name;
        ME.shortName  = 'Dr. ' + (metge.name.split(' ').slice(-2, -1)[0] || metge.name);
        ME.specialty  = metge.specialty;
        ME.subspecialty = metge.subspecialty;
        ME.unit       = metge.unit;
        ME.collegiat  = metge.collegiat;
        ME.experience = metge.experience;
        ME.languages  = metge.languages;
        ME.competences = (metge.competenciesDetail || []).map(c => ({ name: c.name, level: c.level }));
        ME.avatar     = metge.avatar;
    } catch (err) {
        console.error('Error carregant perfil del metge:', err);
    }
}

// ── Carrega torns del mes des del backend ────────────────────
async function loadMyShifts(year, month) {
    if (!ME.id) return;
    try {
        const res = await fetch(`${API}/torns/monthly/${ME.id}?year=${year}&month=${month}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        MY_SHIFTS = await res.json();
    } catch (err) {
        console.error('Error carregant torns:', err);
        MY_SHIFTS = {};
    }
}

// ── Carrega casos del metge des del backend ──────────────────
async function loadMyCases() {
    if (!ME.id) return [];
    try {
        const res = await fetch(`${API}/casos?metge_id=${ME.id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('Error carregant casos:', err);
        return [];
    }
}

// ── Carrega notificacions des del backend ─────────────────────
async function loadNotifications() {
    if (!ME.id) return [];
    try {
        const res = await fetch(`${API}/notificacions?metge_id=${ME.id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('Error carregant notificacions:', err);
        return [];
    }
}

// ── Carrega sol·licituds des del backend ─────────────────────
async function loadMyRequests() {
    if (!ME.id) return [];
    try {
        const res = await fetch(`${API}/solicituds?metge_id=${ME.id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('Error carregant sol·licituds:', err);
        return [];
    }
}

// ── Carrega sol·licituds entrants (permutes) ─────────────────
async function loadIncomingRequests() {
    if (!ME.id) return [];
    try {
        const res = await fetch(`${API}/solicituds/entrants/${ME.id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('Error carregant sol·licituds entrants:', err);
        return [];
    }
}

// ── Carrega companys (altres metges) ──────────────────────────
async function loadColleagues() {
    try {
        const res = await fetch(`${API}/metges`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const all = await res.json();
        return all.filter(m => String(m.collegiat) !== ME_COLLEGIAT).slice(0, 8);
    } catch (err) {
        console.error('Error carregant companys:', err);
        return [];
    }
}


// ========== ESTAT LOCAL (s'omple des del backend) ==========
let COLLEAGUES = [];
let MY_CASES   = [];
let NOTIFICATIONS = [];
let MY_REQUESTS = [];
let INCOMING_REQUESTS = [];

// ========== NAVIGATION ==========
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(`section-${section}`).classList.add('active');
    });
});

// ========== NOTIFICATIONS PANEL ==========
document.getElementById('notif-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('notif-panel').classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.notif-panel') && !e.target.closest('.notification-btn')) {
        document.getElementById('notif-panel').classList.remove('open');
    }
});

document.getElementById('notif-mark-all').addEventListener('click', async () => {
    if (ME.id) {
        try {
            await fetch(`${API}/notificacions/llegir-totes/${ME.id}`, { method: 'PATCH' });
        } catch (e) { /* silenci */ }
    }
    NOTIFICATIONS.forEach(n => n.unread = false);
    renderNotifications();
    document.getElementById('notif-badge').style.display = 'none';
    showToast('Totes les notificacions marcades com a llegides');
});

function renderNotifications() {
    const container = document.getElementById('notif-list');
    container.innerHTML = NOTIFICATIONS.map(n => `
        <div class="notif-item ${n.unread ? 'unread' : ''}">
            <div class="notif-icon ${n.type}"><i class="fas ${n.icon}"></i></div>
            <div class="notif-body">
                <div class="notif-title">${n.title}</div>
                <div class="notif-desc">${n.desc}</div>
                <div class="notif-time">${n.time}</div>
            </div>
        </div>
    `).join('');
}

// ========== HOME SECTION ==========
function renderHome() {
    // Today's date
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('today-date').textContent = now.toLocaleDateString('ca-ES', options);

    // Current shift badge
    const hour = now.getHours();
    const badge = document.getElementById('current-shift-badge');
    if (hour >= 7 && hour < 15) {
        badge.textContent = 'Matí (M) — 7:00 a 15:00';
        badge.className = 'torn-badge mati';
    } else if (hour >= 15 && hour < 23) {
        badge.textContent = 'Tarda (T) — 15:00 a 23:00';
        badge.className = 'torn-badge tarda';
    } else {
        badge.textContent = 'Nit (N) — 23:00 a 7:00';
        badge.className = 'torn-badge nit';
    }

    // Colleagues count
    document.getElementById('colleagues-count').textContent = `${COLLEAGUES.length} metges`;

    // Cases count
    document.getElementById('cases-today').textContent = `${MY_CASES.length} casos`;

    // Timeline
    renderTimeline();

    // Cases
    renderCases();

    // Colleagues
    renderColleagues();
}

function renderTimeline() {
    const container = document.getElementById('today-timeline');
    const hour = new Date().getHours();

    const events = [
        { time: "07:00", title: "Inici de torn — Matí", desc: "Check-in i revisió d'incidències", status: hour >= 7 ? "done" : "upcoming" },
        { time: "07:30", title: "Reunió d'equip", desc: "Briefing diari amb l'equip de Cardiologia", status: hour >= 8 ? "done" : (hour >= 7 ? "active" : "upcoming") },
        { time: "09:30", title: "Cateterisme programat", desc: "Pacient #4521 — Hab. 215", status: hour >= 10 ? "done" : (hour >= 9 ? "active" : "upcoming") },
        { time: "11:00", title: "Eco d'urgència", desc: "Pacient #4533 — Urgències Box 3", status: hour >= 12 ? "done" : (hour >= 11 ? "active" : "upcoming") },
        { time: "12:30", title: "Consulta seguiment", desc: "Pacient #4487 — Consulta 8", status: hour >= 13 ? "done" : (hour >= 12 ? "active" : "upcoming") },
        { time: "13:30", title: "Pausa dinar", desc: "", status: hour >= 14 ? "done" : (hour >= 13 ? "active" : "upcoming") },
        { time: "14:30", title: "Documentació i informes", desc: "Actualització de l'historial clínic", status: hour >= 15 ? "done" : (hour >= 14 ? "active" : "upcoming") },
        { time: "15:00", title: "Fi de torn", desc: "Traspàs al torn de tarda", status: hour >= 15 ? "done" : "upcoming" }
    ];

    container.innerHTML = events.map(e => `
        <div class="timeline-item">
            <div class="timeline-dot ${e.status}"></div>
            <div class="timeline-content">
                <div class="timeline-time">${e.time}</div>
                <div class="timeline-title">${e.title}</div>
                ${e.desc ? `<div class="timeline-desc">${e.desc}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function renderCases() {
    const container = document.getElementById('cases-list');
    container.innerHTML = MY_CASES.map(c => `
        <div class="case-item">
            <div class="case-priority ${c.priority}"></div>
            <div class="case-info">
                <div class="case-title">${c.title}</div>
                <div class="case-detail">${c.patient} · ${c.room} · ${c.time}</div>
                <div class="case-detail">${c.detail}</div>
            </div>
            <div class="case-actions">
                <button class="btn btn-primary btn-sm" onclick="showToast('Cas #${c.id} obert')"><i class="fas fa-folder-open"></i></button>
            </div>
        </div>
    `).join('');
}

function renderColleagues() {
    const container = document.getElementById('colleagues-grid');
    container.innerHTML = COLLEAGUES.map(c => `
        <div class="colleague-card">
            <img src="${c.avatar}" alt="${c.name}">
            <div class="colleague-info">
                <div class="colleague-name">${c.name}</div>
                <div class="colleague-role">${c.specialty}</div>
                <div class="colleague-location"><i class="fas fa-map-marker-alt"></i> ${c.unit}</div>
            </div>
            <span class="status-badge ${c.status}" style="font-size:0.65rem;padding:3px 8px;">${c.status === 'en-torn' ? 'En torn' : 'Disponible'}</span>
        </div>
    `).join('');
}

// ========== SCHEDULE SECTION ==========
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function renderSchedule() {
    renderWeekSchedule();
    renderCalendar();
    renderShiftSummary();
    updateMonthLabel();
}

function updateMonthLabel() {
    const months = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
    document.getElementById('month-label').textContent = `${months[currentMonth]} ${currentYear}`;
}

function renderWeekSchedule() {
    const container = document.getElementById('week-schedule');
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);

    const dayNames = ['Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
    const shiftHours = { M: "7:00–15:00", T: "15:00–23:00", N: "23:00–7:00", G: "24h", L: "Lliure", B: "Baixa" };

    let html = '';
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const shift = MY_SHIFTS[key] || 'L';
        const isToday = d.toDateString() === now.toDateString();

        html += `
            <div class="week-day ${isToday ? 'today' : ''}">
                <div class="week-day-name">${dayNames[i]}</div>
                <div class="week-day-date">${d.getDate()}</div>
                <span class="shift-cell ${shift}">${shift}</span>
                <div class="week-day-hours">${shiftHours[shift]}</div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderCalendar() {
    const container = document.getElementById('calendar-grid');
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday start
    const today = new Date();

    const dayHeaders = ['Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
    let html = dayHeaders.map(d => `<div class="cal-header">${d}</div>`).join('');

    // Previous month padding
    const prevMonth = new Date(currentYear, currentMonth, 0);
    for (let i = startDay - 1; i >= 0; i--) {
        const d = prevMonth.getDate() - i;
        html += `<div class="cal-day other-month"><span class="cal-num">${d}</span></div>`;
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const shift = MY_SHIFTS[dateKey] || 'L';
        const isToday = (d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear());

        html += `
            <div class="cal-day ${isToday ? 'today' : ''}">
                <span class="cal-num">${d}</span>
                <span class="cal-shift shift-cell ${shift}" style="font-size:0.65rem;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;">${shift}</span>
            </div>
        `;
    }

    // Next month padding
    const totalCells = startDay + lastDay.getDate();
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
        html += `<div class="cal-day other-month"><span class="cal-num">${d}</span></div>`;
    }

    container.innerHTML = html;
}

function renderShiftSummary() {
    const container = document.getElementById('shift-summary');
    const counts = { M: 0, T: 0, N: 0, G: 0, L: 0 };
    Object.values(MY_SHIFTS).forEach(s => {
        if (counts[s] !== undefined) counts[s]++;
    });

    container.innerHTML = `
        <div class="summary-item mati">
            <span class="summary-count">${counts.M}</span>
            <span class="summary-label">Matins</span>
        </div>
        <div class="summary-item tarda">
            <span class="summary-count">${counts.T}</span>
            <span class="summary-label">Tardes</span>
        </div>
        <div class="summary-item nit">
            <span class="summary-count">${counts.N}</span>
            <span class="summary-label">Nits</span>
        </div>
        <div class="summary-item guardia">
            <span class="summary-count">${counts.G}</span>
            <span class="summary-label">Guàrdies</span>
        </div>
        <div class="summary-item lliure">
            <span class="summary-count">${counts.L}</span>
            <span class="summary-label">Dies lliures</span>
        </div>
    `;
}

document.getElementById('btn-prev-month').addEventListener('click', async () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    await loadMyShifts(currentYear, currentMonth + 1);
    renderSchedule();
});

document.getElementById('btn-next-month').addEventListener('click', async () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    await loadMyShifts(currentYear, currentMonth + 1);
    renderSchedule();
});

// ========== PROFILE SECTION ==========
function renderProfile() {
    const container = document.getElementById('competence-list');
    container.innerHTML = ME.competences.map(c => `
        <div class="competence-item">
            <i class="fas fa-award"></i>
            <span class="competence-name">${c.name}</span>
            <span class="competence-badge">${c.level}</span>
        </div>
    `).join('');
}

// ========== REQUESTS SECTION ==========
function renderRequests() {
    renderMyRequests();
    renderIncomingRequests();
}

function renderMyRequests(filterStatus = '') {
    const container = document.getElementById('requests-list');
    let filtered = [...MY_REQUESTS];
    if (filterStatus) filtered = filtered.filter(r => r.status === filterStatus);

    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);">Cap sol·licitud trobada</div>';
        return;
    }

    const typeClass = { vacances: 'vacances', canvi: 'canvi', permut: 'permut', baixa: 'baixa-req' };

    container.innerHTML = filtered.map(r => `
        <div class="request-item">
            <div class="request-type-icon ${typeClass[r.type] || 'canvi'}">
                <i class="fas ${r.icon}"></i>
            </div>
            <div class="request-info">
                <div class="request-title">${r.title}</div>
                <div class="request-detail">${r.detail}</div>
                <div class="request-date"><i class="fas fa-comment-alt"></i> ${r.comment} · ${r.date}</div>
            </div>
            <span class="request-status ${r.status}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
        </div>
    `).join('');
}

function renderIncomingRequests() {
    const container = document.getElementById('incoming-requests');
    if (INCOMING_REQUESTS.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);">Cap sol·licitud rebuda</div>';
        return;
    }

    container.innerHTML = INCOMING_REQUESTS.map(r => `
        <div class="request-item">
            <img src="${r.avatar}" alt="${r.from}" style="width:42px;height:42px;border-radius:50%;flex-shrink:0;">
            <div class="request-info">
                <div class="request-title">${r.title} — ${r.from}</div>
                <div class="request-detail">${r.detail}</div>
                <div class="request-date">${r.date}</div>
            </div>
            <div class="request-actions-btns">
                <button class="btn btn-success btn-sm" onclick="acceptRequest(${r.id})"><i class="fas fa-check"></i> Acceptar</button>
                <button class="btn btn-danger btn-sm" onclick="rejectRequest(${r.id})"><i class="fas fa-times"></i> Rebutjar</button>
            </div>
        </div>
    `).join('');
}

function acceptRequest(id) {
    const idx = INCOMING_REQUESTS.findIndex(r => String(r.id) === String(id));
    if (idx > -1) {
        const req = INCOMING_REQUESTS[idx];
        fetch(`${API}/solicituds/${id}/estat`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estat: 'APROVADA' })
        }).catch(e => console.error('Error actualitzant sol·licitud:', e));
        INCOMING_REQUESTS.splice(idx, 1);
        renderIncomingRequests();
        showToast(`Permuta amb ${req.from} acceptada!`);
    }
}

function rejectRequest(id) {
    const idx = INCOMING_REQUESTS.findIndex(r => String(r.id) === String(id));
    if (idx > -1) {
        const req = INCOMING_REQUESTS[idx];
        fetch(`${API}/solicituds/${id}/estat`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estat: 'REBUTJADA' })
        }).catch(e => console.error('Error actualitzant sol·licitud:', e));
        INCOMING_REQUESTS.splice(idx, 1);
        renderIncomingRequests();
        showToast(`Permuta amb ${req.from} rebutjada`, 'error');
    }
}

// Filter requests
document.getElementById('filter-request-status').addEventListener('change', (e) => {
    renderMyRequests(e.target.value);
});

// New request form toggle
document.getElementById('btn-new-request').addEventListener('click', () => {
    document.getElementById('request-form-card').style.display = 'block';
    document.getElementById('request-form-card').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('btn-cancel-request').addEventListener('click', () => {
    document.getElementById('request-form-card').style.display = 'none';
});

document.getElementById('btn-submit-request').addEventListener('click', async () => {
    const type    = document.getElementById('request-type').value;
    const date    = document.getElementById('request-date').value;
    const shift   = document.getElementById('request-shift').value;
    const comment = document.getElementById('request-comment').value;

    if (!date) {
        showToast('Si us plau, selecciona una data', 'error');
        return;
    }

    // Convertir tipus frontend → tipus DB
    const TIPUS_DB = {
        'canvi-torn': 'CANVI_TORN',
        'permut':     'PERMUTA',
        'baixa':      'BAIXA',
        'vacances':   'VACANCES',
        'altres':     'ALTRES'
    };
    const SHIFT_DB = {
        'M': 'MATI', 'T': 'TARDA', 'N': 'NIT', 'G': 'GUARDIA', 'L': 'LLIURE', 'B': 'BAIXA'
    };

    try {
        const res = await fetch(`${API}/solicituds`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipus:               TIPUS_DB[type] || 'ALTRES',
                dataInici:           date,
                tornAfectat:         SHIFT_DB[shift] || 'MATI',
                motiu:               comment || '',
                metge_solicitant_id: ME.id
            })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Recarregar llista des del backend
        MY_REQUESTS = await loadMyRequests();
        renderMyRequests();
        document.getElementById('request-form-card').style.display = 'none';
        document.getElementById('request-date').value = '';
        document.getElementById('request-comment').value = '';
        showToast('Sol·licitud enviada correctament!');
    } catch (err) {
        console.error('Error enviant sol·licitud:', err);
        showToast("Error enviant la sol·licitud", 'error');
    }
});

// ========== STATUS CHANGE ==========
document.getElementById('my-status-select').addEventListener('change', async (e) => {
    const statusLabels = {
        'disponible': 'Disponible',
        'en-torn': 'En torn',
        'ocupat': 'Ocupat',
        'pausa': 'En pausa'
    };
    const STATUS_DB = {
        'disponible': 'DISPONIBLE',
        'en-torn':    'EN_TORN',
        'ocupat':     'OCUPAT',
        'pausa':      'PAUSA'
    };
    const val = e.target.value;
    try {
        const res = await fetch(`${API}/metges/${ME.id}/estat`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estat: STATUS_DB[val] })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showToast(`Estat actualitzat a: ${statusLabels[val]}`);
    } catch (err) {
        console.error('Error actualitzant estat:', err);
        showToast('Error actualitzant l\'estat', 'error');
    }
});

// ========== TOAST ==========
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}" style="color:${type === 'success' ? 'var(--green)' : 'var(--red)'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== INIT ==========
async function init() {
    // 1. Carregar dades del metge logat
    await loadMeFromAPI();

    // 2. Actualitzar avatar i nom al header si ha canviat
    if (ME.id) {
        const headerImg = document.querySelector('.user-avatar img');
        const headerName = document.querySelector('.user-name');
        const headerRole = document.querySelector('.user-role');
        if (headerImg)  headerImg.src = ME.avatar;
        if (headerName) headerName.textContent = ME.name;
        if (headerRole) headerRole.textContent = ME.specialty;
    }

    // 3. Carregar dades en paral·lel
    const now = new Date();
    const [notifs, cases, colleagues, myReqs, inReqs] = await Promise.all([
        loadNotifications(),
        loadMyCases(),
        loadColleagues(),
        loadMyRequests(),
        loadIncomingRequests(),
        loadMyShifts(now.getFullYear(), now.getMonth() + 1)
    ]);

    NOTIFICATIONS    = notifs;
    MY_CASES         = cases;
    COLLEAGUES       = colleagues;
    MY_REQUESTS      = myReqs;
    INCOMING_REQUESTS = inReqs;

    // 4. Actualitzar badge de notificacions
    const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;
    const badge = document.getElementById('notif-badge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? '' : 'none';
    }

    // 5. Renderitzar
    renderNotifications();
    renderHome();
    renderSchedule();
    renderProfile();
    renderRequests();
}

document.addEventListener('DOMContentLoaded', init);
