// FORM HANDLER WITH REDIRECT
const estimateForms = document.querySelectorAll("[data-estimate-form]");
estimateForms.forEach((estimateForm) => {
  estimateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const endpoint = estimateForm.dataset.endpoint || "/api/estimate";
    const submitButton = estimateForm.querySelector("button[type='submit']");
    const formData = new FormData(estimateForm);

    submitButton.textContent = "Sending...";
    submitButton.disabled = true;

    try {
      const response = await fetch(endpoint, { method: "POST", body: formData });
      const result = await response.json();

      if (!response.ok || !result.ok) throw new Error();

      window.location.href = "/thank-you.html";

    } catch (error) {
      alert("Something went wrong. Please call or text (773) 573-5152.");
      submitButton.textContent = "Get My Free Estimate";
      submitButton.disabled = false;
    }
  });
});

// SITE-WIDE AI CHATBOT
(() => {
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "assets/css/chat.css";
  document.head.appendChild(css);

  const historyKey = "goDirectChatHistory";
  let history = [];
  let busy = false;

  try {
    const saved = JSON.parse(sessionStorage.getItem(historyKey) || "[]");
    history = Array.isArray(saved) ? saved.slice(-12) : [];
  } catch (_) {
    history = [];
  }

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "gd-chat-launcher";
  launcher.textContent = "Ask Go Direct";
  launcher.setAttribute("aria-expanded", "false");

  const panel = document.createElement("section");
  panel.className = "gd-chat-panel";
  panel.dataset.open = "false";
  panel.setAttribute("aria-label", "Go Direct Home Services assistant");
  panel.innerHTML = `
    <header class="gd-chat-header">
      <div><h2>Go Direct Assistant</h2><p>Assembly. Mounting. Repairs. Installation.</p></div>
      <button class="gd-chat-close" type="button" aria-label="Close chat">×</button>
    </header>
    <div class="gd-chat-messages" role="log" aria-live="polite"></div>
    <div class="gd-chat-status" aria-live="polite"></div>
    <div class="gd-chat-actions"></div>
    <form class="gd-chat-form">
      <textarea class="gd-chat-input" maxlength="1200" rows="1" placeholder="Describe your project…" aria-label="Message"></textarea>
      <button class="gd-chat-send" type="submit">Send</button>
    </form>
    <a class="gd-chat-estimate" href="free-estimate.html">Request a Free Estimate</a>`;

  document.body.append(panel, launcher);

  const messages = panel.querySelector(".gd-chat-messages");
  const status = panel.querySelector(".gd-chat-status");
  const actions = panel.querySelector(".gd-chat-actions");
  const form = panel.querySelector(".gd-chat-form");
  const input = panel.querySelector(".gd-chat-input");
  const send = panel.querySelector(".gd-chat-send");
  const close = panel.querySelector(".gd-chat-close");

  function addMessage(role, text, save = true) {
    const item = document.createElement("div");
    item.className = "gd-chat-message";
    item.dataset.role = role;
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;

    if (save) {
      history.push({ role, content: text });
      history = history.slice(-12);
      sessionStorage.setItem(historyKey, JSON.stringify(history));
    }
  }

  function setBusy(value, text = "") {
    busy = value;
    input.disabled = value;
    send.disabled = value;
    actions.querySelectorAll("button").forEach((button) => button.disabled = value);
    status.textContent = text;
  }

  async function sendMessage(raw) {
    const message = raw.trim();
    if (!message || busy) return;

    const priorHistory = history.slice(-12);
    addMessage("user", message);
    input.value = "";
    setBusy(true, "Go Direct Assistant is typing…");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: priorHistory }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || "Unable to answer right now.");
      addMessage("assistant", result.reply);
    } catch (error) {
      addMessage("assistant", error.message || "The assistant is unavailable. Please use the free estimate form or call/text (773) 573-5152.");
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  if (history.length) {
    history.forEach((item) => addMessage(item.role, item.content, false));
  } else {
    addMessage("assistant", "Hi! What do you need assembled, mounted, repaired, or installed?");
  }

  ["Furniture assembly", "TV mounting", "Door repair", "Blinds or curtain rods"].forEach((label) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gd-chat-chip";
    button.textContent = label;
    button.addEventListener("click", () => sendMessage(label));
    actions.appendChild(button);
  });

  launcher.addEventListener("click", () => {
    const open = panel.dataset.open !== "true";
    panel.dataset.open = String(open);
    launcher.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
  });

  close.addEventListener("click", () => {
    panel.dataset.open = "false";
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
})();
