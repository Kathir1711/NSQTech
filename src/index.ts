import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';

type Role = 'General User' | 'Admin';
interface User { id: string; userId: string; name: string; email: string; role: Role; active: boolean; hash: string; lastLogin?: string }
interface Rec { id: string; title: string; owner: string; category: string; updatedAt: string; access: Role | 'General User' }

const SECRET = process.env.JWT_SECRET || 'ledgerkey-dev-secret';
const DB_FILE = path.join(__dirname, '..', 'db.json'); // local JSON store (swap for Mongo / DynamoDB in repo layer)

// ---------- tiny repository layer: replace internals to move to MongoDB / DynamoDB ----------
const hashPw = (pw: string) => { const s = randomBytes(8).toString('hex'); return `${s}:${scryptSync(pw, s, 32).toString('hex')}`; };
const checkPw = (pw: string, h: string) => { const [s, k] = h.split(':'); return timingSafeEqual(scryptSync(pw, s, 32), Buffer.from(k, 'hex')); };
const seed = () => ({
  users: [
    { id: randomUUID(), userId: 'admin', name: 'Asha Verma', email: 'asha@ledgerkey.dev', role: 'Admin', active: true, hash: hashPw('Admin@123') },
    { id: randomUUID(), userId: 'alice', name: 'Alice Rao', email: 'alice@ledgerkey.dev', role: 'General User', active: true, hash: hashPw('User@123') },
    { id: randomUUID(), userId: 'bob', name: 'Bob Iyer', email: 'bob@ledgerkey.dev', role: 'General User', active: false, hash: hashPw('User@123') }
  ] as User[],
  records: [
    ['Q3 product roadmap', 'Product', 'General User'], ['Office holiday calendar', 'HR', 'General User'],
    ['Public API changelog', 'Engineering', 'General User'], ['Vendor onboarding guide', 'Procurement', 'General User'],
    ['Payroll register – Sept', 'Finance', 'Admin'], ['Production DB credentials rotation', 'Security', 'Admin'],
    ['Board meeting minutes', 'Legal', 'Admin'], ['Audit findings 2026', 'Compliance', 'Admin']
  ].map(([title, category, access], i) => ({ id: `REC-${100 + i}`, title, category, access, owner: ['Meera', 'Dev', 'Kabir', 'Isha'][i % 4], updatedAt: new Date(Date.now() - i * 864e5 * 3).toISOString() })) as Rec[]
});
const load = () => { if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(seed(), null, 2)); return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as ReturnType<typeof seed>; };
const save = (d: ReturnType<typeof seed>) => fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2));
const pub = ({ hash, ...u }: User) => u;

// ---------- middleware ----------
interface Authed extends Request { me?: User }
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
/** ?delay=<ms> simulates network/cloud latency (capped at 10s) so the UI's async handling can be demonstrated. */
const latency = async (req: Request, _: Response, next: NextFunction) => { await sleep(Math.min(Math.max(Number(req.query.delay) || 0, 0), 10000)); next(); };
const auth = (req: Authed, res: Response, next: NextFunction) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    const { sub } = jwt.verify(t, SECRET) as { sub: string };
    const me = load().users.find(u => u.id === sub);
    if (!me || !me.active) throw new Error();
    req.me = me; next();
  } catch { res.status(401).json({ message: 'Session expired. Sign in again.' }); }
};
const adminOnly = (req: Authed, res: Response, next: NextFunction) =>
  req.me?.role === 'Admin' ? next() : res.status(403).json({ message: 'Admin role required.' });

// ---------- routes ----------
const app = express();
app.use(cors(), express.json(), latency);

app.post('/api/auth/login', (req, res) => {
  const { userId, password, role } = req.body || {};
  const db = load();
  const u = db.users.find(x => x.userId === String(userId).toLowerCase());
  if (!u || !checkPw(String(password), u.hash) || u.role !== role) return res.status(401).json({ message: 'User ID, password or role is incorrect.' });
  if (!u.active) return res.status(403).json({ message: 'This account is disabled. Contact an admin.' });
  u.lastLogin = new Date().toISOString(); save(db);
  res.json({ token: jwt.sign({ sub: u.id }, SECRET, { expiresIn: '2h' }), user: pub(u) });
});

app.get('/api/me', auth, (req: Authed, res) => res.json(pub(req.me!)));

app.get('/api/records', auth, (req: Authed, res) => {
  const isAdmin = req.me!.role === 'Admin';
  res.json(load().records.map(r => {
    const granted = isAdmin || r.access === 'General User';
    return granted ? { ...r, granted } : { id: r.id, category: r.category, access: r.access, title: 'Restricted record', owner: '—', updatedAt: r.updatedAt, granted };
  }));
});

app.get('/api/users', auth, adminOnly, (_req, res) => res.json(load().users.map(pub)));

app.post('/api/users', auth, adminOnly, (req, res) => {
  const { userId, name, email, password, role } = req.body || {};
  if (!userId || !name || !password || !['Admin', 'General User'].includes(role)) return res.status(400).json({ message: 'User ID, name, password and role are required.' });
  const db = load();
  if (db.users.some(u => u.userId === String(userId).toLowerCase())) return res.status(409).json({ message: `User ID "${userId}" is already taken.` });
  const u: User = { id: randomUUID(), userId: String(userId).toLowerCase(), name, email: email || '', role, active: true, hash: hashPw(password) };
  db.users.push(u); save(db); res.status(201).json(pub(u));
});

app.put('/api/users/:id', auth, adminOnly, (req: Authed, res) => {
  const db = load(); const u = db.users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found.' });
  const { name, email, role, active, password } = req.body || {};
  if (u.id === req.me!.id && (active === false || (role && role !== u.role))) return res.status(400).json({ message: 'You cannot disable or demote your own account.' });
  Object.assign(u, { name: name ?? u.name, email: email ?? u.email, role: role ?? u.role, active: active ?? u.active });
  if (password) u.hash = hashPw(password);
  save(db); res.json(pub(u));
});

app.delete('/api/users/:id', auth, adminOnly, (req: Authed, res) => {
  if (req.params.id === req.me!.id) return res.status(400).json({ message: 'You cannot delete your own account.' });
  const db = load(); db.users = db.users.filter(u => u.id !== req.params.id); save(db); res.status(204).end();
});

app.listen(3000, () => console.log('Ledgerkey API on http://localhost:3000'));
