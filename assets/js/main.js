const workerFormStyle = document.createElement("style");
workerFormStyle.textContent = `
  .hp-field {
    position: absolute !important;
    left: -9999px !important;
    height: 1px !important;
    width: 1px !important;
    overflow: hidden !important;
  }

  .notice.success {
    background: #F0FDF4;
    border-color: #86EFAC;
    color: #166534;
  }

  .notice.error {
    background: #FEF2F2;
    border-color: #FCA5A5;
    color: #991B1B;
  }

  button[disabled] {
    cursor: not-allowed;
    opacity: 0.72;
  }
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
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const estimateForms = document.querySelectorAll("[data-estimate-form]");

estimateForms.forEach((estimateForm) => {
  estimateForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const endpoint = estimateForm.dataset.endpoint || window.GO_DIRECT_FORM_ENDPOINT || "/api/estimate";
    const status = estimateForm.querySelector("[data-form-status]");
    const submitButton = estimateForm.querySelector("[data-submit-button]") || estimateForm.querySelector("button[type='submit']");
    const formData = new FormData(estimateForm);

    formData.append("pageUrl", window.location.href);
    formData.append("submittedAt", new Date().toISOString());

    setFormStatus(status, "Sending your request...", "");
    setButtonLoading(submitButton, true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      let result = null;
      try {
        result = await response.json();
      } catch (_) {
        result = null;
      }

      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || "Your request could not be sent. Please try again or contact us directly.");
      }

      setFormStatus(status, result.message || "Thanks. Your free estimate request was sent successfully.", "success");
      estimateForm.reset();
    } catch (error) {
      setFormStatus(status, error.message || "Something went wrong. Please try again.", "error");
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
