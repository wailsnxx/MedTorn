/* =============================================
   MedTorn — App Logic & Sample Data
   Hospital General de Granollers
   ============================================= */

// ========== SAMPLE DATA ==========
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

const SHIFTS = ["M", "T", "N", "G", "L", "B"]; // Matí, Tarda, Nit, Guàrdia, Lliure, Baixa

// Generate realistic doctors
const DOCTOR_NAMES = [
    { name: "Dra. Marta Vidal", gender: "f" },
    { name: "Dr. Jordi Puig", gender: "m" },
    { name: "Dr. Àlex Fernández", gender: "m" },
    { name: "Dra. Laia Soler", gender: "f" },
    { name: "Dr. Pere Martí", gender: "m" },
    { name: "Dra. Núria Castelló", gender: "f" },
    { name: "Dr. Marc Roca", gender: "m" },
    { name: "Dra. Clara Bosch", gender: "f" },
    { name: "Dr. Sergi López", gender: "m" },
    { name: "Dra. Anna García", gender: "f" },
    { name: "Dr. David Romero", gender: "m" },
    { name: "Dra. Ester Pons", gender: "f" },
    { name: "Dr. Pau Aguilar", gender: "m" },
    { name: "Dra. Montse Ferrer", gender: "f" },
    { name: "Dr. Oriol Camps", gender: "m" },
    { name: "Dra. Gemma Navarro", gender: "f" },
    { name: "Dr. Ramon Delgado", gender: "m" },
    { name: "Dra. Sílvia Torres", gender: "f" },
    { name: "Dr. Carles Blanch", gender: "m" },
    { name: "Dra. Judit Morera", gender: "f" },
    { name: "Dr. Enric Domènech", gender: "m" },
    { name: "Dra. Irene Alsina", gender: "f" },
    { name: "Dr. Xavier Giralt", gender: "m" },
    { name: "Dra. Meritxell Font", gender: "f" },
    { name: "Dr. Albert Verdú", gender: "m" },
    { name: "Dra. Teresa Reig", gender: "f" },
    { name: "Dr. Joan Mir", gender: "m" },
    { name: "Dra. Roser Ventura", gender: "f" },
    { name: "Dr. Miquel Cortés", gender: "m" },
    { name: "Dra. Sandra Petit", gender: "f" }
];

function randomFrom(arr, count = 1) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return count === 1 ? shuffled[0] : shuffled.slice(0, count);
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDoctors() {
    return DOCTOR_NAMES.map((d, i) => {
        const specialty = randomFrom(SPECIALTIES);
        const statuses = ["disponible", "en-torn", "en-torn", "en-torn", "baixa", "vacances"];
        const status = randomFrom(statuses);
        const experience = randomInt(2, 30);
        const weekShifts = Array.from({ length: 7 }, () => {
            if (status === "baixa") return "B";
            if (status === "vacances") return "L";
            return randomFrom(SHIFTS);
        });

        return {
            id: i + 1,
            name: d.name,
            gender: d.gender,
            specialty: specialty,
            subspecialty: randomFrom(SUBSPECIALTIES),
            competences: randomFrom(COMPETENCES, randomInt(2, 5)),
            unit: randomFrom(UNITS),
            status: status,
            experience: experience,
            collegiat: `0800${String(10000 + i * 137).slice(0, 5)}`,
            languages: randomFrom(LANGUAGES, randomInt(2, 3)),
            shifts: weekShifts,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name.replace('Dra. ', '').replace('Dr. ', ''))}&background=${d.gender === 'f' ? '2980b9' : '1a5276'}&color=fff&size=120&rounded=true&bold=true`
        };
    });
}

let doctors = generateDoctors();
let currentWeekOffset = 0;

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
function updateDashboardStats() {
    const disponibles = doctors.filter(d => d.status === 'disponible').length;
    const enTorn = doctors.filter(d => d.status === 'en-torn').length;
    const baixa = doctors.filter(d => d.status === 'baixa').length;
    const reemplacaments = doctors.filter(d => d.status === 'baixa' || d.status === 'vacances').length;

    animateCounter('stat-disponibles', disponibles);
    animateCounter('stat-en-torn', enTorn);
    animateCounter('stat-baixa', baixa);
    animateCounter('stat-reemplacaments', reemplacaments);
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
        card.addEventListener('click', () => openDoctorModal(parseInt(card.dataset.id)));
    });
}

function renderAlerts() {
    const container = document.getElementById('alert-list');
    const baixaDoctors = doctors.filter(d => d.status === 'baixa');
    const alerts = [
        {
            type: 'critical',
            icon: 'fa-exclamation-circle',
            title: `${baixaDoctors.length} metge(s) de baixa avui`,
            desc: baixaDoctors.map(d => d.name).join(', ') || 'Cap',
            time: 'Fa 15 min'
        },
        {
            type: 'warning',
            icon: 'fa-exchange-alt',
            title: 'Canvi de torn pendent',
            desc: 'Dr. Sergi López ha sol·licitat un canvi de torn per demà',
            time: 'Fa 1 hora'
        },
        {
            type: 'info',
            icon: 'fa-info-circle',
            title: 'Cobertura mínima assolida a UCI',
            desc: 'La UCI té 2 metges assignats. Mínim recomanat: 2',
            time: 'Fa 2 hores'
        },
        {
            type: 'warning',
            icon: 'fa-user-clock',
            title: "Pic d'urgències previst",
            desc: 'Previsió alta demanda a Urgències aquest vespre',
            time: 'Fa 3 hores'
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
        item.addEventListener('click', () => openDoctorModal(parseInt(item.dataset.id)));
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
        card.addEventListener('click', () => openDoctorModal(parseInt(card.dataset.id)));
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
function openDoctorModal(id) {
    const d = doctors.find(doc => doc.id === id);
    if (!d) return;

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
function init() {
    updateDashboardStats();
    renderShiftOverview();
    renderAlerts();
    renderQuickResults();
    populateFilters();
    renderDoctorsGrid();
    renderShiftTable();
}

document.addEventListener('DOMContentLoaded', init);
