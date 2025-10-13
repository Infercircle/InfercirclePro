import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabase } from '@/lib/supabase';
import { authOptions } from '@/lib/authOptions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Validation API - Session:', session?.user?.id);
    
    if (!session?.user?.id) {
      console.log('Validation API - No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, userId } = await request.json();
    
    console.log('Validation API - Code:', code, 'UserId:', userId);
    
    if (!code) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    // Check if user already has active invite access
    const { data: existingAccess } = await supabase
      .from('user_invite_access')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (existingAccess) {
      return NextResponse.json({ 
        error: 'You already have active invite access' 
      }, { status: 400 });
    }

    // Find the invite code
    const { data: inviteCode, error: codeError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (codeError || !inviteCode) {
      return NextResponse.json({ 
        error: 'Invalid or expired invite code' 
      }, { status: 404 });
    }

    // Check if code is already used
    if (inviteCode.used_by) {
      return NextResponse.json({ 
        error: 'This invite code has already been used' 
      }, { status: 400 });
    }

    // Check if code has expired
    if (new Date() > new Date(inviteCode.expires_at)) {
      return NextResponse.json({ 
        error: 'This invite code has expired' 
      }, { status: 400 });
    }

    // Mark the invite code as used
    const { error: updateError } = await supabase
      .from('invite_codes')
      .update({
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq('id', inviteCode.id);

    if (updateError) {
      console.error('Error updating invite code:', updateError);
      return NextResponse.json({ 
        error: 'Failed to process invite code' 
      }, { status: 500 });
    }

    // Grant 3-day access to the user
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3); // 3 days from now

    const { error: accessError } = await supabase
      .from('user_invite_access')
      .insert({
        user_id: userId,
        invite_code_id: inviteCode.id,
        expires_at: expiresAt.toISOString()
      });

    if (accessError) {
      console.error('Error granting invite access:', accessError);
      return NextResponse.json({ 
        error: 'Failed to grant access' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Invite code validated successfully',
      access_expires_at: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Invite code validation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
