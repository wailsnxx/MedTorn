// server/routes/casos.js
const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const Cas     = require('../models/Cas');

// GET /api/casos — Casos (filtre per metge_id)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.metge_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.metge_id)) {
        return res.status(400).json({ error: 'metge_id invàlid' });
      }
      filter.metge_id = req.query.metge_id;
    }
    const casos = await Cas.find(filter).sort({ hora: 1 }).lean();
    const PRIORITAT_MAP = { ALTA: 'alta', MITJA: 'mitja', BAIXA: 'baixa' };
    res.json(casos.map(c => ({
      id:       c._id,
      title:    c.titol,
      patient:  c.pacient,
      room:     c.sala,
      priority: PRIORITAT_MAP[c.prioritat] || 'baixa',
      time:     c.hora,
      detail:   c.descripcio || '',
      metge_id: c.metge_id
    })));
  } catch (err) {
    console.error('GET /api/casos error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

module.exports = router;
