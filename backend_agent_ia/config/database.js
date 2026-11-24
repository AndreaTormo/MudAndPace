const mongoose = require('mongoose');
const AiCommentSummary = require('../models/aiCommentSummary.model');
const AiSentimentAnalysis = require('../models/aiSentimentAnalysis.model');

async function ensureIndexes() {
  await Promise.all([
    AiCommentSummary.ensureIndexes(),
    AiSentimentAnalysis.ensureIndexes()
  ]);
}

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI no está definida');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  await ensureIndexes();
  console.log('MongoDB conectada');
}

module.exports = { connectDatabase, ensureIndexes };
