const service = require('../services/trailRoute.service');

async function list(req, res) { res.json({ data: await service.list(req.query) }); }
async function getById(req, res) { res.json({ data: await service.getById(req.params.id) }); }
async function getBySlug(req, res) { res.json({ data: await service.getBySlug(req.params.slug) }); }
async function create(req, res) { res.status(201).json({ data: await service.create(req.body) }); }
async function update(req, res) { res.json({ data: await service.update(req.params.id, req.body) }); }
async function softDelete(req, res) { res.json({ data: await service.softDelete(req.params.id) }); }
async function restore(req, res) { res.json({ data: await service.restore(req.params.id) }); }
async function activate(req, res) { res.json({ data: await service.activate(req.params.id) }); }
async function deactivate(req, res) { res.json({ data: await service.deactivate(req.params.id) }); }
async function nearby(req, res) { res.json({ data: await service.nearby(req.query) }); }

module.exports = { list, getById, getBySlug, create, update, softDelete, restore, activate, deactivate, nearby };
