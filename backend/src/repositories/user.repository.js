const User = require('../models/user.model');

const NOT_DELETED = { deleted_at: null };

class UserRepository {
  async findAll(filters = {}) {
    const query = { ...NOT_DELETED };

    if (typeof filters.isActive === 'boolean') {
      query.isActive = filters.isActive;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.role) {
      query.role = filters.role;
    }

    return User.find(query).sort({ created_At: -1 });
  }

  async findByEmail(email, options = {}) {
    const mongoQuery = User.findOne({ email: String(email).toLowerCase(), ...NOT_DELETED });

    if (options.withPassword) {
      mongoQuery.select('+passwordHash');
    }

    return mongoQuery;
  }

  async findById(id) {
    return User.findOne({ _id: id, ...NOT_DELETED });
  }

  async findByIdIncludingDeleted(id) {
    return User.findById(id);
  }

  async existsByEmail(email) {
    return Boolean(await User.exists({ email: String(email).toLowerCase(), ...NOT_DELETED }));
  }

  async emailExists(email, excludeId) {
    const filter = { email: String(email).toLowerCase(), ...NOT_DELETED };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await User.findOne(filter).select('_id');
    return Boolean(existing);
  }

  async create(data) {
    const created = await User.create(data);
    return this.findById(created._id);
  }

  async updateById(id, data) {
    return User.findOneAndUpdate({ _id: id, ...NOT_DELETED }, data, {
      new: true,
      runValidators: true
    });
  }

  async softDeleteById(id) {
    return User.findByIdAndUpdate(
      id,
      { deleted_at: new Date(), isActive: false, status: 'inactive' },
      { new: true, runValidators: true }
    );
  }

  async hardDeleteById(id) {
    return User.deleteOne({ _id: id });
  }
}

module.exports = new UserRepository();
