const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'Server misconfiguration' });
    }
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { authMiddleware };
