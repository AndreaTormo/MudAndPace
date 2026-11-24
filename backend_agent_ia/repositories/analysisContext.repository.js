const Departure = require('../models/analysisDeparture.model');
const Event = require('../models/analysisEvent.model');

class AnalysisContextRepository {
  async findDepartureById(id) {
    return Departure.findOne({ _id: id, deleted_at: null }).lean();
  }

  async findDeparturesByIds(ids) {
    return Departure.find({ _id: { $in: ids } }).lean();
  }

  async findDeparturesByEventId(eventId) {
    return Departure.find({ eventId, deleted_at: null }).lean();
  }

  async findEventById(id) {
    return Event.findOne({ _id: id, deleted_at: null }).lean();
  }

  async findEventsByIds(ids) {
    return Event.find({ _id: { $in: ids }, deleted_at: null }).lean();
  }
}

module.exports = new AnalysisContextRepository();
