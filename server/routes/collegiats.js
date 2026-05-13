// server/routes/collegiats.js — Gestió de col·legiats autoritzats (cap de torn)
'use strict';

const express              = require('express');
const router               = express.Router();
const jwt                  = require('jsonwebtoken');
const CollegiatAutoritzat  = require('../models/CollegiatAutoritzat');
const Metge                = require('../models/Metge');
const Usuari               = require('../models/Usuari');

const JWT_SECRET = process.env.JWT_SECRET || 'medtorn_dev_secret_canvia_en_produccio';

// ── Middleware: només CAP_TORN ────────────────────────────────
function requireCapTorn(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticat' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    if (payload.rol !== 'CAP_TORN') {
      return res.status(403).json({ error: 'Accés restringit al cap de torn' });
    }
    req.usuari = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invàlid o expirat' });
  }
}

// ── GET /api/collegiats ───────────────────────────────────────
// Llista tots els col·legiats autoritzats amb el seu estat
router.get('/', requireCapTorn, async (req, res) => {
  try {
    const collegiats = await CollegiatAutoritzat.find().sort({ createdAt: -1 }).lean();

    const nums    = collegiats.map(c => c.numCollegiat);
    const metges  = await Metge.find({ numCollegiat: { $in: nums } }, 'nom numCollegiat _id').lean();
    const metgeIds = metges.map(m => m._id);

    const usuarisMetge = await Usuari.find(
      { rol: 'METGE', metge_id: { $in: metgeIds } },
      'metge_id'
    ).lean();
    const metgeIdsWithUser = new Set(usuarisMetge.map(u => String(u.metge_id)));
    const metgeByNum = new Map(metges.map(m => [m.numCollegiat, m]));

    res.json(collegiats.map(c => {
      const metge    = metgeByNum.get(c.numCollegiat);
      const teCompte = metge ? metgeIdsWithUser.has(String(metge._id)) : false;
      return {
        id:           c._id,
        numCollegiat: c.numCollegiat,
        createdAt:    c.createdAt,
        metge:        metge ? { id: metge._id, nom: metge.nom } : null,
        teCompte
      };
    }));
  } catch (err) {
    console.error('GET /api/collegiats error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// ── POST /api/collegiats ──────────────────────────────────────
// Afegeix un nou número de col·legiat a la llista autoritzada
router.post('/', requireCapTorn, async (req, res) => {
  try {
    const { numCollegiat } = req.body;
    if (!numCollegiat || !numCollegiat.trim()) {
      return res.status(400).json({ error: 'El número de col·legiat és obligatori' });
    }
    const num = numCollegiat.trim();

    // Comprovar si ja existeix a la llista
    const existent = await CollegiatAutoritzat.findOne({ numCollegiat: num });
    if (existent) {
      return res.status(409).json({ error: 'Aquest número de col·legiat ja està autoritzat' });
    }

    // Comprovar si ja té compte de metge actiu
    const metge = await Metge.findOne({ numCollegiat: num });
    if (metge) {
      const usuari = await Usuari.findOne({ metge_id: metge._id });
      if (usuari) {
        return res.status(409).json({ error: 'Aquest número de col·legiat ja té un compte de metge associat' });
      }
    }

    const nou = await CollegiatAutoritzat.create({ numCollegiat: num });
    res.status(201).json({
      id:           nou._id,
      numCollegiat: nou.numCollegiat,
      createdAt:    nou.createdAt,
      metge:        metge ? { id: metge._id, nom: metge.nom } : null,
      teCompte:     false
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Aquest número de col·legiat ja està autoritzat' });
    }
    console.error('POST /api/collegiats error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// ── DELETE /api/collegiats/:numCollegiat ──────────────────────
// Elimina un col·legiat de la llista (només si no té compte actiu)
router.delete('/:numCollegiat', requireCapTorn, async (req, res) => {
  try {
    const num = req.params.numCollegiat;

    // Bloquejar si el metge ja té compte d'usuari
    const metge = await Metge.findOne({ numCollegiat: num });
    if (metge) {
      const usuari = await Usuari.findOne({ metge_id: metge._id });
      if (usuari) {
        return res.status(409).json({ error: 'No es pot eliminar: aquest col·legiat ja té un compte de metge actiu' });
      }
    }

    const eliminat = await CollegiatAutoritzat.findOneAndDelete({ numCollegiat: num });
    if (!eliminat) {
      return res.status(404).json({ error: 'Número de col·legiat no trobat' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/collegiats error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

module.exports = router;
