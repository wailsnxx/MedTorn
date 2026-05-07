// server/index.js — Servidor Express principal de MedTorn
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express     = require('express');
const cors        = require('cors');
const path        = require('path');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const connectDB   = require('./config/db');
const Torn        = require('./models/Torn');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serveix els fitxers estàtics del frontend (carpeta arrel)
app.use(express.static(path.join(__dirname, '..')));

// ── Swagger UI ───────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'MedTorn API Docs',
  customCss: '.swagger-ui .topbar { background-color: #1a5276; }',
  swaggerOptions: { docExpansion: 'list', filter: true }
}));

// ── Rutes API ────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
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

  // Backfill suau per torns antics sense expiresAt (1 sola passada a l'arrencada)
  const legacy = await Torn.find({ expiresAt: { $exists: false } }, '_id data').lean();
  if (legacy.length) {
    const ops = legacy.map(t => {
      const exp = new Date(t.data);
      exp.setHours(23, 59, 59, 999);
      exp.setDate(exp.getDate() + 30);
      return {
        updateOne: {
          filter: { _id: t._id },
          update: { $set: { expiresAt: exp } }
        }
      };
    });
    await Torn.bulkWrite(ops);
    console.log(`✔ Backfill torns expirables: ${legacy.length}`);
  }

  app.listen(PORT, () => {
    console.log(`✔ MedTorn servidor actiu → http://localhost:${PORT}`);
    console.log(`  Portal Coordinació → http://localhost:${PORT}/index.html`);
    console.log(`  Portal Metge       → http://localhost:${PORT}/medic.html`);
    console.log(`  API Docs (Swagger) → http://localhost:${PORT}/api-docs`);
  });
})();
