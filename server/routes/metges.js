// server/routes/metges.js
const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const Metge    = require('../models/Metge');
const Torn     = require('../models/Torn');

function parseTimeOnDate(baseDate, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

function isShiftActiveNow(torn, now = new Date()) {
  if (!torn || ['LLIURE', 'BAIXA'].includes(torn.tipusTorn)) return false;
  const day = new Date(torn.data);
  const start = parseTimeOnDate(day, torn.horaInici);
  let end = parseTimeOnDate(day, torn.horaFinal);
  if (end <= start) end.setDate(end.getDate() + 1);
  return now >= start && now <= end;
}

function toFrontendStatus(estatDb, tornActual) {
  if (estatDb === 'BAIXA') return 'baixa';
  if (estatDb === 'VACANCES') return 'vacances';
  if (estatDb === 'PAUSA') return 'disponible';
  if (estatDb === 'OCUPAT') return 'en-torn';
  if (isShiftActiveNow(tornActual)) return 'en-torn';
  return 'disponible';
}

// Construeix el filtre de cerca des dels query params
function buildFilter(query) {
  const filter = {};
  if (query.especialitat)    filter.especialitat    = query.especialitat;
  if (query.subespecialitat) filter.subespecialitat = query.subespecialitat;
  if (query.unitat)          filter.unitat          = query.unitat;

  if (query.estat) {
    // Accepta estat frontend ('disponible', 'en-torn') o DB ('DISPONIBLE', 'EN_TORN')
    const estatMap = { disponible: 'DISPONIBLE', 'en-torn': 'EN_TORN', baixa: 'BAIXA', vacances: 'VACANCES' };
    filter.estat = estatMap[query.estat] || query.estat.toUpperCase();
  }

  if (query.competencia) {
    filter['competencies.nom'] = query.competencia;
  }

  if (query.idioma) {
    filter.idiomes = query.idioma;
  }

  if (query.q) {
    const re = new RegExp(query.q, 'i');
    filter.$or = [
      { nom:          re },
      { especialitat: re },
      { unitat:       re },
      { 'competencies.nom': re }
    ];
  }

  return filter;
}

// GET /api/metges — Llista metges (amb filtres opcionals)
router.get('/', async (req, res) => {
  try {
    const filter  = buildFilter(req.query);
    const metges  = await Metge.find(filter).sort({ nom: 1 }).lean();

    // Obtenir torns de la setmana actual per a cada metge
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const ids = metges.map(m => m._id);
    const torns = await Torn.find({
      metge_id: { $in: ids },
      data: { $gte: monday, $lte: sunday },
      expiresAt: { $gt: now }
    }).lean();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const tornsAvui = await Torn.find({
      metge_id: { $in: ids },
      data: { $gte: todayStart, $lte: todayEnd },
      expiresAt: { $gt: now }
    }).lean();
    const tornActualByMetge = {};
    tornsAvui.forEach(t => {
      const key = t.metge_id.toString();
      if (!tornActualByMetge[key] && isShiftActiveNow(t, now)) {
        tornActualByMetge[key] = t;
      }
    });

    // Indexar torns per metge_id i dia de la setmana (0=dl, 6=dg)
    const tornsByMetge = {};
    torns.forEach(t => {
      const key = t.metge_id.toString();
      if (!tornsByMetge[key]) tornsByMetge[key] = {};
      const dow = new Date(t.data).getDay(); // 0=Dg, 1=Dl...
      const adjusted = dow === 0 ? 6 : dow - 1; // 0=Dl, 6=Dg
      const TIPUS_MAP = { MATI: 'M', TARDA: 'T', NIT: 'N', GUARDIA: 'G', LLIURE: 'L', BAIXA: 'B' };
      tornsByMetge[key][adjusted] = TIPUS_MAP[t.tipusTorn] || 'L';
    });

    const result = metges.map((m, i) => {
      const shiftsMap = tornsByMetge[m._id.toString()] || {};
      const tornActual = tornActualByMetge[m._id.toString()] || null;
      const shifts = Array.from({ length: 7 }, (_, idx) => {
        if (m.estat === 'BAIXA') return 'B';
        if (m.estat === 'VACANCES') return 'L';
        return shiftsMap[idx] || 'L';
      });

      return {
        id:          m._id,
        name:        m.nom,
        specialty:   m.especialitat,
        subspecialty:m.subespecialitat || '',
        unit:        m.unitat,
        collegiat:   m.numCollegiat,
        experience:  m.anyExperiencia,
        languages:   m.idiomes || [],
        status:      toFrontendStatus(m.estat, tornActual),
        estat:       m.estat,
        avatar:      m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nom)}&background=1a5276&color=fff&size=120&rounded=true&bold=true`,
        competences: (m.competencies || []).map(c => c.nom),
        competenciesDetail: (m.competencies || []).map(c => ({
          name:  c.nom,
          level: c.nivell.charAt(0) + c.nivell.slice(1).toLowerCase()
        })),
        shifts
      };
    });

    res.json(result);
  } catch (err) {
    console.error('GET /api/metges error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// GET /api/metges/stats — Estadístiques ràpides per al dashboard
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const metges = await Metge.find({}, 'estat').lean();
    const ids = metges.map(m => m._id);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const tornsAvui = await Torn.find({
      metge_id: { $in: ids },
      data: { $gte: todayStart, $lte: todayEnd },
      expiresAt: { $gt: now }
    }).lean();
    const tornActualByMetge = {};
    tornsAvui.forEach(t => {
      const key = t.metge_id.toString();
      if (!tornActualByMetge[key] && isShiftActiveNow(t, now)) {
        tornActualByMetge[key] = t;
      }
    });

    let disponibles = 0;
    let enTorn = 0;
    let baixa = 0;
    let vacances = 0;
    metges.forEach(m => {
      if (m.estat === 'BAIXA') { baixa++; return; }
      if (m.estat === 'VACANCES') { vacances++; return; }
      const s = toFrontendStatus(m.estat, tornActualByMetge[m._id.toString()]);
      if (s === 'en-torn') enTorn++;
      else disponibles++;
    });

    res.json({ disponibles, enTorn, baixa, reemplacaments: baixa + vacances });
  } catch (err) {
    console.error('GET /api/metges/stats error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// GET /api/metges/:id — Detall d'un metge
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invàlid' });
    }
    const metge = await Metge.findById(req.params.id).lean();
    if (!metge) return res.status(404).json({ error: 'Metge no trobat' });

    const ESTAT_MAP = {
      DISPONIBLE: 'disponible', EN_TORN: 'en-torn', BAIXA: 'baixa',
      VACANCES: 'vacances', OCUPAT: 'en-torn', PAUSA: 'disponible'
    };

    res.json({
      id:          metge._id,
      name:        metge.nom,
      specialty:   metge.especialitat,
      subspecialty:metge.subespecialitat || '',
      unit:        metge.unitat,
      collegiat:   metge.numCollegiat,
      experience:  metge.anyExperiencia,
      languages:   metge.idiomes || [],
      status:      ESTAT_MAP[metge.estat] || 'disponible',
      estat:       metge.estat,
      avatar:      metge.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(metge.nom)}&background=1a5276&color=fff&size=160&rounded=true&bold=true`,
      competences: (metge.competencies || []).map(c => c.nom),
      competenciesDetail: (metge.competencies || []).map(c => ({
        name:  c.nom,
        level: c.nivell.charAt(0) + c.nivell.slice(1).toLowerCase()
      }))
    });
  } catch (err) {
    console.error('GET /api/metges/:id error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// PATCH /api/metges/:id/estat — Actualitzar estat d'un metge
router.patch('/:id/estat', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invàlid' });
    }
    const { estat } = req.body;
    const validEstats = ['DISPONIBLE', 'EN_TORN', 'BAIXA', 'VACANCES', 'OCUPAT', 'PAUSA'];
    if (!estat || !validEstats.includes(estat)) {
      return res.status(400).json({ error: 'Estat invàlid' });
    }
    const metge = await Metge.findByIdAndUpdate(
      req.params.id,
      { $set: { estat } },
      { new: true, runValidators: true }
    );
    if (!metge) return res.status(404).json({ error: 'Metge no trobat' });
    res.json({ ok: true, estat: metge.estat });
  } catch (err) {
    console.error('PATCH /api/metges/:id/estat error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

module.exports = router;
