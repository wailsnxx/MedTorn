// server/models/Usuari.js — Usuaris del sistema (autenticació)
'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UsuariSchema = new mongoose.Schema({
  nom:      { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  rol:      { type: String, enum: ['METGE', 'CAP_TORN'], required: true },
  // Només per a rol METGE — apunta al document Metge corresponent
  metge_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Metge', default: null },
  actiu:    { type: Boolean, default: true }
}, { timestamps: true });

// Hash de la contrasenya abans de guardar
UsuariSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Comparació de contrasenya (retorna Promise<boolean>)
UsuariSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Usuari', UsuariSchema);
