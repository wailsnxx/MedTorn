// server/routes/auth.js — Registre i inici de sessió
'use strict';

const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');
const Usuari   = require('../models/Usuari');
const Metge    = require('../models/Metge');

const JWT_SECRET  = process.env.JWT_SECRET || 'medtorn_dev_secret_canvia_en_produccio';
const JWT_EXPIRES = '7d';

// ── Helper: genera token ──────────────────────────────────────
function signToken(usuari) {
  return jwt.sign(
    {
      id:       usuari._id,
      nom:      usuari.nom,
      rol:      usuari.rol,
      metge_id: usuari.metge_id || null
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ── GET /api/auth/metges-disponibles ─────────────────────────
// Retorna metges que encara no tenen compte d'usuari associat
router.get('/metges-disponibles', async (req, res) => {
  try {
    // IDs de metges ja associats a un usuari
    const presos = await Usuari.find({ rol: 'METGE', metge_id: { $ne: null } }, 'metge_id').lean();
    const presoIds = presos.map(u => u.metge_id);

    const metges = await Metge.find({ _id: { $nin: presoIds } }, 'nom especialitat numCollegiat').sort({ nom: 1 }).lean();
    res.json(metges.map(m => ({ id: m._id, nom: m.nom, especialitat: m.especialitat, numCollegiat: m.numCollegiat })));
  } catch (err) {
    console.error('GET /api/auth/metges-disponibles error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// ── POST /api/auth/register ───────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { nom, email, password, rol, metge_id } = req.body;

    // Validació bàsica
    if (!nom || !email || !password || !rol) {
      return res.status(400).json({ error: 'Falten camps obligatoris: nom, email, password, rol' });
    }
    if (!['METGE', 'CAP_TORN'].includes(rol)) {
      return res.status(400).json({ error: 'Rol invàlid. Ha de ser METGE o CAP_TORN' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contrasenya ha de tenir mínim 8 caràcters' });
    }
    // Validació de format d'email bàsica
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Format de correu invàlid' });
    }

    // Comprovar que el correu no existeix
    const existent = await Usuari.findOne({ email: email.toLowerCase().trim() });
    if (existent) {
      return res.status(409).json({ error: 'Ja existeix un compte amb aquest correu electrònic' });
    }

    // Si és METGE, verificar que el metge_id és vàlid i disponible
    let metgeDoc = null;
    if (rol === 'METGE') {
      if (!metge_id || !mongoose.Types.ObjectId.isValid(metge_id)) {
        return res.status(400).json({ error: 'Cal seleccionar un perfil mèdic vàlid' });
      }
      metgeDoc = await Metge.findById(metge_id);
      if (!metgeDoc) {
        return res.status(404).json({ error: 'Perfil mèdic no trobat' });
      }
      // Comprovar que el metge no té ja un compte
      const metgePres = await Usuari.findOne({ metge_id });
      if (metgePres) {
        return res.status(409).json({ error: 'Aquest perfil mèdic ja té un compte associat' });
      }
    }

    // Crear usuari (el password es xifra al pre-save hook)
    const nouUsuari = await Usuari.create({
      nom:      nom.trim(),
      email:    email.toLowerCase().trim(),
      password,
      rol,
      metge_id: rol === 'METGE' ? metge_id : null
    });

    const token = signToken(nouUsuari);
    res.status(201).json({
      token,
      usuari: {
        id:       nouUsuari._id,
        nom:      nouUsuari.nom,
        email:    nouUsuari.email,
        rol:      nouUsuari.rol,
        metge_id: nouUsuari.metge_id
      }
    });
  } catch (err) {
    console.error('POST /api/auth/register error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Cal proporcionar correu i contrasenya' });
    }

    // Buscar usuari (incloure el camp password que per defecte és select: false)
    const usuari = await Usuari.findOne({ email: email.toLowerCase().trim(), actiu: true }).select('+password');
    if (!usuari) {
      return res.status(401).json({ error: 'Credencials incorrectes' });
    }

    const ok = await usuari.checkPassword(password);
    if (!ok) {
      return res.status(401).json({ error: 'Credencials incorrectes' });
    }

    const token = signToken(usuari);
    res.json({
      token,
      usuari: {
        id:       usuari._id,
        nom:      usuari.nom,
        email:    usuari.email,
        rol:      usuari.rol,
        metge_id: usuari.metge_id
      }
    });
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
});

module.exports = router;
