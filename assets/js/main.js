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
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const estimateForm = document.querySelector("[data-estimate-form]");
if (estimateForm) {
  estimateForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(estimateForm);
    const name = formData.get("name") || "there";
    const service = formData.get("service") || "your project";

    const message = `Thanks, ${name}. Your free estimate request for ${service} is ready to connect to your form backend.`;
    const status = estimateForm.querySelector("[data-form-status]");

    if (status) {
      status.textContent = message;
      status.hidden = false;
    }

    estimateForm.reset();
  });
}
