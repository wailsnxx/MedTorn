// server/routes/solicituds.js
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Solicitud = require('../models/Solicitud');
const Metge     = require('../models/Metge');

// GET /api/solicituds — Sol·licituds per metge_id
router.get('/', async (req, res) => {
  try {
    if (!req.query.metge_id) {
      return res.status(400).json({ error: 'Paràmetre metge_id obligatori' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.query.metge_id)) {
      return res.status(400).json({ error: 'metge_id invàlid' });
    }

    const filter = { metge_solicitant_id: req.query.metge_id };
    if (req.query.estat) filter.estat = req.query.estat.toUpperCase();

    const sols = await Solicitud.find(filter).sort({ dataCreacio: -1 }).lean();

    // Obtenir noms dels metges receptors per permutes
    const receptorIds = [...new Set(
      sols.filter(s => s.metge_receptor_id).map(s => s.metge_receptor_id.toString())
    )];
    const receptors = {};
    if (receptorIds.length) {
      const metges = await Metge.find({ _id: { $in: receptorIds } }, 'nom').lean();
      metges.forEach(m => { receptors[m._id.toString()] = m.nom; });
    }

    const TIPUS_CLIENT_MAP = { CANVI_TORN: 'canvi', PERMUTA: 'permut', BAIXA: 'baixa', VACANCES: 'vacances', ALTRES: 'altres' };
    const ICON_MAP = { CANVI_TORN: 'fa-exchange-alt', PERMUTA: 'fa-people-arrows', BAIXA: 'fa-user-minus', VACANCES: 'fa-umbrella-beach', ALTRES: 'fa-file-alt' };
    const formatDate = d => d ? new Date(d).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const TORN_LABELS = { MATI: 'Matí', TARDA: 'Tarda', NIT: 'Nit', GUARDIA: 'Guàrdia', LLIURE: 'Lliure', BAIXA: 'Baixa' };

    res.json(sols.map(s => {
      const receptorNom = s.metge_receptor_id ? receptors[s.metge_receptor_id.toString()] : null;
      let detail = '';
      if (s.dataInici && s.dataFinal) detail = `${formatDate(s.dataInici)} – ${formatDate(s.dataFinal)}`;
      else if (s.dataInici) detail = formatDate(s.dataInici);
      if (s.tornAfectat && detail) detail += ` · ${TORN_LABELS[s.tornAfectat] || s.tornAfectat}`;

      const tipus = s.tipus;
      return {
        id:      s._id,
        type:    TIPUS_CLIENT_MAP[tipus] || 'altres',
        icon:    ICON_MAP[tipus] || 'fa-file-alt',
        title:   tipus === 'PERMUTA' && receptorNom ? `Permuta amb ${receptorNom}` : tipus === 'CANVI_TORN' ? 'Canvi de torn' : tipus === 'BAIXA' ? 'Comunicar baixa' : tipus === 'VACANCES' ? 'Sol·licitud de vacances' : 'Sol·licitud',
        detail,
        comment: s.motiu || '',
        date:    formatDate(s.dataCreacio),
        status:  (s.estat || 'PENDENT').toLowerCase(),
        estat:   s.estat,
        metge_solicitant_id: s.metge_solicitant_id,
        metge_receptor_id:   s.metge_receptor_id
      };
    }));
  } catch (err) {
    console.error('GET /api/solicituds error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// GET /api/solicituds/entrants/:metge_id — Sol·licituds rebudes (permutes)
router.get('/entrants/:metge_id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.metge_id)) {
      return res.status(400).json({ error: 'metge_id invàlid' });
    }
    const sols = await Solicitud.find({
      metge_receptor_id: req.params.metge_id,
      estat: 'PENDENT'
    }).sort({ dataCreacio: -1 }).lean();

    const solicitantIds = [...new Set(sols.map(s => s.metge_solicitant_id.toString()))];
    const metges = {};
    if (solicitantIds.length) {
      const ms = await Metge.find({ _id: { $in: solicitantIds } }, 'nom avatar').lean();
      ms.forEach(m => { metges[m._id.toString()] = m; });
    }

    const formatDate = d => d ? new Date(d).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const TORN_LABELS = { MATI: 'Matí', TARDA: 'Tarda', NIT: 'Nit', GUARDIA: 'Guàrdia', LLIURE: 'Lliure', BAIXA: 'Baixa' };

    res.json(sols.map(s => {
      const solicitant = metges[s.metge_solicitant_id.toString()] || {};
      return {
        id:     s._id,
        from:   solicitant.nom || 'Desconegut',
        avatar: solicitant.avatar || `https://ui-avatars.com/api/?name=Metge&background=1a5276&color=fff&size=40&rounded=true&bold=true`,
        type:   'permut',
        icon:   'fa-people-arrows',
        title:  'Permuta de torn',
        detail: s.tornAfectat ? `Torn: ${TORN_LABELS[s.tornAfectat] || s.tornAfectat}` : '',
        date:   formatDate(s.dataCreacio)
      };
    }));
  } catch (err) {
    console.error('GET /api/solicituds/entrants error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// POST /api/solicituds — Crear nova sol·licitud
router.post('/', async (req, res) => {
  try {
    const { tipus, dataInici, dataFinal, tornAfectat, motiu, metge_solicitant_id } = req.body;

    if (!tipus || !tornAfectat || !metge_solicitant_id) {
      return res.status(400).json({ error: 'Falten camps obligatoris: tipus, tornAfectat, metge_solicitant_id' });
    }
    if (!mongoose.Types.ObjectId.isValid(metge_solicitant_id)) {
      return res.status(400).json({ error: 'metge_solicitant_id invàlid' });
    }
    const validTipus = ['CANVI_TORN', 'PERMUTA', 'BAIXA', 'VACANCES', 'ALTRES'];
    if (!validTipus.includes(tipus)) {
      return res.status(400).json({ error: 'Tipus invàlid' });
    }
    const validTorns = ['MATI', 'TARDA', 'NIT', 'GUARDIA', 'LLIURE', 'BAIXA'];
    if (!validTorns.includes(tornAfectat)) {
      return res.status(400).json({ error: 'tornAfectat invàlid' });
    }

    const sol = await Solicitud.create({
      tipus,
      dataCreacio: new Date(),
      dataInici:   dataInici ? new Date(dataInici) : undefined,
      dataFinal:   dataFinal ? new Date(dataFinal) : undefined,
      tornAfectat,
      motiu:       motiu || '',
      estat:       'PENDENT',
      metge_solicitant_id
    });

    res.status(201).json({ ok: true, id: sol._id });
  } catch (err) {
    console.error('POST /api/solicituds error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// PATCH /api/solicituds/:id/estat — Aprovar / Rebutjar sol·licitud
router.patch('/:id/estat', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invàlid' });
    }
    const { estat } = req.body;
    if (!['APROVADA', 'REBUTJADA', 'PENDENT'].includes(estat)) {
      return res.status(400).json({ error: 'Estat invàlid' });
    }
    const sol = await Solicitud.findByIdAndUpdate(
      req.params.id,
      { $set: { estat } },
      { new: true }
    );
    if (!sol) return res.status(404).json({ error: 'Sol·licitud no trobada' });
    res.json({ ok: true, estat: sol.estat });
  } catch (err) {
    console.error('PATCH /api/solicituds/:id/estat error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

module.exports = router;
