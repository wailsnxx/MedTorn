// server/index.js — Servidor Express principal de MedTorn
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const connectDB = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serveix els fitxers estàtics del frontend (carpeta arrel)
app.use(express.static(path.join(__dirname, '..')));

// ── Rutes API ────────────────────────────────────────────────
app.use('/api/metges',      require('./routes/metges'));
app.use('/api/torns',       require('./routes/torns'));
app.use('/api/casos',       require('./routes/casos'));
app.use('/api/solicituds',  require('./routes/solicituds'));
app.use('/api/notificacions', require('./routes/notificacions'));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 per rutes API desconegudes ───────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no trobada' });
});

// ── Fallback: retorna index.html per a SPA routing ────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Arrencada ────────────────────────────────────────────────
(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✔ MedTorn servidor actiu → http://localhost:${PORT}`);
    console.log(`  Portal Coordinació → http://localhost:${PORT}/index.html`);
    console.log(`  Portal Metge       → http://localhost:${PORT}/medic.html`);
  });
})();
