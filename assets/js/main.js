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

// 🔥 SCROLL REVEAL
const revealEls = document.querySelectorAll(".section, .card, .service-detail-card, .cta-band, .about-panel");
revealEls.forEach(el => el.classList.add("reveal"));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => observer.observe(el));

// FORM HANDLER
const estimateForms = document.querySelectorAll("[data-estimate-form]");
estimateForms.forEach((estimateForm) => {
  estimateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const endpoint = estimateForm.dataset.endpoint || "/api/estimate";
    const status = estimateForm.querySelector("[data-form-status]");
    const submitButton = estimateForm.querySelector("[data-submit-button]");
    const formData = new FormData(estimateForm);

    setFormStatus(status, "Sending your request...");
    submitButton.disabled = true;

    try {
      const response = await fetch(endpoint, { method: "POST", body: formData });
      const result = await response.json();
      if (!result.ok) throw new Error();
      setFormStatus(status, "Request sent successfully.", "success");
      estimateForm.reset();
    } catch {
      setFormStatus(status, "Something went wrong.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
});

function setFormStatus(el, msg, type){ if(!el) return; el.textContent = msg; el.hidden = false; el.className = "notice " + (type || ""); }
