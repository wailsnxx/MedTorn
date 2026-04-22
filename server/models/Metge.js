// server/models/Metge.js
const mongoose = require('mongoose');

const competenciaSchema = new mongoose.Schema({
  nom:             { type: String, required: true },
  nivell:          { type: String, enum: ['ACREDITAT', 'AVANCAT', 'EXPERT'], required: true },
  dataAcreditacio: { type: Date }
}, { _id: false });

const metgeSchema = new mongoose.Schema({
  nom:             { type: String, required: true },
  especialitat:    { type: String, required: true },
  subespecialitat: { type: String, default: null },
  unitat:          { type: String, required: true },
  numCollegiat:    { type: String, required: true, unique: true },
  anyExperiencia:  { type: Number, required: true, min: 0 },
  idiomes:         [{ type: String }],
  estat: {
    type: String,
    enum: ['DISPONIBLE', 'EN_TORN', 'BAIXA', 'VACANCES', 'OCUPAT', 'PAUSA'],
    required: true,
    default: 'DISPONIBLE'
  },
  avatar:          { type: String },
  competencies:    [competenciaSchema]
}, {
  collection: 'metges',
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } }
});

metgeSchema.index({ numCollegiat: 1 }, { unique: true });
metgeSchema.index({ especialitat: 1 });
metgeSchema.index({ estat: 1 });
metgeSchema.index({ unitat: 1 });

// Helper per convertir estat MongoDB → frontend
const ESTAT_MAP = {
  DISPONIBLE: 'disponible',
  EN_TORN:    'en-torn',
  BAIXA:      'baixa',
  VACANCES:   'vacances',
  OCUPAT:     'en-torn',
  PAUSA:      'disponible'
};

metgeSchema.methods.toClient = function () {
  const obj = this.toObject({ virtuals: true });
  return {
    id:            obj._id,
    name:          obj.nom,
    specialty:     obj.especialitat,
    subspecialty:  obj.subespecialitat || '',
    unit:          obj.unitat,
    collegiat:     obj.numCollegiat,
    experience:    obj.anyExperiencia,
    languages:     obj.idiomes || [],
    status:        ESTAT_MAP[obj.estat] || 'disponible',
    estat:         obj.estat,
    avatar:        obj.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(obj.nom)}&background=1a5276&color=fff&size=120&rounded=true&bold=true`,
    competences:   (obj.competencies || []).map(c => c.nom),
    competenciesDetail: (obj.competencies || []).map(c => ({
      name:  c.nom,
      level: c.nivell.charAt(0) + c.nivell.slice(1).toLowerCase()
    })),
    // shifts es calcula per separat des de torns
    shifts: []
  };
};

module.exports = mongoose.model('Metge', metgeSchema);
