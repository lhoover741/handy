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
