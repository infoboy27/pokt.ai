import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payment-service';

// POST /api/billing/payment - Process payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, paymentMethodId, type = 'stripe' } = body;

    if (!amount || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Amount and payment method ID are required' },
        { status: 400 }
      );
    }

    const paymentIntent = await paymentService.processPayment(
      amount,
      paymentMethodId,
      type
    );

    return NextResponse.json({
      success: true,
      paymentIntent,
      message: type === 'crypto' 
        ? 'Crypto payment address generated. Please send payment to the provided address.'
        : 'Payment intent created successfully.'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to process payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/billing/payment - Get payment methods
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let paymentMethods = [];

    if (type === 'all' || type === 'stripe') {
      const stripeMethods = await paymentService.getStripePaymentMethods('customer_123');
      paymentMethods.push(...stripeMethods);
    }

    if (type === 'all' || type === 'crypto') {
      const cryptoMethods = await paymentService.getCryptoPaymentMethods();
      paymentMethods.push(...cryptoMethods);
    }

    return NextResponse.json({
      success: true,
      paymentMethods,
      count: paymentMethods.length
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch payment methods',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}










