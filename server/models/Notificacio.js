// server/models/Notificacio.js
const mongoose = require('mongoose');

const TIPUS_MAP = {
  INFO:   'info',
  AVIS:   'warning',
  EXITO:  'success',
  PERILL: 'danger'
};

const ICON_MAP = {
  INFO:   'fa-info-circle',
  AVIS:   'fa-exchange-alt',
  EXITO:  'fa-check-circle',
  PERILL: 'fa-exclamation-triangle'
};

const notificacioSchema = new mongoose.Schema({
  tipus: {
    type: String,
    enum: ['INFO', 'AVIS', 'EXITO', 'PERILL'],
    required: true
  },
  titol:     { type: String, required: true },
  descripcio:{ type: String, required: true },
  dataHora:  { type: Date, default: Date.now },
  llegida:   { type: Boolean, default: false },
  metge_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Metge', required: true }
}, {
  collection: 'notificacions',
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } }
});

notificacioSchema.index({ metge_id: 1 });
notificacioSchema.index({ llegida: 1 });
notificacioSchema.index({ metge_id: 1, llegida: 1 });

notificacioSchema.methods.toClient = function () {
  const obj = this.toObject({ virtuals: true });
  return {
    id:    obj._id,
    type:  TIPUS_MAP[obj.tipus] || 'info',
    icon:  ICON_MAP[obj.tipus] || 'fa-info-circle',
    title: obj.titol,
    desc:  obj.descripcio,
    time:  formatRelativeTime(obj.dataHora),
    unread: !obj.llegida,
    llegida: obj.llegida,
    metge_id: obj.metge_id
  };
};

function formatRelativeTime(date) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ara mateix';
  if (minutes < 60) return `Fa ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Fa ${hours} hora${hours > 1 ? 'es' : ''}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ahir';
  return `Fa ${days} dies`;
}

module.exports = mongoose.model('Notificacio', notificacioSchema);
