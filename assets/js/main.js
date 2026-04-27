// EXISTING CODE ABOVE...

// 🔢 COUNTER ANIMATION
document.querySelectorAll('[data-counter]').forEach(el => {
  const target = +el.getAttribute('data-counter');
  let count = 0;
  const speed = 30;
  const update = () => {
    const increment = target / 40;
    count += increment;
    if (count < target) {
      el.textContent = Math.ceil(count);
      requestAnimationFrame(update);
    } else {
      el.textContent = target;
    }
  };
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) update();
  }, { threshold: .5 }).observe(el);
});

// 🔀 BEFORE/AFTER SLIDER
const slider = document.querySelector('[data-slider]');
if (slider) {
  const range = slider.querySelector('[data-slider-range]');
  const after = slider.querySelector('[data-after]');
  const handle = slider.querySelector('[data-slider-handle]');

  const updateSlider = (value) => {
    after.style.width = value + '%';
    handle.style.left = value + '%';
  };

  range.addEventListener('input', (e) => updateSlider(e.target.value));
  updateSlider(50);
}

// ⚡ PAGE TRANSITION
document.querySelectorAll('a').forEach(link => {
  if (link.href && link.hostname === window.location.hostname) {
    link.addEventListener('click', e => {
      e.preventDefault();
      document.body.style.opacity = '0';
      setTimeout(() => window.location = link.href, 200);
    });
  }
});
window.addEventListener('pageshow', () => {
  document.body.style.opacity = '1';
});

// 👆 BUTTON TAP EFFECT
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.96)');
  btn.addEventListener('mouseup', () => btn.style.transform = '');
  btn.addEventListener('mouseleave', () => btn.style.transform = '');
});
