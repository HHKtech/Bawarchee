import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    // Parse payload
    const { suggestion_id } = await request.json();

    if (!suggestion_id) {
      return NextResponse.json({ error: 'Missing suggestion_id' }, { status: 400 });
    }

    // Update status to 'cooked'
    const { data: updatedSuggestion, error: updateError } = await (supabase as any)
      .from('recipe_suggestions')
      .update({ status: 'cooked' })
      .eq('id', suggestion_id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateError || !updatedSuggestion) {
      console.error('Cooked update error:', updateError);
      return NextResponse.json({ error: 'Failed to update recipe suggestion status' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        recipe: updatedSuggestion,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/recipes/cooked error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update recipe status' },
      { status: 500 }
    );
  }
}
