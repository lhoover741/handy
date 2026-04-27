const workerFormStyle = document.createElement("style");
workerFormStyle.textContent = `
  .hp-field { position: absolute !important; left: -9999px !important; height: 1px !important; width: 1px !important; overflow: hidden !important; }
  .notice.success { background: #F0FDF4; border-color: #86EFAC; color: #166534; }
  .notice.error { background: #FEF2F2; border-color: #FCA5A5; color: #991B1B; }
  button[disabled] { cursor: not-allowed; opacity: 0.72; }
`;
document.head.appendChild(workerFormStyle);

const body = document.body;
const toggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const isOpen = body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

const yearEl = document.querySelector("[data-year]");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Scroll reveal
const revealEls = document.querySelectorAll(".section, .card, .service-detail-card, .cta-band, .about-panel");
revealEls.forEach(el => el.classList.add("reveal"));
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => observer.observe(el));
} else {
  revealEls.forEach(el => el.classList.add("is-visible"));
}

// Counter animation
const counterEls = document.querySelectorAll("[data-counter]");
counterEls.forEach((el) => {
  const target = Number(el.dataset.counter || 0);
  let started = false;
  const runCounter = () => {
    if (started) return;
    started = true;
    const start = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(progress * target);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        runCounter();
        counterObserver.disconnect();
      }
    }, { threshold: 0.5 });
    counterObserver.observe(el);
  } else {
    runCounter();
  }
});

// Before/after slider
const slider = document.querySelector("[data-slider]");
if (slider) {
  const range = slider.querySelector("[data-slider-range]");
  const after = slider.querySelector("[data-after]");
  const handle = slider.querySelector("[data-slider-handle]");
  const updateSlider = (value) => {
    if (after) after.style.width = value + "%";
    if (handle) handle.style.left = value + "%";
  };
  if (range) {
    range.addEventListener("input", (e) => updateSlider(e.target.value));
    updateSlider(range.value || 50);
  }
}

// Estimate form handler
const estimateForms = document.querySelectorAll("[data-estimate-form]");
estimateForms.forEach((estimateForm) => {
  estimateForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const endpoint = estimateForm.dataset.endpoint || "/api/estimate";
    const status = estimateForm.querySelector("[data-form-status]");
    const submitButton = estimateForm.querySelector("[data-submit-button]") || estimateForm.querySelector("button[type='submit']");
    const formData = new FormData(estimateForm);

    formData.append("pageUrl", window.location.href);
    formData.append("submittedAt", new Date().toISOString());

    setFormStatus(status, "Sending your request...", "");
    setButtonLoading(submitButton, true);

    try {
      const response = await fetch(endpoint, { method: "POST", body: formData });
      let result = null;
      try { result = await response.json(); } catch (_) { result = null; }

      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || "Your request could not be sent. Please call or text (773) 573-5152.");
      }

      setFormStatus(status, result.message || "Thanks. Your free estimate request was sent successfully.", "success");
      estimateForm.reset();
    } catch (error) {
      console.error("Estimate form submit failed", error);
      setFormStatus(status, error.message || "Something went wrong. Please call or text (773) 573-5152.", "error");
    } finally {
      setButtonLoading(submitButton, false);
    }
  });
});

function setFormStatus(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  element.classList.remove("success", "error");
  if (type) element.classList.add(type);
}

function setButtonLoading(button, isLoading) {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = "Sending...";
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || "Get My Free Estimate";
    button.disabled = false;
  }
}

// Page transitions, but do not hijack same-page anchors, phone, sms, mail, file downloads, or form actions.
document.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("tel:") || href.startsWith("sms:") || href.startsWith("mailto:") || link.target === "_blank") return;
    const url = new URL(link.href, window.location.href);
    if (url.hostname !== window.location.hostname) return;
    event.preventDefault();
    document.body.style.opacity = "0";
    setTimeout(() => { window.location.href = url.href; }, 180);
  });
});
window.addEventListener("pageshow", () => { document.body.style.opacity = "1"; });

document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("pointerdown", () => btn.classList.add("is-pressed"));
  btn.addEventListener("pointerup", () => btn.classList.remove("is-pressed"));
  btn.addEventListener("pointerleave", () => btn.classList.remove("is-pressed"));
});
