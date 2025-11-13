import { verify } from '../lib/simpleJwt.js';

export default async function adminAuth(req, res, next) {
  try {
    const auth = req.header('authorization') || req.header('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Authorization required' });
    const token = auth.split(' ')[1];
    const payload = verify(token);
    if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
    req.admin = { id: payload.sub, username: payload.username };
    next();
  } catch (err) {
    res.status(500).json({ error: 'Admin auth failed', details: err.message });
  }
}
