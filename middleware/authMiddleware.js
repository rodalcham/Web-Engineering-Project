function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }

  next();
}

function canEditResource(req, ownerUserId) {
  return req.session.user && (
    req.session.user.role === 'admin' ||
    Number(req.session.user.user_id) === Number(ownerUserId)
  );
}

module.exports = {
  requireAuth,
  canEditResource,
};
