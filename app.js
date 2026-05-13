/* =============================================
   MedTorn — App Logic (MongoDB backend)
   Hospital General de Granollers
   ============================================= */

const API = '/api';

// ========== STATIC LISTS (per als selects de filtres) ==========
const SPECIALTIES = [
    "Medicina Interna", "Cirurgia General", "Pediatria", "Ginecologia i Obstetrícia",
    "Traumatologia", "Cardiologia", "Neurologia", "Urologia", "Anestesiologia",
    "Medicina d'Urgències", "Pneumologia", "Dermatologia", "Oncologia",
    "Nefrologia", "Psiquiatria", "Radiologia"
];

const SUBSPECIALTIES = [
    "Cirurgia laparoscòpica", "Cardiologia intervencionista", "Neonatologia",
    "Embaràs d'alt risc", "Cirurgia artroscòpica", "Neuroradiologia",
    "Cures pal·liatives", "UCI pediàtrica", "Hemodinàmica", "Electrofisiologia"
];

const COMPETENCES = [
    "Ecografia avançada", "Ventilació mecànica", "Intubació difícil",
    "Cirurgia mínimament invasiva", "Reanimació neonatal", "Drenatge toràcic",
    "Cateterisme cardíac", "Punció lumbar", "Sedació conscient",
    "Telemedicina", "Gestió de politraumatismes", "Sutura avançada",
    "Ecocardiografia", "Broncoscòpia", "Endoscòpia digestiva",
    "Radiologia intervencionista", "Atenció al pacient crític"
];

const UNITS = [
    "Urgències", "Planta 1", "Planta 2", "Planta 3", "UCI",
    "Quiròfan 1", "Quiròfan 2", "Consultes Externes", "Neonatologia",
    "Maternitat", "Hospital de Dia"
];

const LANGUAGES = ["Català", "Castellà", "Anglès", "Francès", "Àrab", "Xinès"];

// ========== API STATE ==========
let doctors = [];
let currentWeekOffset = 0;
let liveRefreshTimer = null;

// ── Carrega tots els metges des del backend ──────────────────
async function loadDoctors() {
    try {
        const res = await fetch(`${API}/metges`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        doctors = await res.json();
    } catch (err) {
        console.error('Error carregant metges:', err);
        showToast('Error connectant amb el servidor', 'error');
        doctors = [];
    }
}

// ── Carrega estadístiques del dashboard ──────────────────────
async function loadStats() {
    try {
        const res = await fetch(`${API}/metges/stats`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('Error carregant estadístiques:', err);
        return { disponibles: 0, enTorn: 0, baixa: 0, reemplacaments: 0 };
    }
}

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

// ========== DASHBOARD ==========
async function updateDashboardStats() {
    const stats = await loadStats();
    animateCounter('stat-disponibles', stats.disponibles);
    animateCounter('stat-en-torn', stats.enTorn);
    animateCounter('stat-baixa', stats.baixa);
    animateCounter('stat-reemplacaments', stats.reemplacaments);
}

function animateCounter(id, target) {
    const el = document.getElementById(id);
    let current = 0;
    const step = Math.ceil(target / 20);
    const interval = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        el.textContent = current;
    }, 30);
}

function getCurrentShiftLabel() {
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 15) return 'Matí';
    if (hour >= 15 && hour < 23) return 'Tarda';
    return 'Nit';
}

function renderShiftOverview() {
    const container = document.getElementById('shift-overview');
    const label = document.getElementById('torn-actual-label');
    label.textContent = getCurrentShiftLabel();

    const onShift = doctors.filter(d => d.status === 'en-torn' || d.status === 'disponible');
    container.innerHTML = onShift.map(d => `
        <div class="shift-overview-card" data-id="${d.id}">
            <img class="avatar-sm" src="${d.avatar}" alt="${d.name}">
            <div class="so-info">
                <div class="so-name">${d.name}</div>
                <div class="so-detail">${d.specialty}</div>
                <div class="so-location"><i class="fas fa-map-marker-alt"></i> ${d.unit}</div>
            </div>
            <span class="status-badge ${d.status}">${formatStatus(d.status)}</span>
        </div>
    `).join('');

    container.querySelectorAll('.shift-overview-card').forEach(card => {
        card.addEventListener('click', () => openDoctorModal(card.dataset.id));
    });
}

function renderAlerts() {
    const container = document.getElementById('alert-list');
    const baixaDoctors = doctors.filter(d => d.status === 'baixa');
    const enTornDoctors = doctors.filter(d => d.status === 'en-torn');
    const shiftLabel = getCurrentShiftLabel();
    const alerts = [
        {
            type: 'critical',
            icon: 'fa-exclamation-circle',
            title: `${baixaDoctors.length} metge(s) de baixa avui`,
            desc: baixaDoctors.map(d => d.name).join(', ') || 'Cap',
            time: `Actualitzat ${new Date().toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}`
        },
        {
            type: enTornDoctors.length < 3 ? 'warning' : 'info',
            icon: 'fa-user-clock',
            title: `${enTornDoctors.length} metge(s) en torn actiu (${shiftLabel})`,
            desc: enTornDoctors.slice(0, 3).map(d => d.name).join(', ') || 'Sense cobertura activa',
            time: 'Temps real'
        },
        {
            type: 'info',
            icon: 'fa-info-circle',
            title: `Cobertura total: ${doctors.length} professionals`,
            desc: `Disponibles/actius: ${doctors.filter(d => d.status !== 'baixa').length}`,
            time: 'Sincronitzat'
        },
        {
            type: 'warning',
            icon: 'fa-sync-alt',
            title: 'Monitorització automàtica activa',
            desc: 'El panell es refresca cada 30 segons sense recarregar',
            time: 'Live'
        }
    ];

    container.innerHTML = alerts.map(a => `
        <div class="alert-item ${a.type}">
            <i class="fas ${a.icon}"></i>
            <div class="alert-text">
                <div class="alert-title">${a.title}</div>
                <div class="alert-desc">${a.desc}</div>
            </div>
            <span class="alert-time">${a.time}</span>
        </div>
    `).join('');
}

// ========== QUICK SEARCH ==========
document.getElementById('quick-search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    renderQuickResults(query);
});

document.querySelectorAll('.quick-filters .chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.quick-filters .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.dataset.filter;
        renderQuickResults(document.getElementById('quick-search').value.toLowerCase(), filter);
    });
});

function renderQuickResults(query = '', filterType = 'tots') {
    const container = document.getElementById('quick-results');
    let filtered = [...doctors];

    if (query) {
        filtered = filtered.filter(d =>
            d.name.toLowerCase().includes(query) ||
            d.specialty.toLowerCase().includes(query) ||
            d.competences.some(c => c.toLowerCase().includes(query)) ||
            d.unit.toLowerCase().includes(query)
        );
    }

    if (filterType === 'disponible') filtered = filtered.filter(d => d.status === 'disponible');
    else if (filterType === 'en-torn') filtered = filtered.filter(d => d.status === 'en-torn');
    else if (filterType === 'urgencies') filtered = filtered.filter(d => d.unit === 'Urgències');
    else if (filterType === 'quirofan') filtered = filtered.filter(d => d.unit.startsWith('Quiròfan'));

    const results = filtered.slice(0, 8);
    container.innerHTML = results.map(d => `
        <div class="quick-result-item" data-id="${d.id}">
            <img class="avatar-sm" src="${d.avatar}" alt="${d.name}">
            <div class="qr-info">
                <div class="qr-name">${d.name}</div>
                <div class="qr-detail">${d.specialty} · ${d.unit}</div>
            </div>
            <span class="status-badge ${d.status}">${formatStatus(d.status)}</span>
        </div>
    `).join('');

    if (results.length === 0 && query) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Cap resultat trobat</div>';
    }

    container.querySelectorAll('.quick-result-item').forEach(item => {
        item.addEventListener('click', () => openDoctorModal(item.dataset.id));
    });
}

// ========== DOCTORS DIRECTORY ==========
function populateFilters() {
    const specSelect = document.getElementById('filter-specialty');
    const subSpecSelect = document.getElementById('filter-subspecialty');
    const compSelect = document.getElementById('filter-competence');
    const unitSelect = document.getElementById('filter-unit');
    const sugSpec = document.getElementById('sug-specialty');
    const sugComp = document.getElementById('sug-competence');

    SPECIALTIES.forEach(s => {
        specSelect.innerHTML += `<option value="${s}">${s}</option>`;
        sugSpec.innerHTML += `<option value="${s}">${s}</option>`;
    });
    SUBSPECIALTIES.forEach(s => {
        subSpecSelect.innerHTML += `<option value="${s}">${s}</option>`;
    });
    COMPETENCES.forEach(c => {
        compSelect.innerHTML += `<option value="${c}">${c}</option>`;
        sugComp.innerHTML += `<option value="${c}">${c}</option>`;
    });
    UNITS.forEach(u => {
        unitSelect.innerHTML += `<option value="${u}">${u}</option>`;
    });
}

function getFilteredDoctors() {
    let filtered = [...doctors];

    const spec = document.getElementById('filter-specialty').value;
    const subSpec = document.getElementById('filter-subspecialty').value;
    const comp = document.getElementById('filter-competence').value;
    const unit = document.getElementById('filter-unit').value;
    const avail = document.getElementById('filter-availability').value;
    const lang = document.getElementById('filter-language').value;

    if (spec) filtered = filtered.filter(d => d.specialty === spec);
    if (subSpec) filtered = filtered.filter(d => d.subspecialty === subSpec);
    if (comp) filtered = filtered.filter(d => d.competences.includes(comp));
    if (unit) filtered = filtered.filter(d => d.unit === unit);
    if (avail) filtered = filtered.filter(d => d.status === avail);
    if (lang) filtered = filtered.filter(d => d.languages.includes(lang));

    return filtered;
}

function renderDoctorsGrid() {
    const container = document.getElementById('doctors-grid');
    const filtered = getFilteredDoctors();
    document.getElementById('results-count').textContent = `${filtered.length} metge${filtered.length !== 1 ? 's' : ''} trobat${filtered.length !== 1 ? 's' : ''}`;

    container.innerHTML = filtered.map(d => `
        <div class="doctor-card" data-id="${d.id}">
            <div class="doctor-card-top">
                <img src="${d.avatar}" alt="${d.name}">
                <div class="dc-info">
                    <div class="dc-name">${d.name}</div>
                    <div class="dc-specialty">${d.specialty}</div>
                </div>
                <span class="status-badge ${d.status}">${formatStatus(d.status)}</span>
            </div>
            <div class="dc-details">
                <div class="dc-detail-row"><i class="fas fa-building"></i> ${d.unit}</div>
                <div class="dc-detail-row"><i class="fas fa-clock"></i> ${d.experience} anys d'experiència</div>
                <div class="dc-detail-row"><i class="fas fa-language"></i> ${d.languages.join(', ')}</div>
            </div>
            <div class="dc-tags">
                ${d.competences.slice(0, 3).map(c => `<span class="dc-tag">${c}</span>`).join('')}
                ${d.competences.length > 3 ? `<span class="dc-tag">+${d.competences.length - 3}</span>` : ''}
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.doctor-card').forEach(card => {
        card.addEventListener('click', () => openDoctorModal(card.dataset.id));
    });
}

// Filter event listeners
['filter-specialty', 'filter-subspecialty', 'filter-competence', 'filter-unit', 'filter-availability', 'filter-language'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderDoctorsGrid);
});

document.getElementById('btn-clear-filters').addEventListener('click', () => {
    ['filter-specialty', 'filter-subspecialty', 'filter-competence', 'filter-unit', 'filter-availability', 'filter-language'].forEach(id => {
        document.getElementById(id).value = '';
    });
    renderDoctorsGrid();
});

// View toggle
document.getElementById('view-grid').addEventListener('click', () => {
    document.getElementById('doctors-grid').classList.remove('list-view');
    document.getElementById('view-grid').classList.add('active');
    document.getElementById('view-list').classList.remove('active');
});

document.getElementById('view-list').addEventListener('click', () => {
    document.getElementById('doctors-grid').classList.add('list-view');
    document.getElementById('view-list').classList.add('active');
    document.getElementById('view-grid').classList.remove('active');
});

// ========== SHIFT TABLE ==========
function getWeekDates(offset = 0) {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d);
    }
    return dates;
}

function formatDateShort(date) {
    return date.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' });
}

function renderShiftTable() {
    const tbody = document.getElementById('shift-table-body');
    const weekLabel = document.getElementById('week-label');
    const dates = getWeekDates(currentWeekOffset);

    weekLabel.textContent = `${formatDateShort(dates[0])} — ${formatDateShort(dates[6])}`;

    // Update header dates
    const thCells = document.querySelectorAll('.shift-table thead th');
    const dayNames = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];
    for (let i = 1; i <= 7; i++) {
        thCells[i].innerHTML = `${dayNames[i - 1]}<br><small>${formatDateShort(dates[i - 1])}</small>`;
    }

    tbody.innerHTML = doctors.map(d => {
        const shiftCells = d.shifts.map(s => `<td><span class="shift-cell ${s}">${s}</span></td>`).join('');
        return `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <img src="${d.avatar}" style="width:28px;height:28px;border-radius:50%;" alt="">
                        <span>${d.name}</span>
                    </div>
                </td>
                ${shiftCells}
            </tr>
        `;
    }).join('');
}

document.getElementById('btn-prev-week').addEventListener('click', () => {
    currentWeekOffset--;
    renderShiftTable();
});

document.getElementById('btn-next-week').addEventListener('click', () => {
    currentWeekOffset++;
    renderShiftTable();
});

// ========== SUGGESTIONS ==========
document.getElementById('btn-suggest').addEventListener('click', () => {
    const spec = document.getElementById('sug-specialty').value;
    const comp = document.getElementById('sug-competence').value;
    const urgency = document.getElementById('sug-urgency').value;

    let candidates = doctors.filter(d => d.status === 'disponible' || d.status === 'en-torn');

    if (spec) {
        candidates = candidates.map(d => ({
            ...d,
            matchScore: (d.specialty === spec ? 40 : 0)
                + (d.competences.includes(comp) ? 30 : 0)
                + (d.status === 'disponible' ? 20 : 5)
                + Math.min(d.experience, 10)
        }));
    } else {
        candidates = candidates.map(d => ({
            ...d,
            matchScore: (d.competences.includes(comp) ? 40 : 0)
                + (d.status === 'disponible' ? 30 : 10)
                + Math.min(d.experience, 10)
        }));
    }

    candidates.sort((a, b) => b.matchScore - a.matchScore);
    const top = candidates.slice(0, 5);

    const container = document.getElementById('suggestions-results');
    if (top.length === 0) {
        container.innerHTML = '<div class="card"><div class="card-body" style="text-align:center;color:var(--text-muted);padding:40px;">Cap metge disponible amb els criteris seleccionats.</div></div>';
        return;
    }

    const maxScore = top[0].matchScore || 1;
    container.innerHTML = top.map((d, i) => {
        const pct = Math.round((d.matchScore / maxScore) * 100);
        return `
            <div class="suggestion-result-card rank-${i + 1}">
                <div class="rank-badge">#${i + 1}</div>
                <img src="${d.avatar}" style="width:52px;height:52px;border-radius:50%;" alt="${d.name}">
                <div class="sug-info">
                    <div class="sug-name">${d.name}</div>
                    <div class="sug-details">${d.specialty} · ${d.unit} · ${d.experience} anys exp. · ${formatStatus(d.status)}</div>
                    <div class="sug-details" style="margin-top:4px;">${d.competences.join(', ')}</div>
                </div>
                <div class="sug-match">
                    <div class="match-bar"><div class="match-fill" style="width:${pct}%"></div></div>
                    <span class="match-text">${pct}%</span>
                </div>
                <div class="sug-actions">
                    <button class="btn btn-primary btn-sm" onclick="showToast('Notificació enviada a ${d.name}')"><i class="fas fa-paper-plane"></i></button>
                    <button class="btn btn-success btn-sm" onclick="showToast('${d.name} assignat/da al cas')"><i class="fas fa-user-plus"></i></button>
                </div>
            </div>
        `;
    }).join('');
});

// ========== DOCTOR MODAL ==========
let activeDoctorId = null;

function openDoctorModal(id) {
    const d = doctors.find(doc => String(doc.id) === String(id));
    if (!d) return;
    activeDoctorId = d.id;

    document.getElementById('modal-name').textContent = d.name;
    document.getElementById('modal-specialty').textContent = `${d.specialty} — ${d.subspecialty}`;
    document.getElementById('modal-status').textContent = formatStatus(d.status);
    document.getElementById('modal-status').className = `status-badge ${d.status}`;
    document.getElementById('modal-collegiat').textContent = d.collegiat;
    document.getElementById('modal-experience').textContent = `${d.experience} anys`;
    document.getElementById('modal-unit').textContent = d.unit;
    document.getElementById('modal-languages').textContent = d.languages.join(', ');
    document.getElementById('modal-avatar').innerHTML = `<img src="${d.avatar}" alt="${d.name}">`;

    document.getElementById('modal-competences').innerHTML = d.competences
        .map(c => `<span class="tag">${c}</span>`).join('');

    const shiftLabels = { M: 'Matí', T: 'Tarda', N: 'Nit', G: 'Guàrdia', L: 'Lliure', B: 'Baixa' };
    const dayLabels = ['Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
    document.getElementById('modal-shift-info').innerHTML = `
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${d.shifts.map((s, i) => `
                <div style="text-align:center;">
                    <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">${dayLabels[i]}</div>
                    <span class="shift-cell ${s}">${s}</span>
                </div>
            `).join('')}
        </div>
        <p style="margin-top:10px;font-size:0.82rem;color:var(--text-light);">
            Torn principal: <strong>${shiftLabels[d.shifts.find(s => s !== 'L' && s !== 'B') || 'M']}</strong>
        </p>
    `;

    document.getElementById('modal-overlay').classList.add('open');
}

document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.remove('open');
});

document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('modal-overlay').classList.remove('open');
    }
});

// Botons d'acció del modal del metge
document.querySelector('#modal-overlay .modal-actions .btn-primary').addEventListener('click', () => {
    const d = doctors.find(doc => String(doc.id) === String(activeDoctorId));
    document.getElementById('modal-overlay').classList.remove('open');
    document.getElementById('modal-notif-doctor-name').textContent = d ? d.name : '';
    document.getElementById('modal-notif-overlay').classList.add('open');
});

document.querySelector('#modal-overlay .modal-actions .btn-success').addEventListener('click', () => {
    const d = doctors.find(doc => String(doc.id) === String(activeDoctorId));
    document.getElementById('modal-overlay').classList.remove('open');
    document.getElementById('modal-cas-doctor-name').textContent = d ? d.name : '';
    document.getElementById('modal-cas-overlay').classList.add('open');
    document.getElementById('cas-hora').value = new Date().toTimeString().slice(0, 5);
});

document.querySelector('#modal-overlay .modal-actions .btn-outline').addEventListener('click', () => {
    const d = doctors.find(doc => String(doc.id) === String(activeDoctorId));
    document.getElementById('modal-overlay').classList.remove('open');
    document.getElementById('modal-torn-doctor-name').textContent = d ? d.name : '';
    document.getElementById('modal-torn-overlay').classList.add('open');
    document.getElementById('torn-data').value = new Date().toISOString().split('T')[0];
    if (d) document.getElementById('torn-unitat').value = d.unit || '';
    document.getElementById('torn-tipus').dispatchEvent(new Event('change'));
});

// Tanca modals d'acció
['notif', 'cas', 'torn'].forEach(name => {
    const overlay = document.getElementById(`modal-${name}-overlay`);
    document.getElementById(`modal-${name}-close`).addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
});

// Auto-omplir hores quan canvia el tipus de torn
const TORN_HORES = {
    MATI:    { inici: '08:00', final: '15:00' },
    TARDA:   { inici: '15:00', final: '22:00' },
    NIT:     { inici: '22:00', final: '08:00' },
    GUARDIA: { inici: '08:00', final: '08:00' },
    LLIURE:  { inici: '00:00', final: '23:59' },
    BAIXA:   { inici: '00:00', final: '23:59' },
};
document.getElementById('torn-tipus').addEventListener('change', function () {
    const h = TORN_HORES[this.value];
    if (h) {
        document.getElementById('torn-hora-inici').value = h.inici;
        document.getElementById('torn-hora-final').value = h.final;
    }
});

// ── Enviar notificació ────────────────────────────────────────
document.getElementById('btn-notif-enviar').addEventListener('click', async function () {
    const titol      = document.getElementById('notif-titol').value.trim();
    const descripcio = document.getElementById('notif-descripcio').value.trim();
    const tipus      = document.getElementById('notif-tipus').value;
    if (!titol || !descripcio) { showToast('Omple el títol i el missatge', 'error'); return; }

    this.disabled = true;
    try {
        const res = await fetch(`${API}/notificacions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metge_id: activeDoctorId, titol, descripcio, tipus })
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error || 'Error en enviar', 'error'); return; }
        document.getElementById('modal-notif-overlay').classList.remove('open');
        document.getElementById('notif-titol').value = '';
        document.getElementById('notif-descripcio').value = '';
        showToast('Notificació enviada correctament');
    } catch { showToast('Error de connexió', 'error'); }
    finally { this.disabled = false; }
});

// ── Assignar cas ──────────────────────────────────────────────
document.getElementById('btn-cas-assignar').addEventListener('click', async function () {
    const titol      = document.getElementById('cas-titol').value.trim();
    const pacient    = document.getElementById('cas-pacient').value.trim();
    const sala       = document.getElementById('cas-sala').value.trim();
    const hora       = document.getElementById('cas-hora').value;
    const prioritat  = document.getElementById('cas-prioritat').value;
    const descripcio = document.getElementById('cas-descripcio').value.trim();
    if (!titol || !pacient || !sala || !hora) { showToast('Omple tots els camps obligatoris', 'error'); return; }

    this.disabled = true;
    try {
        const res = await fetch(`${API}/casos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metge_id: activeDoctorId, titol, pacient, sala, hora, prioritat, descripcio })
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error || 'Error en assignar', 'error'); return; }
        document.getElementById('modal-cas-overlay').classList.remove('open');
        ['cas-titol','cas-pacient','cas-sala','cas-descripcio'].forEach(id => document.getElementById(id).value = '');
        showToast('Cas assignat correctament');
    } catch { showToast('Error de connexió', 'error'); }
    finally { this.disabled = false; }
});

// ── Assignar torn ─────────────────────────────────────────────
document.getElementById('btn-torn-assignar').addEventListener('click', async function () {
    const data      = document.getElementById('torn-data').value;
    const tipusTorn = document.getElementById('torn-tipus').value;
    const horaInici = document.getElementById('torn-hora-inici').value;
    const horaFinal = document.getElementById('torn-hora-final').value;
    const unitat    = document.getElementById('torn-unitat').value.trim();
    if (!data || !horaInici || !horaFinal || !unitat) { showToast('Omple tots els camps', 'error'); return; }

    this.disabled = true;
    try {
        const res = await fetch(`${API}/torns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metge_id: activeDoctorId, data, tipusTorn, horaInici, horaFinal, unitat })
        });
        const json = await res.json();
        if (!res.ok) { showToast(json.error || 'Error en assignar', 'error'); return; }
        document.getElementById('modal-torn-overlay').classList.remove('open');
        showToast('Torn assignat correctament');
    } catch { showToast('Error de connexió', 'error'); }
    finally { this.disabled = false; }
});

// ========== TOAST NOTIFICATION ==========
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

// ========== UTILITIES ==========
function formatStatus(status) {
    const map = {
        'disponible': 'Disponible',
        'en-torn': 'En torn',
        'baixa': 'De baixa',
        'vacances': 'Vacances',
        'guardia': 'Guàrdia'
    };
    return map[status] || status;
}

// ========== INIT ==========
async function init() {
    // Actualitzar capçalera amb el nom de l'usuari autenticat
    if (window.AUTH) {
        const nom = window.AUTH.nom || 'Cap de Torn';
        const headerNom    = document.getElementById('header-nom');
        const headerAvatar = document.getElementById('header-avatar');
        if (headerNom)    headerNom.textContent = nom;
        if (headerAvatar) headerAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nom)}&background=1a5276&color=fff&size=36&rounded=true&bold=true`;
    }

    await loadDoctors();
    populateFilters();

    const refreshAll = async () => {
        await loadDoctors();
        updateDashboardStats();
        renderShiftOverview();
        renderAlerts();
        renderQuickResults();
        renderDoctorsGrid();
        renderShiftTable();
    };

    await refreshAll();

    if (liveRefreshTimer) clearInterval(liveRefreshTimer);
    liveRefreshTimer = setInterval(refreshAll, 30000);
}

document.addEventListener('DOMContentLoaded', init);

// ========== COL·LEGIATS AUTORITZATS ==========

function getAuthHeaders() {
    const token = localStorage.getItem('medtorn_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

async function loadCollegiats() {
    try {
        const res = await fetch(`${API}/collegiats`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        renderCollegiatsList(data);
    } catch (err) {
        console.error('Error carregant col·legiats:', err);
        document.getElementById('collegiats-list').innerHTML =
            '<div style="text-align:center;padding:30px;color:var(--text-light);">Error carregant la llista.</div>';
    }
}

function renderCollegiatsList(collegiats) {
    const container = document.getElementById('collegiats-list');
    const count     = document.getElementById('collegiats-count');
    count.textContent = `${collegiats.length} registre${collegiats.length !== 1 ? 's' : ''}`;

    if (collegiats.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light);">Cap número de col·legiat autoritzat encara. Utilitza el formulari per afegir-ne.</div>';
        return;
    }

    const rows = collegiats.map(c => {
        const estatBadge = c.teCompte
            ? `<span style="background:#eafaf1;color:#1e8449;padding:3px 10px;border-radius:12px;font-size:.78rem;font-weight:600;"><i class="fas fa-check-circle"></i> Registrat</span>`
            : `<span style="background:#fef9e7;color:#9a6600;padding:3px 10px;border-radius:12px;font-size:.78rem;font-weight:600;"><i class="fas fa-clock"></i> Pendent</span>`;

        const nomMetge = c.metge ? `<span style="color:var(--text);font-size:.88rem;">${c.metge.nom}</span>` : `<span style="color:var(--text-light);font-size:.85rem;font-style:italic;">Sense compte creat</span>`;

        const dataStr = new Date(c.createdAt).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const btnEliminar = !c.teCompte
            ? `<button class="btn btn-sm" style="background:#fdedec;color:#c0392b;border:1px solid #f5b7b1;padding:4px 10px;font-size:.78rem;" onclick="deleteCollegiat('${c.numCollegiat}')"><i class="fas fa-trash-alt"></i> Eliminar</button>`
            : '';

        return `
            <tr style="border-bottom:1px solid #f0f3f7;">
                <td style="padding:14px 20px;font-weight:600;font-family:monospace;font-size:.95rem;letter-spacing:.5px;">${c.numCollegiat}</td>
                <td style="padding:14px 20px;">${nomMetge}</td>
                <td style="padding:14px 20px;">${estatBadge}</td>
                <td style="padding:14px 20px;color:var(--text-light);font-size:.82rem;">${dataStr}</td>
                <td style="padding:14px 20px;text-align:right;">${btnEliminar}</td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <table style="width:100%;border-collapse:collapse;">
            <thead>
                <tr style="background:#f8fafc;border-bottom:2px solid #e8eef5;">
                    <th style="padding:12px 20px;text-align:left;font-size:.8rem;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;">Nº Col·legiat</th>
                    <th style="padding:12px 20px;text-align:left;font-size:.8rem;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;">Metge</th>
                    <th style="padding:12px 20px;text-align:left;font-size:.8rem;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;">Estat</th>
                    <th style="padding:12px 20px;text-align:left;font-size:.8rem;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;">Afegit</th>
                    <th style="padding:12px 20px;"></th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

async function deleteCollegiat(numCollegiat) {
    if (!confirm(`Segur que vols eliminar l'autorització del col·legiat ${numCollegiat}?`)) return;
    try {
        const res = await fetch(`${API}/collegiats/${encodeURIComponent(numCollegiat)}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (!res.ok) {
            showToast(data.error || 'Error en eliminar', 'error');
            return;
        }
        showToast('Col·legiat eliminat correctament');
        loadCollegiats();
    } catch {
        showToast('Error de connexió', 'error');
    }
}

function showCollegiatAlert(msg, type) {
    const el = document.getElementById('collegiat-alert');
    el.style.display = 'block';
    el.style.background  = type === 'error' ? '#fdedec' : '#eafaf1';
    el.style.color       = type === 'error' ? '#c0392b' : '#1e8449';
    el.style.border      = type === 'error' ? '1px solid #f5b7b1' : '1px solid #a9dfbf';
    el.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${msg}`;
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

document.getElementById('btn-add-collegiat').addEventListener('click', async function () {
    const num = document.getElementById('input-num-collegiat').value.trim();
    if (!num) { showCollegiatAlert('Introdueix un número de col·legiat.', 'error'); return; }

    this.disabled = true;
    try {
        const res  = await fetch(`${API}/collegiats`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ numCollegiat: num })
        });
        const data = await res.json();
        if (!res.ok) {
            showCollegiatAlert(data.error || 'Error desconegut', 'error');
        } else {
            showCollegiatAlert(`Número ${num} autoritzat correctament.`, 'success');
            document.getElementById('input-num-collegiat').value = '';
            loadCollegiats();
        }
    } catch {
        showCollegiatAlert('Error de connexió amb el servidor.', 'error');
    } finally {
        this.disabled = false;
    }
});

document.getElementById('input-num-collegiat').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('btn-add-collegiat').click();
});

// Carregar col·legiats quan es navega a la secció
document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.section === 'collegiats') {
        link.addEventListener('click', loadCollegiats);
    }
});
