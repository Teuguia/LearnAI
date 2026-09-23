import { advanced } from './advanced-lessons.mjs';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync, statSync, createReadStream } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase, atomic } from './database.mjs';
import { passwordHash, passwordMatches, digest, newToken } from './auth.mjs';
import { PLANS, planById, normalizeReference, addMonth, dayKey, imagePrompt, dailyExamples } from './domain.mjs';

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new HttpError(status, message); };
function field(value, min, max, name) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) fail(400, `${name} : saisie invalide.`);
  return value.trim();
}
async function readBody(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) fail(415, 'Un contenu JSON est requis.');
  let text = '';
  for await (const chunk of req) { text += chunk; if (Buffer.byteLength(text) > 16384) fail(413, 'Demande trop volumineuse.'); }
  try { const data = JSON.parse(text); if (!data || Array.isArray(data) || typeof data !== 'object') throw Error(); return data; }
  catch { fail(400, 'Demande JSON invalide.'); }
}
export function createApplication({ dbPath = 'server/data/learnai.sqlite', now = Date.now,
  manualPayments = false, origins = [], mediaDir = 'server/media', merchantNumber = '', supportNumber = '' } = {}) {
  if (manualPayments && !/^\+2376\d{8}$/.test(merchantNumber)) throw new Error('ORANGE_MONEY_MERCHANT must be configured before enabling manual payments.');
  if (supportNumber && !/^\+2376\d{8}$/.test(supportNumber)) throw new Error('WHATSAPP_SUPPORT_NUMBER must use the +237 format.');
  const db = openDatabase(dbPath);
  const lessons = [...JSON.parse(readFileSync(new URL('./lessons.json', import.meta.url), 'utf8')), ...advanced];
  const limits = new Map();
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const active = id => get('SELECT * FROM grants WHERE user_id=? AND revoked IS NULL AND starts<=? AND ends>? ORDER BY ends DESC LIMIT 1', id, now(), now());
  const membership = id => {
    const grant = active(id); if (!grant) return null;
    let ends = grant.ends;
    for (const future of all('SELECT starts,ends FROM grants WHERE user_id=? AND plan=? AND revoked IS NULL AND starts>=? ORDER BY starts', id, grant.plan, grant.starts)) {
      if (future.starts > ends) break;
      ends = Math.max(ends, future.ends);
    }
    return { plan: grant.plan, ends };
  };
  const requireMember = user => { const grant = active(user.id); if (!grant) fail(403, 'Un abonnement actif est nécessaire.'); return grant; };
  const requireAdmin = user => { if (user.role !== 'admin') fail(403, 'Accès administrateur requis.'); };
  const canRead = (grant, lesson) => lesson.level === 'beginner' || grant.plan !== 'essential';
  const findLesson = id => lessons.find(l => l.id === id) || fail(404, 'Leçon introuvable.');
  const videoPath = id => join(mediaDir, `${id}.mp4`);
  function rateLimit(key, limit, duration) {
    const current = now();
    for (const [k, item] of limits) if (item.until <= current) limits.delete(k);
    const value = limits.get(key) || { count: 0, until: current + duration };
    if (value.count >= limit) fail(429, 'Trop de tentatives. Réessayez plus tard.');
    value.count++; limits.set(key, value);
  }
  function authenticate(req) {
    const bearer = req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    if (!bearer) fail(401, 'Connectez-vous pour continuer.');
    const user = get('SELECT u.* FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.hash=? AND s.expires>?', digest(bearer), now());
    if (!user) fail(401, 'Votre session a expiré. Reconnectez-vous.');
    return user;
  }
  const publicUser = u => ({ id: u.id, email: u.email, name: u.name, role: u.role });
  const audit = (user, action, payment, detail) => run('INSERT INTO audit VALUES(?,?,?,?,?,?)', randomUUID(), user.id, action, payment, now(), detail);
  function session(user) {
    const token = newToken();
    run('DELETE FROM sessions WHERE expires<=?', now());
    run('INSERT INTO sessions VALUES(?,?,?)', digest(token), user.id, now() + 7 * 86400000);
    return { token, user: publicUser(user) };
  }
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
    try {
      const origin = req.headers.origin;
      if (origin && !origins.includes(origin)) fail(403, 'Origine non autorisée.');
      if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
        res.writeHead(204); res.end(); return;
      }
      const url = new URL(req.url, 'http://localhost'); const path = url.pathname; const method = req.method;
      const ip = req.socket.remoteAddress;
      rateLimit(`global:${ip}`, 600, 60000);
      if (method === 'GET' && path === '/health') return send({ ok: true });
      if (method === 'GET' && path === '/catalog') return send({ plans: PLANS, manualPayments, merchant: manualPayments ? merchantNumber : null,
        lessons: lessons.map(({ id, title, tag, minutes, level }) => ({ id, title, tag, minutes, level, video: existsSync(videoPath(id)) })) });
      if (method === 'POST' && ['/auth/register', '/auth/login'].includes(path)) {
        rateLimit(`auth:${ip}`, 30, 15 * 60000);
        const body = await readBody(req);
        const email = field(body.email, 5, 200, 'E-mail').toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Adresse e-mail invalide.');
        const password = field(body.password, 10, 128, 'Mot de passe (10 caractères minimum)');
        rateLimit(`email:${email}`, 15, 15 * 60000);
        if (path.endsWith('register')) {
          const name = field(body.name, 2, 80, 'Nom'); const hash = await passwordHash(password);
          try { run('INSERT INTO users(id,email,name,password,created) VALUES(?,?,?,?,?)', randomUUID(), email, name, hash, now()); }
          catch (error) { if (error.code?.startsWith('ERR_SQLITE')) fail(409, 'Inscription impossible avec cette adresse. Essayez de vous connecter.'); throw error; }
          return send(session(get('SELECT * FROM users WHERE email=?', email)), 201);
        }
        const user = get('SELECT * FROM users WHERE email=?', email);
        // Derive even for unknown users to avoid the obvious fast path.
        const match = await passwordMatches(password, user?.password || `${'0'.repeat(32)}:${'0'.repeat(128)}`);
        if (!user || !match) fail(401, 'E-mail ou mot de passe incorrect.');
        return send(session(user));
      }
      if (method === 'GET' && path.startsWith('/media/')) {
        const ticket = get('SELECT * FROM video_tickets WHERE hash=? AND expires>?', digest(url.searchParams.get('ticket') || ''), now());
        const id = path.slice('/media/'.length); const grant = ticket && active(ticket.user_id);
        if (!ticket || ticket.lesson_id !== id || grant?.plan !== 'complete') fail(403, 'Lien vidéo expiré ou accès indisponible.');
        findLesson(id); const file = videoPath(id); if (!existsSync(file)) fail(404, 'Vidéo non publiée.');
        const size = statSync(file).size; const range = req.headers.range;
        let start = 0, end = size - 1;
        if (range) {
          const match = /^bytes=(\d+)-(\d*)$/.exec(range);
          if (!match) { res.setHeader('Content-Range', `bytes */${size}`); fail(416, 'Plage vidéo invalide.'); }
          start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
          if (start > end || start >= size) { res.setHeader('Content-Range', `bytes */${size}`); fail(416, 'Plage vidéo invalide.'); }
          res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
        }
        res.writeHead(range ? 206 : 200, { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
        const stream = createReadStream(file, { start, end });
        stream.on('error', () => res.destroy()); res.on('close', () => stream.destroy()); stream.pipe(res); return;
      }
      const user = authenticate(req);
      if (method === 'POST' && path === '/auth/logout') {
        run('DELETE FROM sessions WHERE hash=?', digest(req.headers.authorization.slice(7))); run('DELETE FROM video_tickets WHERE user_id=?', user.id); return send({ ok: true });
      }
      if (method === 'GET' && path === '/me') return send({ user: publicUser(user), membership: membership(user.id),
        payments: all('SELECT id,plan,amount,reference,phone,status,created,reason FROM payments WHERE user_id=? ORDER BY created DESC', user.id),
        progress: all('SELECT lesson_id,completed,favorite,draft FROM progress WHERE user_id=?', user.id) });
      if (method === 'GET' && path === '/support') {
        if (requireMember(user).plan !== 'complete') fail(403, 'L’assistance est réservée à l’offre Complet.');
        if (!supportNumber) fail(503, 'L’assistance est temporairement indisponible. Réessayez plus tard.');
        return send({ url: `https://wa.me/${supportNumber.slice(1)}?text=${encodeURIComponent('Bonjour, je suis abonné à LearnAI Complet et je souhaite de l’aide pour ma formation.')}` });
      }
      if (method === 'POST' && path === '/payments') {
        if (!manualPayments) fail(403, 'Le paiement manuel n’est pas proposé sur ce service.');
        const body = await readBody(req); const plan = planById(body.plan); if (!plan) fail(400, 'Offre inconnue.');
        const reference = normalizeReference(body.reference);
        if (!/^[A-Z0-9-]{6,80}$/.test(reference)) fail(400, 'Référence Orange Money : 6 à 80 lettres, chiffres ou tirets.');
        const phone = field(body.phone, 9, 16, 'Numéro payeur').replace(/\s/g, '');
        if (!/^(?:\+?237)?6\d{8}$/.test(phone)) fail(400, 'Indiquez un numéro camerounais valide.');
        return send(atomic(db, () => {
          const grant = active(user.id);
          if (grant && grant.plan !== plan.id) fail(409, 'Le changement d’offre sera possible à la fin de votre abonnement actuel.');
          const existing = get('SELECT * FROM payments WHERE reference=?', reference);
          if (existing) {
            if (existing.user_id === user.id && existing.plan === plan.id && existing.phone === phone) return { payment: existing };
            fail(409, 'Cette référence a déjà été déclarée. Contactez le support si nécessaire.');
          }
          if (get("SELECT id FROM payments WHERE user_id=? AND status='pending'", user.id)) fail(409, 'Un paiement est déjà en cours de vérification.');
          const id = randomUUID();
          run('INSERT INTO payments(id,user_id,plan,amount,reference,phone,created) VALUES(?,?,?,?,?,?,?)', id, user.id, plan.id, plan.price, reference, phone, now());
          return { payment: get('SELECT * FROM payments WHERE id=?', id) };
        }), 201);
      }
      if (path.startsWith('/admin/')) {
        requireAdmin(user);
        if (method === 'GET' && path === '/admin/payments') return send({ payments: all("SELECT p.*,u.name,u.email FROM payments p JOIN users u ON p.user_id=u.id ORDER BY CASE WHEN p.status='pending' THEN 0 ELSE 1 END,p.created DESC LIMIT 200") });
        const match = /^\/admin\/payments\/([^/]+)\/(approve|reject|revoke)$/.exec(path);
        if (method === 'POST' && match) {
          const body = await readBody(req); const [, id, action] = match;
          return send(atomic(db, () => {
            const payment = get('SELECT * FROM payments WHERE id=?', id); if (!payment) fail(404, 'Paiement introuvable.');
            if (action === 'approve') {
              if (payment.status === 'approved') return { ok: true, alreadyReviewed: true };
              if (payment.status !== 'pending') fail(409, 'Ce paiement ne peut plus être validé.');
              if (body.confirmed !== true || normalizeReference(body.verifiedReference) !== payment.reference || body.verifiedAmount !== payment.amount)
                fail(400, 'Confirmez la référence et le montant retrouvés dans votre historique Orange Money.');
              const grant = active(payment.user_id);
              if (grant && grant.plan !== payment.plan) fail(409, 'Une autre offre est active. Attendez son expiration.');
              const last = get('SELECT MAX(ends) AS ends FROM grants WHERE user_id=? AND revoked IS NULL', payment.user_id);
              const starts = Math.max(now(), last?.ends || 0); const ends = addMonth(starts);
              run('INSERT INTO grants(id,user_id,payment_id,plan,starts,ends) VALUES(?,?,?,?,?,?)', randomUUID(), payment.user_id, id, payment.plan, starts, ends);
              run("UPDATE payments SET status='approved',reviewed=?,reviewer=? WHERE id=?", now(), user.id, id);
              audit(user, action, id, `Montant ${payment.amount} XAF et référence vérifiés manuellement`);
            } else {
              const reason = field(body.reason, 5, 500, 'Motif');
              if (action === 'reject' && payment.status !== 'pending') fail(409, 'Ce paiement a déjà été traité.');
              if (action === 'revoke' && payment.status !== 'approved') fail(409, 'Seul un paiement validé peut être révoqué.');
              run('UPDATE payments SET status=?,reason=?,reviewed=?,reviewer=? WHERE id=?', action === 'reject' ? 'rejected' : 'revoked', reason, now(), user.id, id);
              if (action === 'revoke') run('UPDATE grants SET revoked=? WHERE payment_id=?', now(), id);
              audit(user, action, id, reason);
            }
            return { ok: true };
          }));
        }
      }
      const lessonMatch = /^\/lessons\/([^/]+)(?:\/(progress|video-ticket))?$/.exec(path);
      if (lessonMatch) {
        const lesson = findLesson(lessonMatch[1]); const grant = requireMember(user);
        if (!canRead(grant, lesson)) fail(403, 'Cette leçon nécessite l’offre Créatif ou Complet.');
        if (method === 'GET' && !lessonMatch[2]) return send({ lesson: { ...lesson, video: existsSync(videoPath(lesson.id)) } });
        if (method === 'POST' && lessonMatch[2] === 'video-ticket') {
          if (grant.plan !== 'complete') fail(403, 'Les vidéos sont réservées à l’offre Complet.');
          if (!existsSync(videoPath(lesson.id))) fail(404, 'Cette vidéo n’est pas encore publiée.');
          const token = newToken(); run('DELETE FROM video_tickets WHERE expires<=?', now());
          run('INSERT INTO video_tickets VALUES(?,?,?,?)', digest(token), user.id, lesson.id, now() + 30 * 60000);
          return send({ path: `/media/${lesson.id}?ticket=${token}` });
        }
        if (method === 'PUT' && lessonMatch[2] === 'progress') {
          const body = await readBody(req); const old = get('SELECT * FROM progress WHERE user_id=? AND lesson_id=?', user.id, lesson.id);
          if (body.answer !== undefined && body.answer !== lesson.answer) fail(400, 'Réponse incorrecte. Relisez la leçon.');
          const draft = body.draft === undefined ? old?.draft || '' : field(body.draft || ' ', 0, 4000, 'Brouillon');
          const favorite = typeof body.favorite === 'boolean' ? Number(body.favorite) : old?.favorite || 0;
          run('INSERT INTO progress VALUES(?,?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET completed=excluded.completed,favorite=excluded.favorite,draft=excluded.draft',
            user.id, lesson.id, body.answer === lesson.answer ? 1 : old?.completed || 0, favorite, draft);
          return send({ ok: true });
        }
      }
      if (method === 'GET' && path === '/prompts') {
        const grant = requireMember(user); const day = dayKey(now());
        const history = all('SELECT id,prompt,created FROM images WHERE user_id=? AND day=? ORDER BY created DESC', user.id, day);
        return send({ day, examples: dailyExamples(grant.plan, now()), history,
          remaining: grant.plan === 'complete' ? null : grant.plan === 'creative' ? Math.max(0, 10 - history.length) : 0,
          imageAccess: grant.plan !== 'essential' });
      }
      if (method === 'POST' && path === '/prompts/image') {
        const body = await readBody(req);
        const input = { subject: field(body.subject, 3, 500, 'Sujet'), style: field(body.style, 2, 120, 'Style'), format: field(body.format, 2, 80, 'Format') };
        const key = field(body.requestKey, 10, 100, 'Identifiant de demande');
        return send(atomic(db, () => {
          const grant = requireMember(user); if (grant.plan === 'essential') fail(403, 'Les prompts image nécessitent Créatif ou Complet.');
          const existing = get('SELECT * FROM images WHERE user_id=? AND request_key=?', user.id, key); if (existing) return { prompt: existing.prompt };
          const day = dayKey(now()); const count = get('SELECT COUNT(*) AS n FROM images WHERE user_id=? AND day=?', user.id, day).n;
          if (grant.plan === 'creative' && count >= 10) fail(429, 'Vos 10 prompts image du jour sont utilisés. Revenez après minuit, heure du Cameroun.');
          const prompt = imagePrompt(input);
          run('INSERT INTO images VALUES(?,?,?,?,?,?)', randomUUID(), user.id, day, key, prompt, now());
          return { prompt };
        }), 201);
      }
      fail(404, 'Page introuvable.');
    } catch (error) {
      if (res.headersSent) return res.destroy();
      if (!error.status) console.error('API error:', error.code || error.name);
      send({ error: error.status ? error.message : 'Une erreur est survenue. Réessayez.' }, error.status || 500);
    }
  });
  server.requestTimeout = 30000; server.headersTimeout = 15000;
  return { server, db };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { server } = createApplication({ dbPath: process.env.DATABASE_PATH || 'server/data/learnai.sqlite',
    mediaDir: process.env.MEDIA_DIR || 'server/media', manualPayments: process.env.MANUAL_PAYMENTS_ENABLED === 'true',
    origins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
    merchantNumber: process.env.ORANGE_MONEY_MERCHANT || '', supportNumber: process.env.WHATSAPP_SUPPORT_NUMBER || '' });
  server.listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1', () => console.log('LearnAI API prête sur le port', process.env.PORT || 3001));
}
