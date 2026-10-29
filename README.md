# KVR CAR CARE - Multi-Brand Workshop & Customer Service Platform
> **Workshop Address:** Palakaluru Road, Guntur, Andhra Pradesh  
> **Proprietor & Contact:** Venkat Reddy  
> **Phone Numbers:** +91 93464 18994 | +91 70367 05454 | +91 9876543210  

---

## 🚀 Live Testing Links

| Application | File Link | Purpose |
| :--- | :--- | :--- |
| **Portal Hub** | [`index.html`](./index.html) | Main gateway, feature catalog & launchpad |
| **App 1: Owner & Workshop App** | [`owner.html`](./owner.html) | Workshop staff, job board, photo upload, pricing & invoice |
| **App 2: Customer App** | [`customer.html`](./customer.html) | Car owners, OTP login, live status, invoice history & feedback |
| **Live Split-Screen Studio** | [`demo.html`](./demo.html) | Test Customer & Owner apps side-by-side in real-time |

---

## 🌟 Key Features Implemented

### 1. App 1: KVR Car Care Owner App (`owner.html`)
- **Workshop Dashboard:** Real-time KPI counters (Total Jobs, Active In-Progress, Completed, Total Revenue in ₹).
- **Service Request Assignment:** Assign jobs to technicians (Venkat Reddy, Suresh, Ramesh, Gopi, Raju).
- **Work Progress Updates:** 5-step progression (`Received` ➜ `Assigned` ➜ `Work In Progress` ➜ `Issue Resolved` ➜ `Completed`) with custom workshop remarks.
- **Upload Photos:** Attach photo proof at different stages (before inspection, teardown, new parts, final wash) with presets & custom URLs.
- **Labour & Parts Charges Entry:** Dynamic billable line items for spare parts and labour overhaul charges.
- **Invoice Generation PDF (`KVR-DDMM-01`):** Formatted official receipt matching specifications, printable and downloadable as PDF.
- **Automated WhatsApp Notification:** When owner marks job as **"Completed"**, an automated modal opens with a pre-filled WhatsApp message containing the complete bill breakdown, total payable, and delivery alert.
- **Services & Prices Modification:** Dedicated **Pricing Manager** allowing the owner to modify prices for any service, add new custom service packages, or remove obsolete items.
- **Download Report Option:** Export full workshop business audits to CSV with customer names, vehicle numbers, categories, technician names, and billed amounts.
- **Registered Customers & Vehicles:** Searchable customer directory with 1-click Direct Call and WhatsApp chat buttons.

---

### 2. App 2: KVR Car Care Customer App (`customer.html`)
- **Mobile OTP Login via WhatsApp Simulation:** Realistic WhatsApp verification popup with 4-digit auto-fill OTP.
- **My Vehicles:** Add and manage vehicles (Brand, Model, Registration No, Fuel Type).
- **Raise Service Request:**
  - Select registered car.
  - Choose categories & subcategories from the owner's live pricing catalog (Air Conditioning, Engine, General Service, Battery, Electrical, Body Repair, Suspension, Detailing).
  - Add specific complaint/description.
  - Live cost estimation calculator.
- **Live Status Tracker:**
  - Visual timeline stepper with active pulsing ring indicator.
  - Real-time cross-tab synchronization with audio notification whenever the owner updates status or notes.
- **Workshop Photo Proofs:** View live photos uploaded by the workshop with zoom preview.
- **Invoice Download & History:** View past invoices with number `KVR-DDMM-01` and download printable PDF receipts.
- **WhatsApp Feedback Link:** Rate service 1 to 5 stars and launch direct WhatsApp feedback to Venkat Reddy.
- **Workshop Contact & Google Maps Navigation:** Direct buttons to call Venkat Reddy (+91 93464 18994 / 70367 05454), chat on WhatsApp, and open Google Maps navigation to Palakaluru Road, Guntur.

---

### 3. Special Visual & Tactile Requirements Met
- **Branding & Visual Identity:** Styled according to the official KVR Car Care banner (Deep Burgundy `#2C0924`, Amber Yellow `#F5B800`, Bold White).
- **Slow Car Moving Only Between the Red Line:** Right below "KVR", an animated micro car glides back and forth strictly bounded between the ends of the signature red line! Click the car anytime to honk the horn.
- **UI Touch Animations & Pop Sound:** Integrated procedural Web Audio API sound synthesizer (`audio.js`) providing tactile "bubble pop" sounds on button taps, success chimes on submissions, alert arpeggios on new requests, and playful car horns. Includes an instant mute toggle.
- **Zero-Build, Zero-Dependency Architecture:** 100% static HTML5, CSS3, and JavaScript (ES6) ready for instant deployment on GitHub Pages or local preview in any browser.

---

## 🌐 How to Publish to GitHub Pages

### Option A: Using GitHub Website (Fastest & Easiest)
1. Go to [github.com/new](https://github.com/new) and create a repository named **`kvr-car-care`** (set to **Public**).
2. Click **"uploading an existing file"** in the repository page.
3. Drag and drop all files from this folder:
   - `index.html`
   - `customer.html`
   - `owner.html`
   - `demo.html`
   - `kvr-banner.png`
   - `css/` (containing `style.css`)
   - `js/` (containing `audio.js`, `db.js`, `customer.js`, `owner.js`, `pdf-export.js`)
   - `README.md`
4. Commit the changes.
5. In your GitHub repository, go to **Settings ➜ Pages**:
   - Under **Build and deployment > Source**, select **Deploy from a branch**.
   - Under **Branch**, select **`main`** and folder **`/(root)`**, then click **Save**.
6. Within 1 minute, your live site will be accessible at:
   - **Hub:** `https://<your-username>.github.io/kvr-car-care/`
   - **Customer App:** `https://<your-username>.github.io/kvr-car-care/customer.html`
   - **Owner App:** `https://<your-username>.github.io/kvr-car-care/owner.html`
   - **Split Studio:** `https://<your-username>.github.io/kvr-car-care/demo.html`

### Option B: Using Git Command Line (if Git is installed)
```bash
cd C:\Users\mahesh.chalimadugu.SMARTIMSHYD\.gemini\antigravity\scratch\kvr-car-care
git init
git add .
git commit -m "Initial commit for KVR Car Care Owner & Customer apps"
git branch -M main
git remote add origin https://github.com/<your-username>/kvr-car-care.git
git push -u origin main
```
Then enable GitHub Pages from the repository settings!

---
© 2026 KVR Car Care, Palakaluru Road, Guntur. Designed for Venkat Reddy.
