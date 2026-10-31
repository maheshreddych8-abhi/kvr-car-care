// Show a short bubble animation wherever the user touches the app.
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener('pointerdown', (event) => {
    for (let index = 0; index < 3; index += 1) {
      const bubble = document.createElement('span');
      const size = 8 + Math.random() * 10;
      bubble.className = 'kvr-touch-bubble';
      bubble.setAttribute('aria-hidden', 'true');
      bubble.style.left = `${event.clientX + (Math.random() - 0.5) * 28}px`;
      bubble.style.top = `${event.clientY + (Math.random() - 0.5) * 20}px`;
      bubble.style.setProperty('--bubble-size', `${size}px`);
      bubble.style.setProperty('--bubble-drift', `${(Math.random() - 0.5) * 28}px`);
      document.body.appendChild(bubble);
      bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
      window.setTimeout(() => bubble.remove(), 1200);
    }
  }, { passive: true });
})();