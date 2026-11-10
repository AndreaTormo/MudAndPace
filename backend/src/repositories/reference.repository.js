const Category = require('../models/category.model');
const Host = require('../models/host.model');
const Location = require('../models/location.model');

class ReferenceRepository {
  async findCategories(filters = {}) {
    return Category.find(filters).select('name slug').sort({ name: 1 });
  }

  async findHosts(filters = {}) {
    return Host.find(filters).select('name slug').sort({ name: 1 });
  }

  async findLocations(filters = {}) {
    return Location.find(filters).select('name slug city country coordinates').sort({ name: 1 });
  }

  async findCategoryIdsBySlugs(slugs = []) {
    if (!Array.isArray(slugs) || slugs.length === 0) return [];
    return Category.find({ slug: { $in: slugs }, deleted_at: null }).distinct('_id');
  }

  async findHostIdsBySlugs(slugs = []) {
    if (!Array.isArray(slugs) || slugs.length === 0) return [];
    return Host.find({ slug: { $in: slugs }, deleted_at: null }).distinct('_id');
  }

  async findLocationIdsBySlugs(slugs = []) {
    if (!Array.isArray(slugs) || slugs.length === 0) return [];
    return Location.find({ slug: { $in: slugs }, deleted_at: null }).distinct('_id');
  }
}

module.exports = new ReferenceRepository();
