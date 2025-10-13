import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabase } from '@/lib/supabase';
import { authOptions } from '@/lib/authOptions';

// Authorized emails for generating invite codes
const AUTHORIZED_EMAILS = ['infercircle@gmail.com', 'kesharwanis084@gmail.com', 'ifechukwuobiezuedoc@gmail.com'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AUTHORIZED_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email, username } = await request.json();

    // Generate a random 8-character invite code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let code;
    let isUnique = false;
    let attempts = 0;

    // Ensure code is unique
    while (!isUnique && attempts < 10) {
      code = generateCode();
      const { data: existing } = await supabase
        .from('invite_codes')
        .select('id')
        .eq('code', code)
        .single();
      
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json({ 
        error: 'Failed to generate unique code' 
      }, { status: 500 });
    }

    // Set expiration to 30 days from now (for the invite code itself)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create the invite code
    const { data: inviteCode, error: createError } = await supabase
      .from('invite_codes')
      .insert({
        code,
        created_by: session.user.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating invite code:', createError);
      return NextResponse.json({ 
        error: 'Failed to create invite code' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      inviteCode: {
        id: inviteCode.id,
        code: inviteCode.code,
        expires_at: inviteCode.expires_at,
        created_at: inviteCode.created_at
      },
      message: 'Invite code generated successfully'
    });

  } catch (error) {
    console.error('Invite code generation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!AUTHORIZED_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all invite codes
    const { data: inviteCodes, error } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invite codes:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch invite codes' 
      }, { status: 500 });
    }

    return NextResponse.json({ inviteCodes });

  } catch (error) {
    console.error('Error fetching invite codes:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
