// Reservations vertical (owner: max) — see docs/backlog.md EPIC 2, US-12..US-16.
// Ownership check pattern: req.user.role !== 'admin' && reservation.userId !== req.user.id.

async function create(req, res, next) {
  // TODO (US-12): verify restaurant exists, create reservation owned by req.user.id.
  res.status(501).json({ message: 'Not implemented yet (US-12)' });
}

async function list(req, res, next) {
  // TODO (US-13): admin sees all, user sees only their own (where userId = req.user.id).
  res.status(501).json({ message: 'Not implemented yet (US-13)' });
}

async function getOne(req, res, next) {
  // TODO (US-13): 404 if missing, 403 if not owner/admin.
  res.status(501).json({ message: 'Not implemented yet (US-13)' });
}

async function update(req, res, next) {
  // TODO (US-14): 403 if not owner/admin, else apply and save changes.
  res.status(501).json({ message: 'Not implemented yet (US-14)' });
}

async function remove(req, res, next) {
  // TODO (US-15): 403 if not owner/admin, else destroy().
  res.status(501).json({ message: 'Not implemented yet (US-15)' });
}

module.exports = { create, list, getOne, update, remove };
