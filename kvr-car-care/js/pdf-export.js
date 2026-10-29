// KVR Car Care - PDF Invoice & Business Reports Generator
// Supports instant high-resolution PDF download and print view

class KVRPdfExport {
  constructor() {
    this.shopDetails = {
      name: "KVR CAR CARE",
      address: "Palakaluru Road, Guntur, Andhra Pradesh",
      phones: "+91 93464 18994 / 70367 05454",
      contactPerson: "Venkat Reddy",
      gstin: "37AAHFK1234F1Z8"
    };
  }

  // Renders the official receipt formatted exactly to customer specification
  getInvoiceHtml(job) {
    const particulars = [];
    let sno = 1;

    (job.partsCharges || []).forEach(part => {
      particulars.push({
        sno: sno++,
        name: part.name,
        qty: part.qty || 1,
        amount: Number(part.amount) * (Number(part.qty) || 1)
      });
    });

    (job.labourCharges || []).forEach(lab => {
      particulars.push({
        sno: sno++,
        name: lab.name,
        qty: lab.qty || 1,
        amount: Number(lab.amount) * (Number(lab.qty) || 1)
      });
    });

    const total = particulars.reduce((acc, p) => acc + p.amount, 0);

    const rowsHtml = particulars.map(p => `
      <tr style="border-bottom: 1px dashed #cbd5e1;">
        <td style="padding: 8px 4px; text-align: center; font-family: monospace;">${p.sno}</td>
        <td style="padding: 8px 4px; font-weight: 500;">${p.name}</td>
        <td style="padding: 8px 4px; text-align: center; font-family: monospace;">${p.qty}</td>
        <td style="padding: 8px 4px; text-align: right; font-family: monospace; font-weight: 600;">₹${p.amount.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    return `
      <div id="kvr-printable-invoice" style="max-width: 480px; margin: 0 auto; background: #ffffff; color: #1e293b; padding: 24px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
        
        <!-- Header Banner & Branding -->
        <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px dashed #94a3b8;">
          <div style="display: inline-block; background: #320B27; color: #F5B800; font-size: 24px; font-weight: 900; letter-spacing: 2px; padding: 6px 18px; border-radius: 8px; margin-bottom: 6px;">
            KVR CAR CARE
          </div>
          <div style="font-size: 13px; color: #475569; font-weight: 500;">Multi-Brand Car Service & Detailing Center</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Palakaluru Road, Guntur, Andhra Pradesh</div>
          <div style="font-size: 12px; font-weight: 600; color: #1e293b; margin-top: 2px;">
            📞 +91 93464 18994 | 70367 05454
          </div>
        </div>

        <!-- Meta Info -->
        <div style="margin-top: 16px; margin-bottom: 16px; font-size: 13px; line-height: 1.6; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Invoice No:</span>
            <span style="font-weight: 700; font-family: monospace; color: #b91c1c;">${job.invoiceNo || 'KVR-PROFORMA'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Date:</span>
            <span style="font-weight: 600;">${job.invoiceDate || new Date().toISOString().slice(0, 10)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px; border-top: 1px dashed #e2e8f0; padding-top: 4px;">
            <span style="color: #64748b;">Customer:</span>
            <span style="font-weight: 600; color: #0f172a;">${job.customerName}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Phone:</span>
            <span style="font-weight: 500;">+91 ${job.customerPhone}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Vehicle:</span>
            <span style="font-weight: 700; color: #1e293b;">${job.vehicleName} (${job.vehicleReg || 'N/A'})</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Technician:</span>
            <span style="font-weight: 500;">${job.assignedTechnician || 'Venkat Reddy'}</span>
          </div>
        </div>

        <!-- Line Items Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
          <thead>
            <tr style="background: #320B27; color: #ffffff; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">
              <th style="padding: 8px 4px; text-align: center; border-radius: 4px 0 0 4px; width: 35px;">S.No</th>
              <th style="padding: 8px 4px; text-align: left;">Particulars</th>
              <th style="padding: 8px 4px; text-align: center; width: 45px;">Qty</th>
              <th style="padding: 8px 4px; text-align: right; border-radius: 0 4px 4px 0; width: 85px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="4" style="text-align: center; padding: 12px; color: #94a3b8;">No billable parts added</td></tr>'}
          </tbody>
          <tfoot>
            <tr style="border-top: 2px solid #320B27;">
              <td colspan="3" style="padding: 10px 4px; text-align: right; font-weight: 800; font-size: 15px; color: #1e293b;">Total Amount:</td>
              <td style="padding: 10px 4px; text-align: right; font-weight: 800; font-size: 16px; color: #15803d; font-family: monospace;">₹${total.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Payment & Thank You Footer -->
        <div style="background: #fdf2f8; border: 1px dashed #f472b6; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 14px;">
          <div style="font-size: 11px; color: #9d174d; font-weight: 600;">UPI Payment accepted to: 9346418994@upi</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Google Pay / PhonePe / Paytm to Venkat Reddy</div>
        </div>

        <div style="text-align: center; border-top: 2px dashed #94a3b8; padding-top: 14px;">
          <div style="font-weight: 700; color: #320B27; font-size: 14px; letter-spacing: 0.5px;">================================</div>
          <div style="font-weight: 700; color: #320B27; font-size: 14px; margin: 4px 0;">THANK YOU VISIT AGAIN</div>
          <div style="font-weight: 700; color: #320B27; font-size: 14px; letter-spacing: 0.5px;">================================</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 6px;">For Emergency Breakdown Service: 93464 18994</div>
        </div>
      </div>
    `;
  }

  // Opens a print/download dialog
  printInvoice(job) {
    const htmlContent = this.getInvoiceHtml(job);
    const printWindow = window.open('', '_blank', 'width=550,height=750');
    if (!printWindow) {
      alert('Please allow popups to download or print the invoice.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice_${job.invoiceNo || job.id}_KVR_Car_Care</title>
          <style>
            @page { margin: 10mm; }
            body { font-family: sans-serif; background: #f8fafc; padding: 20px; margin: 0; }
            @media print {
              body { background: #fff; padding: 0; }
              .no-print { display: none !important; }
            }
            .btn-action {
              background: #320B27;
              color: #F5B800;
              padding: 10px 20px;
              border: none;
              border-radius: 6px;
              font-weight: 700;
              cursor: pointer;
              margin: 10px 5px;
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button class="btn-action" onclick="window.print()">🖨️ Print / Save as PDF</button>
            <button class="btn-action" style="background: #475569; color: #fff;" onclick="window.close()">Close</button>
          </div>
          ${htmlContent}
          <script>
            // Auto open print dialog
            setTimeout(() => {
              window.print();
            }, 600);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // Generates CSV Report for Owner
  exportCSVReport(jobs) {
    let csv = "Invoice No,Date,Customer Name,Phone,Vehicle,Reg No,Category,Assigned Tech,Status,Total Amount (INR)\n";

    jobs.forEach(j => {
      const row = [
        `"${j.invoiceNo || 'N/A'}"`,
        `"${j.invoiceDate || (j.createdAt ? j.createdAt.slice(0, 10) : 'N/A')}"`,
        `"${(j.customerName || '').replace(/"/g, '""')}"`,
        `"${j.customerPhone || ''}"`,
        `"${(j.vehicleName || '').replace(/"/g, '""')}"`,
        `"${(j.vehicleReg || '').replace(/"/g, '""')}"`,
        `"${(j.category || '').replace(/"/g, '""')}"`,
        `"${(j.assignedTechnician || '').replace(/"/g, '""')}"`,
        `"${j.status}"`,
        `"${j.invoiceTotal || 0}"`
      ];
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `KVR_Car_Care_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Global export helper
window.kvrPdf = new KVRPdfExport();
