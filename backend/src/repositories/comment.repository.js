const Comment = require('../models/comment.model');

const NOT_DELETED = { deleted_at: null };
const DEFAULT_PAGE_SIZE = 20;

class CommentRepository {
  async findByDepartureId(departureId, { page = 1, pageSize = DEFAULT_PAGE_SIZE, includeHidden = false } = {}) {
    const query = { departureId, ...NOT_DELETED };
    if (!includeHidden) {
      query.status = { $in: ['visible', 'reported'] };
    }
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      Comment.find(query).sort({ created_At: -1, _id: -1 }).skip(skip).limit(pageSize),
      Comment.countDocuments(query)
    ]);

    return { data, total };
  }

  async findAll({ page = 1, pageSize = DEFAULT_PAGE_SIZE, status } = {}) {
    const query = { ...NOT_DELETED };
    if (status) {
      query.status = status;
    }
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      Comment.find(query).sort({ created_At: -1, _id: -1 }).skip(skip).limit(pageSize),
      Comment.countDocuments(query)
    ]);

    return { data, total };
  }

  async findLatestByUser(userId, { excludeId } = {}) {
    const query = { userId, ...NOT_DELETED };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    return Comment.findOne(query).sort({ created_At: -1, _id: -1 });
  }

  async findRecentByHash(userId, contentHash, since, { excludeId } = {}) {
    const query = { userId, contentHash, created_At: { $gte: since } };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    return Comment.findOne(query).sort({ created_At: -1 });
  }

  async findById(id) {
    return Comment.findOne({ _id: id, ...NOT_DELETED });
  }

  async findByIdIncludingDeleted(id) {
    return Comment.findById(id);
  }

  async create(data) {
    return Comment.create(data);
  }

  async updateContent(id, content, contentHash) {
    return Comment.findOneAndUpdate(
      { _id: id, ...NOT_DELETED },
      { $set: { content, contentHash } },
      { new: true, runValidators: true }
    );
  }

  async setStatus(id, status) {
    return Comment.findOneAndUpdate(
      { _id: id, ...NOT_DELETED },
      { $set: { status } },
      { new: true, runValidators: true }
    );
  }

  async addReport(id, userId) {
    return Comment.findOneAndUpdate(
      { _id: id, ...NOT_DELETED, reportedBy: { $ne: userId } },
      { $addToSet: { reportedBy: userId } },
      { new: true, runValidators: true }
    );
  }

  async softDeleteById(id) {
    return Comment.findOneAndUpdate(
      { _id: id, ...NOT_DELETED },
      { $set: { deleted_at: new Date() } },
      { new: true, runValidators: true }
    );
  }

  async restoreById(id) {
    return Comment.findOneAndUpdate(
      { _id: id, deleted_at: { $ne: null } },
      { $set: { deleted_at: null } },
      { new: true, runValidators: true }
    );
  }

  async findAllDeleted({ page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
    const query = { deleted_at: { $ne: null } };
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      Comment.find(query).sort({ deleted_at: -1, _id: -1 }).skip(skip).limit(pageSize),
      Comment.countDocuments(query)
    ]);

    return { data, total };
  }

  async deleteByDepartureId(departureId) {
    return Comment.deleteMany({ departureId });
  }
}

module.exports = new CommentRepository();
