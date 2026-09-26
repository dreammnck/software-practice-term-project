// Restaurants vertical (owner: max) — see docs/backlog.md EPIC 2, US-11.

async function list(req, res, next) {
  // TODO (US-11): return Restaurant.find() sorted by name.
  res.status(501).json({ message: 'Not implemented yet (US-11)' });
}

async function getById(req, res, next) {
  // TODO (US-11): Restaurant.findById(req.params.id), 404 if missing.
  res.status(501).json({ message: 'Not implemented yet (US-11)' });
}

module.exports = { list, getById };
