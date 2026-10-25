(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const anim = document.documentElement.classList.contains('anim');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Menu data (prices from the printed menu) ---------- */
  const MENU = {
    "Shakes": [["Oreo Shake",159],["Devil's Dark Chocolate",159],["Nutella Shake",159],["Snickers Shake",159],["Chocolate",149],["Strawberry",149],["Mango",139],["Banana",139],["Kit Kat Shake",139],["Gym Lovers Protein Shake",89,"30 g protein mixed with milk"],["Death Shake",189,"The ultimate shake of the generation"]],
    "La Frappe": [["Mocha",149,"Coffee, bittersweet chocolate, whipped cream"],["Caramel Mocha",169],["Hazelnut Mocha",169],["Coffee",149,"Coffee, cream and iced milk"],["Caramel",169,"Coffee, cream, caramel and iced milk"],["Java Chip",179,"Crunchy chocolate strands, cream on top"],["Iced Latte",139],["Irish La Frappe",179],["Hazelnut La Frappe",179],["Berry Mocha La Frappe",159],["Rainbow La Frappe",179],["Cookie Cream La Frappe",179,"Cookie flavour with bits of cookies"]],
    "Waffles": [["Nutella with Ice Cream",139],["Brownie Waffle",139],["Banana Caramel Waffle",139],["Chocolate Waffle",139],["Kit Kat Waffle",139]],
    "Sandwiches": [["Veg Club",99],["Grilled Club",109],["Grilled Veggies",109],["Grilled Chicken",139]]
  };

  /* ---------- Order builder ---------- */
  const cats = $('#cats'), items = $('#items'), lines = $('#lines'), split = $('#split');
  let cat = 'Shakes', cart = {}, people = 1, shown = 0;

  Object.keys(MENU).forEach(k => {
    const b = document.createElement('button');
    b.textContent = k; b.setAttribute('aria-pressed', k === cat);
    b.onclick = () => { cat = k; [...cats.children].forEach(c => c.setAttribute('aria-pressed', c === b)); renderItems(); };
    cats.appendChild(b);
  });

  function renderItems() {
    items.innerHTML = '';
    MENU[cat].forEach(([name, price, note], i) => {
      const row = document.createElement('div');
      row.className = 'item'; row.style.setProperty('--i', i);
      row.innerHTML = '<div><b>' + name + '</b>' + (note ? '<small>' + note + '</small>' : '') + '</div><span class="pr">₹' + price + '</span>';
      const add = document.createElement('button');
      add.className = 'add'; add.textContent = '+'; add.setAttribute('aria-label', 'Add ' + name);
      add.onclick = () => { cart[name] = cart[name] || { p: price, q: 0 }; cart[name].q++; renderBill(name); };
      row.appendChild(add); items.appendChild(row);
    });
  }

  function tween(to) {
    const el = $('#tot'), from = shown, t0 = performance.now(), dur = anim ? 420 : 0;
    shown = to;
    if (!dur) { el.textContent = '₹' + to; return; }
    (function step(now) {
      const k = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = '₹' + Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  function renderBill(changed) {
    lines.innerHTML = ''; let total = 0;
    Object.entries(cart).forEach(([name, o]) => {
      total += o.p * o.q;
      const row = document.createElement('div');
      row.className = 'line' + (name === changed ? ' bump' : '');
      row.innerHTML = '<span>' + name + '</span><span><button aria-label="Remove one ' + name + '">−</button><span>×' + o.q + '</span><span>₹' + o.p * o.q + '</span></span>';
      $('button', row).onclick = () => { if (--o.q <= 0) delete cart[name]; renderBill(); };
      lines.appendChild(row);
    });
    $('#empty').style.display = total ? 'none' : 'block';
    $('#per').textContent = total && people > 1 ? 'About ₹' + Math.round(total / people) + ' each' : '';
    tween(total);
  }

  [1, 2, 3, 4].forEach(n => {
    const b = document.createElement('button');
    b.textContent = n; b.setAttribute('aria-pressed', n === 1);
    b.onclick = () => { people = n; $$('button', split).forEach(c => c.setAttribute('aria-pressed', c === b)); renderBill(); };
    split.appendChild(b);
  });
  renderItems(); renderBill();

  /* ---------- Live open / closed status (India time) ---------- */
  const HOURS = [{ o: 11, c: 23 }, { o: 10.5, c: 23.75 }];
  const fmt = h => { const hh = Math.floor(h) % 24, mm = Math.round((h % 1) * 60); return ((hh + 11) % 12 + 1) + ':' + String(mm).padStart(2, '0') + (hh >= 12 ? ' pm' : ' am'); };
  function status() {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const now = +p.find(x => x.type === 'hour').value + +p.find(x => x.type === 'minute').value / 60;
    HOURS.forEach((b, i) => {
      const open = now >= b.o && now < b.c;
      $('#d' + i).className = 'dot' + (open ? ' on' : '');
      $('#s' + i).textContent = open ? 'Open now, until ' + fmt(b.c) : 'Closed. Opens at ' + fmt(b.o);
    });
  }
  status(); setInterval(status, 60000);

  /* ---------- Marquee: duplicate the track so the loop is seamless ---------- */
  const track = $('#track');
  track.innerHTML += track.innerHTML;

  /* ---------- Scroll reveals ---------- */
  $$('[data-stagger]').forEach(p => [...p.children].forEach((c, i) => { c.setAttribute('data-reveal', ''); c.style.setProperty('--d', i); }));
  $$('#gal figure').forEach((f, i) => f.style.setProperty('--d', i % 3));
  const targets = $$('[data-reveal], #gal figure');
  if (anim && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(t => io.observe(t));
  } else targets.forEach(t => t.classList.add('in'));
  /* Safety net: never leave content hidden if the observer is slow */
  setTimeout(() => targets.forEach(t => { if (!t.classList.contains('in') && t.getBoundingClientRect().top < innerHeight * 1.3) t.classList.add('in'); }), 3500);

  /* ---------- Scroll progress, nav behaviour, gentle parallax ---------- */
  const bar = $('#bar'), progress = $('#progress'), par = $$('[data-par]');
  let last = scrollY, queued = false;
  function onScroll() {
    if (queued) return; queued = true;
    requestAnimationFrame(() => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
      bar.classList.toggle('solid', y > 20);
      bar.classList.toggle('hide', y > last && y > 240);
      last = y;
      if (anim) par.forEach(el => {
        const r = el.getBoundingClientRect();
        const off = (r.top + r.height / 2 - innerHeight / 2) * -parseFloat(el.dataset.par);
        el.style.setProperty('--py', Math.max(-40, Math.min(40, off)).toFixed(1) + 'px');
      });
      queued = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Magnetic buttons (mouse only) ---------- */
  if (anim && finePointer) $$('.mag').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * 0.22 + 'px,' + (e.clientY - r.top - r.height / 2) * 0.3 + 'px)';
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---------- Video: respect reduced motion, pause when off screen ---------- */
  const v = $('#tour');
  if (!anim) { v.removeAttribute('autoplay'); v.pause(); }
  else if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? v.play().catch(() => {}) : v.pause())).observe(v);
  }
})();
