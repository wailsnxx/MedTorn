// server/config/db.js — Connexió Mongoose a MongoDB
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medtorn';
  try {
    await mongoose.connect(uri);
    console.log(`✔ MongoDB connectat: ${uri}`);
  } catch (err) {
    console.error('✘ Error connectant a MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
