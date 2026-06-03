"use strict";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const setYear = () => {
  const yearEl = qs("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
};

const setupHeaderOnScroll = () => {
  const header = qs("[data-header]");
  if (!header) return;

  const update = () => {
    const scrolled = window.scrollY > 12;
    header.classList.toggle("is-scrolled", scrolled);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
};

const setupMobileMenu = () => {
  const burger = qs("[data-burger]");
  const mobileMenu = qs("[data-mobile-menu]");
  const closeBtn = qs("[data-close-menu]");
  const backdrop = qs("[data-backdrop]");
  const navLinks = qsa('a[href^="#"]', mobileMenu || document);

  if (!burger || !mobileMenu) return;

  const open = () => {
    mobileMenu.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    document.documentElement.style.overflow = "hidden";
  };

  const close = () => {
    mobileMenu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.documentElement.style.overflow = "";
  };

  burger.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.contains("is-open");
    if (isOpen) close();
    else open();
  });

  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);

  navLinks.forEach((a) => a.addEventListener("click", close));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
};

const setupSmoothScroll = () => {
  const internalLinks = qsa('a[href^="#"]').filter((a) => a.getAttribute("href") !== "#");
  if (!internalLinks.length) return;

  internalLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href) return;
      const target = qs(href);
      if (!target) return;

      e.preventDefault();
      const header = qs("[data-header]");
      const headerOffset = header ? header.getBoundingClientRect().height : 0;
      const y = target.getBoundingClientRect().top + window.scrollY - headerOffset + 2;

      window.scrollTo({
        top: y,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
      history.pushState(null, "", href);
    });
  });
};

const setupScrollReveal = () => {
  const items = qsa(".reveal");
  if (!items.length) return;

  if (prefersReducedMotion) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -10% 0px" }
  );

  items.forEach((el) => io.observe(el));
};

const setupLightbox = () => {
  const triggers = qsa("[data-lightbox]");
  if (!triggers.length) return;

  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.innerHTML = `
    <div class="lightbox-backdrop" data-lb-close></div>
    <div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="Anteprima immagine">
      <button class="lightbox-close" type="button" aria-label="Chiudi" data-lb-close>×</button>
      <img class="lightbox-img" alt="" />
    </div>
  `;
  document.body.appendChild(lb);

  const img = qs(".lightbox-img", lb);
  const closeEls = qsa("[data-lb-close]", lb);

  const open = (src, alt) => {
    if (!img) return;
    img.src = src;
    img.alt = alt || "Immagine";
    lb.classList.add("is-open");
    document.documentElement.style.overflow = "hidden";
  };

  const close = () => {
    lb.classList.remove("is-open");
    document.documentElement.style.overflow = "";
    if (img) img.src = "";
  };

  triggers.forEach((btn) => {
    btn.addEventListener("click", () => {
      const full = btn.getAttribute("data-full");
      const previewImg = qs("img", btn);
      const alt = previewImg?.getAttribute("alt") || "Immagine";
      if (!full) return;
      open(full, alt);
    });
  });

  closeEls.forEach((el) => el.addEventListener("click", close));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
};

const setupFormValidation = () => {
  const form = qs("[data-booking-form]");
  if (!form) return;

  const statusEl = qs("[data-form-status]");

  const setStatus = (type, text) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.add("is-visible");
    statusEl.classList.toggle("is-success", type === "success");
    statusEl.classList.toggle("is-error", type === "error");
  };

  const clearStatus = () => {
    if (!statusEl) return;
    statusEl.textContent = "";
    statusEl.classList.remove("is-visible", "is-success", "is-error");
  };

  const setFieldError = (fieldEl, message) => {
    const wrap = fieldEl.closest(".field");
    const name = fieldEl.getAttribute("name");
    const err = name ? qs(`[data-error-for="${CSS.escape(name)}"]`, form) : null;
    wrap?.classList.toggle("is-invalid", Boolean(message));
    if (err) err.textContent = message || "";
  };

  const getValue = (name) => {
    const el = qs(`[name="${CSS.escape(name)}"]`, form);
    return el ? String(el.value || "").trim() : "";
  };

  const parseDate = (s) => {
    const d = new Date(`${s}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const validate = () => {
    clearStatus();

    const fields = qsa("input, select, textarea", form);
    fields.forEach((f) => setFieldError(f, ""));

    const errors = [];
    const nome = qs('[name="nome"]', form);
    const cognome = qs('[name="cognome"]', form);
    const email = qs('[name="email"]', form);
    const telefono = qs('[name="telefono"]', form);
    const checkin = qs('[name="checkin"]', form);
    const checkout = qs('[name="checkout"]', form);
    const ospiti = qs('[name="ospiti"]', form);

    const emailValue = getValue("email");
    const phoneValue = getValue("telefono");
    const inValue = getValue("checkin");
    const outValue = getValue("checkout");

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
    const phoneOk = phoneValue.replace(/[^\d+]/g, "").length >= 8;

    if (nome && !getValue("nome")) errors.push([nome, "Inserisci il nome."]);
    if (cognome && !getValue("cognome")) errors.push([cognome, "Inserisci il cognome."]);
    if (email && (!emailValue || !emailOk)) errors.push([email, "Inserisci un’email valida."]);
    if (telefono && (!phoneValue || !phoneOk)) errors.push([telefono, "Inserisci un numero di telefono valido."]);
    if (checkin && !inValue) errors.push([checkin, "Seleziona la data di check-in."]);
    if (checkout && !outValue) errors.push([checkout, "Seleziona la data di check-out."]);
    if (ospiti && !getValue("ospiti")) errors.push([ospiti, "Seleziona il numero di ospiti."]);

    const dIn = parseDate(inValue);
    const dOut = parseDate(outValue);
    if (checkin && checkout && dIn && dOut && dOut <= dIn) {
      errors.push([checkout, "La data di check-out deve essere successiva al check-in."]);
    }

    errors.forEach(([fieldEl, msg]) => setFieldError(fieldEl, msg));
    if (errors.length) {
      setStatus("error", "Controlla i campi evidenziati e riprova.");
      const first = errors[0][0];
      first?.focus?.();
      return false;
    }
    return true;
  };

  qsa("input, select, textarea", form).forEach((el) => {
    el.addEventListener("input", () => {
      const wrap = el.closest(".field");
      if (!wrap?.classList.contains("is-invalid")) return;
      validate();
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = validate();
    if (!ok) return;

    setStatus("success", "Richiesta inviata. Ti ricontatteremo al più presto.");
    form.reset();
  });
};

const setupTiltHover = () => {
  const cards = qsa("[data-tilt]");
  if (!cards.length || prefersReducedMotion) return;

  const max = 10;
  const onMove = (el, e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const rx = (0.5 - y) * max;
    const ry = (x - 0.5) * max;
    el.style.transform = `translateY(-4px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };

  const onLeave = (el) => {
    el.style.transform = "";
  };

  cards.forEach((el) => {
    el.addEventListener("mousemove", (e) => onMove(el, e));
    el.addEventListener("mouseleave", () => onLeave(el));
  });
};

setYear();
setupHeaderOnScroll();
setupMobileMenu();
setupSmoothScroll();
setupScrollReveal();
setupLightbox();
setupFormValidation();
setupTiltHover();
