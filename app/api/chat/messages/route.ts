import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Authenticate user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Load chat messages history
    const { data: messages, error: messagesErr } = await (supabase as any)
      .from('chat_messages')
      .select('*')
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (messagesErr) {
      console.error('Failed to load chat history messages:', messagesErr);
      return NextResponse.json({ error: 'Failed to load chat messages' }, { status: 500 });
    }

    // Load current exclusions for the session
    const { data: session } = await (supabase as any)
      .from('recipe_sessions')
      .select('exclusions')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    return NextResponse.json(
      {
        messages: messages || [],
        exclusions: session?.exclusions || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/chat/messages error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
