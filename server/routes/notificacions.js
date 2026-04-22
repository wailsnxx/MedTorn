// server/routes/notificacions.js
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Notificacio = require('../models/Notificacio');

// GET /api/notificacions?metge_id=xxx — Notificacions d'un metge
router.get('/', async (req, res) => {
  try {
    if (!req.query.metge_id) {
      return res.status(400).json({ error: 'Paràmetre metge_id obligatori' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.query.metge_id)) {
      return res.status(400).json({ error: 'metge_id invàlid' });
    }
    const filter = { metge_id: req.query.metge_id };
    if (req.query.llegida !== undefined) filter.llegida = req.query.llegida === 'true';

    const notifs = await Notificacio.find(filter).sort({ dataHora: -1 }).lean();

    const TIPUS_MAP = { INFO: 'info', AVIS: 'warning', EXITO: 'success', PERILL: 'danger' };
    const ICON_MAP  = { INFO: 'fa-info-circle', AVIS: 'fa-exchange-alt', EXITO: 'fa-check-circle', PERILL: 'fa-exclamation-triangle' };

    const formatRelativeTime = date => {
      const diff = Date.now() - new Date(date).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'Ara mateix';
      if (minutes < 60) return `Fa ${minutes} min`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `Fa ${hours} hora${hours > 1 ? 'es' : ''}`;
      const days = Math.floor(hours / 24);
      if (days === 1) return 'Ahir';
      return `Fa ${days} dies`;
    };

    res.json(notifs.map(n => ({
      id:    n._id,
      type:  TIPUS_MAP[n.tipus] || 'info',
      icon:  ICON_MAP[n.tipus]  || 'fa-info-circle',
      title: n.titol,
      desc:  n.descripcio,
      time:  formatRelativeTime(n.dataHora),
      unread: !n.llegida
    })));
  } catch (err) {
    console.error('GET /api/notificacions error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// PATCH /api/notificacions/:id/llegida — Marcar notificació com a llegida
router.patch('/:id/llegida', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID invàlid' });
    }
    const n = await Notificacio.findByIdAndUpdate(req.params.id, { $set: { llegida: true } }, { new: true });
    if (!n) return res.status(404).json({ error: 'Notificació no trobada' });
    res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/notificacions/:id/llegida error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// PATCH /api/notificacions/llegir-totes/:metge_id — Marcar totes com a llegides
router.patch('/llegir-totes/:metge_id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.metge_id)) {
      return res.status(400).json({ error: 'metge_id invàlid' });
    }
    await Notificacio.updateMany({ metge_id: req.params.metge_id, llegida: false }, { $set: { llegida: true } });
    res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/notificacions/llegir-totes error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

module.exports = router;
