// All names, e-mails, phone numbers and payment references below are synthetic test fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApplication } from './api.mjs';
import { dayKey, addMonth } from './domain.mjs';

test('calendar month and Cameroon midnight', () => {
  assert.equal(dayKey(Date.parse('2026-09-23T22:59:59Z')), '2026-09-23');
  assert.equal(dayKey(Date.parse('2026-09-23T23:00:00Z')), '2026-09-24');
  assert.equal(new Date(addMonth(Date.parse('2026-01-31T10:30:00Z'))).toISOString(), '2026-02-28T10:30:00.000Z');
  assert.equal(new Date(addMonth(Date.parse('2028-01-31T10:30:00Z'))).toISOString(), '2028-02-29T10:30:00.000Z');
});

test('membership and manual-payment integration', async t => {
  let clock = Date.parse('2026-09-23T12:00:00Z');
  const mediaDir = mkdtempSync(join(tmpdir(), 'learnai-media-'));
  writeFileSync(join(mediaDir, 'objectif.mp4'), Buffer.from('0123456789'));
  const { server, db } = createApplication({ dbPath: ':memory:', now: () => clock, manualPayments: true, merchantNumber: '+237600000001', supportNumber: '+237600000001', mediaDir, origins: ['http://localhost:8081'] });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); db.close(); rmSync(mediaDir, { recursive: true }); });
  const root = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { token, method = 'GET', body, headers = {} } = {}) => {
    const response = await fetch(root + path, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: await response.json() };
  };
  const register = async email => {
    const result = await call('/auth/register', { method: 'POST', body: { email, password: 'test-only-long-password', name: 'Test User', role: 'admin' } });
    assert.equal(result.status, 201); return result.data;
  };
  const admin = await register('admin@example.test'), member = await register('member@example.test'), other = await register('other@example.test');
  db.prepare("UPDATE users SET role='admin' WHERE id=?").run(admin.user.id);
  const order = (token, plan, reference) => call('/payments', { token, method: 'POST', body: { plan, reference, phone: '+237690000001', amount: 1, status: 'approved' } });
  const approve = (p, overrides = {}) => call(`/admin/payments/${p.id}/approve`, { token: admin.token, method: 'POST', body: { verifiedReference: p.reference, verifiedAmount: p.amount, confirmed: true, ...overrides } });
  let payment;
  await t.test('private content and administration are protected', async () => {
    assert.equal((await call('/lessons/objectif')).status, 401);
    assert.equal((await call('/lessons/objectif', { token: member.token })).status, 403);
    assert.equal((await call('/admin/payments', { token: member.token })).status, 403);
    assert.equal((await call('/catalog', { headers: { Origin: 'https://evil.example' } })).status, 403);
    assert.equal(member.user.role, 'member');
    const catalog = (await call('/catalog')).data;
    assert.equal(catalog.lessons.length, 12); assert.equal(catalog.lessons[0].body, undefined);
    assert.deepEqual(catalog.plans.map(p => p.price), [1100, 2200, 5500]);
    assert.equal((await call('/support', { token: member.token })).status, 403);
  });
  await t.test('price from server, global reference uniqueness and one pending request', async () => {
    const result = await order(member.token, 'creative', 'OM-TEST-0001'); payment = result.data.payment;
    assert.equal(payment.amount, 2200); assert.equal(payment.status, 'pending');
    assert.equal((await order(member.token, 'creative', 'om-test-0001')).data.payment.id, payment.id);
    assert.equal((await order(other.token, 'creative', 'OM-TEST-0001')).status, 409);
    assert.equal((await order(member.token, 'complete', 'OM-TEST-0002')).status, 409);
    assert.equal((await call('/prompts', { token: member.token })).status, 403);
  });
  await t.test('approval requires admin and merchant evidence, repeats do not extend access', async () => {
    assert.equal((await call(`/admin/payments/${payment.id}/approve`, { token: member.token, method: 'POST', body: {} })).status, 403);
    assert.equal((await approve(payment, { verifiedAmount: 1100 })).status, 400);
    assert.equal((await approve(payment, { verifiedReference: 'WRONG-REF' })).status, 400);
    assert.equal((await approve(payment, { confirmed: false })).status, 400);
    assert.equal((await approve(payment)).status, 200);
    const before = (await call('/me', { token: member.token })).data.membership.ends;
    await approve(payment);
    assert.equal((await call('/me', { token: member.token })).data.membership.ends, before);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM grants WHERE user_id=?').get(member.user.id).n, 1);
    assert.equal((await call('/lessons/brief-image', { token: member.token })).status, 200);
    assert.equal((await call('/support', { token: member.token })).status, 403);
    assert.equal((await call('/lessons/objectif/video-ticket', { token: member.token, method: 'POST', body: {} })).status, 403);
  });
  await t.test('image quota is atomic, retry-safe and renews at local midnight', async () => {
    const generate = requestKey => call('/prompts/image', { token: member.token, method: 'POST', body: { subject: 'un savon artisanal', style: 'photo', format: 'carré', requestKey } });
    const first = await generate('request-id-0000'); assert.equal(first.status, 201);
    assert.equal((await generate('request-id-0000')).data.prompt, first.data.prompt);
    const results = await Promise.all(Array.from({ length: 11 }, (_, i) => generate(`request-id-${i + 1}`)));
    assert.equal(results.filter(r => r.status === 201).length, 9);
    assert.equal(results.filter(r => r.status === 429).length, 2);
    const prompts = (await call('/prompts', { token: member.token })).data;
    assert.equal(prompts.remaining, 0); assert.equal(prompts.examples.length, 5);
    clock = Date.parse('2026-09-23T23:00:00Z');
    assert.equal((await call('/prompts', { token: member.token })).data.remaining, 10);
  });
  await t.test('renewal extends from existing expiry and paid periods can be revoked', async () => {
    const before = (await call('/me', { token: member.token })).data.membership.ends;
    assert.equal((await order(member.token, 'complete', 'OM-CHANGE-PLAN')).status, 409);
    const renewal = (await order(member.token, 'creative', 'OM-RENEW-0001')).data.payment;
    assert.equal((await approve(renewal)).status, 200);
    assert.equal((await call('/me', { token: member.token })).data.membership.ends, addMonth(before));
    assert.equal((await call(`/admin/payments/${renewal.id}/revoke`, { token: admin.token, method: 'POST', body: { reason: 'Remboursement vérifié' } })).status, 200);
    assert.equal((await call('/me', { token: member.token })).data.membership.ends, before);
  });
  await t.test('progress isolated per account and quiz checked server-side', async () => {
    assert.equal((await call('/lessons/objectif/progress', { token: member.token, method: 'PUT', body: { answer: 0 } })).status, 400);
    assert.equal((await call('/lessons/objectif/progress', { token: member.token, method: 'PUT', body: { answer: 1, favorite: true, draft: 'Mon brouillon' } })).status, 200);
    assert.equal((await call('/me', { token: member.token })).data.progress[0].completed, 1);
    assert.equal((await call('/me', { token: other.token })).data.progress.length, 0);
  });
  await t.test('essential has beginner content, daily examples, no advanced/image/support', async () => {
    const p = (await order(other.token, 'essential', 'OM-ESSENTIAL-1')).data.payment; await approve(p);
    assert.equal((await call('/lessons/objectif', { token: other.token })).status, 200);
    assert.equal((await call('/lessons/brief-image', { token: other.token })).status, 403);
    assert.equal((await call('/prompts', { token: other.token })).data.examples.length, 5);
    assert.equal((await call('/prompts/image', { token: other.token, method: 'POST', body: { subject: 'un produit', style: 'photo', format: 'carré', requestKey: 'forbidden-image' } })).status, 403);
    await call(`/admin/payments/${p.id}/revoke`, { token: admin.token, method: 'POST', body: { reason: 'Accès retiré pour test' } });
    assert.equal((await call('/lessons/objectif', { token: other.token })).status, 403);
  });
  await t.test('complete support and video tickets require continuing entitlement', async () => {
    const p = (await order(other.token, 'complete', 'OM-COMPLETE-1')).data.payment; await approve(p);
    assert.match((await call('/support', { token: other.token })).data.url, /^https:\/\/wa.me\/237600000001/);
    assert.equal((await call('/prompts', { token: other.token })).data.examples.length, 20);
    const ticket = (await call('/lessons/objectif/video-ticket', { token: other.token, method: 'POST', body: {} })).data.path;
    let response = await fetch(root + ticket, { headers: { Range: 'bytes=2-5' } });
    assert.equal(response.status, 206); assert.equal(await response.text(), '2345');
    assert.equal((await fetch(root + ticket.replace('/objectif?', '/affiner?'))).status, 403);
    assert.equal((await call('/lessons/affiner/video-ticket', { token: other.token, method: 'POST', body: {} })).status, 404);
    await call(`/admin/payments/${p.id}/revoke`, { token: admin.token, method: 'POST', body: { reason: 'Paiement remboursé hors application' } });
    response = await fetch(root + ticket); assert.equal(response.status, 403);
  });
  await t.test('rejection, expiry and logout cannot retain access', async () => {
    const p = (await order(other.token, 'complete', 'OM-REJECTED-1')).data.payment;
    assert.equal((await call(`/admin/payments/${p.id}/reject`, { token: admin.token, method: 'POST', body: { reason: 'Transaction non retrouvée' } })).status, 200);
    assert.equal((await approve(p)).status, 409);
    clock = addMonth(clock) + 86400000;
    // Reauthenticate after session expiry to verify subscription expiry independently.
    const auth = await call('/auth/login', { method: 'POST', body: { email: member.user.email, password: 'test-only-long-password' } });
    assert.equal((await call('/lessons/objectif', { token: auth.data.token })).status, 403);
    assert.equal((await call('/me', { token: auth.data.token })).data.membership, null);
    await call('/auth/logout', { token: auth.data.token, method: 'POST', body: {} });
    assert.equal((await call('/me', { token: auth.data.token })).status, 401);
  });
});

test('manual payment disabled by default', async t => {
  const { server, db } = createApplication({ dbPath: ':memory:' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { await new Promise(resolve => server.close(resolve)); db.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const catalog = await (await fetch(base + '/catalog')).json(); assert.equal(catalog.manualPayments, false); assert.equal(catalog.merchant, null);
  const registered = await (await fetch(base + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'disabled@example.test', name: 'Test', password: 'test-only-password' }) })).json();
  const response = await fetch(base + '/payments', { method: 'POST', headers: { Authorization: `Bearer ${registered.token}`, 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 403);
});
