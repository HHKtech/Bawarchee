import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { InventoryAddItemPayload } from '@/lib/inventory-api-types';
import type { InventoryAddedVia } from '@/lib/supabase/types';

const addedViaValues: InventoryAddedVia[] = ['search', 'receipt', 'manual'];

function normalizeQuantity(value: unknown) {
  const quantity = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(quantity) && quantity >= 0 ? quantity : null;
}

function parseAddItems(body: unknown): InventoryAddItemPayload[] | null {
  const data = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const rawItems = Array.isArray(data.items) ? data.items : [];

  const items = rawItems.map((rawItem) => {
    const item = typeof rawItem === 'object' && rawItem !== null ? (rawItem as Record<string, unknown>) : {};
    const itemName = typeof item.item_name === 'string' ? item.item_name.trim() : '';
    const unit = typeof item.unit === 'string' ? item.unit.trim() : '';
    const quantity = normalizeQuantity(item.quantity);
    const addedVia = addedViaValues.includes(item.added_via as InventoryAddedVia) ? (item.added_via as InventoryAddedVia) : 'search';

    if (!itemName || !unit || quantity === null) {
      return null;
    }

    return {
      catalog_item_id: typeof item.catalog_item_id === 'string' && item.catalog_item_id ? item.catalog_item_id : null,
      item_name: itemName.toLowerCase(),
      category: typeof item.category === 'string' && item.category.trim() ? item.category.trim() : 'Other',
      quantity,
      unit,
      added_via: addedVia
    };
  });

  return items.every(Boolean) && items.length > 0 ? (items as InventoryAddItemPayload[]) : null;
}

async function getAuthenticatedSupabase() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedSupabase();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await (supabase.from('inventory_items') as any)
    .select('*')
    .eq('user_id', user.id)
    .order('category', { ascending: true })
    .order('item_name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedSupabase();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let items: InventoryAddItemPayload[] | null;

  try {
    items = parseAddItems(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!items) {
    return NextResponse.json({ error: 'Provide at least one valid inventory item' }, { status: 400 });
  }

  for (const item of items) {
    const { data: existing, error: existingError } = await (supabase.from('inventory_items') as any)
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('item_name', item.item_name)
      .eq('unit', item.unit)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existing) {
      const { error: updateError } = await (supabase.from('inventory_items') as any)
        .update({ quantity: Number(existing.quantity) + item.quantity, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .eq('user_id', user.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      const { error: insertError } = await (supabase.from('inventory_items') as any).insert({ ...item, user_id: user.id });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }
  }

  const { data, error } = await (supabase.from('inventory_items') as any)
    .select('*')
    .eq('user_id', user.id)
    .order('category', { ascending: true })
    .order('item_name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedSupabase();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id : '';
  const quantity = normalizeQuantity(body.quantity);

  if (!id || quantity === null) {
    return NextResponse.json({ error: 'Provide a valid id and non-negative quantity' }, { status: 400 });
  }

  const { data, error } = await (supabase.from('inventory_items') as any)
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedSupabase();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let id = request.nextUrl.searchParams.get('id') ?? '';

  if (!id) {
    try {
      const body = (await request.json()) as { id?: unknown };
      id = typeof body.id === 'string' ? body.id : '';
    } catch {
      // Query-string id is optional; invalid or empty JSON is handled below.
    }
  }

  if (!id) {
    return NextResponse.json({ error: 'Provide an inventory item id' }, { status: 400 });
  }

  const { error } = await (supabase.from('inventory_items') as any).delete().eq('id', id).eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
