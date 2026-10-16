const Category = require('../models/category.model');
const Location = require('../models/location.model');
const Host = require('../models/host.model');

const ACTIVE = { deleted_at: null, isActive: true };

class ReferenceService {
  async listCategories() {
    return Category.find(ACTIVE).select('name slug').sort({ name: 1 });
  }

  async listLocations() {
    return Location.find(ACTIVE).select('name slug city').sort({ name: 1 });
  }

  async listHosts() {
    return Host.find(ACTIVE).select('name slug').sort({ name: 1 });
  }
}

module.exports = new ReferenceService();
