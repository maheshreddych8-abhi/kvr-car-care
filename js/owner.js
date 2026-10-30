// KVR Car Care - Workshop Owner & Staff Application Controller
// Manages dashboard, job assignment, progress updates, photo uploads, parts/labour charges,
// invoice generation (KVR-DDMM-01), automated WhatsApp notifications, service pricing manager & CSV reports

class KVROwnerApp {
  constructor() {
    if (!window.kvrSecureAuth || !window.kvrSecureAuth.isWorkshopSession()) {
      throw new Error('Secure owner authentication is not configured.');
    }

    this.session = window.kvrDB.getOwnerSession();
    this.isOwner = window.kvrSecureAuth.isOwnerSession();
    this.activeTab = 'jobs'; // 'jobs', 'pricing', 'customers', 'reports'
    this.statusFilter = 'ALL';
    this.searchQuery = '';
    this.currentJobSheet = null;

    this.init();
  }

  init() {
    // Subscribe to DB events for real-time reactivity
    window.kvrDB.subscribe((action, data) => {
      console.log('Owner App received DB event:', action, data);
      if (action === 'NEW_REQUEST') {
        window.kvrAudio.alert();
        this.showToast(`🚨 New Service Request: ${data.vehicleName} (${data.id})!`, 'alert');
        this.renderStats();
        this.renderJobsList();
      } else if (action === 'JOB_STATUS_CHANGED' || action === 'CHARGES_UPDATED' || action === 'JOBS_UPDATED') {
        this.renderStats();
        this.renderJobsList();
        if (this.currentJobSheet && data.job && this.currentJobSheet.id === data.job.id) {
          this.currentJobSheet = data.job;
          this.renderJobSheetModal(this.currentJobSheet);
        }
      }
    });

    this.renderStats();
    this.renderJobsList();
    if (this.isOwner) {
      this.renderPricingManager();
      this.renderCustomers();
      this.renderStaffManager();
    } else {
      document.querySelectorAll('.owner-only-control').forEach(button => button.classList.add('hidden'));
    }
    this.setupListeners();
  }

  setTab(tab) {
    if (!this.isOwner && tab !== 'jobs') {
      this.showToast('This section is available to the owner only.');
      return;
    }
    this.activeTab = tab;
    document.querySelectorAll('.owner-tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.owner-nav-btn').forEach(btn => {
      if (btn.dataset.tab === tab) {
        btn.classList.add('bg-amber-400', 'text-slate-950', 'font-black');
        btn.classList.remove('text-slate-300', 'hover:bg-slate-800');
      } else {
        btn.classList.remove('bg-amber-400', 'text-slate-950', 'font-black');
        btn.classList.add('text-slate-300', 'hover:bg-slate-800');
      }
    });

    if (this.isOwner && tab === 'pricing') this.renderPricingManager();
    if (this.isOwner && tab === 'customers') this.renderCustomers();
    if (this.isOwner && tab === 'staff') this.renderStaffManager();
    if (this.isOwner && tab === 'reports') this.renderReports();
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-5 right-5 px-5 py-3 rounded-2xl shadow-2xl z-50 text-xs font-bold flex items-center space-x-2 kvr-toast ${
      type === 'alert' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-emerald-300 border border-emerald-500/40'
    }`;
    toast.innerHTML = `<span>⚡</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  // --- Dashboard Stats ---
  renderStats() {
    const jobs = window.kvrDB.getJobs();
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.status === 'Work In Progress' || j.status === 'Assigned' || j.status === 'Received').length;
    const completedJobs = jobs.filter(j => j.status === 'Completed').length;
    const totalRevenue = jobs
      .filter(j => j.status === 'Completed')
      .reduce((sum, j) => sum + (Number(j.invoiceTotal) || 0), 0);

    const totalEl = document.getElementById('stat-total-jobs');
    const activeEl = document.getElementById('stat-active-jobs');
    const compEl = document.getElementById('stat-completed-jobs');
    const revEl = document.getElementById('stat-revenue');

    if (totalEl) totalEl.textContent = totalJobs;
    if (activeEl) activeEl.textContent = activeJobs;
    if (compEl) compEl.textContent = completedJobs;
    if (revEl) revEl.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
  }

  // --- Jobs List Rendering ---
  renderJobsList() {
    const container = document.getElementById('owner-jobs-container');
    if (!container) return;

    let jobs = window.kvrDB.getJobs();

    // Filter by status
    if (this.statusFilter !== 'ALL') {
      jobs = jobs.filter(j => j.status === this.statusFilter);
    }

    // Filter by search query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      jobs = jobs.filter(j =>
        (j.customerName || '').toLowerCase().includes(q) ||
        (j.vehicleName || '').toLowerCase().includes(q) ||
        (j.vehicleReg || '').toLowerCase().includes(q) ||
        (j.id || '').toLowerCase().includes(q) ||
        (j.invoiceNo || '').toLowerCase().includes(q)
      );
    }

    if (jobs.length === 0) {
      container.innerHTML = `
        <div class="p-12 text-center text-slate-400 bg-slate-900/60 rounded-3xl border border-slate-800">
          <div class="text-3xl mb-2">🔍</div>
          <div class="font-bold text-white text-sm">No Service Jobs Found</div>
          <div class="text-xs text-slate-500 mt-1">Try clearing filters or search query</div>
        </div>
      `;
      return;
    }

    container.innerHTML = jobs.map(job => {
      const isCompleted = job.status === 'Completed';

      return `
        <div class="bg-slate-900/95 rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all shadow-lg kvr-card">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-xl">
                🚗
              </div>
              <div>
                <div class="flex items-center space-x-2">
                  <span class="font-mono text-xs font-black text-amber-400">${job.id}</span>
                  ${job.invoiceNo ? `<span class="font-mono text-[11px] bg-red-950/60 text-red-300 border border-red-500/30 px-1.5 py-0.2 rounded font-bold">${job.invoiceNo}</span>` : ''}
                </div>
                <h3 class="text-base font-black text-white">${job.vehicleName} <span class="font-mono text-xs text-amber-300">(${job.vehicleReg})</span></h3>
                <div class="text-xs text-slate-400">Owner: <strong class="text-slate-200">${job.customerName}</strong> • <a href="tel:${job.customerPhone}" class="text-amber-400 hover:underline font-mono">+91 ${job.customerPhone}</a></div>
              </div>
            </div>

            <div class="flex items-center space-x-2 self-start sm:self-center">
              <span class="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                job.status === 'Completed' ? 'badge-completed' :
                job.status === 'Work In Progress' ? 'badge-progress' :
                job.status === 'Issue Resolved' ? 'badge-resolved' : 'badge-received'
              }">
                ${job.status}
              </span>
            </div>
          </div>

          <!-- Mid row: Issue & Tech -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2 py-3 text-xs border-b border-slate-800/60">
            <div>
              <span class="text-slate-400">Category:</span>
              <div class="font-semibold text-slate-200 truncate">${job.category}</div>
            </div>
            <div>
              <span class="text-slate-400">Assigned Technician:</span>
              <div class="font-semibold text-amber-300">${job.assignedTechnician || 'Unassigned'}</div>
            </div>
            <div>
              <span class="text-slate-400">Total Charges:</span>
              <div class="font-mono font-extrabold text-emerald-400 text-sm">₹${(job.invoiceTotal || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>

          <!-- Bottom row: Actions -->
          <div class="pt-3 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center space-x-1.5 text-xs text-slate-400">
              <span>📸 ${(job.photos || []).length} photos</span>
              <span>•</span>
              <span class="truncate max-w-[200px]">Remarks: ${job.complaint || 'General service'}</span>
            </div>

            <div class="flex items-center space-x-2">
              <button onclick="window.kvrOwner.openJobSheetModal('${job.id}')" class="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1 kvr-btn">
                <span>⚙️</span>
                <span>Manage Job Sheet</span>
              </button>

              ${job.invoiceNo ? `
                <button onclick="window.kvrPdf.printInvoice(window.kvrDB.getJobById('${job.id}'))" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs flex items-center space-x-1 kvr-btn">
                  <span>📄</span>
                  <span>Invoice PDF</span>
                </button>
              ` : ''}

              <!-- Direct WhatsApp link -->
              <a href="https://wa.me/91${job.customerPhone}?text=Hello%20${encodeURIComponent(job.customerName)},%20update%20from%20KVR%20Car%20Care%20regarding%20your%20${encodeURIComponent(job.vehicleName)}%20(${job.id}):%20Status%20is%20${encodeURIComponent(job.status)}." 
                target="_blank" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1 kvr-btn">
                <span>💬</span>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Comprehensive Job Sheet Modal ---
  openJobSheetModal(jobId) {
    const job = window.kvrDB.getJobById(jobId);
    if (!job) return;
    this.currentJobSheet = job;
    this.renderJobSheetModal(job);
    const modal = document.getElementById('job-sheet-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeJobSheetModal() {
    const modal = document.getElementById('job-sheet-modal');
    if (modal) modal.classList.add('hidden');
    this.currentJobSheet = null;
  }

  renderJobSheetModal(job) {
    const container = document.getElementById('job-sheet-modal-content');
    if (!container) return;

    // Photos list
    const photosHtml = (job.photos && job.photos.length > 0)
      ? job.photos.map((p, idx) => `
        <div class="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video">
          <img src="${p.url}" class="w-full h-full object-cover" />
          <div class="absolute bottom-0 inset-x-0 bg-slate-950/80 p-1.5 text-[10px]">
            <div class="font-bold text-white truncate">${p.caption}</div>
            <div class="text-amber-400">${p.stage} • ${p.time}</div>
          </div>
        </div>
      `).join('')
      : `<div class="col-span-3 text-center py-4 text-xs text-slate-500">No photos uploaded yet for this vehicle.</div>`;

    // Parts items
    const partsRows = (job.partsCharges || []).map((part, idx) => `
      <div class="flex items-center space-x-2 text-xs py-1.5 border-b border-slate-800">
        <input type="text" value="${part.name}" data-idx="${idx}" data-field="name" class="part-input flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs" />
        <input type="number" value="${part.qty || 1}" min="1" data-idx="${idx}" data-field="qty" class="part-input w-14 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs text-center" />
        <input type="number" value="${part.amount}" min="0" data-idx="${idx}" data-field="amount" class="part-input w-24 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-emerald-400 font-mono text-xs text-right" />
        <button onclick="window.kvrOwner.removePartRow(${idx})" class="text-red-400 hover:text-red-300 font-bold px-1.5 text-sm">✕</button>
      </div>
    `).join('');

    // Labour items
    const labourRows = (job.labourCharges || []).map((lab, idx) => `
      <div class="flex items-center space-x-2 text-xs py-1.5 border-b border-slate-800">
        <input type="text" value="${lab.name}" data-idx="${idx}" data-field="name" class="labour-input flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs" />
        <input type="number" value="${lab.qty || 1}" min="1" data-idx="${idx}" data-field="qty" class="labour-input w-14 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs text-center" />
        <input type="number" value="${lab.amount}" min="0" data-idx="${idx}" data-field="amount" class="labour-input w-24 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-emerald-400 font-mono text-xs text-right" />
        <button onclick="window.kvrOwner.removeLabourRow(${idx})" class="text-red-400 hover:text-red-300 font-bold px-1.5 text-sm">✕</button>
      </div>
    `).join('');

    const calculatedTotal = window.kvrDB.calculateJobTotal(job);

    container.innerHTML = `
      <!-- Modal Header -->
      <div class="p-4 bg-gradient-to-r from-purple-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-mono text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">${job.id}</span>
            <span class="text-xs text-slate-300 font-bold">${job.vehicleName} (${job.vehicleReg})</span>
          </div>
          <div class="text-xs text-slate-400 mt-0.5">Customer: <strong>${job.customerName}</strong> (${job.customerPhone})</div>
        </div>
        <button onclick="window.kvrOwner.closeJobSheetModal()" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold">✕</button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 space-y-5 max-h-[80vh] overflow-y-auto">

        <!-- 1. Status Update & Assignment -->
        <div class="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <h4 class="text-xs font-black text-amber-300 uppercase tracking-wider mb-3">1. Service Progress & Tech Assignment</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Current Job Status</label>
              <select id="modal-job-status" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-amber-400">
                <option value="Received" ${job.status === 'Received' ? 'selected' : ''}>1. Received (Checked In)</option>
                <option value="Assigned" ${job.status === 'Assigned' ? 'selected' : ''}>2. Assigned (Technician Allocated)</option>
                <option value="Work In Progress" ${job.status === 'Work In Progress' ? 'selected' : ''}>3. Work In Progress</option>
                <option value="Issue Resolved" ${job.status === 'Issue Resolved' ? 'selected' : ''}>4. Issue Resolved</option>
                <option value="Completed" ${job.status === 'Completed' ? 'selected' : ''}>5. Completed (Generate Invoice & Alert)</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] text-slate-400 mb-1">Assign Technician</label>
              <select id="modal-job-technician" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-amber-400">
                <option value="Venkat Reddy (Lead Tech)" ${job.assignedTechnician?.includes('Venkat') ? 'selected' : ''}>Venkat Reddy (Master Tech)</option>
                <option value="Suresh (Senior Mech)" ${job.assignedTechnician?.includes('Suresh') ? 'selected' : ''}>Suresh (Engine Specialist)</option>
                <option value="Ramesh (Electrical)" ${job.assignedTechnician?.includes('Ramesh') ? 'selected' : ''}>Ramesh (AC / Electrical)</option>
                <option value="Gopi (Detailer)" ${job.assignedTechnician?.includes('Gopi') ? 'selected' : ''}>Gopi (Body & Detailing)</option>
                <option value="Raju (Technician)" ${job.assignedTechnician?.includes('Raju') ? 'selected' : ''}>Raju (Service Technician)</option>
              </select>
            </div>
          </div>
          <div class="mt-3">
            <label class="block text-[11px] text-slate-400 mb-1">Workshop Progress Remarks (Visible to Customer)</label>
            <input type="text" id="modal-job-remarks" placeholder="e.g. Compressor overhaul ongoing, AC gas refilled..." 
              value="${job.statusNotes && job.statusNotes.length > 0 ? job.statusNotes[job.statusNotes.length - 1].note : ''}" 
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400" />
          </div>
          <div class="mt-3 flex justify-end">
            <button onclick="window.kvrOwner.saveStatusUpdate()" class="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black rounded-xl text-xs kvr-btn">
              Update Status & Notify Customer
            </button>
          </div>
        </div>

        <!-- 2. Photo Uploads -->
        <div class="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-black text-amber-300 uppercase tracking-wider">2. Workshop Photo Proof</h4>
            <span class="text-[11px] text-slate-400">Live sync to customer</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            ${photosHtml}
          </div>

          <!-- Add Photo Controls -->
          <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
            <div class="text-[11px] font-bold text-slate-300">Add New Photo Proof:</div>
            <div class="flex flex-wrap gap-2">
              <button onclick="window.kvrOwner.attachPresetPhoto('compressor')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg kvr-btn">
                📸 Add Compressor Photo
              </button>
              <button onclick="window.kvrOwner.attachPresetPhoto('engine')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg kvr-btn">
                📸 Add Engine Diagnostics Photo
              </button>
              <button onclick="window.kvrOwner.attachPresetPhoto('detailing')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg kvr-btn">
                📸 Add Detailing Wash Photo
              </button>
            </div>
            <div class="flex items-center space-x-2 pt-1">
              <input type="text" id="custom-photo-url" placeholder="Or paste image URL..." class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white" />
              <input type="text" id="custom-photo-caption" placeholder="Caption (e.g. New clutch fitted)" class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white" />
              <button onclick="window.kvrOwner.attachCustomPhoto()" class="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs kvr-btn">
                Add Photo
              </button>
            </div>
          </div>
        </div>

        <!-- 3. Labour & Parts Charges Entry -->
        <div class="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-black text-amber-300 uppercase tracking-wider">3. Parts & Labour Charges Entry</h4>
            <div class="font-mono text-sm font-extrabold text-emerald-400">Total: ₹${calculatedTotal.toLocaleString('en-IN')}</div>
          </div>

          <!-- Parts Table -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-bold text-slate-300">⚙️ Spare Parts Replaced:</span>
              <button onclick="window.kvrOwner.addPartRow()" class="text-amber-400 hover:text-amber-300 text-xs font-bold underline kvr-btn">
                + Add Part
              </button>
            </div>
            <div class="space-y-1">
              ${partsRows || '<div class="text-xs text-slate-500 py-1">No parts added yet. Click "+ Add Part"</div>'}
            </div>
          </div>

          <!-- Labour Charges Table -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-bold text-slate-300">👨‍🔧 Labour Charges:</span>
              <button onclick="window.kvrOwner.addLabourRow()" class="text-amber-400 hover:text-amber-300 text-xs font-bold underline kvr-btn">
                + Add Labour Item
              </button>
            </div>
            <div class="space-y-1">
              ${labourRows || '<div class="text-xs text-slate-500 py-1">No labour charges added yet. Click "+ Add Labour Item"</div>'}
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button onclick="window.kvrOwner.saveCharges()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs kvr-btn">
              💾 Save Charges & Recalculate
            </button>
          </div>
        </div>

        <!-- 4. Invoice & Automated WhatsApp Section -->
        <div class="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div class="text-xs font-black text-amber-300 uppercase tracking-wider">4. Official Invoice (${job.invoiceNo || 'KVR-DDMM-01 format'})</div>
            <div class="text-xs text-slate-400 mt-0.5">Generates PDF invoice and automatically triggers WhatsApp delivery to customer.</div>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="window.kvrPdf.printInvoice(window.kvrDB.getJobById('${job.id}'))" class="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 kvr-btn">
              <span>📄</span>
              <span>Generate / Download PDF</span>
            </button>
            <button onclick="window.kvrOwner.sendWhatsAppInvoice('${job.id}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 kvr-btn">
              <span>💬</span>
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    `;
  }

  // --- Update status handler with automated WhatsApp prompt ---
  saveStatusUpdate() {
    if (!this.currentJobSheet) return;
    const statusSelect = document.getElementById('modal-job-status');
    const techSelect = document.getElementById('modal-job-technician');
    const remarksInput = document.getElementById('modal-job-remarks');

    const newStatus = statusSelect.value;
    const tech = techSelect.value;
    const remarks = remarksInput.value.trim() || `Status updated to ${newStatus}`;

    const updatedJob = window.kvrDB.updateJobStatus(this.currentJobSheet.id, newStatus, remarks, tech);
    this.currentJobSheet = updatedJob;

    window.kvrAudio.success();
    this.showToast(`Status updated to "${newStatus}"`, 'alert');

    // Requirement: "When owner set Job Status Completed, automatically the invoice will send to customer via WhatsApp"
    if (newStatus === 'Completed') {
      this.promptAutomatedWhatsAppInvoice(updatedJob);
    }

    this.renderStats();
    this.renderJobsList();
    this.renderJobSheetModal(updatedJob);
  }

  promptAutomatedWhatsAppInvoice(job) {
    const total = window.kvrDB.calculateJobTotal(job);
    const invoiceNo = job.invoiceNo || 'KVR-3010-01';

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 bg-slate-950/85 backdrop-blur flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl max-w-md w-full p-6 shadow-2xl">
        <div class="flex items-center space-x-3 mb-3">
          <span class="text-3xl">✅</span>
          <div>
            <h3 class="font-black text-white text-base">Job Completed & Invoice Generated!</h3>
            <p class="text-xs text-emerald-300">Invoice <strong class="font-mono text-white">${invoiceNo}</strong> has been generated.</p>
          </div>
        </div>

        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 mb-4">
          <div class="flex justify-between text-slate-300">
            <span>Customer:</span> <strong class="text-white">${job.customerName}</strong>
          </div>
          <div class="flex justify-between text-slate-300">
            <span>Vehicle:</span> <strong class="text-white">${job.vehicleName} (${job.vehicleReg})</strong>
          </div>
          <div class="flex justify-between text-slate-300">
            <span>Invoice Total:</span> <strong class="text-emerald-400 font-mono font-bold text-sm">₹${total.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <div class="p-3 bg-emerald-950/60 border border-emerald-600/40 rounded-xl text-xs text-emerald-200 mb-4">
          🚀 Ready to send final invoice & pickup alert to customer on WhatsApp (+91 ${job.customerPhone}).
        </div>

        <div class="space-y-2">
          <button id="btn-trigger-wa-send" class="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 kvr-btn">
            <span>💬</span>
            <span>Send Invoice Now to Customer's WhatsApp</span>
          </button>
          <button onclick="this.closest('.fixed').remove()" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs kvr-btn">
            Close & Review Later
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btn-trigger-wa-send').addEventListener('click', () => {
      this.sendWhatsAppInvoice(job.id);
      modal.remove();
    });
  }

  sendWhatsAppInvoice(jobId) {
    const job = window.kvrDB.getJobById(jobId);
    if (!job) return;

    const total = window.kvrDB.calculateJobTotal(job);
    const invoiceNo = job.invoiceNo || 'KVR-3010-01';

    // Build breakdown
    let itemsList = "";
    (job.partsCharges || []).forEach(p => {
      itemsList += `\n• ${p.name} (x${p.qty || 1}) - ₹${p.amount * (p.qty || 1)}`;
    });
    (job.labourCharges || []).forEach(l => {
      itemsList += `\n• ${l.name} - ₹${l.amount}`;
    });

    const msg = 
`================================
*KVR CAR CARE*
Palakaluru Road, Guntur
Contact: +91 93464 18994 / 70367 05454
================================
✅ *Your vehicle service is completed.*

*Invoice No:* ${invoiceNo}
*Customer:* ${job.customerName}
*Vehicle:* ${job.vehicleName} (${job.vehicleReg})
--------------------------------
*Service Breakdown:*${itemsList || '\n• Full Car Service'}
--------------------------------
*Total Amount Payable:* ₹${total.toLocaleString('en-IN')}
================================
Please collect your vehicle.
UPI ID: 9346418994@upi
Google Maps Navigation: https://maps.google.com/?q=KVR+Car+Care+Palakaluru+Road+Guntur
================================
*Thank You Visit Again*
Feedback: Reply to this message with your rating!`;

    const waUrl = `https://wa.me/91${job.customerPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    this.showToast('WhatsApp invoice opened!', 'alert');
  }

  // --- Parts & Labour dynamic rows ---
  addPartRow() {
    if (!this.currentJobSheet) return;
    if (!this.currentJobSheet.partsCharges) this.currentJobSheet.partsCharges = [];
    this.currentJobSheet.partsCharges.push({ name: 'New Spare Part', qty: 1, amount: 1000 });
    this.renderJobSheetModal(this.currentJobSheet);
  }

  removePartRow(idx) {
    if (!this.currentJobSheet || !this.currentJobSheet.partsCharges) return;
    this.currentJobSheet.partsCharges.splice(idx, 1);
    this.renderJobSheetModal(this.currentJobSheet);
  }

  addLabourRow() {
    if (!this.currentJobSheet) return;
    if (!this.currentJobSheet.labourCharges) this.currentJobSheet.labourCharges = [];
    this.currentJobSheet.labourCharges.push({ name: 'Labour / Overhaul Service', qty: 1, amount: 500 });
    this.renderJobSheetModal(this.currentJobSheet);
  }

  removeLabourRow(idx) {
    if (!this.currentJobSheet || !this.currentJobSheet.labourCharges) return;
    this.currentJobSheet.labourCharges.splice(idx, 1);
    this.renderJobSheetModal(this.currentJobSheet);
  }

  saveCharges() {
    if (!this.currentJobSheet) return;

    const parts = [];
    document.querySelectorAll('.part-input').forEach(input => {
      const idx = Number(input.dataset.idx);
      const field = input.dataset.field;
      if (!parts[idx]) parts[idx] = {};
      parts[idx][field] = field === 'name' ? input.value : Number(input.value);
    });

    const labours = [];
    document.querySelectorAll('.labour-input').forEach(input => {
      const idx = Number(input.dataset.idx);
      const field = input.dataset.field;
      if (!labours[idx]) labours[idx] = {};
      labours[idx][field] = field === 'name' ? input.value : Number(input.value);
    });

    const updated = window.kvrDB.updateJobCharges(this.currentJobSheet.id, parts, labours);
    this.currentJobSheet = updated;
    window.kvrAudio.success();
    this.showToast('Charges saved & invoice updated!', 'alert');
    this.renderStats();
    this.renderJobsList();
    this.renderJobSheetModal(updated);
  }

  // --- Photo Proof Helpers ---
  attachPresetPhoto(type) {
    if (!this.currentJobSheet) return;

    const presets = {
      compressor: {
        url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
        caption: "AC Compressor inspection & coil overhaul",
        stage: "Work In Progress"
      },
      engine: {
        url: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=600&q=80",
        caption: "OBD diagnostics & throttle sensor testing",
        stage: "Work In Progress"
      },
      detailing: {
        url: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=600&q=80",
        caption: "Deep foam wash & paint glaze shine",
        stage: "Issue Resolved"
      }
    };

    const p = presets[type];
    const updated = window.kvrDB.addJobPhoto(this.currentJobSheet.id, p.url, p.caption, p.stage);
    this.currentJobSheet = updated;
    window.kvrAudio.pop();
    this.renderJobSheetModal(updated);
    this.showToast('Photo added to job sheet & synced with customer!', 'alert');
  }

  attachCustomPhoto() {
    if (!this.currentJobSheet) return;
    const urlInput = document.getElementById('custom-photo-url');
    const captionInput = document.getElementById('custom-photo-caption');

    const url = urlInput?.value.trim() || "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80";
    const caption = captionInput?.value.trim() || "Workshop inspection proof";

    const updated = window.kvrDB.addJobPhoto(this.currentJobSheet.id, url, caption, 'Work In Progress');
    this.currentJobSheet = updated;
    window.kvrAudio.pop();
    this.renderJobSheetModal(updated);
    this.showToast('Photo attached successfully!', 'alert');
  }

  // --- Services & Price Catalog Management (Owner can modify prices/services!) ---
  renderPricingManager() {
    const container = document.getElementById('pricing-manager-container');
    if (!container) return;

    const categories = window.kvrDB.getServices();

    container.innerHTML = `
      <div class="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-black text-white">Workshop Services & Price Catalog</h2>
          <p class="text-xs text-slate-400">Modify prices, add custom service packages, or update rates in real time.</p>
        </div>
        <button onclick="window.kvrOwner.openAddServiceModal()" class="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 kvr-btn">
          <span>+</span>
          <span>Add New Service Item</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${categories.map(cat => `
          <div class="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            <div class="bg-gradient-to-r from-purple-950 to-slate-900 px-4 py-2.5 border-b border-purple-900/40 flex items-center justify-between">
              <span class="text-xs font-black text-amber-300 tracking-wider">🔧 ${cat.category}</span>
              <span class="text-[11px] text-slate-400">${cat.items.length} services</span>
            </div>

            <div class="divide-y divide-slate-800">
              ${cat.items.map(item => `
                <div class="p-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                  <div class="pr-2 flex-1">
                    <div class="text-xs font-bold text-white">${item.name}</div>
                    <div class="text-[11px] text-slate-400">${item.description || ''}</div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <div class="text-right">
                      <span class="text-xs font-mono font-extrabold text-amber-400">₹${item.price.toLocaleString('en-IN')}</span>
                    </div>
                    <button onclick="window.kvrOwner.promptEditPrice('${cat.category}', '${item.id}', '${item.name}', ${item.price})" class="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs kvr-btn" title="Edit Price">
                      ✏️
                    </button>
                    <button onclick="window.kvrOwner.deleteServiceItem('${cat.category}', '${item.id}')" class="p-1.5 bg-slate-800 hover:bg-red-900/40 text-red-400 rounded-lg text-xs kvr-btn" title="Delete">
                      🗑️
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  promptEditPrice(catName, itemId, itemName, currentPrice) {
    const newPrice = prompt(`Modify price for "${itemName}" (Current: ₹${currentPrice}):`, currentPrice);
    if (newPrice !== null && !isNaN(newPrice) && Number(newPrice) >= 0) {
      window.kvrDB.updateServicePrice(catName, itemId, Number(newPrice));
      window.kvrAudio.success();
      this.showToast(`Price updated for ${itemName} to ₹${newPrice}`, 'alert');
      this.renderPricingManager();
    }
  }

  openAddServiceModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-black text-white text-base">Add New Service</h3>
          <button class="text-slate-400 hover:text-white font-bold" onclick="this.closest('.fixed').remove()">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1">Select Category</label>
            <select id="new-service-cat" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white">
              <option value="AIR CONDITIONING">AIR CONDITIONING</option>
              <option value="ENGINE">ENGINE</option>
              <option value="GENERAL SERVICE">GENERAL SERVICE</option>
              <option value="BATTERY">BATTERY</option>
              <option value="ELECTRICAL">ELECTRICAL</option>
              <option value="BODY REPAIR">BODY REPAIR</option>
              <option value="SUSPENSION">SUSPENSION</option>
              <option value="DETAILING">DETAILING</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Service Name</label>
            <input type="text" id="new-service-name" placeholder="e.g. Brake Pad Replacement" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white" />
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Approx Price (₹)</label>
            <input type="number" id="new-service-price" placeholder="1200" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono" />
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Description</label>
            <input type="text" id="new-service-desc" placeholder="Brief scope of work..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white" />
          </div>
        </div>

        <div class="mt-4 flex space-x-2">
          <button id="btn-save-service" class="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs kvr-btn">
            Save Service
          </button>
          <button onclick="this.closest('.fixed').remove()" class="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs kvr-btn">
            Cancel
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#btn-save-service').addEventListener('click', () => {
      const cat = modal.querySelector('#new-service-cat').value;
      const name = modal.querySelector('#new-service-name').value.trim();
      const price = modal.querySelector('#new-service-price').value.trim();
      const desc = modal.querySelector('#new-service-desc').value.trim();

      if (!name || !price) {
        alert('Please fill in Service Name and Price');
        return;
      }

      window.kvrDB.addServiceItem(cat, name, price, desc);
      modal.remove();
      window.kvrAudio.success();
      this.showToast(`Added service: ${name}`, 'alert');
      this.renderPricingManager();
    });
  }

  deleteServiceItem(category, id) {
    if (confirm('Are you sure you want to delete this service?')) {
      window.kvrDB.deleteServiceItem(category, id);
      this.renderPricingManager();
      this.showToast('Service removed', 'alert');
    }
  }

  // --- Customers Tab ---
  renderCustomers() {
    const container = document.getElementById('customers-container');
    if (!container) return;

    const customers = window.kvrDB.getCustomers();
    const jobs = window.kvrDB.getJobs();

    container.innerHTML = `
      <div class="mb-4">
        <h2 class="text-base font-black text-white">Registered Customer Database</h2>
        <p class="text-xs text-slate-400">Total ${customers.length} vehicle owners registered with KVR Car Care.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        ${customers.map(c => {
          const userJobs = jobs.filter(j => (j.customerPhone || '').replace(/\D/g, '').endsWith((c.phone || '').slice(-10)));
          return `
            <div class="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md">
              <div class="flex items-center space-x-3 mb-3">
                <div class="w-10 h-10 rounded-full bg-amber-400/20 text-amber-400 font-bold flex items-center justify-center">
                  👤
                </div>
                <div>
                  <div class="font-bold text-white text-sm">${c.name}</div>
                  <a href="tel:${c.phone}" class="font-mono text-xs text-amber-300 hover:underline">+91 ${c.phone}</a>
                </div>
              </div>

              <div class="text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 mb-3">
                <div class="text-slate-400">Registered Vehicle:</div>
                <div class="font-bold text-white mt-0.5">🚗 ${c.vehicle || 'Car'} <span class="text-amber-400 font-mono">(${c.reg || 'N/A'})</span></div>
                <div class="text-[11px] text-slate-400 mt-1">Total Service Visits: <strong class="text-emerald-400">${userJobs.length}</strong></div>
              </div>

              <div class="flex space-x-2">
                <a href="tel:${c.phone}" class="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg text-center kvr-btn">
                  📞 Call
                </a>
                <a href="https://wa.me/91${c.phone}?text=Hello%20${encodeURIComponent(c.name)},%20greetings%20from%20KVR%20Car%20Care!" target="_blank" class="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg text-center kvr-btn">
                  💬 WhatsApp
                </a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  async renderStaffManager() {
    const container = document.getElementById('staff-manager-container');
    if (!container || !this.isOwner) return;

    container.innerHTML = `
      <div class="mb-5">
        <h2 class="text-base font-black text-white">Owner-managed Staff Access</h2>
        <p class="mt-1 text-xs text-slate-400">Add each staff member's name, email and mobile number. Staff sign in with email OTP; the mobile is kept for contact only.</p>
      </div>
      <form id="staff-add-form" class="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 md:grid-cols-3">
        <input id="staff-name" required maxlength="100" placeholder="Staff full name" class="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white">
        <input id="staff-email" required type="email" placeholder="Staff email for OTP" class="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white">
        <input id="staff-mobile" required type="tel" inputmode="numeric" maxlength="10" pattern="[6-9][0-9]{9}" placeholder="10-digit mobile (contact only)" class="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white">
        <button type="submit" class="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950">Add approved staff</button>
        <p id="staff-manager-status" class="hidden text-xs md:col-span-2" role="status" aria-live="polite"></p>
      </form>
      <div id="staff-list" class="space-y-2"><p class="text-xs text-slate-400">Loading staff list…</p></div>
    `;

    container.querySelector('#staff-add-form').addEventListener('submit', event => {
      event.preventDefault();
      this.addStaffMember();
    });
    container.querySelector('#staff-list').addEventListener('click', event => {
      const button = event.target.closest('[data-staff-id]');
      if (button) this.toggleStaffMember(button.dataset.staffId, button.dataset.active !== 'true');
    });

    await this.loadStaffMembers();
  }

  setStaffManagerStatus(message, isError = false) {
    const status = document.getElementById('staff-manager-status');
    if (!status) return;
    status.textContent = message;
    status.classList.remove('hidden', 'text-rose-300', 'text-emerald-300');
    status.classList.add(isError ? 'text-rose-300' : 'text-emerald-300');
  }

  async loadStaffMembers() {
    const list = document.getElementById('staff-list');
    if (!list) return;
    try {
      const staff = await window.kvrEmailAuth.listStaff();
      list.innerHTML = staff.length
        ? staff.map(member => `
            <article class="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:flex-row sm:items-center">
              <div class="min-w-0 flex-1">
                <h3 class="truncate text-sm font-bold text-white">${this.escapeHtml(member.full_name)}</h3>
                <p class="mt-1 break-all text-xs text-slate-300">${this.escapeHtml(member.email)}</p>
                <p class="mt-1 text-xs text-slate-400">Mobile: ${this.escapeHtml(member.mobile)} · ${member.active ? 'Approved' : 'Disabled'}</p>
              </div>
              <button type="button" data-staff-id="${this.escapeHtml(member.id)}" data-active="${member.active}" class="rounded-lg px-3 py-2 text-xs font-bold ${member.active ? 'bg-rose-950 text-rose-200' : 'bg-emerald-950 text-emerald-200'}">
                ${member.active ? 'Disable access' : 'Enable access'}
              </button>
            </article>
          `).join('')
        : '<p class="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-400">No staff members yet. Add a name, email and mobile number above.</p>';
    } catch (error) {
      list.innerHTML = `<p class="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs text-rose-200">Could not load staff. Apply the staff access SQL schema in Supabase, then try again. ${this.escapeHtml(error.message)}</p>`;
    }
  }

  async addStaffMember() {
    const name = document.getElementById('staff-name').value.trim();
    const email = document.getElementById('staff-email').value.trim().toLowerCase();
    const mobile = document.getElementById('staff-mobile').value.replace(/\D/g, '');
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[6-9]\d{9}$/.test(mobile)) {
      this.setStaffManagerStatus('Enter a staff name, valid email, and valid 10-digit mobile number.', true);
      return;
    }
    try {
      await window.kvrEmailAuth.addStaff({ full_name: name, email, mobile });
      document.getElementById('staff-add-form').reset();
      this.setStaffManagerStatus('Staff member approved. They can now sign in with an email OTP.');
      await this.loadStaffMembers();
    } catch (error) {
      this.setStaffManagerStatus(`Could not add staff: ${error.message}`, true);
    }
  }

  async toggleStaffMember(id, active) {
    try {
      await window.kvrEmailAuth.setStaffActive(id, active);
      await this.loadStaffMembers();
      this.showToast(active ? 'Staff email access enabled.' : 'Staff email access disabled.');
    } catch (error) {
      this.setStaffManagerStatus(`Could not update staff access: ${error.message}`, true);
    }
  }

  escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  // --- Reports & Analytics Tab with CSV Export ---
  renderReports() {
    const container = document.getElementById('reports-container');
    if (!container) return;

    const jobs = window.kvrDB.getJobs();
    const completed = jobs.filter(j => j.status === 'Completed');
    const totalRev = completed.reduce((sum, j) => sum + (Number(j.invoiceTotal) || 0), 0);

    // Group by category
    const catMap = {};
    jobs.forEach(j => {
      catMap[j.category] = (catMap[j.category] || 0) + 1;
    });

    container.innerHTML = `
      <div class="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-black text-white">Workshop Business Reports & Analytics</h2>
          <p class="text-xs text-slate-400">Track turnaround time, service category revenue and generate official audit logs.</p>
        </div>
        <div class="flex items-center space-x-2">
          <button onclick="window.kvrPdf.exportCSVReport(window.kvrDB.getJobs())" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center space-x-1.5 kvr-btn">
            <span>📥</span>
            <span>Download CSV Report</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div class="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          <div class="text-xs text-slate-400">Total Billed Invoices</div>
          <div class="text-2xl font-black text-white mt-1">${completed.length}</div>
          <div class="text-[11px] text-emerald-400 mt-1">100% delivered vehicles</div>
        </div>
        <div class="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          <div class="text-xs text-slate-400">Total Workshop Revenue</div>
          <div class="text-2xl font-black text-emerald-400 font-mono mt-1">₹${totalRev.toLocaleString('en-IN')}</div>
          <div class="text-[11px] text-slate-400 mt-1">Average ₹${completed.length ? Math.round(totalRev / completed.length).toLocaleString('en-IN') : 0} per job</div>
        </div>
        <div class="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          <div class="text-xs text-slate-400">Customer Satisfaction</div>
          <div class="text-2xl font-black text-amber-400 mt-1">4.9 / 5.0 ⭐</div>
          <div class="text-[11px] text-slate-400 mt-1">High retention rate in Guntur</div>
        </div>
      </div>

      <!-- Categories Breakdown -->
      <div class="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 mb-6">
        <h3 class="text-xs font-black text-amber-300 uppercase tracking-wider mb-3">Service Volume by Category</h3>
        <div class="space-y-2">
          ${Object.entries(catMap).map(([cat, count]) => {
            const pct = Math.round((count / jobs.length) * 100);
            return `
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-300 font-semibold">${cat}</span>
                  <span class="text-amber-400 font-mono font-bold">${count} jobs (${pct}%)</span>
                </div>
                <div class="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div class="bg-gradient-to-r from-purple-600 to-amber-400 h-full rounded-full" style="width: ${pct}%"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // --- Listeners Setup ---
  setupListeners() {
    // Navigation tabs
    document.querySelectorAll('.owner-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setTab(btn.dataset.tab);
      });
    });

    // Status filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.statusFilter = btn.dataset.status;
        document.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('bg-amber-400', 'text-slate-950');
          b.classList.add('bg-slate-800', 'text-slate-300');
        });
        btn.classList.add('bg-amber-400', 'text-slate-950');
        btn.classList.remove('bg-slate-800', 'text-slate-300');
        this.renderJobsList();
      });
    });

    // Search query
    const searchInput = document.getElementById('owner-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.renderJobsList();
      });
    }

    // Modal background close
    const modal = document.getElementById('job-sheet-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeJobSheetModal();
      });
    }
  }
}

// Global Owner App instance
document.addEventListener('DOMContentLoaded', () => {
  window.kvrOwner = null;
});
