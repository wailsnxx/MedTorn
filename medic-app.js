/* =============================================
   MedTorn — Portal del Metge  
   App Logic & Data
   ============================================= */

// ========== CURRENT DOCTOR (logged in) ==========
const ME = {
    id: 2,
    name: "Dr. Jordi Puig Fernández",
    shortName: "Dr. Puig",
    specialty: "Cardiologia",
    subspecialty: "Cardiologia Intervencionista",
    unit: "Planta 2 — Cardiologia",
    collegiat: "080012345",
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

// Monthly shifts for the logged-in doctor (28+ days)
const MY_SHIFTS = generateMonthlyShifts();

function generateMonthlyShifts() {
    const shifts = {};
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const patterns = ["M", "M", "T", "T", "N", "L", "L"]; // rotation pattern
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dayOfWeek = date.getDay();
        let shift;
        if (dayOfWeek === 0) shift = "L"; // Sundays mostly off
        else if (d % 7 === 0) shift = "G"; // occasional guard
        else shift = patterns[(d - 1) % patterns.length];

        // Override today to be M (morning)
        if (d === now.getDate()) shift = "M";

        shifts[`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`] = shift;
    }
    return shifts;
}

// ========== COLLEAGUES ==========
const COLLEAGUES = [
    { name: "Dra. Marta Vidal", specialty: "Cardiologia", unit: "Planta 2", status: "en-torn", avatar: "https://ui-avatars.com/api/?name=Marta+Vidal&background=2980b9&color=fff&size=80&rounded=true&bold=true" },
    { name: "Dr. Pere Martí", specialty: "Medicina Interna", unit: "Planta 1", status: "en-torn", avatar: "https://ui-avatars.com/api/?name=Pere+Marti&background=1a5276&color=fff&size=80&rounded=true&bold=true" },
    { name: "Dra. Laia Soler", specialty: "Urgències", unit: "Urgències", status: "disponible", avatar: "https://ui-avatars.com/api/?name=Laia+Soler&background=2980b9&color=fff&size=80&rounded=true&bold=true" },
    { name: "Dr. Marc Roca", specialty: "Cirurgia General", unit: "Quiròfan 1", status: "en-torn", avatar: "https://ui-avatars.com/api/?name=Marc+Roca&background=1a5276&color=fff&size=80&rounded=true&bold=true" },
    { name: "Dra. Clara Bosch", specialty: "Anestesiologia", unit: "Quiròfan 2", status: "en-torn", avatar: "https://ui-avatars.com/api/?name=Clara+Bosch&background=2980b9&color=fff&size=80&rounded=true&bold=true" },
    { name: "Dr. Àlex Fernández", specialty: "Neurologia", unit: "Planta 3", status: "disponible", avatar: "https://ui-avatars.com/api/?name=Alex+Fernandez&background=1a5276&color=fff&size=80&rounded=true&bold=true" },
    { name: "Dra. Núria Castelló", specialty: "Pediatria", unit: "Neonatologia", status: "en-torn", avatar: "https://ui-avatars.com/api/?name=Nuria+Castello&background=2980b9&color=fff&size=80&rounded=true&bold=true" },
    { name: "Dr. David Romero", specialty: "Traumatologia", unit: "Urgències", status: "disponible", avatar: "https://ui-avatars.com/api/?name=David+Romero&background=1a5276&color=fff&size=80&rounded=true&bold=true" }
];

// ========== ASSIGNED CASES ==========
const MY_CASES = [
    { id: 1, title: "Cateterisme cardíac programat", patient: "Pacient #4521", room: "Hab. 215", priority: "mitja", time: "09:30", detail: "Pacient de 67 anys. Control post-stent." },
    { id: 2, title: "Ecocardiografia d'urgència", patient: "Pacient #4533", room: "Urgències Box 3", priority: "alta", time: "11:00", detail: "Dolor toràcic agut. Descartar SCA." },
    { id: 3, title: "Consulta seguiment", patient: "Pacient #4487", room: "Consulta 8", priority: "baixa", time: "12:30", detail: "Revisió trimestral. Insuficiència cardíaca estable." }
];

// ========== NOTIFICATIONS ==========
const NOTIFICATIONS = [
    { id: 1, type: "warning", icon: "fa-exchange-alt", title: "Sol·licitud de permuta", desc: "Dra. Marta Vidal vol permutar el torn de dijous (T) pel teu torn de divendres (M).", time: "Fa 20 min", unread: true },
    { id: 2, type: "info", icon: "fa-calendar-check", title: "Torn confirmat", desc: "El teu torn de demà ha estat confirmat: Tarda (15:00–23:00)", time: "Fa 1 hora", unread: true },
    { id: 3, type: "success", icon: "fa-check-circle", title: "Sol·licitud aprovada", desc: "La teva sol·licitud de vacances (15-20 març) ha estat aprovada.", time: "Fa 3 hores", unread: true },
    { id: 4, type: "danger", icon: "fa-exclamation-triangle", title: "Alerta d'urgència", desc: "S'ha activat el protocol d'urgència a Planta 2. Consulta el cap de torn.", time: "Fa 5 hores", unread: true },
    { id: 5, type: "info", icon: "fa-user-plus", title: "Cas assignat", desc: "T'han assignat un nou cas: Ecocardiografia d'urgència (Pacient #4533)", time: "Ahir", unread: false },
    { id: 6, type: "success", icon: "fa-graduation-cap", title: "Formació disponible", desc: "Nou curs disponible: Actualització en Fibril·lació Auricular 2026", time: "Fa 2 dies", unread: false }
];

// ========== MY REQUESTS ==========
const MY_REQUESTS = [
    { id: 1, type: "vacances", icon: "fa-umbrella-beach", title: "Sol·licitud de vacances", detail: "15 – 20 de març 2026", comment: "Vacances familiars programades", date: "10 feb 2026", status: "aprovada" },
    { id: 2, type: "canvi", icon: "fa-exchange-alt", title: "Canvi de torn", detail: "Dimarts 4 març: Matí → Tarda", comment: "Visita mèdica personal al matí", date: "20 feb 2026", status: "pendent" },
    { id: 3, type: "permut", icon: "fa-people-arrows", title: "Permuta amb Dra. Vidal", detail: "Dilluns 10 març: intercanvi M ↔ T", comment: "Acord mutu per conciliació", date: "22 feb 2026", status: "pendent" }
];

const INCOMING_REQUESTS = [
    { id: 101, from: "Dra. Marta Vidal", type: "permut", icon: "fa-people-arrows", title: "Permuta de torn", detail: "Dijous 27 feb: El seu T per el teu M", date: "Fa 20 min", avatar: "https://ui-avatars.com/api/?name=Marta+Vidal&background=2980b9&color=fff&size=40&rounded=true&bold=true" },
    { id: 102, from: "Dr. David Romero", type: "permut", icon: "fa-people-arrows", title: "Permuta de guàrdia", detail: "Dissabte 1 març: La seva G per la teva del 8 març", date: "Ahir", avatar: "https://ui-avatars.com/api/?name=David+Romero&background=1a5276&color=fff&size=40&rounded=true&bold=true" }
];

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

document.getElementById('notif-mark-all').addEventListener('click', () => {
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

document.getElementById('btn-prev-month').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderSchedule();
});

document.getElementById('btn-next-month').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
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
    const idx = INCOMING_REQUESTS.findIndex(r => r.id === id);
    if (idx > -1) {
        const req = INCOMING_REQUESTS[idx];
        INCOMING_REQUESTS.splice(idx, 1);
        renderIncomingRequests();
        showToast(`Permuta amb ${req.from} acceptada!`);
    }
}

function rejectRequest(id) {
    const idx = INCOMING_REQUESTS.findIndex(r => r.id === id);
    if (idx > -1) {
        const req = INCOMING_REQUESTS[idx];
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

document.getElementById('btn-submit-request').addEventListener('click', () => {
    const type = document.getElementById('request-type').value;
    const date = document.getElementById('request-date').value;
    const shift = document.getElementById('request-shift').value;
    const comment = document.getElementById('request-comment').value;

    if (!date) {
        showToast('Si us plau, selecciona una data', 'error');
        return;
    }

    const typeNames = {
        'canvi-torn': 'Canvi de torn',
        'permut': 'Permuta amb company',
        'baixa': 'Comunicar baixa',
        'vacances': 'Sol·licitar vacances',
        'altres': 'Altres'
    };

    const typeIcons = {
        'canvi-torn': 'fa-exchange-alt',
        'permut': 'fa-people-arrows',
        'baixa': 'fa-user-minus',
        'vacances': 'fa-umbrella-beach',
        'altres': 'fa-file-alt'
    };

    const typeClasses = {
        'canvi-torn': 'canvi',
        'permut': 'permut',
        'baixa': 'baixa',
        'vacances': 'vacances',
        'altres': 'canvi'
    };

    MY_REQUESTS.unshift({
        id: Date.now(),
        type: typeClasses[type] || 'canvi',
        icon: typeIcons[type] || 'fa-file-alt',
        title: typeNames[type] || type,
        detail: `${date} — Torn ${shift}`,
        comment: comment || 'Sense comentari',
        date: 'Ara mateix',
        status: 'pendent'
    });

    renderMyRequests();
    document.getElementById('request-form-card').style.display = 'none';
    document.getElementById('request-date').value = '';
    document.getElementById('request-comment').value = '';
    showToast('Sol·licitud enviada correctament!');
});

// ========== STATUS CHANGE ==========
document.getElementById('my-status-select').addEventListener('change', (e) => {
    const statusLabels = {
        'disponible': 'Disponible',
        'en-torn': 'En torn',
        'ocupat': 'Ocupat',
        'pausa': 'En pausa'
    };
    showToast(`Estat actualitzat a: ${statusLabels[e.target.value]}`);
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
function init() {
    renderNotifications();
    renderHome();
    renderSchedule();
    renderProfile();
    renderRequests();
}

document.addEventListener('DOMContentLoaded', init);
