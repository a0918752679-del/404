const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const app = {
  config: null,
  user: null,
  products: [],
  cart: new Map(),
  scratch: { revealed: false, drawing: false, scratchedPixels: 0, totalPixels: 1 },
  async init() {
    this.bind();
    await this.loadConfig();
    await this.loadMe();
    await this.loadProducts();
    await this.loadOdds();
    await this.loadOrders();
    await this.loadScratchInfo();
    await this.loadLedger();
    this.resetScratchCard();
  },
  bind() {
    $('#loginBtn').addEventListener('click', () => this.openAuth());
    $('#heroLogin').addEventListener('click', () => this.openAuth());
    $('#bottomLogin').addEventListener('click', (e) => { e.preventDefault(); this.openAuth(); });
    $('#checkoutBtn').addEventListener('click', () => this.openCheckout());
    $('#drawScratchBtn').addEventListener('click', () => this.drawScratch());
    $('#resetScratchBtn').addEventListener('click', () => this.resetScratchCard());
    this.bindAdminGate();
    $$('[data-close]').forEach((el) => el.addEventListener('click', () => this.closeModal(el.dataset.close)));
    $('#tabLogin').addEventListener('click', () => this.switchAuthTab('login'));
    $('#tabRegister').addEventListener('click', () => this.switchAuthTab('register'));
    $('#loginForm').addEventListener('submit', (e) => this.localLogin(e));
    $('#registerForm').addEventListener('submit', (e) => this.localRegister(e));
    $('#checkoutForm').addEventListener('submit', (e) => this.createOrder(e));
    $$('.modal').forEach((modal) => modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); }));
  },
  bindAdminGate() {
    let taps = 0;
    let timer = null;
    $('#brandGate').addEventListener('click', () => {
      taps += 1;
      clearTimeout(timer);
      timer = setTimeout(() => { taps = 0; }, 1500);
      if (taps >= 5) {
        taps = 0;
        location.href = '/admin';
      }
    });
  },
  async api(url, opts = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      credentials: 'same-origin',
      ...opts
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || '操作失敗');
    return data;
  },
  toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2800);
  },
  openAuth() {
    if (this.user) {
      this.toast(`${this.user.name} 已登入`);
      location.hash = '#orders';
      return;
    }
    $('#authModal').classList.add('show');
  },
  closeModal(id) { $(`#${id}`).classList.remove('show'); },
  switchAuthTab(tab) {
    const isLogin = tab === 'login';
    $('#tabLogin').classList.toggle('active', isLogin);
    $('#tabRegister').classList.toggle('active', !isLogin);
    $('#loginForm').style.display = isLogin ? 'block' : 'none';
    $('#registerForm').style.display = isLogin ? 'none' : 'block';
  },
  async loadConfig() {
    this.config = await this.api('/api/config');
    $('#bankAccount').textContent = this.config.bankAccount;
    $('#lineLoginLink').classList.toggle('ghost', !this.config.features.lineLogin);
    $('#googleLoginLink').classList.toggle('ghost', !this.config.features.googleLogin);
  },
  async loadMe() {
    const data = await this.api('/api/auth/me');
    this.user = data.user;
    this.renderMember();
  },
  renderMember() {
    const box = $('#memberBox');
    if (this.user) {
      box.style.display = 'block';
      box.innerHTML = `已登入：<strong>${this.user.name}</strong>　會員點數：${Number(this.user.points || 0).toLocaleString()} <button class="btn small ghost" onclick="app.logout()">登出</button>`;
      $('#loginBtn').textContent = this.user.name;
    } else {
      box.style.display = 'none';
      $('#loginBtn').textContent = '登入會員';
    }
  },
  async logout() {
    await this.api('/api/auth/logout', { method: 'POST', body: '{}' });
    this.user = null;
    this.renderMember();
    this.toast('已登出');
  },
  async localLogin(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const data = await this.api('/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
      this.user = data.user;
      this.renderMember();
      this.closeModal('authModal');
      this.toast('登入成功');
      this.loadOrders();
    } catch (err) { this.toast(err.message); }
  },
  async localRegister(e) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const data = await this.api('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });
      this.user = data.user;
      this.renderMember();
      this.closeModal('authModal');
      this.toast('會員建立成功');
      this.loadOrders();
    } catch (err) { this.toast(err.message); }
  },
  async loadScratchInfo() {
    try {
      const data = await this.api('/api/scratch/odds');
      const root = $('#scratchOdds');
      root.innerHTML = data.prizes.map((p) => `
        <div class="odds-row">
          <div><strong>${p.tier}｜${p.title}</strong><small>${p.description || ''}</small></div>
          <div><b>${p.estimatedRate}%</b><small>剩 ${p.remaining}</small></div>
        </div>`).join('');
    } catch (err) {
      $('#scratchOdds').textContent = err.message;
    }
  },
  resetScratchCard() {
    const canvas = $('#scratchCanvas');
    const stage = $('#scratchStage');
    const ctx = canvas.getContext('2d');
    stage.classList.add('idle');
    stage.classList.remove('revealed');
    $('#scratchTier').textContent = 'READY';
    $('#scratchPrize').textContent = this.user ? '點擊下方按鈕領取刮刮樂' : '登入後開始刮刮樂';
    $('#scratchHash').textContent = '伺服器端公平抽取，紀錄公開。';
    this.paintScratchCover(ctx, canvas);
    this.bindScratchCanvas(canvas, ctx);
  },
  paintScratchCover(ctx, canvas) {
    ctx.globalCompositeOperation = 'source-over';
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#1a1a1a');
    grad.addColorStop(.45, '#2a210c');
    grad.addColorStop(1, '#050505');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffc400';
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
    ctx.fillStyle = '#ffc400';
    ctx.font = '900 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('刮開驚喜', canvas.width / 2, canvas.height / 2 - 12);
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.font = '800 24px sans-serif';
    ctx.fillText('SCRATCH TO REVEAL', canvas.width / 2, canvas.height / 2 + 36);
    this.scratch = { revealed: false, drawing: false, scratchedPixels: 0, totalPixels: canvas.width * canvas.height };
  },
  bindScratchCanvas(canvas, ctx) {
    const scratchAt = (event) => {
      if (!$('#scratchStage').classList.contains('revealed') && $('#scratchStage').classList.contains('idle')) return;
      const rect = canvas.getBoundingClientRect();
      const point = event.touches ? event.touches[0] : event;
      const x = (point.clientX - rect.left) * (canvas.width / rect.width);
      const y = (point.clientY - rect.top) * (canvas.height / rect.height);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 34, 0, Math.PI * 2);
      ctx.fill();
      if (Math.random() < .16) this.checkScratchProgress(ctx, canvas);
    };
    canvas.onpointerdown = (e) => { this.scratch.drawing = true; scratchAt(e); };
    canvas.onpointermove = (e) => { if (this.scratch.drawing) scratchAt(e); };
    canvas.onpointerup = canvas.onpointerleave = () => { this.scratch.drawing = false; this.checkScratchProgress(ctx, canvas); };
    canvas.ontouchstart = (e) => { e.preventDefault(); this.scratch.drawing = true; scratchAt(e); };
    canvas.ontouchmove = (e) => { e.preventDefault(); if (this.scratch.drawing) scratchAt(e); };
    canvas.ontouchend = () => { this.scratch.drawing = false; this.checkScratchProgress(ctx, canvas); };
  },
  checkScratchProgress(ctx, canvas) {
    if (this.scratch.revealed) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 16) if (data[i] < 20) transparent += 1;
    const ratio = transparent / (data.length / 16);
    if (ratio > .46) {
      this.scratch.revealed = true;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      $('#scratchStage').classList.add('revealed');
    }
  },
  async drawScratch() {
    if (!this.user) { this.openAuth(); return this.toast('請先登入會員才能開刮'); }
    try {
      const data = await this.api('/api/scratch/draw', { method: 'POST', body: '{}' });
      const d = data.draw;
      $('#scratchStage').classList.remove('idle');
      $('#scratchStage').classList.remove('revealed');
      $('#scratchTier').textContent = d.tier;
      $('#scratchPrize').textContent = d.prizeTitle;
      $('#scratchHash').textContent = `驗證 Hash：${d.verificationHash.slice(0, 18)}...`;
      this.paintScratchCover($('#scratchCanvas').getContext('2d'), $('#scratchCanvas'));
      await this.loadScratchInfo();
      await this.loadLedger();
      await this.loadMe();
      this.toast('刮刮樂已建立，請刮開查看結果');
    } catch (err) { this.toast(err.message); }
  },
  async loadLedger() {
    try {
      const data = await this.api('/api/scratch/ledger');
      const root = $('#ledgerList');
      if (!data.draws.length) { root.className = 'ledger-list notice'; root.textContent = '尚無公開開刮紀錄。'; return; }
      root.className = 'ledger-list';
      root.innerHTML = data.draws.map((d) => `
        <div class="ledger-row">
          <span>${new Date(d.at).toLocaleString()}</span>
          <strong>${d.tier}｜${d.prizeTitle}</strong>
          <code>${d.verificationHash.slice(0, 24)}...</code>
        </div>`).join('');
    } catch (err) { $('#ledgerList').textContent = err.message; }
  },
  async loadProducts() {
    const data = await this.api('/api/products');
    this.products = data.products;
    this.renderProducts();
  },
  renderProducts() {
    const root = $('#products');
    root.innerHTML = this.products.map((p) => {
      const soldout = p.status === 'soldout' || Number(p.stock) <= 0;
      return `
      <article class="product">
        <img src="${p.imageUrl || '/assets/products/placeholder.svg'}" alt="${p.title}" loading="lazy" />
        <div class="product-body">
          <div class="meta"><span class="pill">${p.category || '商品'}</span><span class="pill ${soldout ? 'bad' : 'ok'}">${soldout ? 'SOLD OUT' : `庫存 ${p.stock}`}</span></div>
          <h3>${p.title}</h3>
          <div class="price">NT$ ${Number(p.price).toLocaleString()}</div>
          <p>${p.description || ''}</p>
          ${soldout ? '<button class="btn ghost" disabled style="width:100%">已售完</button>' : `<button class="btn primary" style="width:100%" onclick="app.addToCart('${p.id}')">加入購物車</button>`}
        </div>
      </article>`;
    }).join('');
  },
  addToCart(productId) {
    const p = this.products.find(x => x.id === productId);
    if (!p) return;
    const current = this.cart.get(productId) || 0;
    if (current + 1 > Number(p.stock)) return this.toast(`庫存不足，目前剩 ${p.stock}`);
    this.cart.set(productId, current + 1);
    this.renderCart();
    this.toast(`${p.title} 已加入`);
  },
  removeFromCart(productId) {
    const current = this.cart.get(productId) || 0;
    if (current <= 1) this.cart.delete(productId); else this.cart.set(productId, current - 1);
    this.renderCart();
  },
  cartItems() {
    return Array.from(this.cart.entries()).map(([productId, qty]) => ({ product: this.products.find(p => p.id === productId), qty })).filter(x => x.product);
  },
  cartTotal() { return this.cartItems().reduce((s, x) => s + Number(x.product.price) * x.qty, 0); },
  renderCart() {
    const count = this.cartItems().reduce((s, x) => s + x.qty, 0);
    const total = this.cartTotal();
    $('#cartSummary').textContent = `${count} 件｜NT$ ${total.toLocaleString()}`;
    $('#cartFloat').classList.toggle('show', count > 0);
  },
  openCheckout() {
    if (!this.user) { this.openAuth(); return this.toast('請先登入會員'); }
    const items = this.cartItems();
    if (!items.length) return;
    const total = this.cartTotal();
    $('#checkoutItems').innerHTML = items.map(x => `
      <div class="order-card" style="display:flex;align-items:center;gap:10px">
        <img src="${x.product.imageUrl}" alt="" style="width:72px;height:56px;object-fit:cover;border-radius:14px" />
        <div style="flex:1"><strong>${x.product.title}</strong><br/><small>${x.qty} 件 × NT$ ${Number(x.product.price).toLocaleString()}</small></div>
        <button class="btn small ghost" onclick="app.removeFromCart('${x.product.id}'); app.openCheckout();">移除</button>
      </div>`).join('') + `<h3>合計：NT$ ${total.toLocaleString()}</h3>`;
    $('#checkoutForm [name=transferAmount]').value = total;
    $('#checkoutModal').classList.add('show');
  },
  async createOrder(e) {
    e.preventDefault();
    const items = this.cartItems().map(x => ({ productId: x.product.id, qty: x.qty }));
    const bank = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const data = await this.api('/api/orders', { method: 'POST', body: JSON.stringify({ items, bank }) });
      this.cart.clear();
      this.renderCart();
      this.closeModal('checkoutModal');
      await this.loadProducts();
      await this.loadOrders();
      this.toast(`訂單已建立：${data.order.id}`);
      location.hash = '#orders';
    } catch (err) { this.toast(err.message); }
  },
  async loadOdds() {
    try {
      const data = await this.api('/api/odds/latest');
      const latest = data.latestOdds;
      const box = $('#oddsBox');
      if (!latest) { box.className = 'notice'; box.textContent = '目前尚未公布最新賠率。'; return; }
      box.className = '';
      box.innerHTML = `<div class="order-card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><strong>目前最新賠率</strong><span class="tag gold-tag">更新：${new Date(latest.uploadedAt).toLocaleString()}</span></div>${latest.note ? `<p>${latest.note}</p>` : ''}<img src="${latest.imageUrl}" alt="最新賠率" style="width:100%;border-radius:28px;margin-top:10px;box-shadow:var(--shadow);border:1px solid rgba(255,196,0,.25)" /></div>`;
    } catch (err) { $('#oddsBox').textContent = err.message; }
  },
  async loadOrders() {
    if (!this.user) { $('#ordersList').className = 'notice'; $('#ordersList').textContent = '請先登入會員後查詢。'; return; }
    try {
      const data = await this.api('/api/orders/mine');
      if (!data.orders.length) { $('#ordersList').className = 'notice'; $('#ordersList').textContent = '目前沒有消費紀錄。'; return; }
      $('#ordersList').className = '';
      $('#ordersList').innerHTML = data.orders.map(o => `<div class="order-card"><div style="display:flex;justify-content:space-between;gap:10px"><strong>${o.id}</strong><span class="status ${o.status}">${this.statusText(o.status)}</span></div><small>${new Date(o.createdAt).toLocaleString()}</small><div style="margin-top:8px">${(o.items||[]).map(i => `${i.title} × ${i.qty}`).join('、')}</div><h3>NT$ ${Number(o.total).toLocaleString()}</h3><small>匯款末五碼：${o.bankLast5 || '-'}｜匯款日期：${o.transferDate || '-'}</small></div>`).join('');
    } catch (err) { $('#ordersList').textContent = err.message; }
  },
  statusText(status) { return { pending_bank: '待確認匯款', paid: '已付款', cancelled: '已取消' }[status] || status; }
};

window.app = app;
app.init().catch(err => app.toast(err.message));
