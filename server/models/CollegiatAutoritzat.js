// server/models/CollegiatAutoritzat.js
const mongoose = require('mongoose');

const collegiatAutoritzatSchema = new mongoose.Schema({
  numCollegiat: { type: String, required: true, unique: true, trim: true }
}, {
  collection: 'collegiats_autoritzats',
  timestamps: true
});

module.exports = mongoose.model('CollegiatAutoritzat', collegiatAutoritzatSchema);
