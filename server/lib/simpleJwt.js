import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function sign(payload, opts = {}) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: Math.floor(Date.now() / 1000) };
  if (opts.expiresIn) body.exp = body.iat + opts.expiresIn;
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedBody = base64url(JSON.stringify(body));
  const toSign = `${encodedHeader}.${encodedBody}`;
  const sig = crypto.createHmac('sha256', SECRET).update(toSign).digest('base64');
  const encodedSig = sig.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${toSign}.${encodedSig}`;
}

export function verify(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, b, s] = parts;
  const toSign = `${h}.${b}`;
  const expected = crypto.createHmac('sha256', SECRET).update(toSign).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  if (expected !== s) return null;
  try {
    const payload = JSON.parse(Buffer.from(b, 'base64').toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}
