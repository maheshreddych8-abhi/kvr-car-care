// KVR Car Care login-screen touch decoration.
(() => {
  const loginScreens = ['customer-login-modal', 'owner-auth-gate']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!loginScreens.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  loginScreens.forEach((screen) => {
    screen.addEventListener('pointerdown', (event) => {
      for (let index = 0; index < 3; index += 1) {
        const bubble = document.createElement('span');
        const size = 8 + Math.random() * 10;
        bubble.className = 'kvr-touch-bubble';
        bubble.setAttribute('aria-hidden', 'true');
        bubble.style.left = `${event.clientX + (Math.random() - 0.5) * 28}px`;
        bubble.style.top = `${event.clientY + (Math.random() - 0.5) * 20}px`;
        bubble.style.setProperty('--bubble-size', `${size}px`);
        bubble.style.setProperty('--bubble-drift', `${(Math.random() - 0.5) * 28}px`);
        screen.appendChild(bubble);
        bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
        window.setTimeout(() => bubble.remove(), 1200);
      }
    }, { passive: true });
  });
})();
