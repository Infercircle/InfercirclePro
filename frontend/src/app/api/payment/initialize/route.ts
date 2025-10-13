import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, billingCycle, currency = 'USD', userId } = await request.json();
    
    if (!amount || !billingCycle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Guard: if monthly and user already has active monthly subscription, block
    if (billingCycle === 'monthly') {
      try {
        const statusRes = await fetch(`${process.env.NEXTAUTH_URL}/api/subscription/status?userId=${encodeURIComponent(userId || session.user.id)}`, { cache: 'no-store' });
        const statusJson = await statusRes.json();
        if (statusJson?.activeMonthly) {
          return NextResponse.json({ error: 'You already have an active monthly subscription.' }, { status: 400 });
        }
      } catch (_) {}
    }

    // Create payment payload
    const effectiveUserId = userId || session.user.id;

    const payload = {
      tx_ref: `TGE_${Date.now()}_${effectiveUserId}`,
      amount: amount,
      currency: currency,
      redirect_url: `${process.env.NEXTAUTH_URL}/payment/success`,
      customer: {
        email: session.user.email || '',
        name: session.user.name || '',
      },
      customizations: {
        title: 'InferCircle Pro Subscription',
        description: `TGE Campaign Access - ${billingCycle} subscription`,
        logo: `${process.env.NEXTAUTH_URL}/inferpro.svg`,
      },
      payment_options: 'card,googlepay',
      meta: {
        user_id: effectiveUserId,
        user_email: session.user.email || '',
        user_name: session.user.name || '',
        billing_cycle: billingCycle,
        subscription_type: 'tge_access',
      },
    };

    // Initialize payment via Flutterwave REST API
    const initRes = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const response = await initRes.json();

    if (response?.status === 'success' && response?.data?.link) {
      return NextResponse.json({
        success: true,
        payment_url: response.data.link,
        tx_ref: payload.tx_ref,
      });
    }

    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 400 });
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
