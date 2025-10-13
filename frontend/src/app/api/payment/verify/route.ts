import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabase } from '@/lib/supabase';
import { authOptions } from '@/lib/authOptions';
import nodemailer from 'nodemailer';

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendPaymentEmail(userEmail: string, userName: string, amount: number, billingCycle: string) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Payment Confirmation - InferCircle Pro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Payment Successful!</h1>
          </div>
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333;">Hello ${userName},</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for your payment! Your subscription to InferCircle Pro has been activated.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Payment Details</h3>
              <p><strong>Amount:</strong> $${amount}</p>
              <p><strong>Billing Cycle:</strong> ${billingCycle}</p>
              <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">Active</span></p>
            </div>
            <p style="color: #666;">
              You now have access to our comprehensive TGE campaign database and real-time project tracking.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/tge" 
                 style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Access Dashboard
              </a>
            </div>
            <p style="color: #999; font-size: 14px;">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Payment confirmation email sent successfully', info.messageId);
  } catch (error) {
    console.error('Error sending payment email:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tx_ref } = await request.json();
    
    if (!tx_ref) {
      return NextResponse.json({ error: 'Transaction reference required' }, { status: 400 });
    }

    // Verify payment with Flutterwave REST API
    const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`, {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
    });

    if (!verifyRes.ok) {
      console.error('Flutterwave API error:', verifyRes.status, verifyRes.statusText);
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    const response = await verifyRes.json();

    if (response?.status === 'success' && response?.data?.status === 'successful') {
      const { amount, currency, customer, meta } = response.data;
      const userId = (meta && (meta.user_id || meta.userId)) || session.user.id;
      const emailTo = (meta && (meta.user_email || customer?.email)) || session.user.email || '';
      const nameTo = (meta && (meta.user_name || customer?.name)) || session.user.name || '';
      
      // Check if subscription already exists to avoid duplicate emails
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('tx_ref', tx_ref)
        .single();

      const isNewSubscription = !existingSubscription;
      
      // Save subscription to database
      // Upsert by tx_ref to avoid duplicate key errors on re-verification/polling
      const { error: dbError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          tx_ref: tx_ref,
          amount: amount,
          currency: currency,
          billing_cycle: meta.billing_cycle,
          subscription_type: meta.subscription_type,
          status: 'active',
          payment_provider: 'flutterwave',
          created_at: new Date().toISOString(),
          expires_at: meta.billing_cycle === 'monthly'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 183 * 24 * 60 * 60 * 1000).toISOString(), // approx 6 months
        }, { onConflict: 'tx_ref' });

      if (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
      }

      // Only send email for new subscriptions
      if (isNewSubscription) {
        await sendPaymentEmail(
          emailTo,
          nameTo,
          amount,
          meta.billing_cycle
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified and subscription activated',
        subscription: {
          amount,
          billing_cycle: meta.billing_cycle,
          status: 'active',
        },
      });
    }

    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
