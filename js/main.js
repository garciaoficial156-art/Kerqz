/* ============ Kerqz — interatividade ============
   Módulos: utilitários · estado · menu/cabeçalho · pesquisa · hero · carrossel ·
   filtros e grelha · janela do produto · sacola · checkout · extras. */
(function () {
  "use strict";
  const PR = KERQZ.products;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const byId = id => PR.find(p => p.id == id);
  const money = n => n.toLocaleString("pt-PT") + " Kz";
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem("kq_" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("kq_" + k, JSON.stringify(v)); } catch { } }
  };
  const FREE = 150000, SHIP = 3500, PROMOS = { KERQZ10: .1, BEMVINDO: .15 };

  /* ---------- imagens ---------- */
  const path = (p, ci, n) => `images/produtos/${p.slug}/${p.colors[ci].slug}-${n}.jpg`;
  const pic = (p, ci, n = 1, cls = "") => `<img class="${cls}" src="${path(p, ci, n)}" alt="${esc(p.name)}, ${p.colors[ci].n}" loading="lazy" decoding="async" onerror="Kerqz.miss(this,'${esc(p.name)}')">`;
  const kind = p => `${p.cat} ${p.gen == "Unissexo" ? "unissexo" : p.gen == "Criança" ? "de criança" : "de " + p.gen.toLowerCase()}`;
  const sizesOf = p => p.cat == "Calçado" ? Array.from({ length: p.gen == "Criança" ? 8 : 9 }, (_, i) => String((p.gen == "Criança" ? 28 : 38) + i)) : p.cat == "Acessórios" ? ["Único"] : ["XS", "S", "M", "L", "XL", "XXL"];
  const soldOut = (p, s) => (p.id * 7 + sizesOf(p).indexOf(s) * 3) % 11 == 0; // simula tamanhos esgotados
  const stockLeft = (p, s) => { if (soldOut(p, s)) return 0; const h = (p.id * 13 + sizesOf(p).indexOf(s) * 5) % 11; return h < 3 ? h + 1 : null; }; // simula "últimas unidades" (null = stock normal)

  /* ---------- estado ---------- */
  const S0 = () => ({ cats: new Set, gens: new Set, sports: new Set, colors: new Set, max: 150000, sale: false, fav: false, badge: "", sort: "rel", q: "", limit: 8 });
  let S = S0(), sel = {}, cart = store.get("cart", []), wish = new Set(store.get("wish", [])), promo = store.get("promo", ""), viewed = store.get("viewed", []);

  /* ---------- toast ---------- */
  let tt;
  const toast = (msg, act, fn) => {
    const t = $("#toast"); t.innerHTML = `<span>${msg}</span>` + (act ? `<button>${act}</button>` : "");
    if (act) t.lastChild.onclick = () => { fn(); t.classList.remove("on"); };
    t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), act ? 5000 : 2600);
  };

  /* ---------- painéis (sacola, menu, pesquisa, filtros) ---------- */
  const panel = n => { n ? document.body.dataset.panel = n : delete document.body.dataset.panel; if (n == "search") setTimeout(() => $("#sInput").focus(), 60); };
  $("#veil").onclick = () => panel(null);
  $$("[data-close-panel]").forEach(b => b.onclick = () => panel(null));
  $("#openCart").onclick = () => panel("cart");
  $("#burger").onclick = () => panel("menu");
  $("#openSearch").onclick = () => { drawSearch(); panel("search"); };

  /* ---------- menu grande (mega menu) e menu móvel ---------- */
  const gen = t => ({ t, f: "gen:" + t, cols: [
    { h: "Calçado", l: [["Todo o calçado", `gen:${t}|cat:Calçado`], ["Running", `gen:${t}|sport:Running`], ["Trail", `gen:${t}|sport:Trail`], ["Lifestyle", `gen:${t}|cat:Calçado|sport:Lifestyle`]] },
    { h: "Vestuário", l: [["Casacos", `gen:${t}|cat:Casacos`], ["T-shirts", `gen:${t}|cat:T-shirts`], ["Calças", `gen:${t}|cat:Calças`]] },
    { h: "Em destaque", l: [["Novidades", `gen:${t}|badge:Novo`], ["Ofertas", `gen:${t}|sale:1`], ["Acessórios", "cat:Acessórios"]] }] });
  const MENU = [
    { t: "Novidades", f: "badge:Novo", cols: [{ h: "Em destaque", l: [["Novos lançamentos", "badge:Novo"], ["Mais populares", "sort:pop"], ["Ofertas", "sale:1"]] }, { h: "Comprar por", l: [["Calçado", "cat:Calçado"], ["Casacos", "cat:Casacos"], ["Acessórios", "cat:Acessórios"]] }] },
    gen("Homem"), gen("Mulher"), gen("Criança"),
    { t: "Desporto", f: "", cols: [{ h: "Desportos", l: [["Running", "sport:Running"], ["Trail", "sport:Trail"], ["Treino", "sport:Treino"], ["Lifestyle", "sport:Lifestyle"]] }] }
  ];
  const mega = $("#mega"), nav = $("#nav"), hdr = $("#hdr");
  nav.innerHTML = MENU.map((m, i) => `<a href="#loja" data-mega="${i}" data-filter="${m.f}">${m.t}</a>`).join("");
  const closeMega = () => { mega.classList.remove("open"); $$("#nav a").forEach(a => a.classList.remove("on")); };
  const showMega = i => {
    $$("#nav a").forEach((a, k) => a.classList.toggle("on", k == i));
    mega.innerHTML = `<div class="mega-in">${MENU[i].cols.map(c => `<div><h4>${c.h}</h4>${c.l.map(([t, f]) => `<a href="#loja" data-filter="${f}">${t}</a>`).join("")}</div>`).join("")}</div>`;
    mega.classList.add("open");
  };
  nav.addEventListener("mouseover", e => { const a = e.target.closest("[data-mega]"); if (a) showMega(+a.dataset.mega); });
  nav.addEventListener("focusin", e => { const a = e.target.closest("[data-mega]"); if (a) showMega(+a.dataset.mega); });
  hdr.addEventListener("mouseleave", closeMega);
  $("#mmenu").innerHTML = `<button class="x" data-close-panel aria-label="Fechar">×</button>` + MENU.map(m => `<details><summary>${m.t}</summary>${m.cols.map(c => `<h4>${c.h}</h4>${c.l.map(([t, f]) => `<a href="#loja" data-filter="${f}">${t}</a>`).join("")}`).join("")}</details>`).join("");
  $("#mmenu .x").onclick = () => panel(null);

  /* ---------- cabeçalho inteligente + voltar ao topo ---------- */
  let lastY = 0, ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      hdr.classList.toggle("sh", y > 8);
      hdr.classList.toggle("hide", y > lastY && y > 200 && !document.body.dataset.panel && !mega.classList.contains("open"));
      $("#toTop").classList.toggle("on", y > 900); lastY = y; ticking = false;
    });
  }, { passive: true });
  $("#toTop").onclick = () => scrollTo({ top: 0 });

  /* ---------- pesquisa ao vivo ---------- */
  const sInput = $("#sInput"); let recents = store.get("recent", []), act = -1;
  const hl = (t, q) => esc(t).replace(new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>");
  const drawSearch = () => {
    const q = sInput.value.trim(), n = norm(q); act = -1;
    const res = q ? PR.filter(p => norm(`${p.name} ${p.cat} ${p.sport} ${p.gen} ${p.colors.map(c => c.n).join(" ")}`).includes(n)).slice(0, 6) : [];
    $("#sRes").innerHTML = !q ? "" : res.length ? res.map(p => `<a href="#loja" class="sr" data-sp="${p.id}"><span class="sr-i">${pic(p, 0)}</span><span><b>${hl(p.name, q)}</b><small>${kind(p)} · ${money(p.price)}</small></span></a>`).join("") : `<p class="mu">Sem resultados para “${esc(q)}”. Tenta “running” ou “hoodie”.</p>`;
    $("#sSide").innerHTML = q ? "" : `<section><h4>Pesquisas populares</h4>${["Running", "Hoodie", "Bomber", "Calças", "Boné"].map(t => `<button data-sq="${t}">${t}</button>`).join("")}</section>${recents.length ? `<section><h4>Recentes</h4>${recents.map(t => `<button data-sq="${esc(t)}">${esc(t)}</button>`).join("")}</section>` : ""}`;
  };
  const runSearch = q => { q = q.trim(); if (!q) return; recents = [q, ...recents.filter(x => x != q)].slice(0, 4); store.set("recent", recents); sInput.value = ""; applyFilter("q:" + q); };
  sInput.addEventListener("input", drawSearch);
  sInput.addEventListener("keydown", e => {
    const items = $$(".sr");
    if (e.key == "ArrowDown" || e.key == "ArrowUp") { e.preventDefault(); if (!items.length) return; act = (act + (e.key == "ArrowDown" ? 1 : -1) + items.length) % items.length; items.forEach((el, i) => el.classList.toggle("act", i == act)); }
    if (e.key == "Enter") { e.preventDefault(); if (items[act]) { panel(null); openModal(+items[act].dataset.sp); } else runSearch(sInput.value); }
  });
  addEventListener("keydown", e => {
    if (e.key == "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !$("dialog[open]")) { e.preventDefault(); drawSearch(); panel("search"); }
    if (e.key == "Escape") { panel(null); closeMega(); }
  });

  /* ---------- hero (slider automático) ---------- */
  (function () {
    const root = $(".hero"), sl = $$(".slide", root), dots = $(".dots", root), bar = $(".bar i", root), D = 6500;
    let i = 0, acc = 0, last = 0, paused = matchMedia("(prefers-reduced-motion:reduce)").matches, sx = 0;
    dots.innerHTML = sl.map((_, k) => `<button aria-label="Slide ${k + 1}"></button>`).join("");
    const go = n => { i = (n + sl.length) % sl.length; sl.forEach((s, k) => s.classList.toggle("on", k == i)); $$("button", dots).forEach((b, k) => b.classList.toggle("on", k == i)); acc = 0; };
    const tick = ts => { const dt = ts - (last || ts); last = ts; if (!paused && !document.hidden) { acc += dt; if (acc >= D) go(i + 1); } bar.style.transform = `scaleX(${Math.min(acc / D, 1)})`; requestAnimationFrame(tick); };
    dots.onclick = e => { const k = $$("button", dots).indexOf(e.target.closest("button")); if (k > -1) go(k); };
    root.addEventListener("click", e => { const b = e.target.closest("[data-hero]"); if (b) go(i + +b.dataset.hero); });
    root.addEventListener("mouseenter", () => paused = true); root.addEventListener("mouseleave", () => paused = matchMedia("(prefers-reduced-motion:reduce)").matches);
    root.addEventListener("keydown", e => { if (e.key == "ArrowLeft") go(i - 1); if (e.key == "ArrowRight") go(i + 1); });
    root.addEventListener("pointerdown", e => sx = e.clientX); root.addEventListener("pointerup", e => { const d = e.clientX - sx; if (Math.abs(d) > 60) go(i + (d < 0 ? 1 : -1)); });
    go(0); requestAnimationFrame(tick);
  })();

  /* ---------- carrossel (setas, arrastar, teclado) ---------- */
  const carousel = (el, prev, next) => {
    const upd = () => { prev.disabled = el.scrollLeft < 4; next.disabled = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4; };
    prev.onclick = () => el.scrollBy({ left: -el.clientWidth * .8, behavior: "smooth" });
    next.onclick = () => el.scrollBy({ left: el.clientWidth * .8, behavior: "smooth" });
    el.addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd);
    let down = false, sx = 0, sl = 0, moved = false;
    el.addEventListener("pointerdown", e => { if (e.pointerType != "mouse") return; down = true; moved = false; sx = e.clientX; sl = el.scrollLeft; });
    addEventListener("pointermove", e => { if (!down) return; const d = e.clientX - sx; if (Math.abs(d) > 5) { moved = true; el.classList.add("drag"); } if (moved) el.scrollLeft = sl - d; });
    addEventListener("pointerup", () => { down = false; setTimeout(() => el.classList.remove("drag"), 0); });
    el.addEventListener("click", e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    upd();
  };

  /* ---------- cartão de produto ---------- */
  const media = (p, ci) => `${p.old ? `<span class="tag sale">-${Math.round((1 - p.price / p.old) * 100)}%</span>` : p.badge ? `<span class="tag">${p.badge}</span>` : ""}<button class="heart ${wish.has(p.id) ? "on" : ""}" data-w="${p.id}" aria-label="Favorito" aria-pressed="${wish.has(p.id)}">${wish.has(p.id) ? "♥" : "♡"}</button>${pic(p, ci, 1, "i1")}<img class="alt" src="${path(p, ci, 2)}" alt="" loading="lazy" onerror="this.remove()">`;
  const card = p => { const ci = sel[p.id] || 0; return `<article class="card" data-id="${p.id}"><div class="media" data-open>${media(p, ci)}</div><div class="sws">${p.colors.map((c, j) => `<button style="background:${c.hex}" data-sw="${j}" aria-label="${c.n}" aria-pressed="${j == ci}"></button>`).join("")}</div><button class="ttl" data-open>${esc(p.name)}</button><p class="mu">${kind(p)}</p><p class="price">${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ""}</p></article>`; };
  const setColor = (id, j) => { sel[id] = j; const p = byId(id); $$(`.card[data-id="${id}"]`).forEach(c => { $(".media", c).innerHTML = media(p, j); $$("[data-sw]", c).forEach(b => b.setAttribute("aria-pressed", b.dataset.sw == j)); }); };
  const heartSync = id => { const on = wish.has(id); $$(`.heart[data-w="${id}"]`).forEach(h => { h.classList.toggle("on", on); h.textContent = on ? "♥" : "♡"; h.setAttribute("aria-pressed", on); h.classList.remove("pop"); void h.offsetWidth; h.classList.add("pop"); }); $$(`.wm[data-w="${id}"]`).forEach(b => b.textContent = on ? "Guardado nos favoritos ♥" : "Guardar nos favoritos ♡"); };
  const wishToggle = id => { wish.has(id) ? wish.delete(id) : wish.add(id); store.set("wish", [...wish]); $("#wCnt").textContent = wish.size || ""; heartSync(id); toast(wish.has(id) ? "Guardado nos favoritos" : "Removido dos favoritos"); if (S.fav) render(); };

  /* ---------- vistos recentemente ---------- */
  const secRecent = $("#secRecent");
  const drawViewed = () => {
    const items = viewed.map(byId).filter(Boolean);
    secRecent.hidden = !items.length;
    if (!items.length) return;
    $("#carRecent").innerHTML = items.map(card).join("");
    carousel($("#carRecent"), $("[data-car='-1']", secRecent), $("[data-car='1']", secRecent));
  };
  const addViewed = id => { viewed = [id, ...viewed.filter(x => x != id)].slice(0, 10); store.set("viewed", viewed); drawViewed(); };

  /* ---------- também pode gostar (relacionados) ---------- */
  const relatedOf = p => { const pool = PR.filter(x => x.id != p.id && x.cat == p.cat); pool.sort((a, b) => (b.gen == p.gen) - (a.gen == p.gen)); return pool.slice(0, 4); };
  const relatedHTML = p => { const r = relatedOf(p); return r.length ? `<div class="rel"><h3>Também pode gostar</h3><div class="rel-grid">${r.map(x => `<button class="rel-card" data-sp="${x.id}">${pic(x, 0)}<span>${esc(x.name)}</span><b>${money(x.price)}</b></button>`).join("")}</div></div>` : ""; };

  /* ---------- filtros e grelha ---------- */
  const match = p => (!S.cats.size || S.cats.has(p.cat)) && (!S.gens.size || S.gens.has(p.gen) || (p.gen == "Unissexo" && (S.gens.has("Homem") || S.gens.has("Mulher")))) && (!S.sports.size || S.sports.has(p.sport)) && (!S.colors.size || p.colors.some(c => S.colors.has(c.n))) && p.price <= S.max && (!S.sale || p.old) && (!S.badge || p.badge == S.badge) && (!S.fav || wish.has(p.id)) && (!S.q || norm(`${p.name} ${p.cat} ${p.sport} ${p.gen} ${p.colors.map(c => c.n).join(" ")}`).includes(norm(S.q)));
  const list = () => { const a = PR.filter(match); const s = S.sort; if (s == "asc") a.sort((x, y) => x.price - y.price); if (s == "desc") a.sort((x, y) => y.price - x.price); if (s == "pop") a.sort((x, y) => y.reviews - x.reviews); if (s == "new") a.sort((x, y) => (y.badge == "Novo") - (x.badge == "Novo")); return a; };
  const uniq = k => [...new Set(PR.map(p => p[k]))];
  const colors = [...new Map(PR.flatMap(p => p.colors).map(c => [c.n, c.hex]))];
  const group = (t, key, vals) => `<details open><summary>${t}</summary><div class="fg">${vals.map(v => `<label><input type="checkbox" data-f="${key}" value="${v}">${v}<em>${PR.filter(p => (key == "cats" ? p.cat : key == "gens" ? p.gen : p.sport) == v).length}</em></label>`).join("")}</div></details>`;
  $("#filters").innerHTML = `<button class="x" data-close-panel aria-label="Fechar" style="display:none">×</button>` +
    group("Categoria", "cats", uniq("cat")) + group("Género", "gens", ["Homem", "Mulher", "Criança"]) + group("Desporto", "sports", uniq("sport")) +
    `<details open><summary>Cor</summary><div class="fg fc">${colors.map(([n, h]) => `<button style="background:${h}" data-fc="${n}" aria-label="${n}" title="${n}" aria-pressed="false"></button>`).join("")}</div></details>` +
    `<details open><summary>Preço</summary><div class="fg"><input type="range" id="fMax" min="10000" max="150000" step="5000" value="150000" aria-label="Preço máximo"><span id="fMaxL" class="mu sm"></span></div></details>` +
    `<details open><summary>Ofertas</summary><div class="fg"><label><input type="checkbox" id="fSale">Só com desconto</label></div></details>`;
  const syncFilters = () => {
    $$("[data-f]").forEach(i => i.checked = S[i.dataset.f].has(i.value)); $$("[data-fc]").forEach(b => b.setAttribute("aria-pressed", S.colors.has(b.dataset.fc)));
    $("#fMax").value = S.max; $("#fMaxL").textContent = "Até " + money(S.max); $("#fSale").checked = S.sale; $("#sort").value = S.sort;
  };
  const chips = () => {
    const c = [...[...S.cats].map(v => ["cats", v]), ...[...S.gens].map(v => ["gens", v]), ...[...S.sports].map(v => ["sports", v]), ...[...S.colors].map(v => ["colors", v])];
    if (S.max < 150000) c.push(["max", "Até " + money(S.max)]); if (S.sale) c.push(["sale", "Ofertas"]); if (S.fav) c.push(["fav", "Favoritos"]); if (S.badge) c.push(["badge", S.badge]); if (S.q) c.push(["q", "“" + S.q + "”"]);
    $("#chips").innerHTML = c.length ? c.map(([k, v]) => `<button data-chip="${k}:${esc(v)}">${esc(v)} ×</button>`).join("") + `<button class="clr" data-clear>Limpar tudo</button>` : "";
  };
  const render = () => {
    const a = list(); $("#count").textContent = `(${a.length})`;
    $("#grid").innerHTML = a.length ? a.slice(0, S.limit).map(card).join("") : `<div class="empty"><h3>Nenhum produto encontrado</h3><p>Tenta remover alguns filtros.</p><button class="btn" data-clear>Limpar filtros</button></div>`;
    $("#more").hidden = a.length <= S.limit; $("#more").textContent = `Ver mais (${a.length - S.limit})`; chips(); syncFilters();
  };
  const applyFilter = (str, scroll = true) => {
    S = S0();
    (str || "").split("|").filter(Boolean).forEach(kv => {
      const [k, ...r] = kv.split(":"), v = r.join(":");
      if (k == "cat") S.cats.add(v); if (k == "gen") S.gens.add(v); if (k == "sport") S.sports.add(v);
      if (k == "badge") S.badge = v; if (k == "sale") S.sale = true; if (k == "sort") S.sort = v; if (k == "q") S.q = v; if (k == "fav") S.fav = true;
    });
    render(); panel(null); closeMega();
    if (scroll) $("#loja").scrollIntoView({ behavior: "smooth" });
  };
  $("#filters").addEventListener("change", e => {
    const t = e.target; S.limit = 8;
    if (t.dataset.f) t.checked ? S[t.dataset.f].add(t.value) : S[t.dataset.f].delete(t.value);
    if (t.id == "fSale") S.sale = t.checked; render();
  });
  $("#filters").addEventListener("input", e => { if (e.target.id == "fMax") { S.max = +e.target.value; S.limit = 8; render(); } });
  $("#filters").addEventListener("click", e => { const b = e.target.closest("[data-fc]"); if (b) { S.colors.has(b.dataset.fc) ? S.colors.delete(b.dataset.fc) : S.colors.add(b.dataset.fc); render(); } });
  $("#sort").onchange = e => { S.sort = e.target.value; render(); };
  $("#more").onclick = () => { const a = list(), from = S.limit; S.limit += 8; $("#grid").insertAdjacentHTML("beforeend", a.slice(from, S.limit).map(card).join("")); $("#more").hidden = a.length <= S.limit; $("#more").textContent = `Ver mais (${a.length - S.limit})`; };
  $("#toggleF").onclick = () => { if (innerWidth > 900) { const off = $("#shopGrid").classList.toggle("nof"); $("#toggleF").textContent = off ? "Mostrar filtros" : "Ocultar filtros"; } else { $("#filters .x").style.display = "block"; panel("filters"); } };
  $("#filters").addEventListener("click", e => { if (e.target.closest(".x")) panel(null); });
  $("#openWish").onclick = () => wish.size ? applyFilter("fav:1") : toast("Ainda não tens favoritos. Toca no ♡ num produto.");

  /* ---------- cliques globais (cartões, filtros rápidos, chips) ---------- */
  document.addEventListener("click", e => {
    const t = e.target; let b;
    if (b = t.closest("[data-w]")) { e.stopPropagation(); return wishToggle(+b.dataset.w); }
    if (b = t.closest("[data-sw]")) return setColor(+b.closest(".card").dataset.id, +b.dataset.sw);
    if (b = t.closest(".card [data-open]")) return openModal(+b.closest(".card").dataset.id);
    if (b = t.closest("[data-filter]")) { e.preventDefault(); return applyFilter(b.dataset.filter); }
    if (b = t.closest("[data-sq]")) { sInput.value = b.dataset.sq; return runSearch(b.dataset.sq); }
    if (b = t.closest("[data-sp]")) { e.preventDefault(); panel(null); return openModal(+b.dataset.sp); }
    if (t.closest("[data-clear]")) return applyFilter("", false);
    if (b = t.closest("[data-chip]")) {
      const [k, ...r] = b.dataset.chip.split(":"), v = r.join(":").replace(/&quot;/g, '"');
      if (S[k] instanceof Set) S[k].delete(v); else if (k == "max") S.max = 150000; else if (k == "sale") S.sale = false; else if (k == "fav") S.fav = false; else if (k == "badge") S.badge = ""; else if (k == "q") S.q = "";
      render();
    }
  });
  document.addEventListener("mouseover", e => { const b = e.target.closest(".card [data-sw]"); if (b) { const c = b.closest(".card"); if (sel[c.dataset.id] != b.dataset.sw) setColor(+c.dataset.id, +b.dataset.sw); } });

  /* ---------- janela do produto ---------- */
  const pm = $("#pm"); let M = null;
  const openModal = (id, ci = sel[id] || 0) => { const p = byId(id); M = { p, ci, size: sizesOf(p).length == 1 ? "Único" : null, n: 1 }; drawModal(); if (!pm.open) pm.showModal(); pm.scrollTop = 0; addViewed(id); };
  const drawModal = () => {
    const { p, ci } = M, c = p.colors[ci], on = wish.has(p.id);
    pm.innerHTML = `<button class="x" data-close aria-label="Fechar">×</button><div class="pm"><div class="pm-g"><div class="thumbs">${[1, 2, 3, 4].map(n => `<button data-n="${n}" class="${n == M.n ? "on" : ""}" aria-label="Imagem ${n}"><img src="${path(p, ci, n)}" alt="" onerror="this.parentNode.remove()"></button>`).join("")}</div><div class="zoom" id="zoom">${pic(p, ci, M.n)}</div></div>
    <div class="pm-i"><p class="kick mu">${p.badge || kind(p)}</p><h2>${esc(p.name)}</h2><p class="mu">${kind(p)} · ${p.sport}</p><p class="price">${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ""}</p><p class="rate">★ ${p.rating} <span>(${p.reviews} avaliações)</span></p>
    <div class="lb"><span>Cor: ${c.n}</span></div><div class="sws big">${p.colors.map((k, j) => `<button style="background:${k.hex}" data-mc="${j}" aria-label="${k.n}" aria-pressed="${j == ci}"></button>`).join("")}</div>
    <div class="lb"><span>Tamanho</span><em id="szErr"></em></div><div class="sizes" id="sizes">${sizesOf(p).map(s => { const lft = stockLeft(p, s); return `<button data-size="${s}" ${soldOut(p, s) ? "disabled" : ""} ${lft ? `data-low="1" title="Só restam ${lft}"` : ""} aria-pressed="${s == M.size}">${s}</button>`; }).join("")}</div>
    <p class="stockMsg" id="stockMsg"></p>
    <button class="btn block" data-add>Adicionar à sacola</button><button class="btn o block wm" data-w="${p.id}">${on ? "Guardado nos favoritos ♥" : "Guardar nos favoritos ♡"}</button>
    <details open><summary>Descrição</summary><p>${esc(p.desc)}</p></details><details><summary>Entrega e devoluções</summary><p>Entrega em Luanda em 24 a 48 horas. Devolução gratuita em 30 dias, com o artigo por usar.</p></details><details><summary>Cuidados</summary><p>Lavar a 30 °C, do avesso. Não usar lixívia. Secar à sombra.</p></details>
    ${relatedHTML(p)}</div></div>`;
    updateStockMsg();
  };
  const updateStockMsg = () => { const { p, size } = M, lft = size ? stockLeft(p, size) : null, el = $("#stockMsg"); if (!el) return; el.textContent = lft ? `Só restam ${lft} ${p.cat == "Calçado" ? "pares" : "peças"} no tamanho ${size} — despacha-te.` : ""; };
  pm.addEventListener("click", e => {
    const t = e.target; let b;
    if (t == pm || t.closest("[data-close]")) return pm.close();
    if (b = t.closest("[data-n]")) { M.n = +b.dataset.n; $("#zoom").innerHTML = pic(M.p, M.ci, M.n); $$(".thumbs button").forEach(x => x.classList.toggle("on", x == b)); }
    else if (b = t.closest("[data-mc]")) { M.ci = +b.dataset.mc; M.n = 1; sel[M.p.id] = M.ci; drawModal(); setColor(M.p.id, M.ci); }
    else if (b = t.closest("[data-size]")) { M.size = b.dataset.size; $$("#sizes button").forEach(x => x.setAttribute("aria-pressed", x == b)); $("#szErr").textContent = ""; updateStockMsg(); }
    else if (b = t.closest("[data-add]")) {
      if (!M.size) { const s = $("#sizes"); $("#szErr").textContent = "Escolhe um tamanho"; s.classList.remove("shake"); void s.offsetWidth; s.classList.add("shake"); return; }
      flyToCart($("#zoom img", pm) || b); addToCart(M.p.id, M.ci, M.size); pm.close(); panel("cart");
    }
  });
  pm.addEventListener("mousemove", e => { const z = e.target.closest("#zoom"); if (z) { const r = z.getBoundingClientRect(); z.style.setProperty("--zx", (e.clientX - r.left) / r.width * 100 + "%"); z.style.setProperty("--zy", (e.clientY - r.top) / r.height * 100 + "%"); } });
  pm.addEventListener("keydown", e => { if (e.key == "ArrowRight" || e.key == "ArrowLeft") { const th = $$(".thumbs button"); if (th.length < 2) return; const k = th.findIndex(x => x.classList.contains("on")); th[(k + (e.key == "ArrowRight" ? 1 : -1) + th.length) % th.length].click(); } });

  /* ---------- animação: a imagem "voa" até ao ícone da sacola ---------- */
  const bump = el => { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); };
  const flyToCart = imgEl => {
    const target = $("#openCart");
    if (!imgEl || matchMedia("(prefers-reduced-motion: reduce)").matches) return bump(target);
    const src = imgEl.tagName == "IMG" ? (imgEl.currentSrc || imgEl.getAttribute("src")) : null;
    const r1 = imgEl.getBoundingClientRect(), r2 = target.getBoundingClientRect();
    const clone = document.createElement("div"); clone.className = "fly";
    if (src) clone.style.backgroundImage = `url("${src}")`;
    Object.assign(clone.style, { left: r1.left + "px", top: r1.top + "px", width: r1.width + "px", height: r1.height + "px" });
    document.body.appendChild(clone);
    requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(clone.style, { left: (r2.left + r2.width / 2 - 8) + "px", top: (r2.top + r2.height / 2 - 8) + "px", width: "16px", height: "16px", opacity: "0.15", borderRadius: "50%" })));
    const done = () => { clone.remove(); bump(target); };
    clone.addEventListener("transitionend", done, { once: true }); setTimeout(done, 700);
  };

  /* ---------- sacola ---------- */
  const totals = () => { const sub = cart.reduce((a, l) => a + byId(l.id).price * l.q, 0), d = Math.round(sub * (PROMOS[promo] || 0)), net = sub - d; return { sub, d, net, ship: net >= FREE || !sub ? 0 : SHIP, get total() { return this.net + this.ship; }, n: cart.reduce((a, l) => a + l.q, 0) }; };
  const saveCart = () => { store.set("cart", cart); drawCart(); };
  const addToCart = (id, ci, size) => { const l = cart.find(x => x.id == id && x.ci == ci && x.size == size); l ? l.q++ : cart.push({ id, ci, size, q: 1 }); saveCart(); };
  const drawCart = () => {
    const T = totals(); $("#cCnt").textContent = T.n || "";
    $("#cShip").innerHTML = T.sub ? (T.net >= FREE ? "Tens <b>entrega grátis</b> nesta compra." : `Faltam <b>${money(FREE - T.net)}</b> para entrega grátis.`) + `<i><b style="width:${Math.min(100, T.net / FREE * 100)}%"></b></i>` : "";
    $("#cItems").innerHTML = cart.length ? cart.map((l, k) => { const p = byId(l.id); return `<div class="li"><div class="li-i">${pic(p, l.ci)}</div><div><b>${esc(p.name)}</b><small>${p.colors[l.ci].n} · Tam. ${l.size}</small><div class="qty"><button data-q="${k}:-1" aria-label="Menos">−</button><span>${l.q}</span><button data-q="${k}:1" aria-label="Mais">+</button></div></div><div class="li-p">${money(p.price * l.q)}<button data-rm="${k}">Remover</button></div></div>`; }).join("") : `<div class="empty"><h3>A tua sacola está vazia</h3><p>Quando adicionares artigos, aparecem aqui.</p><button class="btn" data-filter="">Ver produtos</button></div>`;
    $("#cFoot").innerHTML = cart.length ? `<div class="promo"><input id="promoIn" placeholder="Código promocional" value="${esc(promo)}" aria-label="Código promocional"><button class="btn o" data-promo>Aplicar</button></div><dl><div><dt>Subtotal</dt><dd>${money(T.sub)}</dd></div>${T.d ? `<div class="ok"><dt>Desconto (${esc(promo)})</dt><dd>−${money(T.d)}</dd></div>` : ""}<div><dt>Entrega</dt><dd>${T.ship ? money(T.ship) : "Grátis"}</dd></div><div class="tot"><dt>Total</dt><dd>${money(T.total)}</dd></div></dl><button class="btn block" data-checkout>Finalizar compra</button>` : "";
  };
  $("#cart").addEventListener("click", e => {
    const t = e.target; let b;
    if (b = t.closest("[data-q]")) { const [k, d] = b.dataset.q.split(":"); cart[k].q += +d; if (cart[k].q < 1) cart.splice(k, 1); saveCart(); }
    else if (b = t.closest("[data-rm]")) { const k = +b.dataset.rm, [it] = cart.splice(k, 1); saveCart(); toast("Artigo removido", "Desfazer", () => { cart.splice(k, 0, it); saveCart(); }); }
    else if (t.closest("[data-promo]")) { const v = $("#promoIn").value.trim().toUpperCase(); if (!v) { promo = ""; } else if (PROMOS[v]) { promo = v; toast(`Código ${v} aplicado: -${PROMOS[v] * 100}%`); } else { toast("Código inválido. Experimenta KERQZ10."); return; } store.set("promo", promo); drawCart(); }
    else if (t.closest("[data-checkout]")) openCheckout();
  });

  /* ---------- checkout ---------- */
  const co = $("#co");
  const rules = { nome: v => v.trim().split(/\s+/).length > 1 || "Escreve o nome e o apelido.", tel: v => /^(\+?244)?\s?9\d{2}\s?\d{3}\s?\d{3}$/.test(v.trim()) || "Usa um número angolano: 9XX XXX XXX.", email: v => !v || /^\S+@\S+\.\S+$/.test(v.trim()) || "Email inválido.", end: v => v.trim().length > 5 || "Indica a morada de entrega." };
  const openCheckout = () => {
    panel(null); const T = totals();
    co.innerHTML = `<button class="x" data-close aria-label="Fechar">×</button><form class="co" novalidate><h2>Finalizar compra</h2><div class="row"><label>Nome completo<input name="nome" autocomplete="name"><small class="err"></small></label><label>Telefone<input name="tel" type="tel" placeholder="9XX XXX XXX" autocomplete="tel"><small class="err"></small></label></div><label>Email (opcional)<input name="email" type="email" autocomplete="email"><small class="err"></small></label><div class="row"><label>Província<select name="prov">${["Luanda", "Benguela", "Huambo", "Huíla", "Cabinda", "Uíge", "Malanje", "Namibe"].map(x => `<option>${x}</option>`).join("")}</select></label><label>Morada de entrega<input name="end" placeholder="Bairro, rua, referência" autocomplete="street-address"><small class="err"></small></label></div><fieldset><legend>Pagamento</legend>${[["mcx", "Multicaixa Express", "Recebes um pedido de pagamento no telemóvel."], ["ref", "Referência de pagamento", "Geramos uma referência para pagares no ATM ou na app do banco."], ["cod", "Pagar na entrega", "Em dinheiro ou TPA, no momento da entrega."]].map((o, i) => `<label class="opt"><input type="radio" name="pay" value="${o[0]}" ${i ? "" : "checked"}><span><b>${o[1]}</b><small>${o[2]}</small></span></label>`).join("")}</fieldset><button class="btn block">Confirmar pedido · ${money(T.total)}</button><p class="mu sm" style="margin-top:10px">Demonstração: nenhum pagamento real é processado.</p></form>`;
    co.showModal();
  };
  co.addEventListener("click", e => { if (e.target == co || e.target.closest("[data-close]") || e.target.closest("[data-done]")) co.close(); });
  co.addEventListener("input", e => { e.target.classList.remove("bad"); const s = e.target.parentNode.querySelector(".err"); if (s) s.textContent = ""; });
  co.addEventListener("submit", e => {
    e.preventDefault(); const f = e.target; let ok = true;
    Object.keys(rules).forEach(k => { const i = f.elements[k], r = rules[k](i.value), s = i.parentNode.querySelector(".err"); i.classList.toggle("bad", r !== true); s.textContent = r === true ? "" : r; if (r !== true) { if (ok) i.focus(); ok = false; } });
    if (!ok) return;
    const pay = f.elements.pay.value, no = "KQ-" + Math.floor(100000 + Math.random() * 900000), T = totals(), ref = Array.from({ length: 3 }, () => Math.floor(100 + Math.random() * 900)).join(" ");
    co.innerHTML = `<div class="done"><h2>Pedido confirmado</h2><p>Obrigado, <b>${esc(f.elements.nome.value.trim().split(" ")[0])}</b>. O teu pedido <b>${no}</b> está a ser preparado.</p><div class="refbox">${pay == "ref" ? `Entidade <b>11223</b> · Referência <b>${ref}</b><br>Valor a pagar: <b>${money(T.total)}</b>` : pay == "mcx" ? `Enviámos um pedido de pagamento de <b>${money(T.total)}</b> para o teu Multicaixa Express.` : `Paga <b>${money(T.total)}</b> ao estafeta no momento da entrega.`}</div><p class="mu sm">Vamos ligar-te para combinar a entrega em ${esc(f.elements.prov.value)}.</p><button class="btn block" data-done>Continuar a comprar</button></div>`;
    cart = []; promo = ""; store.set("promo", ""); saveCart();
  });

  /* ---------- extras: newsletter e animação ao fazer scroll ---------- */
  $("#nl").addEventListener("submit", e => { e.preventDefault(); const i = $("input", e.target), ok = /^\S+@\S+\.\S+$/.test(i.value); i.classList.toggle("bad", !ok); if (ok) { e.target.reset(); toast("Subscrição feita. Obrigado!"); } else toast("Escreve um email válido."); });
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: .15 }); $$(".rv").forEach(el => io.observe(el)); } else $$(".rv").forEach(el => el.classList.add("in"));

  /* ---------- arranque ---------- */
  $("#carNew").innerHTML = [...PR].sort((a, b) => (b.badge == "Novo") - (a.badge == "Novo")).slice(0, 10).map(card).join("");
  carousel($("#carNew"), $("[data-car='-1']"), $("[data-car='1']"));
  $("#wCnt").textContent = wish.size || "";
  render(); drawCart(); drawSearch(); drawViewed();
})();
