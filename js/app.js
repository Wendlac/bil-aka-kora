/* ==========================================================================
   Bil Aka Kora : interactions
   Dépend de GSAP (window.gsap). Les durées et décalages sont lus dans les
   tokens CSS, pour que CSS et JS gardent le même tempo.

   Composants pilotés par attributs :
     [data-menu-toggle] + #menu[data-menu]         menu plein écran
     [data-listen-open="id"] + dialog#id            feuille « Écouter sur »
     form[data-subscribe]                           formulaire « Être prévenu »
     img[data-fade]                                 image qui s'allume au chargement
     a.video__frame[data-youtube-id]                vidéo YouTube chargée au clic
     button[data-copy]                              copie un texte dans le presse-papiers
     a[data-lightbox-item] + dialog#lightbox        visionneuse plein écran des photos
   ========================================================================== */

(() => {
  "use strict";

  const root = document.documentElement;
  const gsap = window.gsap;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Opacité seule, jamais autoAlpha : visibility:hidden rendrait les liens
  // impossibles à atteindre au clavier pendant l’animation.

  /** Lit un token de durée (« 600ms ») et le renvoie en secondes pour GSAP. */
  const seconds = (token) => {
    if (reducedMotion.matches) return 0;
    return parseFloat(getComputedStyle(root).getPropertyValue(token)) / 1000 || 0;
  };

  /**
   * Rejoue une timeline à rebours, plus vite, puis appelle `done`.
   * Une timeline de durée nulle (mouvement réduit) ne déclenche pas
   * onReverseComplete : on appelle alors `done` directement.
   */
  const reverseThen = (timeline, speed, done) => {
    if (timeline.duration() === 0 || timeline.progress() === 0) {
      timeline.pause(0);
      done();
      return;
    }
    timeline.eventCallback("onReverseComplete", done);
    timeline.timeScale(speed).reverse();
  };

  // Textes d'interface écrits par le script, dans la langue de la page.
  const T = document.documentElement.lang === "en"
    ? { photo: "Photo", of: "of", copied: "Copied" }
    : { photo: "Photographie", of: "sur", copied: "Copié" };

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /* ------------------------------------------------------------------------
     Images : elles s'allument une fois chargées.
     ------------------------------------------------------------------------ */
  function initImageFade() {
    for (const img of document.querySelectorAll("img[data-fade]")) {
      const done = () => img.classList.add("is-loaded");
      if (img.complete && img.naturalWidth > 0) done();
      else {
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      }
    }
  }

  /* ------------------------------------------------------------------------
     Menu plein écran
     Ouverture : voile (lent, linéaire), puis liens en série, puis ligne
     secondaire et frise. Fermeture : même séquence, jouée à rebours et
     plus vite. Échap ferme ; le focus reste dans le menu tant qu'il est
     ouvert et revient au bouton à la fermeture.
     ------------------------------------------------------------------------ */
  function initMenu() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-menu]");
    if (!toggle || !menu || !gsap) return;

    const links = menu.querySelectorAll(".menu__link");
    const foot = menu.querySelector(".menu__foot");
    let timeline = null;

    const build = () => {
      const slow = seconds("--dur-slow");
      const stagger = seconds("--stagger");
      return gsap
        .timeline({ paused: true })
        .fromTo(menu, { opacity: 0 }, { opacity: 1, duration: slow, ease: "none" })
        .fromTo(links, { opacity: 0 }, { opacity: 1, duration: slow, stagger, ease: "none" }, slow * 0.5)
        .fromTo(foot, { opacity: 0 }, { opacity: 1, duration: slow, ease: "none" }, ">-" + slow * 0.5);
    };

    const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

    const open = () => {
      timeline?.kill(); // une fermeture en cours est abandonnée
      timeline = build();
      menu.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      root.classList.add("is-menu-open");
      root.style.overflow = "hidden";
      timeline.timeScale(1).play(0);
      links[0]?.focus({ preventScroll: true });
    };

    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      root.classList.remove("is-menu-open");
      reverseThen(timeline, 1.6, () => {
        menu.hidden = true;
        root.style.overflow = "";
      });
      toggle.focus({ preventScroll: true });
    };

    toggle.addEventListener("click", () => (isOpen() ? close() : open()));

    // Un lien vers une ancre de la même page ferme le menu.
    menu.addEventListener("click", (event) => {
      const link = event.target.closest("a[href^='#']");
      if (link && isOpen()) close();
    });

    document.addEventListener("keydown", (event) => {
      if (!isOpen()) return;
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;
      // Piège à focus : bouton Fermer + contenu du menu.
      const items = [toggle, ...menu.querySelectorAll(FOCUSABLE)];
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     Feuille « Écouter sur » (dialog modal)
     Ouverture : voile en fondu, la feuille monte de quelques pixels en
     s'allumant, puis les plateformes apparaissent en série.
     ------------------------------------------------------------------------ */
  function initListenSheets() {
    for (const trigger of document.querySelectorAll("[data-listen-open]")) {
      const dialog = document.getElementById(trigger.dataset.listenOpen);
      if (!dialog || typeof dialog.showModal !== "function") continue;
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        openSheet(dialog, trigger);
      });
    }
  }

  function openSheet(dialog, trigger) {
    const scrim = dialog.querySelector(".listen-dialog__scrim");
    const sheet = dialog.querySelector(".sheet");
    const items = dialog.querySelectorAll(".sheet__list li");
    const slow = seconds("--dur-slow");
    const base = seconds("--dur-base");
    const stagger = seconds("--stagger");
    const rise = window.matchMedia("(min-width: 48rem)").matches ? 12 : 32;

    dialog.showModal();

    const timeline = gsap
      ? gsap
          .timeline()
          .fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: slow, ease: "none" })
          .fromTo(sheet, { opacity: 0, y: rise }, { opacity: 1, y: 0, duration: slow, ease: "power2.out" }, base * 0.5)
          .fromTo(items, { opacity: 0 }, { opacity: 1, duration: base, stagger, ease: "none" }, base)
      : null;

    let closing = false;
    const close = () => {
      if (closing) return;
      closing = true;
      const finish = () => {
        dialog.close();
        trigger.focus({ preventScroll: true });
        cleanup();
      };
      if (timeline) reverseThen(timeline, 1.8, finish);
      else finish();
    };

    const onCancel = (event) => {
      event.preventDefault(); // Échap : on anime la fermeture au lieu de couper net
      close();
    };
    const onClick = (event) => {
      if (event.target === scrim || event.target.closest("[data-listen-close]")) close();
    };
    const cleanup = () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("click", onClick);
    };

    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("click", onClick);
  }

  /* ------------------------------------------------------------------------
     Formulaire « Être prévenu des prochaines dates »
     Erreur : le trait et le message passent en argile, le focus revient au
     champ. Succès : le formulaire s'éteint, la confirmation s'allume.
     L'envoi réel est à brancher sur le service retenu (voir sendSubscription).
     ------------------------------------------------------------------------ */
  function initSubscribeForms() {
    for (const form of document.querySelectorAll("form[data-subscribe]")) {
      const field = form.querySelector(".field");
      const input = form.querySelector("input[type=email]");
      const message = form.querySelector(".field__message-text");
      const button = form.querySelector("button[type=submit]");
      const done = form.parentElement.querySelector(".subscribe__done");

      const setError = (text) => {
        field.classList.toggle("is-invalid", Boolean(text));
        input.setAttribute("aria-invalid", text ? "true" : "false");
        if (text) message.textContent = text;
      };

      input.addEventListener("input", () => {
        if (field.classList.contains("is-invalid") && input.validity.valid) setError("");
      });

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (input.validity.valueMissing) {
          setError(form.dataset.msgEmpty);
          input.focus();
          return;
        }
        if (!input.validity.valid) {
          setError(form.dataset.msgInvalid);
          input.focus();
          return;
        }
        setError("");
        button.setAttribute("aria-busy", "true");
        await sendSubscription(input.value);
        button.removeAttribute("aria-busy");

        const slow = seconds("--dur-slow");
        const finish = () => {
          form.hidden = true;
          done.hidden = false;
          done.focus({ preventScroll: true });
        };
        if (!gsap) return finish();
        gsap
          .timeline()
          .to(form, { opacity: 0, duration: slow * 0.6, ease: "none", onComplete: finish })
          .fromTo(done, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: slow, ease: "power2.out" });
      });
    }
  }

  /** Simulation d'envoi. À remplacer par l'appel au service d'e-mailing. */
  function sendSubscription() {
    return new Promise((resolve) => setTimeout(resolve, 1200));
  }

  /* ------------------------------------------------------------------------
     Vidéo : façade YouTube
     La vignette est un lien vers YouTube (fonctionne sans JS). Avec JS, et
     si data-youtube-id est renseigné, le clic charge le lecteur sur place
     (domaine youtube-nocookie : aucun cookie avant la lecture).
     ------------------------------------------------------------------------ */
  function initVideoFacades() {
    for (const frame of document.querySelectorAll(".video__frame[data-youtube-id]")) {
      const id = frame.dataset.youtubeId;
      if (!id) continue;
      frame.addEventListener("click", (event) => {
        event.preventDefault();
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
        iframe.title = frame.getAttribute("aria-label") || "Vidéo";
        iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        iframe.allowFullscreen = true;
        frame.replaceChildren(iframe);
        frame.removeAttribute("href");
        iframe.focus();
      }, { once: true });
    }
  }

  /* ------------------------------------------------------------------------
     Bouton « Copier » (page Booking et presse)
     button[data-copy="#id"] copie le texte de l'élément ciblé ;
     button[data-copy="texte"] copie le texte donné. Caché sans JS.
     Le libellé devient « Copié » en fondu, puis revient. Si le
     presse-papiers est refusé, le texte est sélectionné pour une copie
     manuelle.
     ------------------------------------------------------------------------ */
  function initCopyButtons() {
    for (const button of document.querySelectorAll("button[data-copy]")) {
      const label = button.querySelector("[data-copy-label]");
      const initial = label.textContent;
      const source = button.dataset.copy;
      const target = source.startsWith("#") ? document.querySelector(source) : null;
      button.hidden = false;

      button.addEventListener("click", async () => {
        const text = target ? target.innerText.trim() : source;
        try {
          await navigator.clipboard.writeText(text);
          label.textContent = button.dataset.copyDone || T.copied;
          button.classList.add("is-done");
          setTimeout(() => {
            label.textContent = initial;
            button.classList.remove("is-done");
          }, 2000);
        } catch {
          if (!target) return;
          const range = document.createRange();
          range.selectNodeContents(target);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      });
    }
  }

  /* ------------------------------------------------------------------------
     Visionneuse plein écran (page Photos)
     a[data-lightbox-item] pointe vers la grande image : sans JS, le lien
     l'ouvre directement. Avec JS : ouverture en fondu, passage d'une photo
     à l'autre en fondu enchaîné (jamais de glissement), flèches du clavier,
     balayage sur écran tactile, Échap ou clic hors de la photo pour fermer.
     Les photos voisines sont préchargées.
     ------------------------------------------------------------------------ */
  function initLightbox() {
    const dialog = document.getElementById("lightbox");
    const items = [...document.querySelectorAll("[data-lightbox-item]")];
    if (!dialog || !items.length || typeof dialog.showModal !== "function") return;

    const img = dialog.querySelector(".lightbox__img");
    const text = dialog.querySelector(".lightbox__text");
    const counter = dialog.querySelector(".lightbox__count");
    const figure = dialog.querySelector(".lightbox__figure");
    let index = 0;
    let trigger = null;

    const preload = (i) => {
      const item = items[(i + items.length) % items.length];
      new Image().src = item.href;
    };

    const show = (i) => {
      index = (i + items.length) % items.length;
      const item = items[index];
      const thumb = item.querySelector("img");
      img.src = item.href;
      img.width = Number(item.dataset.width) || "";
      img.height = Number(item.dataset.height) || "";
      img.alt = thumb.alt;
      text.textContent = item.dataset.credit ? `${thumb.alt} ${T.photo}${T.photo === "Photo" ? ":" : " :"} ${item.dataset.credit}.` : thumb.alt;
      counter.textContent = `${index + 1} ${T.of} ${items.length}`;
      preload(index + 1);
      preload(index - 1);
    };

    const go = (step) => {
      const base = seconds("--dur-base");
      if (!gsap || !base) return show(index + step);
      gsap.to(figure, {
        opacity: 0,
        duration: base * 0.6,
        ease: "none",
        onComplete: () => {
          show(index + step);
          const reveal = () => gsap.to(figure, { opacity: 1, duration: base, ease: "none" });
          if (img.complete) reveal();
          else img.addEventListener("load", reveal, { once: true });
        },
      });
    };

    // Une transition en cours ne doit pas se terminer après une fermeture
    // ou une réouverture : elle ferait avancer la photo toute seule.
    const settle = () => {
      if (!gsap) return;
      gsap.killTweensOf(figure);
      gsap.set(figure, { opacity: 1 });
    };

    let timeline = null;
    const open = (i, from) => {
      settle();
      trigger = from;
      show(i);
      dialog.showModal();
      dialog.querySelector("[data-lightbox-close]").focus({ preventScroll: true });
      timeline = gsap
        ? gsap.timeline().fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: seconds("--dur-slow"), ease: "none" })
        : null;
    };

    const close = () => {
      settle();
      const finish = () => {
        dialog.close();
        trigger?.focus({ preventScroll: true });
      };
      if (timeline) reverseThen(timeline, 1.8, finish);
      else finish();
    };

    items.forEach((item, i) =>
      item.addEventListener("click", (event) => {
        event.preventDefault();
        open(i, item);
      })
    );

    dialog.querySelector("[data-lightbox-prev]").addEventListener("click", () => go(-1));
    dialog.querySelector("[data-lightbox-next]").addEventListener("click", () => go(1));
    dialog.querySelector("[data-lightbox-close]").addEventListener("click", close);
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
    // Un clic sur le fond (hors photo et légende) ferme.
    dialog.querySelector("[data-lightbox-close-zone]").addEventListener("click", (event) => {
      if (!event.target.closest(".lightbox__figure")) close();
    });
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    });

    // Balayage horizontal sur écran tactile.
    let startX = null;
    dialog.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse") startX = event.clientX;
    });
    dialog.addEventListener("pointerup", (event) => {
      if (startX === null) return;
      const dx = event.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    });
  }

  initImageFade();
  initVideoFacades();
  initCopyButtons();
  initLightbox();
  initMenu();
  initListenSheets();
  initSubscribeForms();
})();
