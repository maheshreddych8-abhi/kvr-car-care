// KVR Car Care - Central Reactive Database & Synchronization Layer
// Uses localStorage with BroadcastChannel for instant cross-tab real-time reactivity

const KVR_STORAGE_KEYS = {
  SERVICES: 'kvr_services_catalog_v2',
  JOBS: 'kvr_jobs_list_v2',
  CUSTOMERS: 'kvr_customers_list_v2',
  VEHICLES: 'kvr_vehicles_list_v2',
  OWNER_AUTH: 'kvr_owner_session',
  CUSTOMER_AUTH: 'kvr_customer_session',
  INVOICE_COUNTER: 'kvr_invoice_counter'
};

// Default Categories & Services Catalog (Prices pre-populated as required)
const DEFAULT_SERVICES = [
  {
    category: "AIR CONDITIONING",
    icon: "snowflake",
    items: [
      { id: "ac-1", name: "AC Checkup", price: 499, description: "Inspection of gas pressure, filter & blower" },
      { id: "ac-2", name: "AC Gas Refill", price: 1500, description: "R134a refrigerant recharge & leak check" },
      { id: "ac-3", name: "AC Filter Replacement", price: 700, description: "OEM cabin air filter renewal" },
      { id: "ac-4", name: "Compressor Repair", price: 4500, description: "Clutch, bearing and valve overhaul" },
      { id: "ac-5", name: "Compressor Replacement", price: 12000, description: "Brand new OEM compressor unit" },
      { id: "ac-6", name: "Cooling Coil Cleaning", price: 1000, description: "Deep chemical foaming and rinse" }
    ]
  },
  {
    category: "ENGINE",
    icon: "wrench",
    items: [
      { id: "eng-1", name: "Engine Diagnostics", price: 700, description: "OBD-II scanner error code diagnosis" },
      { id: "eng-2", name: "Tune Up", price: 2000, description: "Spark plugs, throttle body cleaning" },
      { id: "eng-3", name: "Engine Service", price: 4000, description: "Engine oil change, oil filter, air filter" },
      { id: "eng-4", name: "Engine Overhaul", price: 35000, description: "Full teardown, piston rings, head gasket" }
    ]
  },
  {
    category: "GENERAL SERVICE",
    icon: "cogs",
    items: [
      { id: "gen-1", name: "Basic Service", price: 2500, description: "Fluid top-ups, 40-point safety check" },
      { id: "gen-2", name: "Full Service", price: 5500, description: "Synthetic oil, all filters, brake service" },
      { id: "gen-3", name: "Premium Service", price: 8500, description: "Complete bumper-to-bumper check & flush" }
    ]
  },
  {
    category: "BATTERY",
    icon: "battery-charging",
    items: [
      { id: "bat-1", name: "Battery Check", price: 250, description: "Voltage, specific gravity & load test" },
      { id: "bat-2", name: "Battery Maintenance", price: 500, description: "Terminal cleaning & distilled water top-up" },
      { id: "bat-3", name: "Battery Replacement", price: 4500, description: "Exide / Amaron with multi-year warranty" }
    ]
  },
  {
    category: "ELECTRICAL",
    icon: "zap",
    items: [
      { id: "elec-1", name: "Wiring Repair", price: 1000, description: "Rat-bite & short circuit diagnosis" },
      { id: "elec-2", name: "Starter Repair", price: 2500, description: "Starter motor solenoid & brush repair" },
      { id: "elec-3", name: "Alternator Repair", price: 3500, description: "Dynamo charging overhaul & diode test" },
      { id: "elec-4", name: "Headlight Repair", price: 700, description: "Bulb/relay replacement & beam alignment" }
    ]
  },
  {
    category: "BODY REPAIR",
    icon: "shield",
    items: [
      { id: "bdy-1", name: "Dent Repair", price: 1500, description: "Paintless dent removal & puller repair" },
      { id: "bdy-2", name: "Painting Per Panel", price: 2000, description: "Booth spray paint with clear coat match" },
      { id: "bdy-3", name: "Bumper Repair", price: 2500, description: "Plastic welding, alignment & paint" },
      { id: "bdy-4", name: "Windshield Repair", price: 3000, description: "Crack resin sealing / OEM replacement" }
    ]
  },
  {
    category: "SUSPENSION",
    icon: "activity",
    items: [
      { id: "sus-1", name: "Wheel Alignment", price: 600, description: "3D computerized camera alignment & balancing" },
      { id: "sus-2", name: "Suspension Repair", price: 4000, description: "Struts, bushes & link rod overhaul" },
      { id: "sus-3", name: "Steering Repair", price: 3500, description: "Rack & pinion overhaul, tie rod ends" }
    ]
  },
  {
    category: "DETAILING",
    icon: "sparkles",
    items: [
      { id: "det-1", name: "Car Wash", price: 500, description: "High pressure foam wash & underbody spray" },
      { id: "det-2", name: "Interior Cleaning", price: 1500, description: "Upholstery steam extraction & conditioning" },
      { id: "det-3", name: "Ceramic Coating", price: 15000, description: "9H Nano ceramic glass shield with 3-yr coat" },
      { id: "det-4", name: "Detailing Package", price: 5000, description: "Paint compounding, wax gloss & interior shine" }
    ]
  }
];

// Seed demo jobs to show full end-to-end features right away
const DEFAULT_JOBS = [
  {
    id: "REQ-2026-101",
    customerName: "Ramesh Kumar",
    customerPhone: "9876543210",
    vehicleName: "Hyundai i20",
    vehicleReg: "AP 07 BK 4455",
    category: "AIR CONDITIONING",
    services: ["Compressor Repair", "AC Gas Refill"],
    complaint: "AC not cooling properly. Cooling stopped suddenly yesterday.",
    assignedTechnician: "Venkat Reddy (Lead Tech)",
    status: "Completed", // Received, Assigned, Work In Progress, Issue Resolved, Completed
    statusNotes: [
      { status: "Received", time: "2026-10-30 08:30 AM", note: "Vehicle checked in at workshop reception." },
      { status: "Assigned", time: "2026-10-30 09:00 AM", note: "Assigned to Master Tech Venkat Reddy." },
      { status: "Work In Progress", time: "2026-10-30 10:15 AM", note: "Compressor inspection ongoing. Found clutch coil open." },
      { status: "Issue Resolved", time: "2026-10-30 01:45 PM", note: "Compressor overhauled, AC gas refilled, cooling tested at 6°C." },
      { status: "Completed", time: "2026-10-30 03:00 PM", note: "Final wash completed. Ready for delivery." }
    ],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
        caption: "Compressor inspection ongoing at bay 2",
        stage: "Work In Progress",
        time: "10:20 AM"
      },
      {
        url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80",
        caption: "New clutch assembly & R134a refrigerant refill",
        stage: "Issue Resolved",
        time: "01:30 PM"
      }
    ],
    partsCharges: [
      { name: "Compressor Overhaul Kit & Clutch", qty: 1, amount: 4500 },
      { name: "AC Gas R134a Refill & Oil", qty: 1, amount: 1500 }
    ],
    labourCharges: [
      { name: "AC System Labour & Foaming", qty: 1, amount: 750 }
    ],
    invoiceNo: "KVR-3010-01",
    invoiceDate: "2026-10-30",
    invoiceTotal: 6750,
    feedback: {
      rating: 5,
      comment: "Super cooling restored! Very clean workshop and fast service by Venkat Reddy.",
      sentAt: "2026-10-30 03:20 PM"
    },
    createdAt: "2026-10-30T08:30:00.000Z"
  },
  {
    id: "REQ-2026-102",
    customerName: "Srinivas Rao",
    customerPhone: "9440123456",
    vehicleName: "Maruti Swift Dzire",
    vehicleReg: "AP 07 CD 8899",
    category: "ENGINE",
    services: ["Engine Diagnostics", "Tune Up"],
    complaint: "Check engine warning light on dashboard and slight pickup lag.",
    assignedTechnician: "Suresh (Senior Mech)",
    status: "Work In Progress",
    statusNotes: [
      { status: "Received", time: "2026-10-30 09:15 AM", note: "Vehicle arrived at bay." },
      { status: "Assigned", time: "2026-10-30 09:45 AM", note: "Assigned to Suresh." },
      { status: "Work In Progress", time: "2026-10-30 11:00 AM", note: "OBD scanning in progress. Throttle sensor being cleaned." }
    ],
    photos: [
      {
        url: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=600&q=80",
        caption: "OBD Scanner connected - analyzing sensor codes",
        stage: "Work In Progress",
        time: "11:15 AM"
      }
    ],
    partsCharges: [
      { name: "Air Sensor Cleaner Spray", qty: 1, amount: 450 }
    ],
    labourCharges: [
      { name: "OBD Diagnostic & Throttle Service", qty: 1, amount: 1200 }
    ],
    invoiceNo: null,
    invoiceDate: null,
    invoiceTotal: 1650,
    feedback: null,
    createdAt: "2026-10-30T09:15:00.000Z"
  },
  {
    id: "REQ-2026-103",
    customerName: "Praveen Varma",
    customerPhone: "9848011223",
    vehicleName: "Honda City",
    vehicleReg: "AP 07 EX 9001",
    category: "DETAILING",
    services: ["Detailing Package", "Interior Cleaning"],
    complaint: "Deep exterior swirl polishing and interior sanitization before family trip.",
    assignedTechnician: "Gopi (Detailer)",
    status: "Received",
    statusNotes: [
      { status: "Received", time: "2026-10-30 11:30 AM", note: "Request submitted online by customer." }
    ],
    photos: [],
    partsCharges: [],
    labourCharges: [],
    invoiceNo: null,
    invoiceDate: null,
    invoiceTotal: 0,
    feedback: null,
    createdAt: "2026-10-30T11:30:00.000Z"
  }
];

class KVRDatabase {
  constructor() {
    this.channel = null;
    try {
      this.channel = new BroadcastChannel('kvr_car_care_sync');
      this.channel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data);
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported, falling back to storage listener');
    }

    window.addEventListener('storage', (e) => {
      this.triggerListeners(e.key);
    });

    this.listeners = [];
    this.initDefaults();
  }

  initDefaults() {
    if (!localStorage.getItem(KVR_STORAGE_KEYS.SERVICES)) {
      localStorage.setItem(KVR_STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    }
    if (!localStorage.getItem(KVR_STORAGE_KEYS.JOBS)) {
      localStorage.setItem(KVR_STORAGE_KEYS.JOBS, JSON.stringify(DEFAULT_JOBS));
    }
    if (!localStorage.getItem(KVR_STORAGE_KEYS.CUSTOMERS)) {
      const initialCustomers = [
        { name: "Ramesh Kumar", phone: "9876543210", vehicle: "Hyundai i20", reg: "AP 07 BK 4455" },
        { name: "Srinivas Rao", phone: "9440123456", vehicle: "Maruti Swift Dzire", reg: "AP 07 CD 8899" },
        { name: "Praveen Varma", phone: "9848011223", vehicle: "Honda City", reg: "AP 07 EX 9001" }
      ];
      localStorage.setItem(KVR_STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
    }
    if (!localStorage.getItem(KVR_STORAGE_KEYS.VEHICLES)) {
      const initialVehicles = [
        { id: "v1", customerPhone: "9876543210", make: "Hyundai", model: "i20", reg: "AP 07 BK 4455", fuel: "Petrol", year: "2022" },
        { id: "v2", customerPhone: "9440123456", make: "Maruti", model: "Swift Dzire", reg: "AP 07 CD 8899", fuel: "Diesel", year: "2020" },
        { id: "v3", customerPhone: "9848011223", make: "Honda", model: "City", reg: "AP 07 EX 9001", fuel: "Petrol", year: "2023" }
      ];
      localStorage.setItem(KVR_STORAGE_KEYS.VEHICLES, JSON.stringify(initialVehicles));
    }
  }

  // Real-time synchronization
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify(action, data) {
    if (this.channel) {
      this.channel.postMessage({ action, data, timestamp: Date.now() });
    }
    this.listeners.forEach(cb => cb(action, data));
  }

  handleBroadcastMessage(msg) {
    this.listeners.forEach(cb => cb(msg.action, msg.data));
  }

  triggerListeners(key) {
    this.listeners.forEach(cb => cb('STORAGE_CHANGE', { key }));
  }

  // --- Services & Price Catalog (Owner Editable) ---
  getServices() {
    try {
      return JSON.parse(localStorage.getItem(KVR_STORAGE_KEYS.SERVICES)) || DEFAULT_SERVICES;
    } catch {
      return DEFAULT_SERVICES;
    }
  }

  updateServices(services) {
    localStorage.setItem(KVR_STORAGE_KEYS.SERVICES, JSON.stringify(services));
    this.notify('SERVICES_UPDATED', services);
  }

  updateServicePrice(categoryId, serviceId, newPrice) {
    const services = this.getServices();
    const cat = services.find(c => c.category === categoryId || c.category.toUpperCase() === categoryId.toUpperCase());
    if (cat) {
      const item = cat.items.find(i => i.id === serviceId);
      if (item) {
        item.price = Number(newPrice);
        this.updateServices(services);
        return true;
      }
    }
    return false;
  }

  addServiceItem(categoryName, name, price, description = '') {
    const services = this.getServices();
    let cat = services.find(c => c.category.toUpperCase() === categoryName.toUpperCase());
    if (!cat) {
      cat = {
        category: categoryName.toUpperCase(),
        icon: 'tool',
        items: []
      };
      services.push(cat);
    }
    const newId = 'srv-' + Date.now().toString(36);
    cat.items.push({
      id: newId,
      name,
      price: Number(price),
      description
    });
    this.updateServices(services);
    return newId;
  }

  deleteServiceItem(categoryName, serviceId) {
    const services = this.getServices();
    const cat = services.find(c => c.category.toUpperCase() === categoryName.toUpperCase());
    if (cat) {
      cat.items = cat.items.filter(i => i.id !== serviceId);
      this.updateServices(services);
      return true;
    }
    return false;
  }

  // --- Jobs / Service Requests ---
  getJobs() {
    try {
      return JSON.parse(localStorage.getItem(KVR_STORAGE_KEYS.JOBS)) || DEFAULT_JOBS;
    } catch {
      return DEFAULT_JOBS;
    }
  }

  getJobById(id) {
    const jobs = this.getJobs();
    return jobs.find(j => j.id === id);
  }

  getJobsByPhone(phone) {
    const clean = (phone || '').replace(/\D/g, '');
    const jobs = this.getJobs();
    return jobs.filter(j => (j.customerPhone || '').replace(/\D/g, '').endsWith(clean.slice(-10)));
  }

  saveJobs(jobs) {
    localStorage.setItem(KVR_STORAGE_KEYS.JOBS, JSON.stringify(jobs));
    this.notify('JOBS_UPDATED', jobs);
  }

  createServiceRequest(data) {
    const jobs = this.getJobs();
    const today = new Date();
    const dateCode = today.getFullYear().toString().slice(-2) + String(today.getMonth() + 1).padStart(2, '0');
    const seq = (jobs.length + 101).toString();
    const newId = `REQ-${today.getFullYear()}-${seq}`;

    const newJob = {
      id: newId,
      customerName: data.customerName || "Customer",
      customerPhone: data.customerPhone || "",
      vehicleName: data.vehicleName || "Vehicle",
      vehicleReg: data.vehicleReg || "AP 07 XX 0000",
      category: data.category || "GENERAL SERVICE",
      services: data.services || [],
      complaint: data.complaint || "Routine Inspection",
      assignedTechnician: "Unassigned",
      status: "Received",
      statusNotes: [
        {
          status: "Received",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: "Service request received online."
        }
      ],
      photos: [],
      partsCharges: [],
      labourCharges: [],
      invoiceNo: null,
      invoiceDate: null,
      invoiceTotal: 0,
      feedback: null,
      createdAt: new Date().toISOString()
    };

    jobs.unshift(newJob);
    this.saveJobs(jobs);

    // Also register vehicle if customer provided
    this.registerCustomerVehicle({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      vehicleName: data.vehicleName,
      vehicleReg: data.vehicleReg
    });

    this.notify('NEW_REQUEST', newJob);
    return newJob;
  }

  updateJobStatus(jobId, newStatus, noteText = '', technician = null) {
    const jobs = this.getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) return null;

    job.status = newStatus;
    if (technician) job.assignedTechnician = technician;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    job.statusNotes.push({
      status: newStatus,
      time: timeStr,
      note: noteText || `Status updated to ${newStatus}`
    });

    // If completed and no invoice yet, auto generate invoice number
    if (newStatus === 'Completed' && !job.invoiceNo) {
      job.invoiceNo = this.generateInvoiceNumber();
      job.invoiceDate = new Date().toISOString().slice(0, 10);
      job.invoiceTotal = this.calculateJobTotal(job);
    }

    this.saveJobs(jobs);
    this.notify('JOB_STATUS_CHANGED', { job, newStatus });
    return job;
  }

  addJobPhoto(jobId, photoUrl, caption, stage = 'Work In Progress') {
    const jobs = this.getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) return null;

    job.photos.push({
      url: photoUrl,
      caption: caption || 'Workshop inspection photo',
      stage: stage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.saveJobs(jobs);
    this.notify('PHOTO_ADDED', { jobId, photo: job.photos[job.photos.length - 1] });
    return job;
  }

  updateJobCharges(jobId, partsCharges, labourCharges) {
    const jobs = this.getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) return null;

    job.partsCharges = partsCharges || [];
    job.labourCharges = labourCharges || [];
    job.invoiceTotal = this.calculateJobTotal(job);

    this.saveJobs(jobs);
    this.notify('CHARGES_UPDATED', job);
    return job;
  }

  calculateJobTotal(job) {
    const partsSum = (job.partsCharges || []).reduce((acc, p) => acc + (Number(p.amount) || 0) * (Number(p.qty) || 1), 0);
    const labourSum = (job.labourCharges || []).reduce((acc, l) => acc + (Number(l.amount) || 0) * (Number(l.qty) || 1), 0);
    return partsSum + labourSum;
  }

  // Invoice Number Generation Format: KVR-DDMM-01 (e.g., KVR-3010-01)
  generateInvoiceNumber() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `KVR-${day}${month}-`;

    const jobs = this.getJobs();
    const todayInvoices = jobs
      .map(j => j.invoiceNo)
      .filter(inv => inv && inv.startsWith(prefix));

    const nextSeq = String(todayInvoices.length + 1).padStart(2, '0');
    return `${prefix}${nextSeq}`;
  }

  saveFeedback(jobId, rating, comment) {
    const jobs = this.getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) return null;

    job.feedback = {
      rating: Number(rating),
      comment: comment || 'Service satisfied',
      sentAt: new Date().toLocaleString()
    };

    this.saveJobs(jobs);
    this.notify('FEEDBACK_SAVED', { jobId, feedback: job.feedback });
    return job;
  }

  // --- Customers & Vehicles ---
  getCustomers() {
    try {
      return JSON.parse(localStorage.getItem(KVR_STORAGE_KEYS.CUSTOMERS)) || [];
    } catch {
      return [];
    }
  }

  getVehicles(phone = null) {
    try {
      const list = JSON.parse(localStorage.getItem(KVR_STORAGE_KEYS.VEHICLES)) || [];
      if (!phone) return list;
      const clean = phone.replace(/\D/g, '').slice(-10);
      return list.filter(v => (v.customerPhone || '').replace(/\D/g, '').endsWith(clean));
    } catch {
      return [];
    }
  }

  registerCustomerVehicle({ customerName, customerPhone, vehicleName, vehicleReg, fuel = 'Petrol', year = '2022' }) {
    if (!customerPhone || !vehicleReg) return;

    // Customer register
    const customers = this.getCustomers();
    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
    const existingCust = customers.find(c => (c.phone || '').replace(/\D/g, '').endsWith(cleanPhone));
    if (!existingCust) {
      customers.push({
        name: customerName,
        phone: customerPhone,
        vehicle: vehicleName,
        reg: vehicleReg
      });
      localStorage.setItem(KVR_STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }

    // Vehicle register
    const vehicles = this.getVehicles();
    const existingVeh = vehicles.find(v => v.reg.toUpperCase().replace(/\s/g, '') === vehicleReg.toUpperCase().replace(/\s/g, ''));
    if (!existingVeh) {
      vehicles.push({
        id: 'v-' + Date.now().toString(36),
        customerPhone: customerPhone,
        make: vehicleName.split(' ')[0] || 'Car',
        model: vehicleName,
        reg: vehicleReg,
        fuel: fuel,
        year: year
      });
      localStorage.setItem(KVR_STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
    }
  }

  // Authentication Helpers (Simulated OTP Login via WhatsApp)
  setOwnerSession(data) {
    localStorage.setItem(KVR_STORAGE_KEYS.OWNER_AUTH, JSON.stringify(data));
    this.notify('OWNER_AUTH_CHANGE', data);
  }

  getOwnerSession() {
    try {
      return JSON.parse(localStorage.getItem(KVR_STORAGE_KEYS.OWNER_AUTH));
    } catch {
      return null;
    }
  }

  clearOwnerSession() {
    localStorage.removeItem(KVR_STORAGE_KEYS.OWNER_AUTH);
  }

  setCustomerSession(data) {
    localStorage.setItem(KVR_STORAGE_KEYS.CUSTOMER_AUTH, JSON.stringify(data));
    this.notify('CUSTOMER_AUTH_CHANGE', data);
  }

  getCustomerSession() {
    try {
      return JSON.parse(localStorage.getItem(KVR_STORAGE_KEYS.CUSTOMER_AUTH));
    } catch {
      return null;
    }
  }

  clearCustomerSession() {
    localStorage.removeItem(KVR_STORAGE_KEYS.CUSTOMER_AUTH);
  }

  // Reset to default seed
  resetDefaults() {
    localStorage.setItem(KVR_STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    localStorage.setItem(KVR_STORAGE_KEYS.JOBS, JSON.stringify(DEFAULT_JOBS));
    this.notify('DATABASE_RESET', {});
  }
}

// Global DB instance
window.kvrDB = new KVRDatabase();
