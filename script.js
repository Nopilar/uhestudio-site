/* Uh! Estúdio — interações do site */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Ano no rodapé ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Abertura com logo ---------- */
  const intro = $("#intro");
  if (intro && document.documentElement.classList.contains("intro-on")) {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      document.documentElement.classList.remove("intro-on");
      intro.remove();
    };
    const skip = () => {
      intro.classList.add("is-leaving");
      setTimeout(finish, 750);
    };
    intro.addEventListener("click", skip);
    window.addEventListener("keydown", skip, { once: true });
    intro.addEventListener("animationend", (e) => {
      if (e.target === intro) finish();
    });
    setTimeout(finish, 3400); // garantia caso a animação não dispare
  } else if (intro) {
    intro.remove();
  }

  /* ---------- Header: estado ao rolar ---------- */
  const header = $("#header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  const toggle = $("#menuToggle");
  const nav = $("#nav");
  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      nav.classList.toggle("is-open", open);
      header.classList.toggle("menu-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    $$("a", nav).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  /* ---------- Hero: slider de projetos ---------- */
  const slides = $$(".hero__slide");
  const heroTitle = $("#heroTitle");
  const heroMeta = $("#heroMeta");
  const heroLink = $("#heroLink");
  const heroIndex = $("#heroIndex");
  const heroTotal = $("#heroTotal");
  const heroNext = $("#heroNext");
  let current = 0;
  let timer = null;
  const pad = (n) => String(n).padStart(2, "0");

  function showSlide(i) {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === current));
    const active = slides[current];
    if (heroTitle) heroTitle.textContent = active.dataset.title || "";
    if (heroMeta) heroMeta.textContent = active.dataset.meta || "";
    if (heroLink && active.dataset.href) heroLink.href = active.dataset.href;
    if (heroIndex) heroIndex.textContent = pad(current + 1);
    tabs.forEach((t, idx) => t.setAttribute("aria-current", idx === current ? "true" : "false"));
  }

  /* Lista de projetos do hero (gerada a partir dos slides) */
  const heroTabs = $("#heroTabs");
  const tabs = [];
  if (heroTabs) {
    slides.forEach((s, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = s.dataset.title || "Projeto " + (idx + 1);
      b.addEventListener("click", () => { showSlide(idx); startAuto(); });
      heroTabs.appendChild(b);
      tabs.push(b);
    });
  }

  /* Relógio de São Paulo */
  const heroClock = $("#heroClock");
  if (heroClock) {
    const fmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
    const tick = () => { heroClock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 20000);
  }

  function startAuto() {
    stopAuto();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer = setInterval(() => showSlide(current + 1), 6000);
  }
  function stopAuto() { if (timer) clearInterval(timer); timer = null; }

  if (slides.length) {
    if (heroTotal) heroTotal.textContent = pad(slides.length);
    showSlide(0);
    startAuto();
    heroNext && heroNext.addEventListener("click", () => { showSlide(current + 1); startAuto(); });
    document.addEventListener("visibilitychange", () => (document.hidden ? stopAuto() : startAuto()));
  }

  /* ---------- Projetos: filtros ---------- */
  const filters = $("#filters");
  const cards = $$("#projectsGrid .card");
  if (filters) {
    filters.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      $$("button", filters).forEach((b) => b.classList.toggle("is-active", b === btn));
      const f = btn.dataset.filter;
      cards.forEach((card) => {
        const match = f === "all" || (card.dataset.cat || "").split(" ").includes(f);
        card.classList.toggle("is-hidden", !match);
        if (match) card.classList.add("is-visible");
      });
    });
  }

  /* ---------- Reveal ao rolar ---------- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Galeria dos projetos ----------
     Monta linhas "justificadas" (todas as fotos da linha com a mesma altura,
     sem cortar nada), com uma foto horizontal de ponta a ponta de tempos em
     tempos, legendas numeradas e um visualizador em tela cheia. */
  const galleries = $$(".gallery");
  if (galleries.length) {
    const ratio = (fig) => {
      const img = $("img", fig);
      const w = +img.getAttribute("width");
      const h = +img.getAttribute("height");
      return w && h ? w / h : 1.5;
    };
    const allFigs = [];

    galleries.forEach((g) => {
      const figs = $$("figure", g);
      const rows = [];
      let i = 0;
      let sinceFeature = 99;
      while (i < figs.length) {
        const isPortrait = (k) => figs[i + k] && ratio(figs[i + k]) < 1;
        let n;
        if (ratio(figs[i]) >= 1.3 && sinceFeature >= 4 && figs.length >= 4) {
          n = 1;
          sinceFeature = 0;
        } else {
          n = isPortrait(0) && isPortrait(1) && isPortrait(2) ? 3 : 2;
          n = Math.min(n, figs.length - i);
          sinceFeature += n;
        }
        rows.push(figs.slice(i, i + n));
        i += n;
      }
      // Uma foto vertical sobrando no fim entra na linha anterior
      const last = rows[rows.length - 1];
      if (rows.length > 1 && last.length === 1 && ratio(last[0]) < 1.3) {
        rows[rows.length - 2].push(...rows.pop());
      }

      g.textContent = "";
      g.classList.add("gallery--editorial");
      rows.forEach((row) => {
        const div = document.createElement("div");
        const sum = row.reduce((acc, f) => acc + ratio(f), 0);
        const full = row.length === 1 && figs.length >= 4;
        div.className = "gallery__row" + (full ? " gallery__row--full" : "");
        // Limita a altura da linha a ~84% da tela (fotos verticais não ficam gigantes)
        if (!full) div.style.maxWidth = "calc(" + sum.toFixed(3) + " * 84svh)";
        row.forEach((fig) => {
          fig.style.flex = ratio(fig).toFixed(3) + " 1 0%";
          div.appendChild(fig);
        });
        g.appendChild(div);
      });
      allFigs.push(...figs);
    });

    /* Visualizador em tela cheia */
    const total = allFigs.length;
    const projectName = (document.title.split("—")[0] || "").trim();
    const lb = document.createElement("div");
    lb.className = "lb";
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Fotos do projeto " + projectName);
    lb.innerHTML =
      '<div class="lb__bar">' +
        '<span class="lb__title"></span>' +
        '<span class="lb__count"></span>' +
        '<button type="button" class="lb__close">Fechar <span aria-hidden="true">✕</span></button>' +
      "</div>" +
      '<div class="lb__stage"><img class="lb__img" alt=""></div>' +
      '<button type="button" class="lb__nav lb__nav--prev" aria-label="Foto anterior"><img src="../assets/img/brand/seta-laranjaclaro.png" alt=""></button>' +
      '<button type="button" class="lb__nav lb__nav--next" aria-label="Próxima foto"><img src="../assets/img/brand/seta-laranjaclaro.png" alt=""></button>' +
      '<p class="lb__caption"></p>';
    document.body.appendChild(lb);

    const lbImg = $(".lb__img", lb);
    const lbCount = $(".lb__count", lb);
    const lbCaption = $(".lb__caption", lb);
    const lbClose = $(".lb__close", lb);
    $(".lb__title", lb).textContent = projectName;
    let lbIndex = 0;
    let lastFocus = null;

    const srcOf = (idx) => $("img", allFigs[idx]).getAttribute("src");
    const show = (idx) => {
      lbIndex = (idx + total) % total;
      const img = $("img", allFigs[lbIndex]);
      lbImg.classList.remove("is-loaded");
      lbImg.onload = () => lbImg.classList.add("is-loaded");
      lbImg.src = srcOf(lbIndex);
      lbImg.alt = img.alt;
      if (lbImg.complete) lbImg.classList.add("is-loaded");
      lbCount.textContent = pad(lbIndex + 1) + " / " + pad(total);
      lbCaption.textContent = img.alt;
      [lbIndex + 1, lbIndex - 1].forEach((n) => { new Image().src = srcOf((n + total) % total); });
    };
    const openLb = (idx) => {
      lastFocus = document.activeElement;
      lb.hidden = false;
      document.body.style.overflow = "hidden";
      show(idx);
      requestAnimationFrame(() => lb.classList.add("is-open"));
      lbClose.focus();
    };
    const closeLb = () => {
      lb.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(() => { lb.hidden = true; }, 300);
      if (lastFocus) lastFocus.focus();
    };

    allFigs.forEach((fig, idx) => {
      const img = $("img", fig);
      const cap = document.createElement("figcaption");
      const num = document.createElement("span");
      const txt = document.createElement("span");
      num.textContent = pad(idx + 1) + " / " + pad(total);
      txt.textContent = img.alt;
      cap.append(num, txt);
      fig.appendChild(cap);
      fig.tabIndex = 0;
      fig.setAttribute("role", "button");
      fig.setAttribute("aria-label", "Ampliar foto " + (idx + 1) + ": " + img.alt);
      fig.addEventListener("click", () => openLb(idx));
      fig.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLb(idx); }
      });
    });

    lbClose.addEventListener("click", closeLb);
    $(".lb__nav--prev", lb).addEventListener("click", () => show(lbIndex - 1));
    $(".lb__nav--next", lb).addEventListener("click", () => show(lbIndex + 1));
    $(".lb__stage", lb).addEventListener("click", (e) => { if (e.target !== lbImg) closeLb(); });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowRight") show(lbIndex + 1);
      else if (e.key === "ArrowLeft") show(lbIndex - 1);
    });
    let touchX = null;
    lb.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(lbIndex + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  /* ---------- Formulário de contato ----------
     Sem backend ainda: monta um e-mail com os dados.
     Para usar um serviço (Formspree, Netlify Forms etc.),
     troque o bloco abaixo por um fetch() para o endpoint. */
  const form = $("#contactForm");
  if (form) {
    const digits = (v) => v.replace(/\D/g, "");

    // Máscara do WhatsApp: (11) 91234-5678
    const tel = form.elements.telefone;
    tel.addEventListener("input", () => {
      const d = digits(tel.value).slice(0, 11);
      let out = d;
      if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length > 7) out = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
      tel.value = out;
    });

    const messages = {
      nome: "Informe seu nome.",
      email: "Informe um e-mail válido.",
      telefone: "Informe um WhatsApp com DDD.",
      tipo: "Escolha o tipo de projeto.",
      mensagem: "Conte um pouco sobre o projeto.",
    };
    const fields = Object.keys(messages).map((n) => form.elements[n]);

    const check = (el) => {
      let ok = el.checkValidity() && el.value.trim() !== "";
      if (el.name === "nome") ok = ok && el.value.trim().length >= 2;
      if (el.name === "telefone") ok = [10, 11].includes(digits(el.value).length);
      const label = el.closest("label");
      let err = $(".form__error", label);
      if (!ok && !err) {
        err = document.createElement("span");
        err.className = "form__error";
        err.id = "err-" + el.name;
        label.appendChild(err);
      }
      if (err) err.textContent = ok ? "" : messages[el.name];
      el.setAttribute("aria-invalid", ok ? "false" : "true");
      if (err) el.setAttribute("aria-describedby", err.id);
      return ok;
    };
    fields.forEach((el) => {
      el.addEventListener("blur", () => check(el));
      el.addEventListener("input", () => { if (el.getAttribute("aria-invalid") === "true") check(el); });
      el.addEventListener("change", () => { if (el.getAttribute("aria-invalid") === "true") check(el); });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const invalid = fields.filter((el) => !check(el));
      if (invalid.length) { invalid[0].focus(); return; }

      const data = new FormData(form);
      const nome = data.get("nome").trim();
      const telefone = data.get("telefone").trim();
      const assunto = encodeURIComponent(`Novo contato pelo site — ${data.get("tipo")} — ${nome}`);
      const corpo = encodeURIComponent(
        `CONTATO PARA SALVAR\n` +
        `Nome: ${nome}\n` +
        `WhatsApp: ${telefone}\n` +
        `Conversar no WhatsApp: https://wa.me/55${digits(telefone)}\n` +
        `E-mail: ${data.get("email").trim()}\n\n` +
        `Tipo de projeto: ${data.get("tipo")}\n\n` +
        `Mensagem:\n${data.get("mensagem").trim()}`
      );
      window.location.href = `mailto:ola@uhestudio.com?subject=${assunto}&body=${corpo}`;
      form.classList.add("is-sent");
      const note = $(".form__note", form);
      if (note) note.textContent = "Obrigado! Abrimos seu e-mail com a mensagem pronta para enviar.";
    });
  }
})();
