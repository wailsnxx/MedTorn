// server/seed.js — Pobla la base de dades MedTorn amb dades d'exemple
// Execució: npm run seed
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Metge     = require('./models/Metge');
const Torn      = require('./models/Torn');
const Cas       = require('./models/Cas');
const Solicitud = require('./models/Solicitud');
const Notificacio = require('./models/Notificacio');

// ── Dades mestres ────────────────────────────────────────────
const SPECIALTIES = [
  "Medicina Interna","Cirurgia General","Pediatria","Ginecologia i Obstetrícia",
  "Traumatologia","Cardiologia","Neurologia","Urologia","Anestesiologia",
  "Medicina d'Urgències","Pneumologia","Dermatologia","Oncologia",
  "Nefrologia","Psiquiatria","Radiologia"
];
const SUBSPECIALTIES = [
  "Cirurgia laparoscòpica","Cardiologia intervencionista","Neonatologia",
  "Embaràs d'alt risc","Cirurgia artroscòpica","Neuroradiologia",
  "Cures pal·liatives","UCI pediàtrica","Hemodinàmica","Electrofisiologia"
];
const COMPETENCES = [
  "Ecografia avançada","Ventilació mecànica","Intubació difícil",
  "Cirurgia mínimament invasiva","Reanimació neonatal","Drenatge toràcic",
  "Cateterisme cardíac","Punció lumbar","Sedació conscient",
  "Telemedicina","Gestió de politraumatismes","Sutura avançada",
  "Ecocardiografia","Broncoscòpia","Endoscòpia digestiva",
  "Radiologia intervencionista","Atenció al pacient crític"
];
const UNITS = [
  "Urgències","Planta 1","Planta 2","Planta 3","UCI",
  "Quiròfan 1","Quiròfan 2","Consultes Externes","Neonatologia",
  "Maternitat","Hospital de Dia"
];
const LANGUAGES = ["Català","Castellà","Anglès","Francès","Àrab","Xinès"];
const ESTATS = ["DISPONIBLE","EN_TORN","EN_TORN","EN_TORN","BAIXA","VACANCES"];
const NIVELLS = ["ACREDITAT","AVANCAT","EXPERT"];

const DOCTOR_NAMES = [
  {nom:"Dra. Marta Vidal",gender:"f"},{nom:"Dr. Jordi Puig",gender:"m"},
  {nom:"Dr. Àlex Fernández",gender:"m"},{nom:"Dra. Laia Soler",gender:"f"},
  {nom:"Dr. Pere Martí",gender:"m"},{nom:"Dra. Núria Castelló",gender:"f"},
  {nom:"Dr. Marc Roca",gender:"m"},{nom:"Dra. Clara Bosch",gender:"f"},
  {nom:"Dr. Sergi López",gender:"m"},{nom:"Dra. Anna García",gender:"f"},
  {nom:"Dr. David Romero",gender:"m"},{nom:"Dra. Ester Pons",gender:"f"},
  {nom:"Dr. Pau Aguilar",gender:"m"},{nom:"Dra. Montse Ferrer",gender:"f"},
  {nom:"Dr. Oriol Camps",gender:"m"},{nom:"Dra. Gemma Navarro",gender:"f"},
  {nom:"Dr. Ramon Delgado",gender:"m"},{nom:"Dra. Sílvia Torres",gender:"f"},
  {nom:"Dr. Carles Blanch",gender:"m"},{nom:"Dra. Judit Morera",gender:"f"},
  {nom:"Dr. Enric Domènech",gender:"m"},{nom:"Dra. Irene Alsina",gender:"f"},
  {nom:"Dr. Xavier Giralt",gender:"m"},{nom:"Dra. Meritxell Font",gender:"f"},
  {nom:"Dr. Albert Verdú",gender:"m"},{nom:"Dra. Teresa Reig",gender:"f"},
  {nom:"Dr. Joan Mir",gender:"m"},{nom:"Dra. Roser Ventura",gender:"f"},
  {nom:"Dr. Miquel Cortés",gender:"m"},{nom:"Dra. Sandra Petit",gender:"f"}
];

// ── Helpers ──────────────────────────────────────────────────
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const rInt  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const SHIFT_TYPES = ['MATI','TARDA','NIT','GUARDIA','LLIURE'];

// ── Seed ─────────────────────────────────────────────────────
async function seed() {
  await connectDB();

  console.log('🗑  Netejant col·leccions...');
  await Promise.all([
    Metge.deleteMany({}),
    Torn.deleteMany({}),
    Cas.deleteMany({}),
    Solicitud.deleteMany({}),
    Notificacio.deleteMany({})
  ]);

  // ── Metges ──
  console.log('👩‍⚕️  Inserint metges...');
  const metgeDocs = DOCTOR_NAMES.map((d, i) => {
    const estat = pick(ESTATS);
    const colorBg = d.gender === 'f' ? '2980b9' : '1a5276';
    const nomCurt = d.nom.replace('Dra. ','').replace('Dr. ','');
    const numComp = rInt(2, 5);
    const compNames = pickN(COMPETENCES, numComp);
    return {
      nom:             d.nom,
      especialitat:    pick(SPECIALTIES),
      subespecialitat: i % 3 === 0 ? pick(SUBSPECIALTIES) : null,
      unitat:          pick(UNITS),
      numCollegiat:    `0800${String(10000 + i * 137).slice(0, 5)}`,
      anyExperiencia:  rInt(2, 30),
      idiomes:         pickN(LANGUAGES, rInt(2, 3)),
      estat,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nomCurt)}&background=${colorBg}&color=fff&size=120&rounded=true&bold=true`,
      competencies: compNames.map(nom => ({
        nom,
        nivell: pick(NIVELLS),
        dataAcreditacio: new Date(2015 + rInt(0, 8), rInt(0, 11), rInt(1, 28))
      }))
    };
  });

  // Assegurar que el Dr. Jordi Puig (índex 1) té les dades fixes de medic.html
  metgeDocs[1] = {
    nom:             'Dr. Jordi Puig Fernández',
    especialitat:    'Cardiologia',
    subespecialitat: 'Cardiologia Intervencionista',
    unitat:          'Planta 2 — Cardiologia',
    numCollegiat:    '080012345',
    anyExperiencia:  14,
    idiomes:         ['Català','Castellà','Anglès'],
    estat:           'EN_TORN',
    avatar:          'https://ui-avatars.com/api/?name=Jordi+Puig&background=1a5276&color=fff&size=160&rounded=true&bold=true',
    competencies: [
      { nom: 'Cateterisme cardíac',        nivell: 'EXPERT',    dataAcreditacio: new Date('2015-06-01') },
      { nom: 'Ecocardiografia',            nivell: 'EXPERT',    dataAcreditacio: new Date('2014-09-15') },
      { nom: 'Ecografia avançada',         nivell: 'AVANCAT',   dataAcreditacio: new Date('2017-03-20') },
      { nom: 'Sedació conscient',          nivell: 'ACREDITAT', dataAcreditacio: new Date('2018-11-10') },
      { nom: 'Atenció al pacient crític',  nivell: 'AVANCAT',   dataAcreditacio: new Date('2016-05-05') },
      { nom: 'Telemedicina',               nivell: 'ACREDITAT', dataAcreditacio: new Date('2022-01-20') }
    ]
  };

  const metges = await Metge.insertMany(metgeDocs);
  console.log(`   ✔ ${metges.length} metges inserits`);

  const jordiPuig = metges[1]; // Dr. Jordi Puig Fernández

  // ── Torns (setmana actual + la propera) ──
  console.log('📅  Inserint torns...');
  const torns = [];
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  monday.setHours(0, 0, 0, 0);

  const TORN_HOURS = {
    MATI:    { horaInici: '07:00', horaFinal: '15:00' },
    TARDA:   { horaInici: '15:00', horaFinal: '23:00' },
    NIT:     { horaInici: '23:00', horaFinal: '07:00' },
    GUARDIA: { horaInici: '08:00', horaFinal: '08:00' },
    LLIURE:  { horaInici: '00:00', horaFinal: '00:00' }
  };

  for (let week = 0; week < 2; week++) {
    for (let day = 0; day < 7; day++) {
      const data = new Date(monday);
      data.setDate(monday.getDate() + week * 7 + day);

      // Torn per al Dr. Jordi Puig
      const tipusJordi = day < 5 ? ['MATI','TARDA','MATI','NIT','MATI'][day] : 'LLIURE';
      const hJordi = TORN_HOURS[tipusJordi];
      torns.push({
        data,
        tipusTorn: tipusJordi,
        horaInici: hJordi.horaInici,
        horaFinal: hJordi.horaFinal,
        unitat:    jordiPuig.unitat,
        metge_id:  jordiPuig._id
      });

      // Torns per a la resta de metges
      for (const metge of metges) {
        if (metge._id.equals(jordiPuig._id)) continue;
        if (metge.estat === 'BAIXA') {
          torns.push({ data, tipusTorn: 'BAIXA', horaInici: '00:00', horaFinal: '00:00', unitat: metge.unitat, metge_id: metge._id });
        } else if (metge.estat === 'VACANCES') {
          torns.push({ data, tipusTorn: 'LLIURE', horaInici: '00:00', horaFinal: '00:00', unitat: metge.unitat, metge_id: metge._id });
        } else {
          const tipusTorn = day === 6 ? 'LLIURE' : pick(SHIFT_TYPES);
          const h = TORN_HOURS[tipusTorn];
          torns.push({ data, tipusTorn, horaInici: h.horaInici, horaFinal: h.horaFinal, unitat: metge.unitat, metge_id: metge._id });
        }
      }
    }
  }
  await Torn.insertMany(torns);
  console.log(`   ✔ ${torns.length} torns inserits`);

  // ── Casos ──
  console.log('🩺  Inserint casos...');
  await Cas.insertMany([
    { titol: 'Cateterisme cardíac programat', pacient: 'Pacient #4521', sala: 'Hab. 215',      prioritat: 'MITJA', hora: '09:30', descripcio: 'Pacient de 67 anys. Control post-stent.',                metge_id: jordiPuig._id },
    { titol: "Ecocardiografia d'urgència",    pacient: 'Pacient #4533', sala: 'Urgències Box 3',prioritat: 'ALTA',  hora: '11:00', descripcio: 'Dolor toràcic agut. Descartar SCA.',                   metge_id: jordiPuig._id },
    { titol: 'Consulta de seguiment',         pacient: 'Pacient #4487', sala: 'Consulta 8',    prioritat: 'BAIXA', hora: '12:30', descripcio: 'Revisió trimestral. Insuficiència cardíaca estable.', metge_id: jordiPuig._id }
  ]);
  console.log('   ✔ 3 casos inserits');

  // ── Sol·licituds ──
  console.log('📋  Inserint sol·licituds...');
  await Solicitud.insertMany([
    {
      tipus: 'VACANCES', dataCreacio: new Date('2026-02-10'),
      dataInici: new Date('2026-03-15'), dataFinal: new Date('2026-03-20'),
      tornAfectat: 'MATI', motiu: 'Vacances familiars programades',
      estat: 'APROVADA', metge_solicitant_id: jordiPuig._id
    },
    {
      tipus: 'CANVI_TORN', dataCreacio: new Date('2026-02-20'),
      dataInici: new Date('2026-03-04'),
      tornAfectat: 'MATI', motiu: 'Visita mèdica personal al matí',
      estat: 'PENDENT', metge_solicitant_id: jordiPuig._id
    },
    {
      tipus: 'PERMUTA', dataCreacio: new Date('2026-02-22'),
      tornAfectat: 'MATI', motiu: 'Acord mutu per conciliació',
      estat: 'PENDENT',
      metge_solicitant_id: jordiPuig._id,
      metge_receptor_id:   metges[0]._id  // Dra. Marta Vidal
    }
  ]);
  console.log('   ✔ 3 sol·licituds inserides');

  // ── Notificacions ──
  console.log('🔔  Inserint notificacions...');
  await Notificacio.insertMany([
    { tipus: 'AVIS',  titol: 'Sol·licitud de permuta', descripcio: 'Dra. Marta Vidal vol permutar el torn de dijous (T) pel teu torn de divendres (M).', dataHora: new Date(Date.now() - 20*60*1000), llegida: false, metge_id: jordiPuig._id },
    { tipus: 'INFO',  titol: 'Torn confirmat',          descripcio: 'El teu torn de demà ha estat confirmat: Tarda (15:00–23:00)',                          dataHora: new Date(Date.now() - 60*60*1000), llegida: false, metge_id: jordiPuig._id },
    { tipus: 'EXITO', titol: 'Sol·licitud aprovada',    descripcio: 'La teva sol·licitud de vacances (15-20 març) ha estat aprovada.',                       dataHora: new Date(Date.now() - 3*60*60*1000), llegida: false, metge_id: jordiPuig._id },
    { tipus: 'PERILL',titol: "Alerta d'urgència",       descripcio: "S'ha activat el protocol d'urgència a Planta 2. Consulta el cap de torn.",              dataHora: new Date(Date.now() - 5*60*60*1000), llegida: false, metge_id: jordiPuig._id },
    { tipus: 'INFO',  titol: 'Cas assignat',             descripcio: "T'han assignat un nou cas: Ecocardiografia d'urgència (Pacient #4533)",                 dataHora: new Date(Date.now() - 24*60*60*1000), llegida: true, metge_id: jordiPuig._id }
  ]);
  console.log('   ✔ 5 notificacions inserides');

  console.log('\n══════════════════════════════════════════');
  console.log('  MedTorn — Seed completat correctament');
  console.log(`  Metges: ${metges.length}  Torns: ${torns.length}`);
  console.log('  ID del Dr. Jordi Puig:', jordiPuig._id.toString());
  console.log('══════════════════════════════════════════\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('✘ Error durant el seed:', err);
  process.exit(1);
});
