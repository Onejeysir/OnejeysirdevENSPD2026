(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Année du pied de page */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* En-tête : ombre au défilement */
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);

  /* Menu mobile */
  const toggle = $('.nav-toggle');
  const menu = $('#menu');
  const setMenu = (open) => {
    menu.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 760) setMenu(false); });

  /* Lien actif selon la section visible */
  const links = $$('.menu a');
  const sections = links.map((a) => $(a.getAttribute('href')));
  const setActive = () => {
    const pos = window.scrollY + header.offsetHeight + 120;
    let current = 0;
    sections.forEach((s, i) => { if (s && s.offsetTop <= pos) current = i; });
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) current = sections.length - 1;
    links.forEach((a, i) => a.classList.toggle('active', i === current));
  };
  window.addEventListener('scroll', () => { onScroll(); setActive(); }, { passive: true });
  onScroll();
  setActive();

  /* Titre animé : Front end, Backend, Fullstack */
  const typed = $('#typed');
  const words = ['Front end', 'Backend', 'Fullstack'];
  if (typed && !reduceMotion) {
    let w = words.length - 1;
    let i = words[w].length;
    let deleting = true;
    const tick = () => {
      const word = words[w];
      i += deleting ? -1 : 1;
      typed.textContent = word.slice(0, i);
      let delay = deleting ? 55 : 110;
      if (!deleting && i === word.length) { deleting = true; delay = 1700; }
      else if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 1800);
  }

  /* Apparition au défilement + barres de compétences */
  const animateSkill = (card) => {
    card.classList.add('animate');
    const out = $('.count', card);
    const target = Number(card.dataset.value);
    if (reduceMotion || !out) return;
    const start = performance.now();
    const duration = 1600;
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      out.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    out.textContent = '0';
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('visible');
        if (el.matches('.skill')) animateSkill(el);
        io.unobserve(el);
      });
    }, { threshold: 0.25 });
    $$('.reveal').forEach((el) => io.observe(el));
  }

  /* Copier du texte */
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      area.remove();
      return ok;
    }
  };
  const flashLabel = (btn, text) => {
    const old = btn.textContent;
    btn.textContent = text;
    setTimeout(() => { btn.textContent = old; }, 1800);
  };
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await copyText(btn.dataset.copy);
      flashLabel(btn, ok ? 'Copié ✓' : 'Sélectionnez le texte');
    });
  });

  /* Formulaire de contact */
  const TO = 'jeysonudalric150@gmail.com';
  const form = $('#contact-form');
  const status = $('#form-status');

  const rules = {
    nom: (v) => v.trim().length >= 2 || 'Veuillez saisir votre nom.',
    prenom: (v) => v.trim().length >= 2 || 'Veuillez saisir votre prénom.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Veuillez saisir une adresse e-mail valide.',
    message: (v) => v.trim().length >= 10 || 'Votre message doit contenir au moins 10 caractères.'
  };

  const check = (id) => {
    const input = document.getElementById(id);
    const field = input.closest('.field');
    const result = rules[id](input.value);
    const valid = result === true;
    field.classList.toggle('invalid', !valid);
    input.setAttribute('aria-invalid', String(!valid));
    $('.error', field).textContent = valid ? '' : result;
    return valid;
  };

  Object.keys(rules).forEach((id) => {
    document.getElementById(id).addEventListener('input', () => {
      if (document.getElementById(id).closest('.field').classList.contains('invalid')) check(id);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const results = Object.keys(rules).map(check);
    if (results.includes(false)) {
      const firstBad = $('.field.invalid input, .field.invalid textarea', form);
      if (firstBad) firstBad.focus();
      return;
    }

    const nom = $('#nom').value.trim();
    const prenom = $('#prenom').value.trim();
    const email = $('#email').value.trim();
    const message = $('#message').value.trim();
    const subject = 'Message depuis votre profil : ' + prenom + ' ' + nom;
    const body = 'Nom : ' + nom + '\nPrénom : ' + prenom + '\nE-mail : ' + email + '\n\n' + message;
    const enc = encodeURIComponent;

    const mailto = 'mailto:' + TO + '?subject=' + enc(subject) + '&body=' + enc(body);
    const gmail = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + enc(TO) + '&su=' + enc(subject) + '&body=' + enc(body);

    status.replaceChildren();
    const text = document.createElement('p');
    text.textContent = 'Votre application e-mail va s\'ouvrir avec le message prêt à envoyer. Si rien ne s\'ouvre, utilisez l\'une de ces options :';
    const actions = document.createElement('div');
    actions.className = 'status-actions';

    const gmailLink = document.createElement('a');
    gmailLink.className = 'btn-ghost';
    gmailLink.href = gmail;
    gmailLink.target = '_blank';
    gmailLink.rel = 'noopener';
    gmailLink.textContent = 'Ouvrir dans Gmail';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn-ghost';
    copyBtn.textContent = 'Copier le message';
    copyBtn.addEventListener('click', async () => {
      const ok = await copyText(body);
      flashLabel(copyBtn, ok ? 'Copié ✓' : 'Copie impossible');
    });

    actions.append(gmailLink, copyBtn);
    status.append(text, actions);
    status.hidden = false;

    try { window.location.href = mailto; } catch (err) { /* l'utilisateur garde les options ci-dessus */ }
  });
})();
