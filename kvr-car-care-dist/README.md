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
| **App 2: Customer App** | [`customer.html`](./customer.html) | Car owners, email OTP login, live status, invoice history & feedback |
| **Live Split-Screen Studio** | [`demo.html`](./demo.html) | Test Customer & Owner apps side-by-side in real-time |

---

## 🌟 Key Features Implemented

### 1. Owner / Staff Access (`owner.html`)
- **Email OTP Login:** Owner manually enters the email address, requests a six-digit email OTP, and verifies it to sign in. Owner access is restricted to `maheshch1810@gmail.com`.
- **Owner-managed Staff:** Once configured, the owner can add a staff member's name, email and mobile number. Staff sign in with email OTP; their mobile number is contact-only.
- The workshop dashboard features listed below describe the prototype and are not accessible until the login gate is connected.
- **Prototype Limitation:** App data is currently browser-local, not protected by a production database. Do not enter real customer, staff, or workshop records until backend authorization is implemented.
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
- **Customer OTP Login:** Customers enter their name and email address to receive a six-digit sign-in code by email. No paid SMS/WhatsApp OTP provider is required.
- **Single Mobile App:** Install KVR Car Care once, then choose Customer or Owner / Staff from the home screen.
- **Festival Offers:** Customer app banner links to WhatsApp to ask the workshop about current seasonal discounts.
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

## Configure Customer and Owner OTP

Customers do not need a separate registration form: entering an email and requesting a code creates the Supabase account automatically when needed. The site does not generate or display pretend OTPs. A sender email address by itself does not connect the app to an email service. SMS and WhatsApp OTP sign-in are not enabled.

1. Create a Supabase project. In `js/supabase-config.js`, set its Project URL and **public anon/publishable key**. Never put a service-role key in browser code.
2. In Supabase Authentication > SMTP Settings, enable custom SMTP and configure the business sender. For Gmail, use `smtp.gmail.com`, port `465` (SSL) or `587` (STARTTLS), and `kvrcarcare11@gmail.com` as the sender address and SMTP username. Use a Google App Password as the SMTP password and enter it only in the Supabase dashboard; never add it to this repository or share it in chat. Gmail may impose sending limits.
3. In Supabase Authentication > Email Templates, configure both **Confirm sign up** and **Magic Link** to send an OTP instead of a confirmation link. Set the subject to `Your KVR Car Care sign-in code` and use this body in both templates:

   ```html
   <p>Dear Customer!</p>
   <p>Welcome to KVR CAR CARE! Please use the OTP below to log in and enjoy our services:</p>
   <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">{{ .Token }}</p>
   <p>If you did not request this code, please ignore this email.</p>
   <p>Have a great day!</p>
   <p>Thank you,<br>KVR Car Care</p>
   ```

   The `{{ .Token }}` variable is required so the email contains the six-digit code. Do not use `{{ .ConfirmationURL }}` for this code-entry flow; it sends a link and may redirect users away from the app.
4. In Supabase Authentication > URL Configuration, set the Site URL to `https://maheshreddych8-abhi.github.io/kvr-car-care` and add `https://maheshreddych8-abhi.github.io/kvr-car-care/**` to the allowed Redirect URLs. Customer and workshop auth requests explicitly redirect to the GitHub Pages Customer or Owner app, even if the request starts from a local copy.
5. Create the owner account `maheshch1810@gmail.com` in Supabase Auth; the app rejects other owner emails. Owner and Staff login remain email OTP only.
6. Run `supabase-staff-schema.sql` in the Supabase SQL Editor. Publish the public Project URL/key and files. Customers can then self-register by email OTP; the owner can add staff after signing in.

The workshop jobs, invoices and customer data are still stored in browser local storage. OTP gates the UI, but this prototype is not a substitute for server-side authorization/RLS on workshop data. Avoid entering sensitive production records until that data is moved behind protected backend policies.

---

### 3. Special Visual & Tactile Requirements Met
- **Branding & Visual Identity:** Styled according to the official KVR Car Care banner (Deep Burgundy `#2C0924`, Amber Yellow `#F5B800`, Bold White).
- **Slow Car Moving Only Between the Red Line:** Right below "KVR", an animated micro car glides back and forth strictly bounded between the ends of the signature red line! Click the car anytime to honk the horn.
- **UI Touch Animations & Pop Sound:** Integrated procedural Web Audio API sound synthesizer (`audio.js`) providing tactile "bubble pop" sounds on button taps, success chimes on submissions, alert arpeggios on new requests, and playful car horns. Includes an instant mute toggle.
- **Zero-Build Static Architecture:** HTML5, CSS3, and JavaScript (ES6), with Supabase JS loaded from its CDN for email authentication.

---

## 🌐 How to Publish to GitHub Pages

### Option A: Using GitHub Website (Fastest & Easiest)
1. Go to [github.com/new](https://github.com/new) and create a repository named **`kvr-car-care`** (set to **Public**).
2. Click **"uploading an existing file"** in the repository page.
3. Drag and drop all files from this folder:
   - `index.html`
   - `manifest.json`
   - `customer.html`
   - `owner.html`
   - `demo.html`
   - `kvr-banner.png`, `festival-offer.svg`, and the four app icons
   - `css/` and `js/` folders (including `email-auth.js`, `owner-access.js`, `pwa.js`, and `supabase-config.js`)
   - `supabase-staff-schema.sql`
   - `sw.js`
   - `README.md`
4. Commit the changes.
5. In your GitHub repository, go to **Settings ➜ Pages**:
   - Under **Build and deployment > Source**, select **Deploy from a branch**.
   - Under **Branch**, select **`main`** and folder **`/(root)`**, then click **Save**.
6. Install the single KVR Car Care app and choose Customer or Owner / Staff from the home screen. Within 1 minute, your live site will be accessible at:
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
