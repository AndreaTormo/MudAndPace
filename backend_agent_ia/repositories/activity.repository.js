const Activity = require('../models/activity.model');

async function create(data) {
  const doc = await Activity.create(data);
  return doc.toObject();
}

function findOne(id, userId) {
  return Activity.findOne({ _id: id, userId }).lean();
}

async function list(filter, { skip, limit }) {
  const [items, total] = await Promise.all([
    Activity.find(filter).sort({ date: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Activity.countDocuments(filter)
  ]);
  return { items, total };
}

function update(id, userId, set) {
  return Activity.findOneAndUpdate(
    { _id: id, userId },
    { $set: set },
    { new: true, runValidators: true }
  ).lean();
}

function remove(id, userId) {
  return Activity.findOneAndDelete({ _id: id, userId }).lean();
}

async function totals(filter) {
  const [row] = await Activity.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        activities: { $sum: 1 },
        distanceKm: { $sum: '$distanceKm' },
        elevationGainM: { $sum: '$elevationGainM' },
        durationSec: { $sum: '$durationSec' },
        calories: { $sum: '$calories' }
      }
    }
  ]);

  return row ?? { activities: 0, distanceKm: 0, elevationGainM: 0, durationSec: 0, calories: 0 };
}

module.exports = { create, findOne, list, update, remove, totals };
