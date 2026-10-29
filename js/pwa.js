// KVR Car Care - Mobile PWA Installation Controller
// Handles 1-tap installation on Android & iPhone

class KVRPwaInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    this.init();
  }

  init() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then(reg => console.log('KVR Service Worker registered:', reg.scope))
          .catch(err => console.warn('Service Worker registration failed:', err));
      });
    }

    // Capture install prompt for Android/Desktop
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallUI();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      console.log('KVR App installed successfully');
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.remove();
    });

    // Check if on iOS and not standalone
    if (this.isIOS && !this.isStandalone) {
      setTimeout(() => {
        this.showIOSInstallHint();
      }, 1500);
    }
  }

  showInstallUI() {
    if (this.isStandalone) return;
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.remove('hidden');
    }
  }

  async promptInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`User response to install: ${outcome}`);
      this.deferredPrompt = null;
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.classList.add('hidden');
    } else if (this.isIOS) {
      this.openIOSGuideModal();
    } else {
      // Browser instructions modal
      this.openGeneralInstallGuide();
    }
  }

  showIOSInstallHint() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.remove('hidden');
    }
  }

  openIOSGuideModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 bg-slate-950/85 backdrop-blur flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-slate-900 border-2 border-amber-400/80 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center text-3xl mb-3">
          📲
        </div>
        <h3 class="font-black text-white text-base mb-1">Install on iPhone / iPad</h3>
        <p class="text-xs text-slate-300 mb-4">Install this app directly onto your home screen without App Store:</p>

        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-3 mb-4">
          <div class="flex items-start space-x-2.5">
            <span class="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
            <span class="text-slate-300">Tap the <strong>Share</strong> button <span class="text-amber-400 text-base">⎋</span> at the bottom of Safari.</span>
          </div>
          <div class="flex items-start space-x-2.5">
            <span class="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
            <span class="text-slate-300">Scroll down and tap <strong>"Add to Home Screen"</strong> <span class="text-amber-400 font-bold">➕</span>.</span>
          </div>
          <div class="flex items-start space-x-2.5">
            <span class="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
            <span class="text-slate-300">Tap <strong>"Add"</strong> in top right. App icon appears on your home screen!</span>
          </div>
        </div>

        <button onclick="this.closest('.fixed').remove()" class="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs kvr-btn">
          Got It!
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  openGeneralInstallGuide() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 bg-slate-950/85 backdrop-blur flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-slate-900 border-2 border-amber-400/80 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center text-3xl mb-3">
          📱
        </div>
        <h3 class="font-black text-white text-base mb-1">Download & Install Mobile App</h3>
        <p class="text-xs text-slate-300 mb-4">Install as a standalone app on your mobile phone:</p>

        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-3 mb-4">
          <div class="flex items-start space-x-2.5">
            <span class="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
            <span class="text-slate-300">Tap your mobile browser menu (<strong class="text-amber-400">⋮</strong> on Android Chrome or <strong class="text-amber-400">⎋</strong> on iPhone Safari).</span>
          </div>
          <div class="flex items-start space-x-2.5">
            <span class="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
            <span class="text-slate-300">Select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</span>
          </div>
          <div class="flex items-start space-x-2.5">
            <span class="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
            <span class="text-slate-300">The app installs directly on your phone with its own custom icon!</span>
          </div>
        </div>

        <button onclick="this.closest('.fixed').remove()" class="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs kvr-btn">
          Understood
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

window.kvrPwa = new KVRPwaInstaller();
