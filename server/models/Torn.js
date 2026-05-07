// server/models/Torn.js
const mongoose = require('mongoose');

const TIPUS_MAP = {
  MATI:    'M',
  TARDA:   'T',
  NIT:     'N',
  GUARDIA: 'G',
  LLIURE:  'L',
  BAIXA:   'B'
};

const tornSchema = new mongoose.Schema({
  data:      { type: Date, required: true },
  tipusTorn: {
    type: String,
    enum: ['MATI', 'TARDA', 'NIT', 'GUARDIA', 'LLIURE', 'BAIXA'],
    required: true
  },
  horaInici: { type: String, required: true },
  horaFinal: { type: String, required: true },
  unitat:    { type: String, required: true },
  metge_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Metge', required: true },
  // Caducitat real del torn. MongoDB esborra automàticament el document quan arriba aquest moment.
  expiresAt: { type: Date, required: true }
}, {
  collection: 'torns',
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } }
});

tornSchema.index({ metge_id: 1 });
tornSchema.index({ data: 1 });
tornSchema.index({ metge_id: 1, data: 1 });
tornSchema.index({ tipusTorn: 1 });
tornSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

function computeExpiresAt(data) {
  const base = new Date(data);
  base.setHours(23, 59, 59, 999);
  // Guardem historial recent durant 30 dies i després caduca.
  base.setDate(base.getDate() + 30);
  return base;
}

tornSchema.pre('validate', function (next) {
  if (this.isModified('data') || !this.expiresAt) {
    this.expiresAt = computeExpiresAt(this.data);
  }
  next();
});

tornSchema.methods.toClient = function () {
  const obj = this.toObject({ virtuals: true });
  return {
    id:       obj._id,
    data:     obj.data,
    tipus:    obj.tipusTorn,
    codi:     TIPUS_MAP[obj.tipusTorn] || 'L',
    horaInici: obj.horaInici,
    horaFinal: obj.horaFinal,
    unitat:   obj.unitat,
    metge_id: obj.metge_id
  };
};

module.exports = mongoose.model('Torn', tornSchema);
module.exports.TIPUS_MAP = TIPUS_MAP;
