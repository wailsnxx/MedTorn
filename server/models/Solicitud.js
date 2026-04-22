// server/models/Solicitud.js
const mongoose = require('mongoose');

const TIPUS_CLIENT_MAP = {
  CANVI_TORN: 'canvi',
  PERMUTA:    'permut',
  BAIXA:      'baixa',
  VACANCES:   'vacances',
  ALTRES:     'altres'
};

const ICON_MAP = {
  CANVI_TORN: 'fa-exchange-alt',
  PERMUTA:    'fa-people-arrows',
  BAIXA:      'fa-user-minus',
  VACANCES:   'fa-umbrella-beach',
  ALTRES:     'fa-file-alt'
};

const solicitudSchema = new mongoose.Schema({
  tipus: {
    type: String,
    enum: ['CANVI_TORN', 'PERMUTA', 'BAIXA', 'VACANCES', 'ALTRES'],
    required: true
  },
  dataCreacio:           { type: Date, default: Date.now },
  dataInici:             { type: Date },
  dataFinal:             { type: Date },
  tornAfectat: {
    type: String,
    enum: ['MATI', 'TARDA', 'NIT', 'GUARDIA', 'LLIURE', 'BAIXA'],
    required: true
  },
  motiu:                 { type: String, default: '' },
  estat: {
    type: String,
    enum: ['PENDENT', 'APROVADA', 'REBUTJADA'],
    required: true,
    default: 'PENDENT'
  },
  metge_solicitant_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Metge', required: true },
  metge_receptor_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Metge' },
  torn_ofert_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Torn' },
  torn_demanat_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Torn' }
}, {
  collection: 'solicituds',
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } }
});

solicitudSchema.index({ metge_solicitant_id: 1 });
solicitudSchema.index({ metge_receptor_id: 1 }, { sparse: true });
solicitudSchema.index({ estat: 1 });
solicitudSchema.index({ tipus: 1 });

solicitudSchema.methods.toClient = function (metgeReceptorNom) {
  const obj = this.toObject({ virtuals: true });
  const formatDate = d => d ? new Date(d).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  let detail = '';
  if (obj.dataInici && obj.dataFinal) {
    detail = `${formatDate(obj.dataInici)} – ${formatDate(obj.dataFinal)}`;
  } else if (obj.dataInici) {
    detail = formatDate(obj.dataInici);
  }
  if (obj.tornAfectat) {
    const tornLabels = { MATI: 'Matí', TARDA: 'Tarda', NIT: 'Nit', GUARDIA: 'Guàrdia', LLIURE: 'Lliure', BAIXA: 'Baixa' };
    if (detail) detail += ` · ${tornLabels[obj.tornAfectat] || obj.tornAfectat}`;
  }

  return {
    id:           obj._id,
    type:         TIPUS_CLIENT_MAP[obj.tipus] || 'altres',
    tipus:        obj.tipus,
    icon:         ICON_MAP[obj.tipus] || 'fa-file-alt',
    title:        titolSolicitud(obj.tipus, metgeReceptorNom),
    detail:       detail,
    comment:      obj.motiu || '',
    date:         formatDate(obj.dataCreacio),
    status:       obj.estat.toLowerCase(),
    estat:        obj.estat,
    metge_solicitant_id: obj.metge_solicitant_id,
    metge_receptor_id:   obj.metge_receptor_id
  };
};

function titolSolicitud(tipus, metgeReceptorNom) {
  switch (tipus) {
    case 'CANVI_TORN': return 'Canvi de torn';
    case 'PERMUTA':    return metgeReceptorNom ? `Permuta amb ${metgeReceptorNom}` : 'Permuta de torn';
    case 'BAIXA':      return 'Comunicar baixa';
    case 'VACANCES':   return 'Sol·licitud de vacances';
    default:           return 'Sol·licitud';
  }
}

module.exports = mongoose.model('Solicitud', solicitudSchema);
