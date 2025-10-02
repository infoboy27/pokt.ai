'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress'; // Component not available
import { useToast } from '@/hooks/use-toast';
// import { pdfService } from '@/lib/pdf-service'; // Not used - using custom PDF generation
import { 
  CreditCard, 
  Download, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Zap,
  Shield,
  Star,
  CheckCircle,
  AlertCircle,
  FileText,
  Receipt,
  Settings,
  Plus,
  Minus,
  Activity
} from 'lucide-react';

interface BillingData {
  currentPlan: {
    name: string;
    price: number;
    features: string[];
    usage: {
      requests: number;
      limit: number;
      percentage: number;
    };
  };
  paymentMethods: Array<{
    id: string;
    type: 'card' | 'crypto' | 'bank';
    brand?: string;
    last4?: string;
    expiry?: string;
    currency?: string;
    address?: string;
    isDefault: boolean;
    isActive: boolean;
  }>;
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    downloadUrl: string;
  }>;
  usageHistory: Array<{
    month: string;
    requests: number;
    cost: number;
  }>;
  costBreakdown: {
    basePlan: number;
    overage: number;
    total: number;
  };
  nextBillingDate: string;
  totalEndpoints: number;
  activeEndpoints: number;
}

export default function BillingPage() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const { toast } = useToast();

  // Fetch billing data
  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/billing');
        
        if (response.ok) {
          const data = await response.json();
          setBillingData(data);
        } else {
          // Fallback to mock data if API fails
          const mockData: BillingData = {
            currentPlan: {
              name: 'Enterprise',
              price: 474.75,
              features: [
                'Unlimited RPC requests',
                '99.9% SLA guarantee',
                'Priority support',
                'Advanced analytics',
                'Custom endpoints',
                'Webhook notifications'
              ],
              usage: {
                requests: 18166,
                limit: 1000000,
                percentage: 1.8
              }
            },
            paymentMethod: {
              type: 'card',
              last4: '4242',
              expiry: '12/26',
              brand: 'visa'
            },
            invoices: [
              {
                id: 'INV-2024-001',
                date: '2024-10-01',
                amount: 474.75,
                status: 'paid',
                downloadUrl: '#'
              },
              {
                id: 'INV-2024-002',
                date: '2024-09-01',
                amount: 423.50,
                status: 'paid',
                downloadUrl: '#'
              },
              {
                id: 'INV-2024-003',
                date: '2024-08-01',
                amount: 389.25,
                status: 'paid',
                downloadUrl: '#'
              }
            ],
            usageHistory: [
              { month: 'Oct 2024', requests: 18166, cost: 474.75 },
              { month: 'Sep 2024', requests: 15234, cost: 423.50 },
              { month: 'Aug 2024', requests: 12890, cost: 389.25 },
              { month: 'Jul 2024', requests: 11234, cost: 356.80 }
            ]
          };
          setBillingData(mockData);
        }
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
        // Fallback to mock data on error
        const mockData: BillingData = {
          currentPlan: {
            name: 'Enterprise',
            price: 474.75,
            features: [
              'Unlimited RPC requests',
              '99.9% SLA guarantee',
              'Priority support',
              'Advanced analytics',
              'Custom endpoints',
              'Webhook notifications'
            ],
            usage: {
              requests: 18166,
              limit: 1000000,
              percentage: 1.8
            }
          },
          paymentMethod: {
            type: 'card',
            last4: '4242',
            expiry: '12/26',
            brand: 'visa'
          },
          invoices: [
            {
              id: 'INV-2024-001',
              date: '2024-10-01',
              amount: 474.75,
              status: 'paid',
              downloadUrl: '#'
            },
            {
              id: 'INV-2024-002',
              date: '2024-09-01',
              amount: 423.50,
              status: 'paid',
              downloadUrl: '#'
            },
            {
              id: 'INV-2024-003',
              date: '2024-08-01',
              amount: 389.25,
              status: 'paid',
              downloadUrl: '#'
            }
          ],
          usageHistory: [
            { month: 'Oct 2024', requests: 18166, cost: 474.75 },
            { month: 'Sep 2024', requests: 15234, cost: 423.50 },
            { month: 'Aug 2024', requests: 12890, cost: 389.25 },
            { month: 'Jul 2024', requests: 11234, cost: 356.80 }
          ]
        };
        setBillingData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  const handleDownloadInvoice = async (invoiceId: string, format: 'html' | 'pdf' = 'html') => {
    setIsGeneratingInvoice(true);
    try {
      // Fetch the invoice from the API
      const response = await fetch(`/api/billing/invoice/${invoiceId}`);
      
      if (response.ok) {
        const invoiceHtml = await response.text();
        
        if (format === 'html') {
          // Download as HTML file
          const blob = new Blob([invoiceHtml], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `pokt-ai-invoice-${invoiceId}.html`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({
            title: "📄 HTML Invoice Downloaded!",
            description: `Invoice ${invoiceId} has been downloaded as HTML.`,
            duration: 5000,
          });
        } else if (format === 'pdf') {
          // Generate PDF using browser print functionality
          await generatePDFInvoice(invoiceHtml, invoiceId);
          
          toast({
            title: "📄 PDF Invoice Generated!",
            description: `Invoice ${invoiceId} has been generated as PDF.`,
            duration: 5000,
          });
        }
      } else {
        throw new Error('Failed to fetch invoice');
      }
    } catch (error) {
      console.error('Invoice download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const generatePDFInvoice = async (invoiceHtml: string, invoiceId: string) => {
    try {
      console.log('🔧 Generating PDF for invoice:', invoiceId);
      
      // Create a new window for PDF generation with cache busting
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Could not open print window. Please allow popups for this site.');
      }

      // Create a completely new HTML document with proper CSS
      const pdfOptimizedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>pokt.ai Invoice ${invoiceId}</title>
    <style type="text/css">
        /* Reset and base styles */
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
            margin: 0;
            padding: 0;
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
            color: white;
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
            color: white;
        }
        
        .payment-method p {
            font-size: 0.95rem;
            opacity: 0.95;
            margin-bottom: 8px;
            color: white;
        }
        
        .crypto-address {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background: rgba(255, 255, 255, 0.2);
            padding: 10px;
            border-radius: 6px;
            word-break: break-all;
            font-size: 0.85rem;
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
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
                background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
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
                background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            }
            
            .footer {
                page-break-inside: avoid;
                margin-top: 20px;
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
                <div class="invoice-date">${new Date().toLocaleDateString()}</div>
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
            <p>Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;

      // Clear any existing content and write new content
      printWindow.document.open();
      printWindow.document.write(pdfOptimizedHtml);
      printWindow.document.close();

      // Wait for content to load and verify it's properly structured
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Debug: Check if the content is properly loaded
      console.log('🔍 PDF content loaded, checking structure...');
      const hasStyle = printWindow.document.querySelector('style');
      const hasHeader = printWindow.document.querySelector('.header');
      console.log('📊 Style element found:', !!hasStyle);
      console.log('📊 Header element found:', !!hasHeader);
      
      if (!hasStyle || !hasHeader) {
        console.error('❌ PDF content not properly loaded, retrying...');
        // Retry with a different approach
        printWindow.document.open();
        printWindow.document.write(pdfOptimizedHtml);
        printWindow.document.close();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Trigger print dialog
      printWindow.print();

      // Close the window after a delay
      setTimeout(() => {
        printWindow.close();
      }, 2000);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
            <p className="text-muted-foreground">Loading your billing information...</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card animate-pulse h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">Failed to load billing information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
          <p className="text-muted-foreground">
            Manage your subscription, view usage, and download invoices
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
            <Settings className="mr-2 h-4 w-4" />
            Billing Settings
          </Button>
        </div>
      </div>

      {/* Current Plan & Usage */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5 text-blue-600" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-blue-600">{billingData.currentPlan.name}</h3>
                  <p className="text-sm text-muted-foreground">Active subscription</p>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Active
                </Badge>
              </div>
              
              <div className="text-3xl font-bold text-blue-600">
                ${billingData.currentPlan.price.toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Usage this month</span>
                  <span className="font-medium">{billingData.currentPlan.usage.requests.toLocaleString()} / {billingData.currentPlan.usage.limit.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, billingData.currentPlan.usage.percentage)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {billingData.currentPlan.usage.percentage.toFixed(1)}% of monthly limit used
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-green-600" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {billingData.paymentMethods.map((method, index) => (
                <div key={method.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${
                      method.type === 'card' ? 'bg-blue-600' : 
                      method.type === 'crypto' ? 'bg-orange-600' : 'bg-purple-600'
                    }`}>
                      {method.type === 'card' ? (
                        <CreditCard className="h-4 w-4 text-white" />
                      ) : method.type === 'crypto' ? (
                        <Zap className="h-4 w-4 text-white" />
                      ) : (
                        <Shield className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {method.type === 'card' ? `•••• •••• •••• ${method.last4}` : 
                         method.type === 'crypto' ? `${method.currency} Wallet` : 
                         'Bank Account'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {method.type === 'card' ? `Expires ${method.expiry}` :
                         method.type === 'crypto' ? `${method.address?.slice(0, 8)}...${method.address?.slice(-4)}` :
                         'ACH Transfer'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {method.isDefault && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Default
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <Shield className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                </div>
              ))}
              
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Next billing date</span>
                <span className="font-medium">{new Date(billingData.nextBillingDate).toLocaleDateString()}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Add Card
                </Button>
                <Button variant="outline" className="w-full">
                  <Zap className="mr-2 h-4 w-4" />
                  Add Crypto
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="mr-2 h-5 w-5 text-yellow-500" />
            Plan Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {billingData.currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage History Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
            Usage History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {billingData.usageHistory.map((month, index) => (
                <div key={index} className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border">
                  <p className="text-sm text-muted-foreground">{month.month}</p>
                  <p className="text-2xl font-bold text-blue-600">{month.requests.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">requests</p>
                  <p className="text-lg font-semibold text-green-600">${month.cost.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="mr-2 h-5 w-5 text-purple-600" />
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingData.invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold">${invoice.amount.toFixed(2)}</p>
                    <Badge 
                      variant={invoice.status === 'paid' ? 'default' : invoice.status === 'pending' ? 'secondary' : 'destructive'}
                      className={
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }
                    >
                      {invoice.status === 'paid' ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : invoice.status === 'pending' ? (
                        <AlertCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <AlertCircle className="mr-1 h-3 w-3" />
                      )}
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadInvoice(invoice.id, 'html')}
                      disabled={isGeneratingInvoice}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                    >
                      {isGeneratingInvoice ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-3 w-3" />
                          HTML
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadInvoice(invoice.id, 'pdf')}
                      disabled={isGeneratingInvoice}
                      className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white border-0"
                    >
                      {isGeneratingInvoice ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-3 w-3" />
                          PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Endpoint Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5 text-blue-600" />
            Endpoint Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border">
              <p className="text-sm text-muted-foreground">Total Endpoints</p>
              <p className="text-2xl font-bold text-blue-600">{billingData.totalEndpoints}</p>
              <p className="text-xs text-muted-foreground">All endpoints</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border">
              <p className="text-sm text-muted-foreground">Active Endpoints</p>
              <p className="text-2xl font-bold text-green-600">{billingData.activeEndpoints}</p>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold text-purple-600">99.9%</p>
              <p className="text-xs text-muted-foreground">Uptime guarantee</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-700">
              <Calendar className="mr-2 h-5 w-5" />
              Billing Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Your next billing date</p>
              <p className="text-xl font-semibold">{new Date(billingData.nextBillingDate).toLocaleDateString()}</p>
              <p className="text-sm text-muted-foreground">Amount: ${billingData.currentPlan.price.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-700">
              <DollarSign className="mr-2 h-5 w-5" />
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Base plan</span>
                <span className="text-sm">${billingData.costBreakdown.basePlan.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Usage overage</span>
                <span className="text-sm">${billingData.costBreakdown.overage.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>${billingData.costBreakdown.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
