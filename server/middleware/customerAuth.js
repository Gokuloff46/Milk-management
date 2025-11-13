import { verifyToken } from '../utils/jwt.js';

export default function customerAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  console.log('Authorization header:', auth); // Debug logging
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.slice(7);
  const payload = verifyToken(token);
  console.log('Token payload:', payload); // Debug logging
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  req.customer = payload;
  next();
}
