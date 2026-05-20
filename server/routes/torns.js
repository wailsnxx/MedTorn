// server/routes/torns.js
const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const Torn    = require('../models/Torn');

// GET /api/torns — Torns (filtre per metge_id i/o rang de dates)
router.get('/', async (req, res) => {
  try {
    const filter = { expiresAt: { $gt: new Date() } };
    if (req.query.metge_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.metge_id)) {
        return res.status(400).json({ error: 'metge_id invàlid' });
      }
      filter.metge_id = req.query.metge_id;
    }
    if (req.query.dataInici || req.query.dataFinal) {
      filter.data = {};
      if (req.query.dataInici) filter.data.$gte = new Date(req.query.dataInici);
      if (req.query.dataFinal) filter.data.$lte = new Date(req.query.dataFinal);
    }

    const torns = await Torn.find(filter).sort({ data: 1 }).lean();

    const TIPUS_MAP = { MATI: 'M', TARDA: 'T', NIT: 'N', GUARDIA: 'G', LLIURE: 'L', BAIXA: 'B' };
    res.json(torns.map(t => ({
      id:       t._id,
      data:     t.data,
      tipus:    t.tipusTorn,
      codi:     TIPUS_MAP[t.tipusTorn] || 'L',
      horaInici: t.horaInici,
      horaFinal: t.horaFinal,
      unitat:   t.unitat,
      metge_id: t.metge_id
    })));
  } catch (err) {
    console.error('GET /api/torns error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// GET /api/torns/monthly/:metge_id — Torns del mes per a un metge (per al calendari)
router.get('/monthly/:metge_id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.metge_id)) {
      return res.status(400).json({ error: 'metge_id invàlid' });
    }
    const year  = parseInt(req.query.year)  || new Date().getFullYear();
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

    const inici  = new Date(year, month - 1, 1);
    const final  = new Date(year, month, 0, 23, 59, 59);

    const torns = await Torn.find({
      metge_id: req.params.metge_id,
      data: { $gte: inici, $lte: final },
      expiresAt: { $gt: new Date() }
    }).lean();

    const TIPUS_MAP = { MATI: 'M', TARDA: 'T', NIT: 'N', GUARDIA: 'G', LLIURE: 'L', BAIXA: 'B' };
    const byDate = {};
    torns.forEach(t => {
      const key = new Date(t.data).toISOString().split('T')[0];
      byDate[key] = TIPUS_MAP[t.tipusTorn] || 'L';
    });

    res.json(byDate);
  } catch (err) {
    console.error('GET /api/torns/monthly error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// POST /api/torns — Crear nou torn per a un metge
router.post('/', async (req, res) => {
  try {
    const { metge_id, data, tipusTorn, horaInici, horaFinal, unitat } = req.body;
    if (!metge_id || !data || !tipusTorn || !horaInici || !horaFinal || !unitat) {
      return res.status(400).json({ error: 'Falten camps: metge_id, data, tipusTorn, horaInici, horaFinal, unitat' });
    }
    if (!mongoose.Types.ObjectId.isValid(metge_id)) {
      return res.status(400).json({ error: 'metge_id invàlid' });
    }
    if (!['MATI', 'TARDA', 'NIT', 'GUARDIA', 'LLIURE', 'BAIXA'].includes(tipusTorn)) {
      return res.status(400).json({ error: 'tipusTorn invàlid' });
    }
    const torn = await Torn.create({ metge_id, data: new Date(data), tipusTorn, horaInici, horaFinal, unitat });
    res.status(201).json({ ok: true, id: torn._id });
  } catch (err) {
    console.error('POST /api/torns error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// PUT /api/torns/:id — Actualitzar un torn existent
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID de torn invàlid' });
    }
    const { metge_id, data, tipusTorn, horaInici, horaFinal, unitat } = req.body;
    if (!metge_id || !data || !tipusTorn || !horaInici || !horaFinal || !unitat) {
      return res.status(400).json({ error: 'Falten camps: metge_id, data, tipusTorn, horaInici, horaFinal, unitat' });
    }
    if (!mongoose.Types.ObjectId.isValid(metge_id)) {
      return res.status(400).json({ error: 'metge_id invàlid' });
    }
    if (!['MATI', 'TARDA', 'NIT', 'GUARDIA', 'LLIURE', 'BAIXA'].includes(tipusTorn)) {
      return res.status(400).json({ error: 'tipusTorn invàlid' });
    }
    const torn = await Torn.findByIdAndUpdate(
      req.params.id,
      { metge_id, data: new Date(data), tipusTorn, horaInici, horaFinal, unitat },
      { new: true }
    );
    if (!torn) return res.status(404).json({ error: 'Torn no trobat' });
    res.json({ ok: true, id: torn._id });
  } catch (err) {
    console.error('PUT /api/torns/:id error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// DELETE /api/torns/:id — Eliminar un torn
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID de torn invàlid' });
    }
    const torn = await Torn.findByIdAndDelete(req.params.id);
    if (!torn) return res.status(404).json({ error: 'Torn no trobat' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/torns/:id error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

module.exports = router;
