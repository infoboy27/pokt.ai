// Payment service supporting both Stripe and Crypto payments
export interface PaymentMethod {
  id: string;
  type: 'card' | 'crypto' | 'bank';
  brand?: string;
  last4?: string;
  expiry?: string;
  currency?: string;
  address?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  paymentMethod: PaymentMethod;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface CryptoPayment {
  currency: string;
  amount: string;
  address: string;
  network: string;
  qrCode: string;
  expiresAt: string;
}

export class PaymentService {
  private stripeApiKey: string;
  private cryptoServiceUrl: string;

  constructor() {
    this.stripeApiKey = process.env.STRIPE_SECRET_KEY || '';
    this.cryptoServiceUrl = process.env.CRYPTO_SERVICE_URL || 'https://api.crypto-payments.com';
  }

  // Stripe Payment Methods
  async createStripePaymentIntent(amount: number, currency: string = 'usd'): Promise<PaymentIntent> {
    try {
      // In production, this would call Stripe API
      const paymentIntent = {
        id: `pi_${Date.now()}`,
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        status: 'pending' as const,
        paymentMethod: {
          id: 'pm_stripe_default',
          type: 'card' as const,
          brand: 'visa',
          last4: '4242',
          expiry: '12/26',
          isDefault: true,
          isActive: true
        },
        createdAt: new Date().toISOString(),
        metadata: {
          service: 'pokt.ai',
          plan: 'enterprise'
        }
      };

      return paymentIntent;
    } catch (error) {
      throw new Error(`Failed to create Stripe payment intent: ${error}`);
    }
  }

  async getStripePaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      // In production, this would fetch from Stripe
      return [
        {
          id: 'pm_stripe_1',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          expiry: '12/26',
          isDefault: true,
          isActive: true
        },
        {
          id: 'pm_stripe_2',
          type: 'card',
          brand: 'mastercard',
          last4: '5555',
          expiry: '06/25',
          isDefault: false,
          isActive: true
        }
      ];
    } catch (error) {
      throw new Error(`Failed to fetch Stripe payment methods: ${error}`);
    }
  }

  // Crypto Payment Methods
  async createCryptoPayment(amount: number, currency: string = 'USDC'): Promise<CryptoPayment> {
    try {
      // In production, this would integrate with crypto payment providers
      const cryptoPayment = {
        currency,
        amount: amount.toString(),
        address: '0x742d35Cc6634C0532925a3b8D' + Math.random().toString(36).substr(2, 9),
        network: 'Ethereum',
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('0x742d35Cc6634C0532925a3b8D')}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      };

      return cryptoPayment;
    } catch (error) {
      throw new Error(`Failed to create crypto payment: ${error}`);
    }
  }

  async getCryptoPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      return [
        {
          id: 'pm_crypto_usdc',
          type: 'crypto',
          currency: 'USDC',
          address: '0x742d35Cc6634C0532925a3b8D',
          isDefault: false,
          isActive: true
        },
        {
          id: 'pm_crypto_eth',
          type: 'crypto',
          currency: 'ETH',
          address: '0x742d35Cc6634C0532925a3b8D',
          isDefault: false,
          isActive: true
        },
        {
          id: 'pm_crypto_btc',
          type: 'crypto',
          currency: 'BTC',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          isDefault: false,
          isActive: true
        }
      ];
    } catch (error) {
      throw new Error(`Failed to fetch crypto payment methods: ${error}`);
    }
  }

  // Universal Payment Processing
  async processPayment(
    amount: number, 
    paymentMethodId: string, 
    type: 'stripe' | 'crypto' = 'stripe'
  ): Promise<PaymentIntent> {
    try {
      if (type === 'stripe') {
        return await this.createStripePaymentIntent(amount);
      } else {
        const cryptoPayment = await this.createCryptoPayment(amount);
        return {
          id: `crypto_${Date.now()}`,
          amount,
          currency: 'usd',
          status: 'pending',
          paymentMethod: {
            id: paymentMethodId,
            type: 'crypto',
            currency: cryptoPayment.currency,
            address: cryptoPayment.address,
            isDefault: false,
            isActive: true
          },
          createdAt: new Date().toISOString(),
          metadata: {
            cryptoAddress: cryptoPayment.address,
            network: cryptoPayment.network,
            qrCode: cryptoPayment.qrCode
          }
        };
      }
    } catch (error) {
      throw new Error(`Failed to process payment: ${error}`);
    }
  }

  // Payment Status Checking
  async checkPaymentStatus(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      // In production, this would check actual payment status
      return {
        id: paymentIntentId,
        amount: 40000, // $400 in cents
        currency: 'usd',
        status: 'succeeded',
        paymentMethod: {
          id: 'pm_default',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          expiry: '12/26',
          isDefault: true,
          isActive: true
        },
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to check payment status: ${error}`);
    }
  }

  // Webhook Handling
  async handleWebhook(payload: any, signature: string, type: 'stripe' | 'crypto'): Promise<void> {
    try {
      if (type === 'stripe') {
        // Handle Stripe webhook
        console.log('Processing Stripe webhook:', payload);
      } else {
        // Handle crypto payment webhook
        console.log('Processing crypto payment webhook:', payload);
      }
    } catch (error) {
      throw new Error(`Failed to handle webhook: ${error}`);
    }
  }
}

export const paymentService = new PaymentService();
