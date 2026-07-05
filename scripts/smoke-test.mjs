import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const PORT = 18087;
const dataFile = path.join(root, 'data', 'smoke-db.json');
if (fs.existsSync(dataFile)) fs.rmSync(dataFile);

const env = {
  ...process.env,
  PORT: String(PORT),
  BASE_URL: `http://127.0.0.1:${PORT}`,
  JWT_SECRET: 'smoke-test-secret-change-me-1234567890',
  ADMIN_PASSWORD: '69677323',
  DATA_FILE: dataFile,
  NODE_ENV: 'production'
};

const server = spawn(process.execPath, ['server.js'], { cwd: root, env, stdio: ['ignore','pipe','pipe'] });
let stdout = '';
let stderr = '';
server.stdout.on('data', d => stdout += d.toString());
server.stderr.on('data', d => stderr += d.toString());

const base = `http://127.0.0.1:${PORT}`;
const cookies = { admin: '', user: '' };
const results = [];
const fail = (name, msg) => { throw new Error(`${name}: ${msg}`); };
const wait = ms => new Promise(r => setTimeout(r, ms));
async function waitReady() {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.ok) return;
    } catch {}
    await wait(200);
  }
  fail('server startup', `not ready\nstdout=${stdout}\nstderr=${stderr}`);
}
function rememberCookie(bucket, res) {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return;
  const parts = setCookie.split(/, (?=[^;]+=)/).map(v => v.split(';')[0]);
  cookies[bucket] = parts.join('; ');
}
async function request(name, url, { method='GET', body, bucket, cookie, expect=200, contentType='json' } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${base}${url}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, redirect: 'manual' });
  const text = await res.text();
  if (res.status !== expect) fail(name, `expected ${expect}, got ${res.status}, body=${text.slice(0,400)}`);
  if (bucket) rememberCookie(bucket, res);
  let data = text;
  if (contentType === 'json') {
    try { data = text ? JSON.parse(text) : {}; } catch { fail(name, `invalid JSON: ${text.slice(0,200)}`); }
  }
  results.push({ name, status: res.status });
  return { res, data, text };
}

try {
  await waitReady();
  await request('front root', '/', { contentType: 'html' });
  await request('front index', '/index.html', { contentType: 'html' });
  await request('admin page', '/admin', { contentType: 'html' });
  await request('admin html', '/admin.html', { contentType: 'html' });
  await request('login error page', '/login-error.html', { contentType: 'html' });
  await request('health', '/health');
  await request('api health', '/api/health');
  await request('config', '/api/config');
  await request('products', '/api/products');
  await request('scratch odds', '/api/scratch/odds');
  await request('scratch ledger', '/api/scratch/ledger');
  await request('static richmenu image', '/assets/richmenu/main.jpg', { contentType: 'binary' });
  await request('static placeholder', '/assets/products/placeholder.svg', { contentType: 'text' });
  await request('spa fallback', '/any/front/path', { contentType: 'html' });
  await request('admin unauthorized', '/api/admin/me', { expect: 401 });
  await request('admin bad login', '/api/admin/login', { method: 'POST', body: { password: 'wrong' }, expect: 401 });
  await request('admin login', '/api/admin/login', { method: 'POST', body: { password: '69677323' }, bucket: 'admin' });
  await request('admin me', '/api/admin/me', { cookie: cookies.admin });
  const dash = await request('admin dashboard', '/api/admin/dashboard', { cookie: cookies.admin });
  if (typeof dash.data.stats?.products !== 'number') fail('admin dashboard', 'stats missing');
  const prods = await request('admin products', '/api/admin/products', { cookie: cookies.admin });
  const productId = prods.data.products?.[0]?.id;
  if (!productId) fail('admin products', 'no seed product');
  await request('admin create product', '/api/admin/products', { method: 'POST', cookie: cookies.admin, body: { title: 'Smoke Test 商品', price: 99, stock: 2, status: 'active', imageUrl: '/assets/products/placeholder.svg' } });
  await request('admin update product', `/api/admin/products/${productId}`, { method: 'PUT', cookie: cookies.admin, body: { title: 'BX-01 戰鬥陀螺入門組', price: 390, stock: 18, status: 'active' } });
  await request('admin unpublish product', `/api/admin/products/${productId}/unpublish`, { method: 'POST', cookie: cookies.admin, body: {} });
  await request('admin publish product', `/api/admin/products/${productId}/publish`, { method: 'POST', cookie: cookies.admin, body: {} });
  await request('admin orders', '/api/admin/orders', { cookie: cookies.admin });
  await request('admin odds', '/api/admin/odds', { cookie: cookies.admin });
  const onePx = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';
  const oddsUpload = await request('admin odds upload', '/api/admin/odds/upload', { method: 'POST', cookie: cookies.admin, body: { imageData: onePx, filename: 'smoke.png', note: 'smoke' } });
  if (!oddsUpload.data.latestOdds?.imageUrl) fail('admin odds upload', 'imageUrl missing');
  await request('latest odds public', '/api/odds/latest');
  await request('uploaded odds static', oddsUpload.data.latestOdds.imageUrl, { contentType: 'binary' });
  await request('user unauthorized orders', '/api/orders/mine', { expect: 401 });
  const email = `smoke_${Date.now()}@example.com`;
  await request('user register', '/api/auth/register', { method: 'POST', body: { name: 'Smoke User', email, phone: '0912345678', password: '123456' }, bucket: 'user' });
  await request('user me', '/api/auth/me', { cookie: cookies.user });
  await request('scratch draw', '/api/scratch/draw', { method: 'POST', cookie: cookies.user, body: {} });
  const productList = await request('products after auth', '/api/products');
  const active = productList.data.products.find(p => p.status === 'active' && Number(p.stock) > 0);
  if (!active) fail('create order', 'no active product');
  const order = await request('create order', '/api/orders', { method: 'POST', cookie: cookies.user, body: { items: [{ productId: active.id, qty: 1 }], bank: { bankLast5: '12345', transferDate: '2026-07-05', transferAmount: active.price, note: 'smoke' } } });
  const orderId = order.data.order?.id;
  if (!orderId) fail('create order', 'order id missing');
  await request('orders mine', '/api/orders/mine', { cookie: cookies.user });
  await request('confirm payment', `/api/admin/orders/${orderId}/confirm-payment`, { method: 'POST', cookie: cookies.admin, body: {} });
  await request('admin logout', '/api/admin/logout', { method: 'POST', cookie: cookies.admin, body: {} });
  await request('user logout', '/api/auth/logout', { method: 'POST', cookie: cookies.user, body: {} });

  const summary = { ok: true, count: results.length, results };
  console.log(JSON.stringify(summary, null, 2));
  process.exitCode = 0;
} catch (err) {
  console.error('SMOKE_TEST_FAILED');
  console.error(err.stack || err.message);
  console.error('SERVER_STDOUT\n' + stdout);
  console.error('SERVER_STDERR\n' + stderr);
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
}
