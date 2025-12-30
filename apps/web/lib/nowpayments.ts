// NOWPayments Integration for Crypto Payments
// Documentation: https://documenter.getpostman.com/view/7907941/S1a32n38

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

export interface NOWPaymentsConfig {
  apiKey: string;
  publicKey: string;
  ipnSecret: string;
}

export interface CreatePaymentParams {
  price_amount: number;
  price_currency: string; // USD, EUR, etc.
  pay_currency?: string; // BTC, ETH, USDC, etc. (optional - omit to let user choose on NOWPayments page)
  order_id: string; // Your internal order/invoice ID
  order_description: string;
  ipn_callback_url: string; // Your webhook URL
  success_url?: string; // Where to redirect after payment
  cancel_url?: string; // Where to redirect if cancelled
  [key: string]: any; // Allow additional params
}

export interface NOWPayment {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  created_at: string;
  updated_at: string;
  purchase_id: string;
  invoice_url: string;
}

export interface PaymentStatus {
  payment_id: string;
  payment_status: 'waiting' | 'confirming' | 'confirmed' | 'sending' | 'partially_paid' | 'finished' | 'failed' | 'refunded' | 'expired';
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
  outcome_amount: number;
  outcome_currency: string;
}

class NOWPaymentsService {
  private config: NOWPaymentsConfig;

  constructor() {
    this.config = {
      apiKey: process.env.NOWPAYMENTS_API_KEY || '',
      publicKey: process.env.NOWPAYMENTS_PUBLIC_KEY || '',
      ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET || '',
    };
  }

  private getHeaders() {
    return {
      'x-api-key': this.config.apiKey,
      'Content-Type': 'application/json',
    };
  }

  // Get available currencies
  async getAvailableCurrencies(): Promise<string[]> {
    try {
      const response = await fetch(`${NOWPAYMENTS_API_URL}/currencies`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`NOWPayments API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.currencies || [];
    } catch (error) {
      console.error('[NOWPAYMENTS] Error fetching currencies:', error);
      throw error;
    }
  }

  // Get minimum payment amount for a currency
  async getMinimumAmount(currency: string): Promise<number> {
    try {
      const response = await fetch(`${NOWPAYMENTS_API_URL}/min-amount?currency_from=usd&currency_to=${currency.toLowerCase()}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`NOWPayments API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.min_amount || 0;
    } catch (error) {
      console.error('[NOWPAYMENTS] Error fetching minimum amount:', error);
      return 0;
    }
  }

  // Create a payment
  async createPayment(params: CreatePaymentParams): Promise<NOWPayment> {
    try {
      // Check if API key is configured
      if (!this.config.apiKey) {
        throw new Error('NOWPayments API key is not configured. Please set NOWPAYMENTS_API_KEY environment variable.');
      }
      
      console.log('[NOWPAYMENTS] Creating payment with params:', {
        ...params,
        ipn_callback_url: params.ipn_callback_url,
        success_url: params.success_url,
        cancel_url: params.cancel_url,
      });
      
      const response = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: await response.text() };
        }
        console.error('[NOWPAYMENTS] API Error Response:', errorData);
        throw new Error(`NOWPayments API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      console.log('[NOWPAYMENTS] Payment created successfully:', data.payment_id);
      console.log('[NOWPAYMENTS] Full response data:', JSON.stringify(data, null, 2));
      
      // Validate response has required fields
      if (!data.payment_id) {
        throw new Error('NOWPayments response missing payment_id');
      }
      if (!data.pay_address) {
        console.warn('[NOWPAYMENTS] Warning: pay_address missing in response');
      }
      if (!data.invoice_url && !data.payment_id) {
        console.warn('[NOWPAYMENTS] Warning: invoice_url missing, will construct from payment_id');
      }
      
      return data;
    } catch (error) {
      console.error('[NOWPAYMENTS] Error creating payment:', error);
      throw error;
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await fetch(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`NOWPayments API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[NOWPAYMENTS] Error fetching payment status:', error);
      throw error;
    }
  }

  // Verify IPN callback signature
  verifyIPNSignature(receivedSignature: string, payload: string): boolean {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha512', this.config.ipnSecret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');
    
    return calculatedSignature === receivedSignature;
  }
}

export const nowPaymentsService = new NOWPaymentsService();








