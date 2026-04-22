// server/models/Cas.js
const mongoose = require('mongoose');

const casSchema = new mongoose.Schema({
  titol:     { type: String, required: true },
  pacient:   { type: String, required: true },
  sala:      { type: String, required: true },
  prioritat: { type: String, enum: ['ALTA', 'MITJA', 'BAIXA'], required: true },
  hora:      { type: String, required: true },
  descripcio:{ type: String, default: '' },
  metge_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Metge', required: true }
}, {
  collection: 'casos',
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } }
});

casSchema.index({ metge_id: 1 });
casSchema.index({ prioritat: 1 });

casSchema.methods.toClient = function () {
  const obj = this.toObject({ virtuals: true });
  return {
    id:       obj._id,
    title:    obj.titol,
    patient:  obj.pacient,
    room:     obj.sala,
    priority: obj.prioritat.toLowerCase(),
    time:     obj.hora,
    detail:   obj.descripcio,
    metge_id: obj.metge_id
  };
};

module.exports = mongoose.model('Cas', casSchema);
