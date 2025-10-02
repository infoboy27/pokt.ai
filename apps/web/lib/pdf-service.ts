// PDF generation service for pokt.ai invoices
export interface PDFOptions {
  filename: string;
  format: 'A4' | 'Letter';
  margin: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  printBackground: boolean;
}

export class PDFService {
  private defaultOptions: PDFOptions = {
    filename: 'pokt-ai-invoice.pdf',
    format: 'A4',
    margin: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in'
    },
    printBackground: true
  };

  async generatePDF(htmlContent: string, options: Partial<PDFOptions> = {}): Promise<void> {
    const config = { ...this.defaultOptions, ...options };
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window. Please allow popups for this site.');
    }

    // Add PDF-optimized styles
    const pdfOptimizedHtml = this.addPDFStyles(htmlContent);
    
    printWindow.document.write(pdfOptimizedHtml);
    printWindow.document.close();

    // Wait for content to load
    await this.waitForContent(printWindow);

    // Trigger print dialog
    printWindow.print();

    // Close the window after a delay
    setTimeout(() => {
      printWindow.close();
    }, 2000);
  }

  private addPDFStyles(htmlContent: string): string {
    const pdfStyles = `
      <style>
        @media print {
          * { 
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body { 
            margin: 0; 
            padding: 20px; 
            font-size: 12px;
            line-height: 1.4;
          }
          
          .invoice-container { 
            max-width: 100%; 
            padding: 20px; 
            margin: 0;
          }
          
          .header { 
            page-break-inside: avoid; 
            margin-bottom: 20px;
          }
          
          .billing-info { 
            page-break-inside: avoid; 
            margin-bottom: 20px;
          }
          
          .items-table { 
            page-break-inside: avoid; 
            margin-bottom: 20px;
          }
          
          .total-section { 
            page-break-inside: avoid; 
            margin-bottom: 20px;
          }
          
          .payment-info { 
            page-break-inside: avoid; 
            margin-bottom: 20px;
          }
          
          .footer {
            page-break-inside: avoid;
            margin-top: 20px;
          }
          
          /* Ensure gradients and colors print */
          .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%) !important;
            color: white !important;
          }
          
          .payment-info {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%) !important;
            color: white !important;
          }
          
          /* Hide any interactive elements */
          button, .no-print {
            display: none !important;
          }
        }
        
        @page {
          margin: 0.5in;
          size: A4;
        }
        
        /* Ensure pokt.ai branding is visible */
        .logo {
          color: #3b82f6 !important;
          font-weight: 800 !important;
        }
        
        .invoice-number {
          color: #1e293b !important;
          font-weight: 700 !important;
        }
        
        .total-row.final {
          border-top: 2px solid #e2e8f0 !important;
          font-weight: 700 !important;
        }
      </style>
    `;

    return htmlContent.replace('<style>', pdfStyles);
  }

  private waitForContent(window: Window): Promise<void> {
    return new Promise((resolve) => {
      const checkContent = () => {
        if (window.document.readyState === 'complete') {
          resolve();
        } else {
          setTimeout(checkContent, 100);
        }
      };
      checkContent();
    });
  }

  // Generate a branded invoice with pokt.ai styling
  generateInvoiceHTML(invoiceData: {
    id: string;
    date: string;
    amount: number;
    customer: string;
    items: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
  }): string {
    const currentDate = new Date();
    const dueDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>pokt.ai Invoice ${invoiceData.id}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
            color: #1e293b;
            line-height: 1.6;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: white;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            border-radius: 8px;
        }
        .logo {
            font-size: 2rem;
            font-weight: 800;
        }
        .invoice-meta {
            text-align: right;
        }
        .invoice-number {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        .invoice-date {
            opacity: 0.9;
            font-size: 0.9rem;
        }
        .billing-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        .billing-section h3 {
            color: #1e293b;
            font-size: 1.1rem;
            margin-bottom: 15px;
            font-weight: 600;
        }
        .billing-section p {
            color: #64748b;
            margin-bottom: 5px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            background: #f8fafc;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #1e293b;
            border-bottom: 2px solid #e2e8f0;
        }
        .items-table td {
            padding: 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        .items-table tr:last-child td {
            border-bottom: none;
        }
        .total-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .total-row.final {
            font-size: 1.2rem;
            font-weight: 700;
            color: #1e293b;
            border-top: 2px solid #e2e8f0;
            padding-top: 10px;
            margin-top: 10px;
        }
        .payment-info {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .payment-info h3 {
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        .payment-methods {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .payment-method {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 6px;
        }
        .payment-method h4 {
            margin-bottom: 10px;
            font-size: 1rem;
        }
        .payment-method p {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        .footer {
            text-align: center;
            color: #64748b;
            font-size: 0.9rem;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        .crypto-address {
            font-family: monospace;
            background: rgba(255, 255, 255, 0.1);
            padding: 8px;
            border-radius: 4px;
            word-break: break-all;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="logo">⚡ pokt.ai</div>
            <div class="invoice-meta">
                <div class="invoice-number">${invoiceData.id}</div>
                <div class="invoice-date">${invoiceData.date}</div>
            </div>
        </div>

        <div class="billing-info">
            <div class="billing-section">
                <h3>Bill To</h3>
                <p><strong>${invoiceData.customer}</strong></p>
                <p>Enterprise Plan</p>
                <p>customer@pokt.ai</p>
            </div>
            <div class="billing-section">
                <h3>From</h3>
                <p><strong>pokt.ai</strong></p>
                <p>Decentralized Infrastructure for Web3</p>
                <p>billing@pokt.ai</p>
                <p>https://pokt.ai</p>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${invoiceData.items.map(item => `
                    <tr>
                        <td>${item.description}</td>
                        <td>${item.quantity}</td>
                        <td>$${item.rate.toFixed(2)}</td>
                        <td>$${item.amount.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-row">
                <span>Subtotal</span>
                <span>$${invoiceData.amount.toFixed(2)}</span>
            </div>
            <div class="total-row">
                <span>Tax (0%)</span>
                <span>$0.00</span>
            </div>
            <div class="total-row final">
                <span>Total</span>
                <span>$${invoiceData.amount.toFixed(2)}</span>
            </div>
        </div>

        <div class="payment-info">
            <h3>💳 Payment Information</h3>
            <div class="payment-methods">
                <div class="payment-method">
                    <h4>💳 Credit Card</h4>
                    <p>Pay securely with Stripe</p>
                    <p>•••• •••• •••• 4242</p>
                </div>
                <div class="payment-method">
                    <h4>₿ Crypto Payment</h4>
                    <p>USDC on Ethereum</p>
                    <div class="crypto-address">0x742d35Cc6634C0532925a3b8D</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>⚡ pokt.ai</strong> - Decentralized Infrastructure for Web3</p>
            <p>Thank you for using pokt.ai! For support, contact us at billing@pokt.ai</p>
            <p>Due Date: ${dueDate.toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;
  }
}

export const pdfService = new PDFService();
