const mongoose = require('mongoose');
const UserInteraction = require('../models/UserInteraction');
const CompassView = require('../models/CompassView');
const WinsView = require('../models/WinsView');

// Helper to get yyyy-mm-dd string from a Date (using local time, not UTC)
function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function upsertCompassView(doc) {
  // Process both compass and reflection kinds
  if (doc.kind !== 'compass' && doc.kind !== 'reflection') return;
  
  const date = toLocalDateString(doc.capturedAt || new Date());
  const update = {};
  
  // Check both promptText and interactionMeta for type detection
  const promptText = (doc.promptText || '').toLowerCase();
  const metaType = doc.interactionMeta?.type;
  
  // Handle mood
  if (promptText.includes('mood') || metaType === 'mood') {
    update.mood = doc.numericAnswer;
  }
  
  // Handle energy
  if (promptText.includes('energy') || metaType === 'energy') {
    update.energy = doc.numericAnswer;
  }

  // Handle note
  if (metaType === 'note' && doc.responseText) {
    update.note = doc.responseText;
  }
  
  // Handle evening reflection
  if (metaType === 'evening-reflection' && doc.responseText) {
    update.eveningNote = doc.responseText;
    update.reflectionInteractionId = doc._id;
  }
  
  // Only update if we have something to update
  if (Object.keys(update).length > 0) {
    const result = await CompassView.findOneAndUpdate(
      { user: doc.user, date },
      { $set: update, $setOnInsert: { user: doc.user, date } },
      { upsert: true, new: true }
    );
  }
}

async function upsertWinsView(doc) {
  // Only process win kind
  if (doc.kind !== 'win') return;
  
  // Assume promptText or interactionMeta contains enough info to distinguish title/description
  const date = toLocalDateString(doc.capturedAt || new Date());
  
  if (doc.promptText && doc.promptText.toLowerCase().includes('title')) {
    await WinsView.findOneAndUpdate(
      { user: doc.user, achievedAt: date },
      { $set: { titleInteractionId: doc._id }, $setOnInsert: { user: doc.user, achievedAt: date } },
      { upsert: true, new: true }
    );
  } else if (doc.promptText && doc.promptText.toLowerCase().includes('description')) {
    await WinsView.findOneAndUpdate(
      { user: doc.user, achievedAt: date },
      { $set: { descriptionInteractionId: doc._id }, $setOnInsert: { user: doc.user, achievedAt: date } },
      { upsert: true, new: true }
    );
  }
}

async function startWorker() {
  await mongoose.connect(process.env.MONGO_URI);
  const changeStream = UserInteraction.watch([], { fullDocument: 'updateLookup' });
  
  changeStream.on('change', async (change) => {
    if (change.operationType === 'insert' || change.operationType === 'update') {
      const doc = change.fullDocument;      
      if (doc.kind === 'compass') {
        await upsertCompassView(doc);
      } else if (doc.kind === 'reflection') {
        await upsertCompassView(doc);
      } else if (doc.kind === 'win') {
        await upsertWinsView(doc);
      }
    }
  });
}

if (require.main === module) {
  startWorker().catch(err => {
    console.error('ViewBuilder worker error:', err);
    process.exit(1);
  });
}

module.exports = { upsertCompassView, upsertWinsView, startWorker }; 