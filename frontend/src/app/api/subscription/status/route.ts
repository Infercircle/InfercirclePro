import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log('Subscription Status Check - User ID:', userId);

    // Check for active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('billing_cycle,status,expires_at')
      .eq('user_id', userId)
      .gte('expires_at', new Date().toISOString())
      .eq('status', 'active');

    if (subError) {
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }

    // Check for active invite access
    const { data: inviteAccess, error: inviteError } = await supabase
      .from('user_invite_access')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (inviteError && inviteError.code !== 'PGRST116') { // PGRST116 = no rows found
      return NextResponse.json({ error: 'db_error' }, { status: 500 });
    }

    const activeMonthly = (subscriptions || []).some(r => r.billing_cycle === 'monthly');
    const activeSixMonths = (subscriptions || []).some(r => r.billing_cycle !== 'monthly');
    const hasActiveSubscription = (subscriptions || []).length > 0;
    const hasActiveInviteAccess = !!inviteAccess;
    const hasAnyAccess = hasActiveSubscription || hasActiveInviteAccess;

    console.log('Subscription Status Check - Results:', {
      subscriptions: subscriptions || [],
      inviteAccess: inviteAccess || null,
      hasActiveSubscription,
      hasActiveInviteAccess,
      hasAnyAccess
    });

    return NextResponse.json({ 
      hasActiveSubscription: hasAnyAccess,
      activeMonthly, 
      activeSixMonths,
      hasActiveInviteAccess,
      subscriptions: subscriptions || [],
      inviteAccess: inviteAccess || null
    });
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}



