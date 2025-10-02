import { NextRequest, NextResponse } from 'next/server';

// GET /api/billing/invoice/[id] - Generate and download invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Generate branded invoice HTML
    const invoiceHtml = generateInvoiceHTML(id);
    
    return new NextResponse(invoiceHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="pokt-ai-invoice-${id}.html"`
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to generate invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateInvoiceHTML(invoiceId: string): string {
  const currentDate = new Date();
  const dueDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>pokt.ai Invoice ${invoiceId}</title>
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: white;
            color: #1e293b;
            line-height: 1.6;
            font-size: 14px;
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
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .logo {
            font-size: 2.5rem;
            font-weight: 800;
            color: white;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .invoice-meta {
            text-align: right;
        }
        
        .invoice-number {
            font-size: 1.8rem;
            font-weight: 700;
            color: white;
            margin-bottom: 10px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .invoice-date {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1rem;
        }
        
        .billing-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        
        .billing-section {
            background: #f8fafc;
            padding: 25px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        
        .billing-section h3 {
            color: #1e293b;
            font-size: 1.2rem;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .billing-section p {
            color: #64748b;
            margin-bottom: 8px;
            font-size: 0.95rem;
        }
        
        .billing-section strong {
            color: #1e293b;
            font-weight: 600;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        
        .items-table th {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            padding: 18px;
            text-align: left;
            font-weight: 600;
            font-size: 0.95rem;
        }
        
        .items-table td {
            padding: 18px;
            border-bottom: 1px solid #e2e8f0;
            color: #374151;
        }
        
        .items-table tr:last-child td {
            border-bottom: none;
        }
        
        .items-table tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .total-section {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 1rem;
        }
        
        .total-row.final {
            font-size: 1.4rem;
            font-weight: 700;
            color: #1e293b;
            border-top: 3px solid #3b82f6;
            padding-top: 15px;
            margin-top: 15px;
        }
        
        .payment-info {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .payment-info h3 {
            margin-bottom: 20px;
            font-size: 1.3rem;
            font-weight: 600;
        }
        
        .payment-methods {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .payment-method {
            background: rgba(255, 255, 255, 0.15);
            padding: 20px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
        }
        
        .payment-method h4 {
            margin-bottom: 12px;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .payment-method p {
            font-size: 0.95rem;
            opacity: 0.95;
            margin-bottom: 8px;
        }
        
        .crypto-address {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background: rgba(255, 255, 255, 0.2);
            padding: 10px;
            border-radius: 6px;
            word-break: break-all;
            font-size: 0.85rem;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .footer {
            text-align: center;
            color: #64748b;
            font-size: 0.95rem;
            margin-top: 40px;
            padding-top: 25px;
            border-top: 2px solid #e2e8f0;
        }
        
        .footer strong {
            color: #3b82f6;
            font-weight: 700;
        }
        
        /* Print styles */
        @media print {
            body { 
                margin: 0; 
                padding: 0;
                font-size: 12px;
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
            
            /* Ensure colors print */
            .header {
                background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%) !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .payment-info {
                background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%) !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .items-table th {
                background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%) !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
                color: white !important;
            }
        }
        
        @page {
            margin: 0.5in;
            size: A4;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="logo">⚡ pokt.ai</div>
            <div class="invoice-meta">
                <div class="invoice-number">${invoiceId}</div>
                <div class="invoice-date">${currentDate.toLocaleDateString()}</div>
            </div>
        </div>

        <div class="billing-info">
            <div class="billing-section">
                <h3>Bill To</h3>
                <p><strong>pokt.ai Customer</strong></p>
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
                <tr>
                    <td>Enterprise Plan - Base</td>
                    <td>1 month</td>
                    <td>$400.00</td>
                    <td>$400.00</td>
                </tr>
                <tr>
                    <td>RPC Requests (18,166)</td>
                    <td>18,166</td>
                    <td>$0.0001</td>
                    <td>$1.82</td>
                </tr>
                <tr>
                    <td>Priority Support</td>
                    <td>1 month</td>
                    <td>$0.00</td>
                    <td>$0.00</td>
                </tr>
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-row">
                <span>Subtotal</span>
                <span>$401.82</span>
            </div>
            <div class="total-row">
                <span>Tax (0%)</span>
                <span>$0.00</span>
            </div>
            <div class="total-row final">
                <span>Total</span>
                <span>$401.82</span>
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
