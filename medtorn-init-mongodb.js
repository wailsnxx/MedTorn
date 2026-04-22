// ============================================================
//  MedTorn — Script d'inicialització MongoDB (versió inicial)
//  Projecte MetropolisFPLab
//  Base de dades NO relacional — MongoDB
// ============================================================
//
//  Execució:
//    mongosh < medtorn-init-mongodb.js
//    o bé dins mongosh:  load("medtorn-init-mongodb.js")
// ============================================================

// ── Selecció de base de dades ──────────────────────────────
use("medtorn");

// ── Elimina col·leccions si s'executa per netejar ─────────
// (Comentar en producció)
db.metges.drop();
db.caps_torn.drop();
db.torns.drop();
db.quadre_torns.drop();
db.casos.drop();
db.solicituds.drop();
db.notificacions.drop();

print("✔ Col·leccions eliminades (reinici)");

// ============================================================
//  1. COL·LECCIÓ: metges
//     Conté les competències com a documents INCRUSTATS
// ============================================================
db.createCollection("metges", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nom", "especialitat", "unitat", "numCollegiat", "anyExperiencia", "estat"],
      properties: {
        nom:            { bsonType: "string",  description: "Nom complet del metge (obligatori)" },
        especialitat:   { bsonType: "string",  description: "Especialitat mèdica principal (obligatori)" },
        subespecialitat:{ bsonType: "string",  description: "Subespecialitat (opcional)" },
        unitat:         { bsonType: "string",  description: "Unitat / planta assignada (obligatori)" },
        numCollegiat:   { bsonType: "string",  description: "Número col·legiat (obligatori)" },
        anyExperiencia: { bsonType: "number",  minimum: 0, description: "Anys d'experiència (obligatori)" },
        idiomes:        { bsonType: "array",   items: { bsonType: "string" }, description: "Idiomes parlats (opcional)" },
        estat: {
          bsonType: "string",
          enum: ["DISPONIBLE", "EN_TORN", "BAIXA", "VACANCES", "OCUPAT", "PAUSA"],
          description: "Estat actual del metge (obligatori)"
        },
        avatar: { bsonType: "string", description: "URL de la imatge de perfil (opcional)" },
        // ── Subdocuments incrustats ──────────────────────────
        competencies: {
          bsonType: "array",
          description: "Array de competències acreditades (opcional)",
          items: {
            bsonType: "object",
            required: ["nom", "nivell"],
            properties: {
              nom:            { bsonType: "string" },
              nivell:         { bsonType: "string", enum: ["ACREDITAT", "AVANCAT", "EXPERT"] },
              dataAcreditacio:{ bsonType: "date",   description: "Data d'acreditació (opcional)" }
            }
          }
        }
      }
    }
  }
});
print("✔ Col·lecció 'metges' creada");

// Índexs de la col·lecció metges
db.metges.createIndex({ numCollegiat: 1 }, { unique: true, name: "idx_metges_collegiat" });
db.metges.createIndex({ especialitat: 1 }, { name: "idx_metges_especialitat" });
db.metges.createIndex({ estat: 1 },        { name: "idx_metges_estat" });
db.metges.createIndex({ unitat: 1 },       { name: "idx_metges_unitat" });
print("✔ Índexs 'metges' creats");

// ============================================================
//  2. COL·LECCIÓ: caps_torn
// ============================================================
db.createCollection("caps_torn", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nom", "email"],
      properties: {
        nom:    { bsonType: "string" },
        email:  { bsonType: "string" },
        unitat: { bsonType: "string", description: "Unitat gestionada (opcional)" }
      }
    }
  }
});
print("✔ Col·lecció 'caps_torn' creada");

db.caps_torn.createIndex({ email: 1 }, { unique: true, name: "idx_caps_email" });
print("✔ Índexs 'caps_torn' creats");

// ============================================================
//  3. COL·LECCIÓ: torns
// ============================================================
db.createCollection("torns", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["data", "tipusTorn", "horaInici", "horaFinal", "unitat", "metge_id"],
      properties: {
        data:       { bsonType: "date",   description: "Data del torn (obligatori)" },
        tipusTorn: {
          bsonType: "string",
          enum: ["MATI", "TARDA", "NIT", "GUARDIA", "LLIURE", "BAIXA"],
          description: "Tipus de torn (obligatori)"
        },
        horaInici:  { bsonType: "string", description: "Hora d'inici en format HH:MM (obligatori)" },
        horaFinal:  { bsonType: "string", description: "Hora de final en format HH:MM (obligatori)" },
        unitat:     { bsonType: "string", description: "Unitat on es fa el torn (obligatori)" },
        metge_id:   { bsonType: "objectId", description: "Referència al metge (obligatori)" }
      }
    }
  }
});
print("✔ Col·lecció 'torns' creada");

db.torns.createIndex({ metge_id: 1 },              { name: "idx_torns_metge" });
db.torns.createIndex({ data: 1 },                  { name: "idx_torns_data" });
db.torns.createIndex({ metge_id: 1, data: 1 },     { name: "idx_torns_metge_data" });
db.torns.createIndex({ tipusTorn: 1 },             { name: "idx_torns_tipus" });
print("✔ Índexs 'torns' creats");

// ============================================================
//  4. COL·LECCIÓ: quadre_torns
//     Conté referències (array d'ObjectId) als torns
// ============================================================
db.createCollection("quadre_torns", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["setmanaInici", "setmanaFinal"],
      properties: {
        setmanaInici: { bsonType: "date", description: "Primer dia de la setmana (obligatori)" },
        setmanaFinal: { bsonType: "date", description: "Últim dia de la setmana (obligatori)" },
        torn_ids: {
          bsonType: "array",
          items: { bsonType: "objectId" },
          description: "Array de referències als torns d'aquesta setmana (opcional)"
        }
      }
    }
  }
});
print("✔ Col·lecció 'quadre_torns' creada");

db.quadre_torns.createIndex({ setmanaInici: 1 }, { unique: true, name: "idx_quadre_setmana" });
print("✔ Índexs 'quadre_torns' creats");

// ============================================================
//  5. COL·LECCIÓ: casos
// ============================================================
db.createCollection("casos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["titol", "pacient", "sala", "prioritat", "hora", "metge_id"],
      properties: {
        titol:     { bsonType: "string" },
        pacient:   { bsonType: "string", description: "Identificador del pacient (obligatori)" },
        sala:      { bsonType: "string" },
        prioritat: { bsonType: "string", enum: ["ALTA", "MITJA", "BAIXA"] },
        hora:      { bsonType: "string", description: "Hora en format HH:MM (obligatori)" },
        descripcio:{ bsonType: "string", description: "Detall clínic (opcional)" },
        metge_id:  { bsonType: "objectId", description: "Referència al metge assignat (obligatori)" }
      }
    }
  }
});
print("✔ Col·lecció 'casos' creada");

db.casos.createIndex({ metge_id: 1 },   { name: "idx_casos_metge" });
db.casos.createIndex({ prioritat: 1 },  { name: "idx_casos_prioritat" });
print("✔ Índexs 'casos' creats");

// ============================================================
//  6. COL·LECCIÓ: solicituds
//     Inclou permutas com a subTipus (camp discriminador)
// ============================================================
db.createCollection("solicituds", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tipus", "dataCreacio", "tornAfectat", "estat", "metge_solicitant_id"],
      properties: {
        tipus: {
          bsonType: "string",
          enum: ["CANVI_TORN", "PERMUTA", "BAIXA", "VACANCES", "ALTRES"],
          description: "Tipus de sol·licitud (obligatori)"
        },
        dataCreacio:         { bsonType: "date" },
        dataInici:           { bsonType: "date",     description: "Data d'inici afectada (opcional)" },
        dataFinal:           { bsonType: "date",     description: "Data de final afectada (opcional)" },
        tornAfectat: {
          bsonType: "string",
          enum: ["MATI", "TARDA", "NIT", "GUARDIA", "LLIURE", "BAIXA"],
          description: "Torn afectat (obligatori)"
        },
        motiu:               { bsonType: "string",   description: "Motiu de la sol·licitud (opcional)" },
        estat: {
          bsonType: "string",
          enum: ["PENDENT", "APROVADA", "REBUTJADA"],
          description: "Estat actual (obligatori)"
        },
        metge_solicitant_id: { bsonType: "objectId", description: "Referència al metge sol·licitant (obligatori)" },
        // ── Camps exclusius de PERMUTA ───────────────────────
        metge_receptor_id:   { bsonType: "objectId", description: "Metge que rep la permuta (obligatori si PERMUTA)" },
        torn_ofert_id:       { bsonType: "objectId", description: "Torn que ofereix el sol·licitant (obligatori si PERMUTA)" },
        torn_demanat_id:     { bsonType: "objectId", description: "Torn que demana el sol·licitant (obligatori si PERMUTA)" }
      }
    }
  }
});
print("✔ Col·lecció 'solicituds' creada");

db.solicituds.createIndex({ metge_solicitant_id: 1 }, { name: "idx_sol_metge_solicitant" });
db.solicituds.createIndex({ metge_receptor_id: 1 },   { sparse: true, name: "idx_sol_metge_receptor" });
db.solicituds.createIndex({ estat: 1 },               { name: "idx_sol_estat" });
db.solicituds.createIndex({ tipus: 1 },               { name: "idx_sol_tipus" });
print("✔ Índexs 'solicituds' creats");

// ============================================================
//  7. COL·LECCIÓ: notificacions
// ============================================================
db.createCollection("notificacions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tipus", "titol", "descripcio", "dataHora", "llegida", "metge_id"],
      properties: {
        tipus: {
          bsonType: "string",
          enum: ["INFO", "AVIS", "EXITO", "PERILL"],
          description: "Tipus de notificació (obligatori)"
        },
        titol:     { bsonType: "string" },
        descripcio:{ bsonType: "string" },
        dataHora:  { bsonType: "date" },
        llegida:   { bsonType: "bool" },
        metge_id:  { bsonType: "objectId", description: "Referència al metge destinatari (obligatori)" }
      }
    }
  }
});
print("✔ Col·lecció 'notificacions' creada");

db.notificacions.createIndex({ metge_id: 1 },          { name: "idx_notif_metge" });
db.notificacions.createIndex({ llegida: 1 },            { name: "idx_notif_llegida" });
db.notificacions.createIndex({ metge_id: 1, llegida: 1 },{ name: "idx_notif_metge_llegida" });
print("✔ Índexs 'notificacions' creats");

// ============================================================
//  DADES D'EXEMPLE (Seed data)
// ============================================================

// ── Caps de torn ────────────────────────────────────────────
const capId = db.caps_torn.insertOne({
  nom:    "Anna Puig",
  email:  "anna.puig@medtorn.cat",
  unitat: "Coordinació General"
}).insertedId;
print("✔ Cap de torn inserit: " + capId);

// ── Metges ──────────────────────────────────────────────────
const metge1Id = db.metges.insertOne({
  nom:             "Dr. Jordi Puig Fernández",
  especialitat:    "Cardiologia",
  subespecialitat: "Cardiologia Intervencionista",
  unitat:          "Planta 2 — Cardiologia",
  numCollegiat:    "080012345",
  anyExperiencia:  14,
  idiomes:         ["Català", "Castellà", "Anglès"],
  estat:           "EN_TORN",
  avatar:          "https://ui-avatars.com/api/?name=Jordi+Puig&background=1a5276&color=fff",
  competencies: [
    { nom: "Cateterisme cardíac",   nivell: "EXPERT",     dataAcreditacio: new Date("2015-06-01") },
    { nom: "Ecocardiografia",       nivell: "EXPERT",     dataAcreditacio: new Date("2014-09-15") },
    { nom: "Ecografia avançada",    nivell: "AVANCAT",    dataAcreditacio: new Date("2017-03-20") },
    { nom: "Sedació conscient",     nivell: "ACREDITAT",  dataAcreditacio: new Date("2018-11-10") },
    { nom: "Atenció al pacient crític", nivell: "AVANCAT", dataAcreditacio: new Date("2016-05-05") },
    { nom: "Telemedicina",          nivell: "ACREDITAT",  dataAcreditacio: new Date("2022-01-20") }
  ]
}).insertedId;

const metge2Id = db.metges.insertOne({
  nom:             "Dra. Marta Vidal",
  especialitat:    "Cardiologia",
  subespecialitat: null,
  unitat:          "Planta 2",
  numCollegiat:    "080054321",
  anyExperiencia:  9,
  idiomes:         ["Català", "Castellà"],
  estat:           "EN_TORN",
  avatar:          "https://ui-avatars.com/api/?name=Marta+Vidal&background=2980b9&color=fff",
  competencies: [
    { nom: "Ecocardiografia",    nivell: "AVANCAT",   dataAcreditacio: new Date("2019-04-01") },
    { nom: "Sedació conscient",  nivell: "ACREDITAT", dataAcreditacio: new Date("2020-07-15") }
  ]
}).insertedId;

const metge3Id = db.metges.insertOne({
  nom:            "Dra. Laia Soler",
  especialitat:   "Medicina d'Urgències",
  unitat:         "Urgències",
  numCollegiat:   "080099876",
  anyExperiencia: 6,
  idiomes:        ["Català", "Castellà", "Anglès"],
  estat:          "DISPONIBLE",
  competencies: [
    { nom: "Gestió de politraumatismes", nivell: "EXPERT",     dataAcreditacio: new Date("2021-02-10") },
    { nom: "Ventilació mecànica",        nivell: "AVANCAT",    dataAcreditacio: new Date("2022-05-05") },
    { nom: "Intubació difícil",          nivell: "ACREDITAT",  dataAcreditacio: new Date("2020-11-20") }
  ]
}).insertedId;

print("✔ Metges d'exemple inserits");

// ── Torns ───────────────────────────────────────────────────
const avui = new Date();
avui.setHours(0, 0, 0, 0);

const torna1Id = db.torns.insertOne({
  data:      avui,
  tipusTorn: "MATI",
  horaInici: "07:00",
  horaFinal: "15:00",
  unitat:    "Planta 2 — Cardiologia",
  metge_id:  metge1Id
}).insertedId;

const demà = new Date(avui); demà.setDate(demà.getDate() + 1);

const torn2Id = db.torns.insertOne({
  data:      demà,
  tipusTorn: "TARDA",
  horaInici: "15:00",
  horaFinal: "23:00",
  unitat:    "Planta 2 — Cardiologia",
  metge_id:  metge1Id
}).insertedId;

const torn3Id = db.torns.insertOne({
  data:      avui,
  tipusTorn: "TARDA",
  horaInici: "15:00",
  horaFinal: "23:00",
  unitat:    "Planta 2",
  metge_id:  metge2Id
}).insertedId;

print("✔ Torns d'exemple inserits");

// ── Quadre de torns (setmana actual) ────────────────────────
const dilluns = new Date(avui);
dilluns.setDate(avui.getDate() - avui.getDay() + 1);
const diumenge = new Date(dilluns); diumenge.setDate(dilluns.getDate() + 6);

db.quadre_torns.insertOne({
  setmanaInici: dilluns,
  setmanaFinal: diumenge,
  torn_ids:     [torna1Id, torn2Id, torn3Id]
});
print("✔ Quadre de torns inserit");

// ── Casos ────────────────────────────────────────────────────
db.casos.insertMany([
  {
    titol:     "Cateterisme cardíac programat",
    pacient:   "Pacient #4521",
    sala:      "Hab. 215",
    prioritat: "MITJA",
    hora:      "09:30",
    descripcio:"Pacient de 67 anys. Control post-stent.",
    metge_id:  metge1Id
  },
  {
    titol:     "Ecocardiografia d'urgència",
    pacient:   "Pacient #4533",
    sala:      "Urgències Box 3",
    prioritat: "ALTA",
    hora:      "11:00",
    descripcio:"Dolor toràcic agut. Descartar SCA.",
    metge_id:  metge1Id
  },
  {
    titol:     "Consulta de seguiment",
    pacient:   "Pacient #4487",
    sala:      "Consulta 8",
    prioritat: "BAIXA",
    hora:      "12:30",
    descripcio:"Revisió trimestral. Insuficiència cardíaca estable.",
    metge_id:  metge1Id
  }
]);
print("✔ Casos d'exemple inserits");

// ── Sol·licituds ─────────────────────────────────────────────
const sol1Id = db.solicituds.insertOne({
  tipus:              "VACANCES",
  dataCreacio:        new Date("2026-02-10"),
  dataInici:          new Date("2026-03-15"),
  dataFinal:          new Date("2026-03-20"),
  tornAfectat:        "MATI",
  motiu:              "Vacances familiars programades",
  estat:              "APROVADA",
  metge_solicitant_id: metge1Id
}).insertedId;

db.solicituds.insertOne({
  tipus:              "CANVI_TORN",
  dataCreacio:        new Date("2026-02-20"),
  dataInici:          new Date("2026-03-04"),
  tornAfectat:        "MATI",
  motiu:              "Visita mèdica personal al matí",
  estat:              "PENDENT",
  metge_solicitant_id: metge1Id
});

db.solicituds.insertOne({
  tipus:               "PERMUTA",
  dataCreacio:         new Date("2026-02-22"),
  tornAfectat:         "MATI",
  motiu:               "Acord mutu per conciliació",
  estat:               "PENDENT",
  metge_solicitant_id: metge1Id,
  metge_receptor_id:   metge2Id,
  torn_ofert_id:       torna1Id,
  torn_demanat_id:     torn3Id
});
print("✔ Sol·licituds d'exemple inserides");

// ── Notificacions ────────────────────────────────────────────
db.notificacions.insertMany([
  {
    tipus:     "AVIS",
    titol:     "Sol·licitud de permuta",
    descripcio:"Dra. Marta Vidal vol permutar el torn de dijous (T) pel teu torn de divendres (M).",
    dataHora:  new Date(Date.now() - 20 * 60 * 1000),
    llegida:   false,
    metge_id:  metge1Id
  },
  {
    tipus:     "INFO",
    titol:     "Torn confirmat",
    descripcio:"El teu torn de demà ha estat confirmat: Tarda (15:00–23:00)",
    dataHora:  new Date(Date.now() - 60 * 60 * 1000),
    llegida:   false,
    metge_id:  metge1Id
  },
  {
    tipus:     "EXITO",
    titol:     "Sol·licitud aprovada",
    descripcio:"La teva sol·licitud de vacances (15-20 març) ha estat aprovada.",
    dataHora:  new Date(Date.now() - 3 * 60 * 60 * 1000),
    llegida:   false,
    metge_id:  metge1Id
  },
  {
    tipus:     "PERILL",
    titol:     "Alerta d'urgència",
    descripcio:"S'ha activat el protocol d'urgència a Planta 2. Consulta el cap de torn.",
    dataHora:  new Date(Date.now() - 5 * 60 * 60 * 1000),
    llegida:   false,
    metge_id:  metge1Id
  }
]);
print("✔ Notificacions d'exemple inserides");

// ============================================================
//  RESUM FINAL
// ============================================================
print("\n══════════════════════════════════════════════════");
print("  MedTorn — Base de dades MongoDB inicialitzada");
print("══════════════════════════════════════════════════");
print("  Col·leccions creades:");
print("   • metges          → " + db.metges.countDocuments()          + " documents");
print("   • caps_torn        → " + db.caps_torn.countDocuments()       + " documents");
print("   • torns            → " + db.torns.countDocuments()           + " documents");
print("   • quadre_torns     → " + db.quadre_torns.countDocuments()    + " documents");
print("   • casos            → " + db.casos.countDocuments()           + " documents");
print("   • solicituds       → " + db.solicituds.countDocuments()      + " documents");
print("   • notificacions    → " + db.notificacions.countDocuments()   + " documents");
print("══════════════════════════════════════════════════\n");
