import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendRenewalEmail(userEmail: string, userName: string, amount: number, billingCycle: string) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Subscription Renewal - InferCircle Pro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Subscription Renewed!</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333;">Hello ${userName},</h2>
            <p style="color: #666; line-height: 1.6;">
              Your subscription has been successfully renewed. Thank you for continuing with InferCircle Pro!
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Renewal Details</h3>
              <p><strong>Amount:</strong> $${amount}</p>
              <p><strong>Billing Cycle:</strong> ${billingCycle}</p>
              <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">Active</span></p>
            </div>
            <p style="color: #666;">
              Your access to our TGE campaign database remains uninterrupted.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/tge" 
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Access Dashboard
              </a>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Renewal email sent successfully');
  } catch (error) {
    console.error('Error sending renewal email:', error);
  }
}

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('verif-hash');
    
    if (!signature || !process.env.FLUTTERWAVE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, process.env.FLUTTERWAVE_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);
    
    switch (event.event) {
      case 'charge.completed':
        await handlePaymentCompleted(event.data);
        break;
      case 'subscription.activated':
        await handleSubscriptionActivated(event.data);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handlePaymentCompleted(data: Record<string, unknown>) {
  try {
    const { tx_ref, amount, customer, meta } = data;
    
    // Update subscription status
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('tx_ref', tx_ref);

    if (error) {
      console.error('Error updating subscription:', error);
    }

    // Send confirmation email
    await sendRenewalEmail(
      (customer as Record<string, unknown>).email as string,
      (customer as Record<string, unknown>).name as string,
      amount as number,
      (meta as Record<string, unknown>).billing_cycle as string
    );
  } catch (error) {
    console.error('Error handling payment completed:', error);
  }
}

async function handleSubscriptionActivated(data: Record<string, unknown>) {
  try {
    const { tx_ref, amount, customer, meta } = data;
    
    // Create new subscription record
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: (customer as Record<string, unknown>).id as string,
        tx_ref: tx_ref as string,
        amount: amount as number,
        billing_cycle: (meta as Record<string, unknown>).billing_cycle as string,
        subscription_type: (meta as Record<string, unknown>).subscription_type as string,
        status: 'active',
        payment_provider: 'flutterwave',
        created_at: new Date().toISOString(),
        expires_at: (meta as Record<string, unknown>).billing_cycle === 'monthly' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (error) {
      console.error('Error creating subscription:', error);
    }
  } catch (error) {
    console.error('Error handling subscription activated:', error);
  }
}

async function handleSubscriptionUpdated(data: Record<string, unknown>) {
  try {
    const { tx_ref, status } = data;
    
    // Update subscription status
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('tx_ref', tx_ref);

    if (error) {
      console.error('Error updating subscription:', error);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}



