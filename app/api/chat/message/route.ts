import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processChatRefinement } from '@/lib/gemini';

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
    const { session_id, message } = await request.json();

    if (!session_id || !message) {
      return NextResponse.json({ error: 'Missing session_id or message' }, { status: 400 });
    }

    // Verify session ownership
    const { data: session, error: sessionErr } = await (supabase as any)
      .from('recipe_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionErr || !session) {
      console.error('Session error or not found:', sessionErr);
      return NextResponse.json({ error: 'Recipe session not found' }, { status: 404 });
    }

    // Save user message in DB
    const { data: userMsgRow, error: userMsgErr } = await (supabase as any)
      .from('chat_messages')
      .insert({
        session_id,
        user_id: user.id,
        role: 'user',
        content: message.trim(),
      })
      .select('*')
      .single();

    if (userMsgErr || !userMsgRow) {
      console.error('Failed to save user message:', userMsgErr);
      return NextResponse.json({ error: 'Failed to save user message' }, { status: 500 });
    }

    // Fetch conversation history prior to the current user message
    const { data: historyMessages } = await (supabase as any)
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .lt('created_at', userMsgRow.created_at)
      .order('created_at', { ascending: true });

    // Fetch details needed for Gemini context
    const [profileRes, selectedItemsRes, fullInventoryRes, familyMembersRes, suggestionsRes] = await Promise.all([
      (supabase.from('profiles') as any).select('*').eq('id', user.id).single(),
      (supabase.from('inventory_items') as any).select('*').in('id', session.selected_inventory_item_ids).eq('user_id', user.id),
      (supabase.from('inventory_items') as any).select('*').eq('user_id', user.id),
      (supabase.from('family_members') as any).select('*').eq('user_id', user.id),
      (supabase.from('recipe_suggestions') as any).select('*').eq('session_id', session_id).eq('user_id', user.id),
    ]);

    const profile = profileRes.data;
    const selectedItems = selectedItemsRes.data || [];
    const fullInventory = fullInventoryRes.data || [];
    const familyMembers = familyMembersRes.data || [];
    const currentRecipes = suggestionsRes.data || [];

    // Format profile parameters for AI
    const profileParams = {
      dietary_restrictions: profile?.dietary_restrictions || [],
      allergies: profile?.allergies || '',
      cuisine_preference: profile?.cuisine_preference || [],
      cooking_skill: profile?.cooking_skill || 'beginner',
      household_size: profile?.household_size || (familyMembers.length + 1),
    };

    // Call Gemini chat refinement engine
    const chatResult = await processChatRefinement({
      history: (historyMessages || []).map((m: any) => ({ role: m.role, content: m.content })),
      latestMessage: message.trim(),
      recipes: currentRecipes,
      profile: profileParams,
      exclusions: session.exclusions || [],
      selectedItems: selectedItems.map((item: any) => ({
        item_name: item.item_name,
        quantity: Number(item.quantity),
        unit: item.unit,
      })),
      fullInventory: fullInventory.map((item: any) => ({
        item_name: item.item_name,
        quantity: Number(item.quantity),
        unit: item.unit,
      })),
    });

    // Save assistant message in DB
    const { data: assistantMsgRow, error: assistantMsgErr } = await (supabase as any)
      .from('chat_messages')
      .insert({
        session_id,
        user_id: user.id,
        role: 'assistant',
        content: chatResult.message,
      })
      .select('*')
      .single();

    if (assistantMsgErr || !assistantMsgRow) {
      console.error('Failed to save assistant message:', assistantMsgErr);
      return NextResponse.json({ error: 'Failed to save assistant response' }, { status: 500 });
    }

    let updatedExclusions: string[] | undefined = undefined;
    let insertedSuggestions: any[] | undefined = undefined;

    // Apply new exclusions if detected
    if (chatResult.newExclusions && chatResult.newExclusions.length > 0) {
      const mergedExclusions = Array.from(
        new Set([
          ...(session.exclusions || []),
          ...chatResult.newExclusions.map((e) => e.toLowerCase().trim()),
        ])
      );
      
      const { error: updateExclusionErr } = await (supabase as any)
        .from('recipe_sessions')
        .update({ exclusions: mergedExclusions })
        .eq('id', session_id);

      if (updateExclusionErr) {
        console.error('Failed to update session exclusions:', updateExclusionErr);
      } else {
        updatedExclusions = mergedExclusions;
      }
    }

    // Apply updated recipe suggestions if regenerated
    if (chatResult.updatedRecipes && chatResult.updatedRecipes.length > 0) {
      // Delete old suggestions for this session
      const { error: deleteSuggestionsErr } = await (supabase as any)
        .from('recipe_suggestions')
        .delete()
        .eq('session_id', session_id);

      if (deleteSuggestionsErr) {
        console.error('Failed to delete old recipe suggestions:', deleteSuggestionsErr);
      }

      // Insert new suggestions
      const newSuggestionsPayload = chatResult.updatedRecipes.map((recipe) => ({
        session_id,
        user_id: user.id,
        title: recipe.title,
        ingredients_used: recipe.ingredients_used,
        steps: recipe.steps,
        est_time_minutes: recipe.est_time_minutes,
        est_calories: recipe.est_calories,
        serves: recipe.serves,
        status: 'suggested' as const,
      }));

      const { data: insertedRows, error: insertSuggestionsErr } = await (supabase as any)
        .from('recipe_suggestions')
        .insert(newSuggestionsPayload)
        .select('*');

      if (insertSuggestionsErr) {
        console.error('Failed to insert new recipe suggestions:', insertSuggestionsErr);
      } else {
        insertedSuggestions = insertedRows;
      }
    }

    return NextResponse.json(
      {
        message: assistantMsgRow,
        updatedExclusions,
        updatedRecipes: insertedSuggestions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/chat/message error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}
