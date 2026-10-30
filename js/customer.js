// KVR Car Care - Customer Application Controller
// Handles OTP login, vehicle management, service requests, real-time status tracking, photos, invoices & feedback

class KVRCustomerApp {
  constructor() {
    this.session = { name: '', phone: '', email: '', isLoggedIn: false };
    this.activeTab = 'status'; // 'request', 'status', 'history', 'contact'
    this.selectedServices = new Set();
    this.pendingLogin = null;
    this.activeJobId = null;

    this.init();
  }

  init() {
    // Pick the most recent active job for this customer
    const customerJobs = this.getCustomerJobs();
    if (customerJobs.length > 0) {
      this.activeJobId = customerJobs[0].id;
    }

    // Subscribe to DB changes for real-time reactivity
    window.kvrDB.subscribe((action, data) => {
      console.log('Customer App received DB event:', action, data);
      if (action === 'JOB_STATUS_CHANGED' || action === 'PHOTO_ADDED' || action === 'CHARGES_UPDATED' || action === 'JOBS_UPDATED') {
        this.renderLiveStatus();
        this.renderHistory();
        if (action === 'JOB_STATUS_CHANGED' && data.job && this.matchesCustomerJob(data.job)) {
          window.kvrAudio.success();
          this.showToast(`Status Updated: ${data.job.status}`);
        }
      }
      if (action === 'SERVICES_UPDATED') {
        this.renderServiceCatalog();
      }
    });

    this.renderHeader();
    this.renderVehiclesList();
    this.renderServiceCatalog();
    this.renderLiveStatus();
    this.renderHistory();
    this.setupListeners();
    document.body.classList.add('customer-auth-locked');
    this.openLoginModal();
    this.restoreSession();
  }

  async restoreSession() {
    try {
      const user = await window.kvrEmailAuth.getCurrentUser();
      if (user) {
        if (user.email) {
          this.completeCustomerLogin(user, false);
        } else {
          await window.kvrEmailAuth.signOut();
          window.kvrDB.clearCustomerSession();
        }
      } else {
        window.kvrDB.clearCustomerSession();
      }
    } catch (error) {
      this.setAuthStatus(`Could not check your email sign-in: ${error.message}`, false);
    }
  }

  completeCustomerLogin(user, showSuccess = true) {
    const saved = window.kvrDB.getCustomerSession();
    const email = user.email || '';
    const phone = user.phone || '';
    this.session = {
      name: document.getElementById('input-login-name')?.value.trim()
        || user.user_metadata?.full_name
        || saved?.name
        || 'Customer',
      phone,
      email,
      authUserId: user.id,
      authMethod: 'email-otp',
      isLoggedIn: true
    };
    window.kvrDB.setCustomerSession(this.session);
    document.body.classList.remove('customer-auth-locked');
    document.getElementById('customer-login-modal')?.classList.add('hidden');
    this.renderHeader();
    this.renderVehiclesList();
    this.renderLiveStatus();
    this.renderHistory();
    if (showSuccess) {
      window.kvrAudio.success();
      this.showToast(`Signed in as ${this.session.email}`, 'success');
    }
  }

  setTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.customer-tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.dataset.tab === tab) {
        btn.classList.add('border-amber-400', 'text-amber-400', 'bg-purple-950/40');
        btn.classList.remove('border-transparent', 'text-slate-400');
      } else {
        btn.classList.remove('border-amber-400', 'text-amber-400', 'bg-purple-950/40');
        btn.classList.add('border-transparent', 'text-slate-400');
      }
    });

    if (tab === 'status') this.renderLiveStatus();
    if (tab === 'history') this.renderHistory();
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-20 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full shadow-2xl z-50 text-sm font-semibold flex items-center space-x-2 kvr-toast ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-amber-300 border border-amber-400/40'
    }`;
    toast.innerHTML = `<span>⚡</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  renderHeader() {
    const userBanner = document.getElementById('user-profile-bar');
    if (!userBanner) return;
    if (this.session && this.session.isLoggedIn) {
      userBanner.innerHTML = `
        <div class="flex items-center justify-between text-xs bg-slate-900/60 backdrop-blur px-4 py-2 border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-slate-300">Welcome, <strong class="text-white">${this.session.name}</strong> (${this.session.email || this.session.phone})</span>
          </div>
          <button id="btn-customer-logout" class="text-amber-400 hover:text-amber-300 underline font-medium kvr-btn">
            Switch User / Logout
          </button>
        </div>
      `;
      document.getElementById('btn-customer-logout')?.addEventListener('click', () => {
        this.signOut();
      });
    }
  }

  openLoginModal() {
    const modal = document.getElementById('customer-login-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeLoginModal() {
    if (!this.session.isLoggedIn) return;
    const modal = document.getElementById('customer-login-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('customer-auth-locked');
  }

  setAuthStatus(message, success, neutral = false) {
    const status = document.getElementById('customer-auth-status');
    if (!status) return;
    status.textContent = message;
    status.classList.remove(
      'hidden',
      'border-emerald-500/50', 'bg-emerald-950/60', 'text-emerald-200',
      'border-rose-500/50', 'bg-rose-950/60', 'text-rose-200',
      'border-slate-700', 'bg-slate-800', 'text-slate-200'
    );
    const statusClasses = success
      ? ['border-emerald-500/50', 'bg-emerald-950/60', 'text-emerald-200']
      : neutral
        ? ['border-slate-700', 'bg-slate-800', 'text-slate-200']
        : ['border-rose-500/50', 'bg-rose-950/60', 'text-rose-200'];
    status.classList.add(...statusClasses);
  }

  async requestCustomerOtp() {
    const nameInput = document.getElementById('input-login-name');
    const name = nameInput?.value.trim() || '';
    if (!name) {
      this.setAuthStatus('Enter your name to continue.', false);
      nameInput?.focus();
      return;
    }

    const emailInput = document.getElementById('input-login-email');
    const identifier = emailInput?.value.trim().toLowerCase();
    if (!emailInput?.checkValidity() || !identifier) {
      this.setAuthStatus('Enter a valid email address.', false);
      emailInput?.focus();
      return;
    }

    const button = document.getElementById('btn-send-otp');
    const otpEntry = document.getElementById('customer-otp-entry');
    const verifyButton = document.getElementById('btn-verify-otp');
    otpEntry?.classList.remove('hidden');
    verifyButton.disabled = this.pendingLogin?.identifier !== identifier;
    button.disabled = true;
    button.textContent = 'Sending Email OTP…';
    try {
      await window.kvrEmailAuth.sendOtp(identifier, true, 'customer', { full_name: name });
      this.pendingLogin = { identifier };
      verifyButton.disabled = false;
      verifyButton.className = 'w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs kvr-btn';
      this.setAuthStatus(`Email OTP requested for ${identifier}. Check your inbox and spam folder for the 6-digit code.`, true);
    } catch (error) {
      const notConfigured = error.message.includes('OTP is not configured');
      const message = notConfigured
        ? 'Email sign-in is unavailable: authentication has not been configured.'
        : `Could not send Email OTP: ${error.message}`;
      this.setAuthStatus(message, false, notConfigured);
    } finally {
      button.disabled = false;
      const pendingMatches = this.pendingLogin?.identifier === identifier;
      button.textContent = `${pendingMatches ? 'Resend' : 'Send'} Email OTP`;
    }
  }

  async verifyCustomerOtp() {
    const token = document.getElementById('input-login-otp')?.value.trim() || '';
    if (!this.pendingLogin) {
      this.setAuthStatus('Request a sign-in code before verifying.', false);
      return;
    }
    if (!/^\d{6}$/.test(token)) {
      this.setAuthStatus('Enter the 6-digit code you received.', false);
      return;
    }
    const button = document.getElementById('btn-verify-otp');
    button.disabled = true;
    button.textContent = 'Verifying…';
    try {
      const user = await window.kvrEmailAuth.verifyOtp(this.pendingLogin.identifier, token, 'customer');
      this.completeCustomerLogin(user);
    } catch (error) {
      this.setAuthStatus(`Code verification failed: ${error.message}`, false);
    } finally {
      button.disabled = false;
      button.textContent = 'Verify OTP';
    }
  }

  getCustomerJobs() {
    if (!this.session.isLoggedIn) return [];
    return this.session.email
      ? window.kvrDB.getJobsByEmail(this.session.email)
      : window.kvrDB.getJobsByPhone(this.session.phone);
  }

  matchesCustomerJob(job) {
    if (this.session.email) return (job.customerEmail || '').trim().toLowerCase() === this.session.email.toLowerCase();
    const phone = (this.session.phone || '').replace(/\D/g, '').slice(-10);
    return Boolean(phone) && (job.customerPhone || '').replace(/\D/g, '').endsWith(phone);
  }

  async signOut() {
    try {
      await window.kvrEmailAuth.signOut();
      window.kvrDB.clearCustomerSession();
      window.location.reload();
    } catch (error) {
      this.showToast(`Could not sign out: ${error.message}`);
    }
  }

  // --- Vehicles ---
  renderVehiclesList() {
    const selectEl = document.getElementById('request-vehicle-select');
    const myVehiclesContainer = document.getElementById('my-vehicles-list');
    const vehicles = this.session.isLoggedIn
      ? this.session.email
        ? window.kvrDB.getVehiclesByEmail(this.session.email)
        : window.kvrDB.getVehicles(this.session.phone)
      : [];

    if (selectEl) {
      if (vehicles.length === 0) {
        selectEl.innerHTML = `<option value="">No vehicles found - Add one below</option>`;
      } else {
        selectEl.innerHTML = vehicles.map(v => `
          <option value="${v.model} (${v.reg})" data-reg="${v.reg}" data-name="${v.model}">
            🚗 ${v.model} - [${v.reg}] (${v.fuel || 'Petrol'})
          </option>
        `).join('');
      }
    }

    if (myVehiclesContainer) {
      if (vehicles.length === 0) {
        myVehiclesContainer.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">No vehicles registered yet. Click "+ Add Vehicle".</div>`;
      } else {
        myVehiclesContainer.innerHTML = vehicles.map(v => `
          <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                🚗
              </div>
              <div>
                <div class="font-bold text-white text-sm">${v.model}</div>
                <div class="text-xs text-amber-300 font-mono">${v.reg} • ${v.fuel || 'Petrol'}</div>
              </div>
            </div>
            <span class="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Verified</span>
          </div>
        `).join('');
      }
    }
  }

  // --- Service Catalog ---
  renderServiceCatalog() {
    const catalogContainer = document.getElementById('service-catalog-selection');
    if (!catalogContainer) return;

    const categories = window.kvrDB.getServices();
    catalogContainer.innerHTML = categories.map(cat => `
      <div class="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden mb-4">
        <div class="bg-gradient-to-r from-purple-950/80 to-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-purple-900/40">
          <div class="font-black text-amber-300 tracking-wider text-xs flex items-center space-x-2">
            <span>🔧</span>
            <span>${cat.category}</span>
          </div>
          <span class="text-[11px] text-slate-400">${cat.items.length} options</span>
        </div>
        <div class="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${cat.items.map(item => {
            const isChecked = this.selectedServices.has(item.name);
            return `
              <label class="kvr-interactive flex items-start justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                isChecked
                  ? 'bg-amber-400/10 border-amber-400/60 shadow-sm'
                  : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
              }">
                <div class="flex items-start space-x-2.5">
                  <input type="checkbox" name="service_choice" value="${item.name}" data-price="${item.price}" 
                    class="mt-1 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-400"
                    ${isChecked ? 'checked' : ''} />
                  <div>
                    <div class="font-bold text-slate-100 text-xs">${item.name}</div>
                    <div class="text-[11px] text-slate-400 leading-tight">${item.description || ''}</div>
                  </div>
                </div>
                <div class="text-right pl-2">
                  <span class="text-xs font-extrabold text-amber-400 font-mono">₹${item.price.toLocaleString('en-IN')}</span>
                </div>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');

    // Attach click listeners to update estimate
    catalogContainer.querySelectorAll('input[name="service_choice"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          this.selectedServices.add(cb.value);
        } else {
          this.selectedServices.delete(cb.value);
        }
        this.updateEstimatedBill();
      });
    });

    this.updateEstimatedBill();
  }

  updateEstimatedBill() {
    const estimateEl = document.getElementById('estimated-bill-amount');
    const selectedCountEl = document.getElementById('selected-services-count');
    if (!estimateEl) return;

    let total = 0;
    const services = window.kvrDB.getServices();
    const allItems = services.flatMap(c => c.items);

    this.selectedServices.forEach(sName => {
      const match = allItems.find(i => i.name === sName);
      if (match) total += match.price;
    });

    estimateEl.textContent = `₹${total.toLocaleString('en-IN')}`;
    if (selectedCountEl) selectedCountEl.textContent = `${this.selectedServices.size} selected`;
  }

  // --- Submit Request ---
  submitServiceRequest() {
    const selectVehicle = document.getElementById('request-vehicle-select');
    const customVehicleName = document.getElementById('custom-vehicle-name')?.value.trim();
    const customVehicleReg = document.getElementById('custom-vehicle-reg')?.value.trim();
    const complaintText = document.getElementById('request-complaint')?.value.trim();

    let vehicleName = "";
    let vehicleReg = "";

    if (customVehicleName && customVehicleReg) {
      vehicleName = customVehicleName;
      vehicleReg = customVehicleReg;
    } else if (selectVehicle && selectVehicle.selectedOptions.length > 0) {
      const opt = selectVehicle.selectedOptions[0];
      vehicleName = opt.dataset.name || "Hyundai i20";
      vehicleReg = opt.dataset.reg || "AP 07 BK 4455";
    }

    if (!complaintText && this.selectedServices.size === 0) {
      alert('Please select at least one service category or enter a complaint description.');
      return;
    }

    const servicesArray = Array.from(this.selectedServices);
    const categoryName = servicesArray.length > 0 ? "MULTI-POINT SERVICE" : "GENERAL SERVICE";

    const newJob = window.kvrDB.createServiceRequest({
      customerName: this.session.name,
      customerPhone: this.session.phone,
      customerEmail: this.session.email,
      vehicleName: vehicleName || "Vehicle",
      vehicleReg: vehicleReg || "AP 07 XX 0000",
      category: categoryName,
      services: servicesArray,
      complaint: complaintText || "Routine vehicle maintenance"
    });

    this.activeJobId = newJob.id;
    this.selectedServices.clear();
    const complaintInput = document.getElementById('request-complaint');
    if (complaintInput) complaintInput.value = '';

    window.kvrAudio.success();
    this.showToast(`Request ${newJob.id} raised successfully!`, 'success');
    this.setTab('status');
  }

  // --- Live Status Tracker ---
  renderLiveStatus() {
    const container = document.getElementById('live-status-container');
    if (!container) return;

    const customerJobs = this.getCustomerJobs();
    if (customerJobs.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 px-4 bg-slate-900/60 rounded-3xl border border-slate-800">
          <div class="text-4xl mb-3">🚗</div>
          <h3 class="text-base font-bold text-white mb-1">No Active Service Requests</h3>
          <p class="text-xs text-slate-400 mb-4">Need car service, AC repair or detailing? Raise a service request in seconds.</p>
          <button onclick="window.kvrCustomer.setTab('request')" class="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs kvr-btn">
            + Raise New Service Request
          </button>
        </div>
      `;
      return;
    }

    // Active or currently selected job
    let job = customerJobs.find(j => j.id === this.activeJobId) || customerJobs[0];
    this.activeJobId = job.id;

    // Steps list
    const steps = [
      { key: 'Received', title: '1. Received', desc: 'Job sheet created at workshop', icon: '📝' },
      { key: 'Assigned', title: '2. Assigned', desc: `Assigned to ${job.assignedTechnician || 'Technician'}`, icon: '👨‍🔧' },
      { key: 'Work In Progress', title: '3. Work In Progress', desc: 'Active repair & parts inspection', icon: '⚙️' },
      { key: 'Issue Resolved', title: '4. Issue Resolved', desc: 'Repairs completed & tested', icon: '✨' },
      { key: 'Completed', title: '5. Completed', desc: 'Ready for delivery & invoice ready', icon: '✅' }
    ];

    const statusOrder = ['Received', 'Assigned', 'Work In Progress', 'Issue Resolved', 'Completed'];
    const currentIdx = statusOrder.indexOf(job.status);

    // Photos HTML
    const photosHtml = (job.photos && job.photos.length > 0)
      ? `
        <div class="mt-4 pt-4 border-t border-slate-800">
          <div class="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>📸 Live Photos From Workshop (${job.photos.length})</span>
            <span class="text-[10px] text-slate-400">Tap to expand</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            ${job.photos.map((p, idx) => `
              <div class="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-video cursor-pointer" onclick="window.kvrCustomer.previewPhoto('${p.url}', '${p.caption}')">
                <img src="${p.url}" alt="${p.caption}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 p-1.5">
                  <div class="text-[10px] font-semibold text-white truncate">${p.caption}</div>
                  <div class="text-[9px] text-amber-300">${p.stage} • ${p.time}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `
      : `
        <div class="mt-4 p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
          📷 Photos uploaded by technician during work will appear here in real-time.
        </div>
      `;

    // Completion / Invoice Banner
    const isCompleted = job.status === 'Completed';
    const completionBanner = isCompleted ? `
      <div class="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/70 shadow-xl">
        <div class="flex items-center space-x-3 mb-2">
          <span class="text-3xl">🎉</span>
          <div>
            <h4 class="font-black text-emerald-300 text-sm">Service Completed Successfully!</h4>
            <p class="text-xs text-slate-300">Your vehicle is sanitized and ready for pickup at KVR Car Care.</p>
          </div>
        </div>

        <div class="bg-slate-950/80 rounded-xl p-3 border border-emerald-500/30 flex items-center justify-between my-3">
          <div>
            <div class="text-[11px] text-slate-400 font-medium">Invoice Number: <span class="font-mono text-white font-bold">${job.invoiceNo || 'KVR-3010-01'}</span></div>
            <div class="text-xs font-semibold text-slate-300">Total Payable: <strong class="text-emerald-400 font-mono text-base font-extrabold">₹${(job.invoiceTotal || 0).toLocaleString('en-IN')}</strong></div>
          </div>
          <button onclick="window.kvrPdf.printInvoice(window.kvrDB.getJobById('${job.id}'))" class="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 kvr-btn">
            <span>📄</span>
            <span>Download PDF</span>
          </button>
        </div>

        <!-- WhatsApp Feedback Prompt -->
        <div class="pt-2 border-t border-emerald-900/60 flex items-center justify-between text-xs">
          <span class="text-slate-300 font-medium">How was your service experience?</span>
          <button onclick="window.kvrCustomer.openFeedbackModal('${job.id}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs kvr-btn">
            ⭐ Give Feedback
          </button>
        </div>
      </div>
    ` : '';

    container.innerHTML = `
      ${completionBanner}

      <!-- Main Live Status Card -->
      <div class="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl">
        
        <!-- Header Info -->
        <div class="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">${job.id}</span>
              <span class="text-xs text-slate-400">• ${new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <h2 class="text-base font-black text-white mt-1">${job.vehicleName} <span class="text-xs text-amber-300 font-mono">(${job.vehicleReg})</span></h2>
            <div class="text-xs text-slate-400 mt-0.5">Category: <strong class="text-slate-200">${job.category}</strong></div>
          </div>

          <div class="text-right">
            <span class="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
              job.status === 'Completed' ? 'badge-completed' :
              job.status === 'Work In Progress' ? 'badge-progress' :
              job.status === 'Issue Resolved' ? 'badge-resolved' : 'badge-received'
            }">
              ${job.status}
            </span>
            <div class="text-[11px] text-slate-400 mt-1">Tech: <strong class="text-slate-200">${job.assignedTechnician || 'Venkat Reddy'}</strong></div>
          </div>
        </div>

        <!-- Customer Complaint -->
        <div class="py-3 text-xs bg-slate-950/40 px-3 rounded-xl my-3 border border-slate-800/80">
          <div class="text-[11px] text-amber-400/80 font-bold uppercase tracking-wider">Reported Issue:</div>
          <div class="text-slate-200 font-medium mt-0.5">${job.complaint || 'General checkup and diagnostics'}</div>
          ${job.services && job.services.length > 0 ? `
            <div class="flex flex-wrap gap-1 mt-2">
              ${job.services.map(s => `<span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] border border-slate-700">✓ ${s}</span>`).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Stepper Timeline -->
        <div class="mt-4 mb-2">
          <div class="text-xs font-bold text-amber-300 uppercase tracking-wider mb-4">Live Service Progress</div>
          <div class="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            ${steps.map((st, i) => {
              const isPast = i < currentIdx;
              const isCurrent = i === currentIdx;
              const noteEntry = (job.statusNotes || []).find(n => n.status === st.key);

              return `
                <div class="relative group">
                  <!-- Stepper Indicator -->
                  <div class="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isPast ? 'bg-emerald-500 text-slate-950' :
                    isCurrent ? 'bg-amber-400 text-slate-950 step-active ring-4 ring-amber-400/30' :
                    'bg-slate-800 text-slate-500 border border-slate-700'
                  }">
                    ${isPast ? '✓' : (i + 1)}
                  </div>

                  <!-- Step Content -->
                  <div class="pl-2">
                    <div class="flex items-center justify-between">
                      <div class="font-extrabold text-xs ${isCurrent ? 'text-amber-400 font-black text-sm' : isPast ? 'text-slate-200' : 'text-slate-500'}">
                        ${st.icon} ${st.title}
                      </div>
                      ${noteEntry ? `<span class="text-[10px] text-slate-400 font-mono">${noteEntry.time}</span>` : ''}
                    </div>
                    <div class="text-xs text-slate-400 mt-0.5">${noteEntry ? noteEntry.note : st.desc}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        ${photosHtml}

        <!-- Footer Actions -->
        <div class="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div class="text-xs text-slate-400">
            Auto updates in real-time
          </div>
          <div class="flex items-center space-x-2">
            <a href="tel:9346418994" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center space-x-1 kvr-btn">
              <span>📞</span>
              <span>Call Workshop</span>
            </a>
            <a href="https://wa.me/919346418994?text=Hi%20Venkat%20Reddy%20garu,%20checking%20status%20for%20my%20vehicle%20${encodeURIComponent(job.vehicleReg)}%20(${job.id})" target="_blank" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 kvr-btn">
              <span>💬</span>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // --- Photo preview popup ---
  previewPhoto(url, caption) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 bg-slate-950/90 backdrop-blur flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div class="p-3 bg-slate-950 flex justify-between items-center border-b border-slate-800">
          <span class="text-xs font-bold text-amber-400">Workshop Photo Proof</span>
          <button class="text-slate-400 hover:text-white font-bold text-sm" onclick="this.closest('.fixed').remove()">✕</button>
        </div>
        <img src="${url}" class="w-full max-h-96 object-contain bg-black" />
        <div class="p-3 text-xs text-slate-300 font-medium">${caption}</div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // --- History Tab ---
  renderHistory() {
    const container = document.getElementById('customer-history-container');
    if (!container) return;

    const customerJobs = this.getCustomerJobs();

    if (customerJobs.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400 text-xs">No service records found.</div>`;
      return;
    }

    container.innerHTML = customerJobs.map(job => `
      <div class="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 mb-3 hover:border-slate-700 transition-colors">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-mono text-xs font-bold text-amber-400">${job.invoiceNo || job.id}</span>
              <span class="text-xs text-slate-400">• ${job.invoiceDate || (job.createdAt ? job.createdAt.slice(0, 10) : '')}</span>
            </div>
            <div class="font-bold text-white text-sm mt-0.5">${job.vehicleName} (${job.vehicleReg})</div>
            <div class="text-xs text-slate-400">${job.category} • ${job.assignedTechnician || 'Venkat Reddy'}</div>
          </div>
          <div class="text-right">
            <div class="font-mono font-extrabold text-emerald-400 text-sm">₹${(job.invoiceTotal || 0).toLocaleString('en-IN')}</div>
            <span class="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${job.status === 'Completed' ? 'badge-completed' : 'badge-progress'}">
              ${job.status}
            </span>
          </div>
        </div>

        <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div class="text-xs text-slate-400">
            ${job.photos ? `${job.photos.length} photos uploaded` : 'No photos'}
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="window.kvrCustomer.showJobDetails('${job.id}')" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg kvr-btn">
              View Status
            </button>
            ${job.invoiceNo ? `
              <button onclick="window.kvrPdf.printInvoice(window.kvrDB.getJobById('${job.id}'))" class="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg kvr-btn">
                📄 PDF
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  showJobDetails(jobId) {
    this.activeJobId = jobId;
    this.setTab('status');
  }

  // --- Feedback Modal ---
  openFeedbackModal(jobId) {
    const job = window.kvrDB.getJobById(jobId);
    if (!job) return;

    let selectedRating = 5;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-black text-white text-base">Service Feedback</h3>
          <button class="text-slate-400 hover:text-white font-bold" onclick="this.closest('.fixed').remove()">✕</button>
        </div>
        <p class="text-xs text-slate-400 mb-4">Please rate your experience with KVR Car Care for <strong>${job.vehicleName}</strong> (${job.invoiceNo || job.id}).</p>

        <!-- Star Rating -->
        <div class="flex justify-center space-x-2 text-2xl my-3 cursor-pointer" id="star-rating-container">
          <span data-star="1" class="text-amber-400">★</span>
          <span data-star="2" class="text-amber-400">★</span>
          <span data-star="3" class="text-amber-400">★</span>
          <span data-star="4" class="text-amber-400">★</span>
          <span data-star="5" class="text-amber-400">★</span>
        </div>

        <textarea id="feedback-comment" rows="3" placeholder="Share your experience (e.g. prompt service, AC cooling quality)..." 
          class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none mb-4"></textarea>

        <div class="space-y-2">
          <button id="btn-submit-feedback-whatsapp" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 kvr-btn">
            <span>💬</span>
            <span>Send Feedback to Workshop WhatsApp</span>
          </button>
          <button id="btn-submit-feedback-internal" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs kvr-btn">
            Save in App Only
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Star click interaction
    const starContainer = modal.querySelector('#star-rating-container');
    const stars = starContainer.querySelectorAll('span');
    stars.forEach(s => {
      s.addEventListener('click', () => {
        selectedRating = Number(s.dataset.star);
        stars.forEach((st, idx) => {
          st.className = idx < selectedRating ? 'text-amber-400' : 'text-slate-600';
        });
        window.kvrAudio.pop();
      });
    });

    modal.querySelector('#btn-submit-feedback-whatsapp').addEventListener('click', () => {
      const comment = modal.querySelector('#feedback-comment').value.trim() || 'Great service!';
      window.kvrDB.saveFeedback(job.id, selectedRating, comment);
      modal.remove();

      const starsEmoji = '⭐'.repeat(selectedRating);
      const text = `Hi Venkat Reddy garu, here is my feedback for KVR Car Care (Invoice: ${job.invoiceNo || job.id}) for ${job.vehicleName}:\nRating: ${starsEmoji} (${selectedRating}/5)\nRemarks: "${comment}"\nThank you!`;
      const waUrl = `https://wa.me/919346418994?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
      this.showToast('Thank you for your valuable feedback!', 'success');
      this.renderLiveStatus();
    });

    modal.querySelector('#btn-submit-feedback-internal').addEventListener('click', () => {
      const comment = modal.querySelector('#feedback-comment').value.trim() || 'Service completed satisfactorily.';
      window.kvrDB.saveFeedback(job.id, selectedRating, comment);
      modal.remove();
      this.showToast('Feedback saved successfully!', 'success');
      this.renderLiveStatus();
    });
  }

  // --- Listeners Setup ---
  setupListeners() {
    // Navigation Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setTab(btn.dataset.tab);
      });
    });

    // Submit Service Request
    document.getElementById('btn-submit-request')?.addEventListener('click', () => {
      this.submitServiceRequest();
    });

    // Add Vehicle Modal
    document.getElementById('btn-open-add-vehicle')?.addEventListener('click', () => {
      const modal = document.getElementById('add-vehicle-modal');
      if (modal) modal.classList.remove('hidden');
    });

    document.getElementById('btn-save-new-vehicle')?.addEventListener('click', () => {
      const make = document.getElementById('new-vehicle-make')?.value.trim();
      const model = document.getElementById('new-vehicle-model')?.value.trim();
      const reg = document.getElementById('new-vehicle-reg')?.value.trim().toUpperCase();
      const fuel = document.getElementById('new-vehicle-fuel')?.value;

      if (!reg || !model) {
        alert('Please fill in Vehicle Model and Registration Number.');
        return;
      }

      window.kvrDB.registerCustomerVehicle({
        customerName: this.session.name,
        customerPhone: this.session.phone,
        customerEmail: this.session.email,
        vehicleName: `${make} ${model}`.trim(),
        vehicleReg: reg,
        fuel: fuel
      });

      document.getElementById('add-vehicle-modal')?.classList.add('hidden');
      this.renderVehiclesList();
      window.kvrAudio.success();
      this.showToast(`Vehicle ${reg} registered!`, 'success');
    });

    document.getElementById('btn-send-otp')?.addEventListener('click', () => this.requestCustomerOtp());
    document.getElementById('btn-verify-otp')?.addEventListener('click', () => this.verifyCustomerOtp());
  }
}

// Global Customer App instance
document.addEventListener('DOMContentLoaded', () => {
  window.kvrCustomer = new KVRCustomerApp();
});
// KVR Car Care - Customer Application Controller
// Handles OTP login, vehicle management, service requests, real-time status tracking, photos, invoices & feedback

class KVRCustomerApp {
  constructor() {
    this.session = { name: '', phone: '', email: '', isLoggedIn: false };
    this.activeTab = 'status'; // 'request', 'status', 'history', 'contact'
    this.selectedServices = new Set();
    this.loginChannel = 'email';
    this.pendingLogin = null;
    this.activeJobId = null;

    this.init();
  }

  init() {
    // Pick the most recent active job for this customer
    const customerJobs = this.getCustomerJobs();
    if (customerJobs.length > 0) {
      this.activeJobId = customerJobs[0].id;
    }

    // Subscribe to DB changes for real-time reactivity
    window.kvrDB.subscribe((action, data) => {
      console.log('Customer App received DB event:', action, data);
      if (action === 'JOB_STATUS_CHANGED' || action === 'PHOTO_ADDED' || action === 'CHARGES_UPDATED' || action === 'JOBS_UPDATED') {
        this.renderLiveStatus();
        this.renderHistory();
        if (action === 'JOB_STATUS_CHANGED' && data.job && this.matchesCustomerJob(data.job)) {
          window.kvrAudio.success();
          this.showToast(`Status Updated: ${data.job.status}`);
        }
      }
      if (action === 'SERVICES_UPDATED') {
        this.renderServiceCatalog();
      }
    });

    this.renderHeader();
    this.renderVehiclesList();
    this.renderServiceCatalog();
    this.renderLiveStatus();
    this.renderHistory();
    this.setupListeners();
    document.body.classList.add('customer-auth-locked');
    this.openLoginModal();
    this.restoreSession();
  }

  async restoreSession() {
    try {
      const user = await window.kvrEmailAuth.getCurrentUser();
      if (user) {
        this.completeCustomerLogin(user, false);
      } else {
        window.kvrDB.clearCustomerSession();
      }
    } catch (error) {
      this.setAuthStatus(`Could not check your email sign-in: ${error.message}`, false);
    }
  }

  completeCustomerLogin(user, showSuccess = true) {
    const saved = window.kvrDB.getCustomerSession();
    const email = user.email || '';
    const phone = user.phone || '';
    this.session = {
      name: document.getElementById('input-login-name')?.value.trim()
        || user.user_metadata?.full_name
        || saved?.name
        || 'Customer',
      phone,
      email,
      authUserId: user.id,
      authMethod: email ? 'email-otp' : 'phone-otp',
      isLoggedIn: true
    };
    window.kvrDB.setCustomerSession(this.session);
    document.body.classList.remove('customer-auth-locked');
    document.getElementById('customer-login-modal')?.classList.add('hidden');
    this.renderHeader();
    this.renderVehiclesList();
    this.renderLiveStatus();
    this.renderHistory();
    if (showSuccess) {
      window.kvrAudio.success();
      this.showToast(`Signed in as ${this.session.email || this.session.phone}`, 'success');
    }
  }

  setTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.customer-tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.dataset.tab === tab) {
        btn.classList.add('border-amber-400', 'text-amber-400', 'bg-purple-950/40');
        btn.classList.remove('border-transparent', 'text-slate-400');
      } else {
        btn.classList.remove('border-amber-400', 'text-amber-400', 'bg-purple-950/40');
        btn.classList.add('border-transparent', 'text-slate-400');
      }
    });

    if (tab === 'status') this.renderLiveStatus();
    if (tab === 'history') this.renderHistory();
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-20 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full shadow-2xl z-50 text-sm font-semibold flex items-center space-x-2 kvr-toast ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-amber-300 border border-amber-400/40'
    }`;
    toast.innerHTML = `<span>⚡</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  renderHeader() {
    const userBanner = document.getElementById('user-profile-bar');
    if (!userBanner) return;
    if (this.session && this.session.isLoggedIn) {
      userBanner.innerHTML = `
        <div class="flex items-center justify-between text-xs bg-slate-900/60 backdrop-blur px-4 py-2 border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-slate-300">Welcome, <strong class="text-white">${this.session.name}</strong> (${this.session.email || this.session.phone})</span>
          </div>
          <button id="btn-customer-logout" class="text-amber-400 hover:text-amber-300 underline font-medium kvr-btn">
            Switch User / Logout
          </button>
        </div>
      `;
      document.getElementById('btn-customer-logout')?.addEventListener('click', () => {
        this.signOut();
      });
    }
  }

  openLoginModal() {
    const modal = document.getElementById('customer-login-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeLoginModal() {
    if (!this.session.isLoggedIn) return;
    const modal = document.getElementById('customer-login-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('customer-auth-locked');
  }

  setAuthStatus(message, success, neutral = false) {
    const status = document.getElementById('customer-auth-status');
    if (!status) return;
    status.textContent = message;
    status.classList.remove(
      'hidden',
      'border-emerald-500/50', 'bg-emerald-950/60', 'text-emerald-200',
      'border-rose-500/50', 'bg-rose-950/60', 'text-rose-200',
      'border-slate-700', 'bg-slate-800', 'text-slate-200'
    );
    const statusClasses = success
      ? ['border-emerald-500/50', 'bg-emerald-950/60', 'text-emerald-200']
      : neutral
        ? ['border-slate-700', 'bg-slate-800', 'text-slate-200']
        : ['border-rose-500/50', 'bg-rose-950/60', 'text-rose-200'];
    status.classList.add(...statusClasses);
  }

  normalizePhoneNumber(value) {
    const compact = value.trim().replace(/[\s()-]/g, '');
    if (/^[6-9]\d{9}$/.test(compact)) return `+91${compact}`;
    if (/^91[6-9]\d{9}$/.test(compact)) return `+${compact}`;
    if (/^\+91[6-9]\d{9}$/.test(compact)) return compact;
    return null;
  }

  setLoginChannel(channel) {
    this.loginChannel = channel;
    this.pendingLogin = null;
    const isEmail = channel === 'email';
    const methodLabel = channel === 'email' ? 'email' : channel === 'sms' ? 'SMS' : 'WhatsApp';
    document.getElementById('customer-email-field').classList.toggle('hidden', !isEmail);
    document.getElementById('customer-phone-field').classList.toggle('hidden', isEmail);
    document.getElementById('input-login-email').required = isEmail;
    document.getElementById('input-login-phone').required = !isEmail;
    document.getElementById('customer-otp-entry').classList.add('hidden');
    const verifyButton = document.getElementById('btn-verify-otp');
    verifyButton.disabled = true;
    verifyButton.className = 'w-full py-3 bg-slate-700 text-slate-400 font-black rounded-xl text-xs cursor-not-allowed';
    document.getElementById('input-login-otp').value = '';
    document.getElementById('btn-send-otp').textContent = `Send ${methodLabel} OTP`;
    document.getElementById('customer-otp-label').textContent = `Enter the 6-digit code from your ${isEmail ? 'email' : channel === 'sms' ? 'SMS' : 'WhatsApp message'}`;
    document.querySelectorAll('.customer-otp-channel').forEach(button => {
      const selected = button.dataset.channel === channel;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('border-amber-400', selected);
      button.classList.toggle('bg-amber-400/15', selected);
      button.classList.toggle('text-amber-200', selected);
      button.classList.toggle('border-slate-700', !selected);
      button.classList.toggle('bg-slate-950/60', !selected);
      button.classList.toggle('text-slate-300', !selected);
    });
  }

  async requestCustomerOtp() {
    const nameInput = document.getElementById('input-login-name');
    const name = nameInput?.value.trim() || '';
    if (!name) {
      this.setAuthStatus('Enter your name to continue.', false);
      nameInput?.focus();
      return;
    }

    const channel = this.loginChannel;
    let identifier;
    if (channel === 'email') {
      const emailInput = document.getElementById('input-login-email');
      identifier = emailInput?.value.trim().toLowerCase();
      if (!emailInput?.checkValidity() || !identifier) {
        this.setAuthStatus('Enter a valid email address.', false);
        emailInput?.focus();
        return;
      }
    } else {
      const phoneInput = document.getElementById('input-login-phone');
      identifier = this.normalizePhoneNumber(phoneInput?.value || '');
      if (!identifier) {
        this.setAuthStatus('Enter a valid Indian mobile number with 10 digits.', false);
        phoneInput?.focus();
        return;
      }
    }

    const button = document.getElementById('btn-send-otp');
    const otpEntry = document.getElementById('customer-otp-entry');
    const verifyButton = document.getElementById('btn-verify-otp');
    otpEntry?.classList.remove('hidden');
    verifyButton.disabled = this.pendingLogin?.channel !== channel || this.pendingLogin?.identifier !== identifier;
    button.disabled = true;
    const methodLabel = channel === 'email' ? 'email' : channel === 'sms' ? 'SMS' : 'WhatsApp';
    button.textContent = `Sending ${methodLabel} OTP…`;
    try {
      if (channel === 'email') {
        await window.kvrEmailAuth.sendOtp(identifier, true, 'customer', { full_name: name });
      } else {
        await window.kvrEmailAuth.sendPhoneOtp(identifier, channel, true, 'customer', { full_name: name });
      }
      this.pendingLogin = { channel, identifier };
      verifyButton.disabled = false;
      verifyButton.className = 'w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs kvr-btn';
      const location = channel === 'email' ? 'email inbox and spam folder' : channel === 'sms' ? 'SMS messages' : 'WhatsApp messages';
      this.setAuthStatus(`${methodLabel} OTP requested for ${identifier}. Check your ${location} for the 6-digit code.`, true);
    } catch (error) {
      const notConfigured = error.message.includes('OTP is not configured');
      const message = notConfigured
        ? `${methodLabel} sign-in is unavailable: authentication has not been configured.`
        : `Could not send ${methodLabel} OTP: ${error.message}`;
      this.setAuthStatus(message, false, notConfigured);
    } finally {
      button.disabled = false;
      const pendingMatches = this.pendingLogin?.channel === channel && this.pendingLogin?.identifier === identifier;
      button.textContent = `${pendingMatches ? 'Resend' : 'Send'} ${methodLabel} OTP`;
    }
  }

  async verifyCustomerOtp() {
    const token = document.getElementById('input-login-otp')?.value.trim() || '';
    if (!this.pendingLogin) {
      this.setAuthStatus('Request a sign-in code before verifying.', false);
      return;
    }
    if (!/^\d{6}$/.test(token)) {
      this.setAuthStatus('Enter the 6-digit code you received.', false);
      return;
    }
    const button = document.getElementById('btn-verify-otp');
    button.disabled = true;
    button.textContent = 'Verifying…';
    try {
      const method = this.pendingLogin.channel === 'email' ? 'email' : 'phone';
      const user = await window.kvrEmailAuth.verifyOtp(this.pendingLogin.identifier, token, 'customer', method);
      this.completeCustomerLogin(user);
    } catch (error) {
      this.setAuthStatus(`Code verification failed: ${error.message}`, false);
    } finally {
      button.disabled = false;
      button.textContent = 'Verify OTP';
    }
  }

  getCustomerJobs() {
    if (!this.session.isLoggedIn) return [];
    return this.session.email
      ? window.kvrDB.getJobsByEmail(this.session.email)
      : window.kvrDB.getJobsByPhone(this.session.phone);
  }

  matchesCustomerJob(job) {
    if (this.session.email) return (job.customerEmail || '').trim().toLowerCase() === this.session.email.toLowerCase();
    const phone = (this.session.phone || '').replace(/\D/g, '').slice(-10);
    return Boolean(phone) && (job.customerPhone || '').replace(/\D/g, '').endsWith(phone);
  }

  async signOut() {
    try {
      await window.kvrEmailAuth.signOut();
      window.kvrDB.clearCustomerSession();
      window.location.reload();
    } catch (error) {
      this.showToast(`Could not sign out: ${error.message}`);
    }
  }

  // --- Vehicles ---
  renderVehiclesList() {
    const selectEl = document.getElementById('request-vehicle-select');
    const myVehiclesContainer = document.getElementById('my-vehicles-list');
    const vehicles = this.session.isLoggedIn
      ? this.session.email
        ? window.kvrDB.getVehiclesByEmail(this.session.email)
        : window.kvrDB.getVehicles(this.session.phone)
      : [];

    if (selectEl) {
      if (vehicles.length === 0) {
        selectEl.innerHTML = `<option value="">No vehicles found - Add one below</option>`;
      } else {
        selectEl.innerHTML = vehicles.map(v => `
          <option value="${v.model} (${v.reg})" data-reg="${v.reg}" data-name="${v.model}">
            🚗 ${v.model} - [${v.reg}] (${v.fuel || 'Petrol'})
          </option>
        `).join('');
      }
    }

    if (myVehiclesContainer) {
      if (vehicles.length === 0) {
        myVehiclesContainer.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">No vehicles registered yet. Click "+ Add Vehicle".</div>`;
      } else {
        myVehiclesContainer.innerHTML = vehicles.map(v => `
          <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                🚗
              </div>
              <div>
                <div class="font-bold text-white text-sm">${v.model}</div>
                <div class="text-xs text-amber-300 font-mono">${v.reg} • ${v.fuel || 'Petrol'}</div>
              </div>
            </div>
            <span class="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Verified</span>
          </div>
        `).join('');
      }
    }
  }

  // --- Service Catalog ---
  renderServiceCatalog() {
    const catalogContainer = document.getElementById('service-catalog-selection');
    if (!catalogContainer) return;

    const categories = window.kvrDB.getServices();
    catalogContainer.innerHTML = categories.map(cat => `
      <div class="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden mb-4">
        <div class="bg-gradient-to-r from-purple-950/80 to-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-purple-900/40">
          <div class="font-black text-amber-300 tracking-wider text-xs flex items-center space-x-2">
            <span>🔧</span>
            <span>${cat.category}</span>
          </div>
          <span class="text-[11px] text-slate-400">${cat.items.length} options</span>
        </div>
        <div class="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${cat.items.map(item => {
            const isChecked = this.selectedServices.has(item.name);
            return `
              <label class="kvr-interactive flex items-start justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                isChecked
                  ? 'bg-amber-400/10 border-amber-400/60 shadow-sm'
                  : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
              }">
                <div class="flex items-start space-x-2.5">
                  <input type="checkbox" name="service_choice" value="${item.name}" data-price="${item.price}" 
                    class="mt-1 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-400"
                    ${isChecked ? 'checked' : ''} />
                  <div>
                    <div class="font-bold text-slate-100 text-xs">${item.name}</div>
                    <div class="text-[11px] text-slate-400 leading-tight">${item.description || ''}</div>
                  </div>
                </div>
                <div class="text-right pl-2">
                  <span class="text-xs font-extrabold text-amber-400 font-mono">₹${item.price.toLocaleString('en-IN')}</span>
                </div>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');

    // Attach click listeners to update estimate
    catalogContainer.querySelectorAll('input[name="service_choice"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          this.selectedServices.add(cb.value);
        } else {
          this.selectedServices.delete(cb.value);
        }
        this.updateEstimatedBill();
      });
    });

    this.updateEstimatedBill();
  }

  updateEstimatedBill() {
    const estimateEl = document.getElementById('estimated-bill-amount');
    const selectedCountEl = document.getElementById('selected-services-count');
    if (!estimateEl) return;

    let total = 0;
    const services = window.kvrDB.getServices();
    const allItems = services.flatMap(c => c.items);

    this.selectedServices.forEach(sName => {
      const match = allItems.find(i => i.name === sName);
      if (match) total += match.price;
    });

    estimateEl.textContent = `₹${total.toLocaleString('en-IN')}`;
    if (selectedCountEl) selectedCountEl.textContent = `${this.selectedServices.size} selected`;
  }

  // --- Submit Request ---
  submitServiceRequest() {
    const selectVehicle = document.getElementById('request-vehicle-select');
    const customVehicleName = document.getElementById('custom-vehicle-name')?.value.trim();
    const customVehicleReg = document.getElementById('custom-vehicle-reg')?.value.trim();
    const complaintText = document.getElementById('request-complaint')?.value.trim();

    let vehicleName = "";
    let vehicleReg = "";

    if (customVehicleName && customVehicleReg) {
      vehicleName = customVehicleName;
      vehicleReg = customVehicleReg;
    } else if (selectVehicle && selectVehicle.selectedOptions.length > 0) {
      const opt = selectVehicle.selectedOptions[0];
      vehicleName = opt.dataset.name || "Hyundai i20";
      vehicleReg = opt.dataset.reg || "AP 07 BK 4455";
    }

    if (!complaintText && this.selectedServices.size === 0) {
      alert('Please select at least one service category or enter a complaint description.');
      return;
    }

    const servicesArray = Array.from(this.selectedServices);
    const categoryName = servicesArray.length > 0 ? "MULTI-POINT SERVICE" : "GENERAL SERVICE";

    const newJob = window.kvrDB.createServiceRequest({
      customerName: this.session.name,
      customerPhone: this.session.phone,
      customerEmail: this.session.email,
      vehicleName: vehicleName || "Vehicle",
      vehicleReg: vehicleReg || "AP 07 XX 0000",
      category: categoryName,
      services: servicesArray,
      complaint: complaintText || "Routine vehicle maintenance"
    });

    this.activeJobId = newJob.id;
    this.selectedServices.clear();
    const complaintInput = document.getElementById('request-complaint');
    if (complaintInput) complaintInput.value = '';

    window.kvrAudio.success();
    this.showToast(`Request ${newJob.id} raised successfully!`, 'success');
    this.setTab('status');
  }

  // --- Live Status Tracker ---
  renderLiveStatus() {
    const container = document.getElementById('live-status-container');
    if (!container) return;

    const customerJobs = this.getCustomerJobs();
    if (customerJobs.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 px-4 bg-slate-900/60 rounded-3xl border border-slate-800">
          <div class="text-4xl mb-3">🚗</div>
          <h3 class="text-base font-bold text-white mb-1">No Active Service Requests</h3>
          <p class="text-xs text-slate-400 mb-4">Need car service, AC repair or detailing? Raise a service request in seconds.</p>
          <button onclick="window.kvrCustomer.setTab('request')" class="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs kvr-btn">
            + Raise New Service Request
          </button>
        </div>
      `;
      return;
    }

    // Active or currently selected job
    let job = customerJobs.find(j => j.id === this.activeJobId) || customerJobs[0];
    this.activeJobId = job.id;

    // Steps list
    const steps = [
      { key: 'Received', title: '1. Received', desc: 'Job sheet created at workshop', icon: '📝' },
      { key: 'Assigned', title: '2. Assigned', desc: `Assigned to ${job.assignedTechnician || 'Technician'}`, icon: '👨‍🔧' },
      { key: 'Work In Progress', title: '3. Work In Progress', desc: 'Active repair & parts inspection', icon: '⚙️' },
      { key: 'Issue Resolved', title: '4. Issue Resolved', desc: 'Repairs completed & tested', icon: '✨' },
      { key: 'Completed', title: '5. Completed', desc: 'Ready for delivery & invoice ready', icon: '✅' }
    ];

    const statusOrder = ['Received', 'Assigned', 'Work In Progress', 'Issue Resolved', 'Completed'];
    const currentIdx = statusOrder.indexOf(job.status);

    // Photos HTML
    const photosHtml = (job.photos && job.photos.length > 0)
      ? `
        <div class="mt-4 pt-4 border-t border-slate-800">
          <div class="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>📸 Live Photos From Workshop (${job.photos.length})</span>
            <span class="text-[10px] text-slate-400">Tap to expand</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            ${job.photos.map((p, idx) => `
              <div class="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-video cursor-pointer" onclick="window.kvrCustomer.previewPhoto('${p.url}', '${p.caption}')">
                <img src="${p.url}" alt="${p.caption}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 p-1.5">
                  <div class="text-[10px] font-semibold text-white truncate">${p.caption}</div>
                  <div class="text-[9px] text-amber-300">${p.stage} • ${p.time}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `
      : `
        <div class="mt-4 p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
          📷 Photos uploaded by technician during work will appear here in real-time.
        </div>
      `;

    // Completion / Invoice Banner
    const isCompleted = job.status === 'Completed';
    const completionBanner = isCompleted ? `
      <div class="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/70 shadow-xl">
        <div class="flex items-center space-x-3 mb-2">
          <span class="text-3xl">🎉</span>
          <div>
            <h4 class="font-black text-emerald-300 text-sm">Service Completed Successfully!</h4>
            <p class="text-xs text-slate-300">Your vehicle is sanitized and ready for pickup at KVR Car Care.</p>
          </div>
        </div>

        <div class="bg-slate-950/80 rounded-xl p-3 border border-emerald-500/30 flex items-center justify-between my-3">
          <div>
            <div class="text-[11px] text-slate-400 font-medium">Invoice Number: <span class="font-mono text-white font-bold">${job.invoiceNo || 'KVR-3010-01'}</span></div>
            <div class="text-xs font-semibold text-slate-300">Total Payable: <strong class="text-emerald-400 font-mono text-base font-extrabold">₹${(job.invoiceTotal || 0).toLocaleString('en-IN')}</strong></div>
          </div>
          <button onclick="window.kvrPdf.printInvoice(window.kvrDB.getJobById('${job.id}'))" class="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 kvr-btn">
            <span>📄</span>
            <span>Download PDF</span>
          </button>
        </div>

        <!-- WhatsApp Feedback Prompt -->
        <div class="pt-2 border-t border-emerald-900/60 flex items-center justify-between text-xs">
          <span class="text-slate-300 font-medium">How was your service experience?</span>
          <button onclick="window.kvrCustomer.openFeedbackModal('${job.id}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs kvr-btn">
            ⭐ Give Feedback
          </button>
        </div>
      </div>
    ` : '';

    container.innerHTML = `
      ${completionBanner}

      <!-- Main Live Status Card -->
      <div class="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl">
        
        <!-- Header Info -->
        <div class="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">${job.id}</span>
              <span class="text-xs text-slate-400">• ${new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <h2 class="text-base font-black text-white mt-1">${job.vehicleName} <span class="text-xs text-amber-300 font-mono">(${job.vehicleReg})</span></h2>
            <div class="text-xs text-slate-400 mt-0.5">Category: <strong class="text-slate-200">${job.category}</strong></div>
          </div>

          <div class="text-right">
            <span class="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
              job.status === 'Completed' ? 'badge-completed' :
              job.status === 'Work In Progress' ? 'badge-progress' :
              job.status === 'Issue Resolved' ? 'badge-resolved' : 'badge-received'
            }">
              ${job.status}
            </span>
            <div class="text-[11px] text-slate-400 mt-1">Tech: <strong class="text-slate-200">${job.assignedTechnician || 'Venkat Reddy'}</strong></div>
          </div>
        </div>

        <!-- Customer Complaint -->
        <div class="py-3 text-xs bg-slate-950/40 px-3 rounded-xl my-3 border border-slate-800/80">
          <div class="text-[11px] text-amber-400/80 font-bold uppercase tracking-wider">Reported Issue:</div>
          <div class="text-slate-200 font-medium mt-0.5">${job.complaint || 'General checkup and diagnostics'}</div>
          ${job.services && job.services.length > 0 ? `
            <div class="flex flex-wrap gap-1 mt-2">
              ${job.services.map(s => `<span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] border border-slate-700">✓ ${s}</span>`).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Stepper Timeline -->
        <div class="mt-4 mb-2">
          <div class="text-xs font-bold text-amber-300 uppercase tracking-wider mb-4">Live Service Progress</div>
          <div class="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            ${steps.map((st, i) => {
              const isPast = i < currentIdx;
              const isCurrent = i === currentIdx;
              const noteEntry = (job.statusNotes || []).find(n => n.status === st.key);

              return `
                <div class="relative group">
                  <!-- Stepper Indicator -->
                  <div class="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isPast ? 'bg-emerald-500 text-slate-950' :
                    isCurrent ? 'bg-amber-400 text-slate-950 step-active ring-4 ring-amber-400/30' :
                    'bg-slate-800 text-slate-500 border border-slate-700'
                  }">
                    ${isPast ? '✓' : (i + 1)}
                  </div>

                  <!-- Step Content -->
                  <div class="pl-2">
                    <div class="flex items-center justify-between">
                      <div class="font-extrabold text-xs ${isCurrent ? 'text-amber-400 font-black text-sm' : isPast ? 'text-slate-200' : 'text-slate-500'}">
                        ${st.icon} ${st.title}
                      </div>
                      ${noteEntry ? `<span class="text-[10px] text-slate-400 font-mono">${noteEntry.time}</span>` : ''}
                    </div>
                    <div class="text-xs text-slate-400 mt-0.5">${noteEntry ? noteEntry.note : st.desc}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        ${photosHtml}

        <!-- Footer Actions -->
        <div class="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div class="text-xs text-slate-400">
            Auto updates in real-time
          </div>
          <div class="flex items-center space-x-2">
            <a href="tel:9346418994" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center space-x-1 kvr-btn">
              <span>📞</span>
              <span>Call Workshop</span>
            </a>
            <a href="https://wa.me/919346418994?text=Hi%20Venkat%20Reddy%20garu,%20checking%20status%20for%20my%20vehicle%20${encodeURIComponent(job.vehicleReg)}%20(${job.id})" target="_blank" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 kvr-btn">
              <span>💬</span>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // --- Photo preview popup ---
  previewPhoto(url, caption) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 bg-slate-950/90 backdrop-blur flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div class="p-3 bg-slate-950 flex justify-between items-center border-b border-slate-800">
          <span class="text-xs font-bold text-amber-400">Workshop Photo Proof</span>
          <button class="text-slate-400 hover:text-white font-bold text-sm" onclick="this.closest('.fixed').remove()">✕</button>
        </div>
        <img src="${url}" class="w-full max-h-96 object-contain bg-black" />
        <div class="p-3 text-xs text-slate-300 font-medium">${caption}</div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // --- History Tab ---
  renderHistory() {
    const container = document.getElementById('customer-history-container');
    if (!container) return;

    const customerJobs = this.getCustomerJobs();

    if (customerJobs.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400 text-xs">No service records found.</div>`;
      return;
    }

    container.innerHTML = customerJobs.map(job => `
      <div class="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 mb-3 hover:border-slate-700 transition-colors">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-mono text-xs font-bold text-amber-400">${job.invoiceNo || job.id}</span>
              <span class="text-xs text-slate-400">• ${job.invoiceDate || (job.createdAt ? job.createdAt.slice(0, 10) : '')}</span>
            </div>
            <div class="font-bold text-white text-sm mt-0.5">${job.vehicleName} (${job.vehicleReg})</div>
            <div class="text-xs text-slate-400">${job.category} • ${job.assignedTechnician || 'Venkat Reddy'}</div>
          </div>
          <div class="text-right">
            <div class="font-mono font-extrabold text-emerald-400 text-sm">₹${(job.invoiceTotal || 0).toLocaleString('en-IN')}</div>
            <span class="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${job.status === 'Completed' ? 'badge-completed' : 'badge-progress'}">
              ${job.status}
            </span>
          </div>
        </div>

        <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div class="text-xs text-slate-400">
            ${job.photos ? `${job.photos.length} photos uploaded` : 'No photos'}
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="window.kvrCustomer.showJobDetails('${job.id}')" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg kvr-btn">
              View Status
            </button>
            ${job.invoiceNo ? `
              <button onclick="window.kvrPdf.printInvoice(window.kvrDB.getJobById('${job.id}'))" class="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg kvr-btn">
                📄 PDF
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  showJobDetails(jobId) {
    this.activeJobId = jobId;
    this.setTab('status');
  }

  // --- Feedback Modal ---
  openFeedbackModal(jobId) {
    const job = window.kvrDB.getJobById(jobId);
    if (!job) return;

    let selectedRating = 5;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-black text-white text-base">Service Feedback</h3>
          <button class="text-slate-400 hover:text-white font-bold" onclick="this.closest('.fixed').remove()">✕</button>
        </div>
        <p class="text-xs text-slate-400 mb-4">Please rate your experience with KVR Car Care for <strong>${job.vehicleName}</strong> (${job.invoiceNo || job.id}).</p>

        <!-- Star Rating -->
        <div class="flex justify-center space-x-2 text-2xl my-3 cursor-pointer" id="star-rating-container">
          <span data-star="1" class="text-amber-400">★</span>
          <span data-star="2" class="text-amber-400">★</span>
          <span data-star="3" class="text-amber-400">★</span>
          <span data-star="4" class="text-amber-400">★</span>
          <span data-star="5" class="text-amber-400">★</span>
        </div>

        <textarea id="feedback-comment" rows="3" placeholder="Share your experience (e.g. prompt service, AC cooling quality)..." 
          class="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none mb-4"></textarea>

        <div class="space-y-2">
          <button id="btn-submit-feedback-whatsapp" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 kvr-btn">
            <span>💬</span>
            <span>Send Feedback to Workshop WhatsApp</span>
          </button>
          <button id="btn-submit-feedback-internal" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs kvr-btn">
            Save in App Only
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Star click interaction
    const starContainer = modal.querySelector('#star-rating-container');
    const stars = starContainer.querySelectorAll('span');
    stars.forEach(s => {
      s.addEventListener('click', () => {
        selectedRating = Number(s.dataset.star);
        stars.forEach((st, idx) => {
          st.className = idx < selectedRating ? 'text-amber-400' : 'text-slate-600';
        });
        window.kvrAudio.pop();
      });
    });

    modal.querySelector('#btn-submit-feedback-whatsapp').addEventListener('click', () => {
      const comment = modal.querySelector('#feedback-comment').value.trim() || 'Great service!';
      window.kvrDB.saveFeedback(job.id, selectedRating, comment);
      modal.remove();

      const starsEmoji = '⭐'.repeat(selectedRating);
      const text = `Hi Venkat Reddy garu, here is my feedback for KVR Car Care (Invoice: ${job.invoiceNo || job.id}) for ${job.vehicleName}:\nRating: ${starsEmoji} (${selectedRating}/5)\nRemarks: "${comment}"\nThank you!`;
      const waUrl = `https://wa.me/919346418994?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
      this.showToast('Thank you for your valuable feedback!', 'success');
      this.renderLiveStatus();
    });

    modal.querySelector('#btn-submit-feedback-internal').addEventListener('click', () => {
      const comment = modal.querySelector('#feedback-comment').value.trim() || 'Service completed satisfactorily.';
      window.kvrDB.saveFeedback(job.id, selectedRating, comment);
      modal.remove();
      this.showToast('Feedback saved successfully!', 'success');
      this.renderLiveStatus();
    });
  }

  // --- Listeners Setup ---
  setupListeners() {
    // Navigation Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setTab(btn.dataset.tab);
      });
    });

    // Submit Service Request
    document.getElementById('btn-submit-request')?.addEventListener('click', () => {
      this.submitServiceRequest();
    });

    // Add Vehicle Modal
    document.getElementById('btn-open-add-vehicle')?.addEventListener('click', () => {
      const modal = document.getElementById('add-vehicle-modal');
      if (modal) modal.classList.remove('hidden');
    });

    document.getElementById('btn-save-new-vehicle')?.addEventListener('click', () => {
      const make = document.getElementById('new-vehicle-make')?.value.trim();
      const model = document.getElementById('new-vehicle-model')?.value.trim();
      const reg = document.getElementById('new-vehicle-reg')?.value.trim().toUpperCase();
      const fuel = document.getElementById('new-vehicle-fuel')?.value;

      if (!reg || !model) {
        alert('Please fill in Vehicle Model and Registration Number.');
        return;
      }

      window.kvrDB.registerCustomerVehicle({
        customerName: this.session.name,
        customerPhone: this.session.phone,
        customerEmail: this.session.email,
        vehicleName: `${make} ${model}`.trim(),
        vehicleReg: reg,
        fuel: fuel
      });

      document.getElementById('add-vehicle-modal')?.classList.add('hidden');
      this.renderVehiclesList();
      window.kvrAudio.success();
      this.showToast(`Vehicle ${reg} registered!`, 'success');
    });

    document.querySelectorAll('.customer-otp-channel').forEach(button => {
      button.addEventListener('click', () => this.setLoginChannel(button.dataset.channel));
    });
    document.getElementById('btn-send-otp')?.addEventListener('click', () => this.requestCustomerOtp());
    document.getElementById('btn-verify-otp')?.addEventListener('click', () => this.verifyCustomerOtp());
  }
}

// Global Customer App instance
document.addEventListener('DOMContentLoaded', () => {
  window.kvrCustomer = new KVRCustomerApp();
});
