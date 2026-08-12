import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ConfirmReceiptRequest, ConfirmReceiptResponse } from '@/lib/receipt-api-types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: ConfirmReceiptRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { scan_id, confirmed_items } = body;

    if (!scan_id || !Array.isArray(confirmed_items) || confirmed_items.length === 0) {
      return NextResponse.json(
        { error: 'Provide a valid scan_id and non-empty confirmed_items array' },
        { status: 400 }
      );
    }

    // 1. Update receipt scan status to confirmed
    await (supabase.from('receipt_scans') as any)
      .update({ status: 'confirmed' })
      .eq('id', scan_id)
      .eq('user_id', user.id);

    // 2. Post / merge items directly into user's public.inventory_items using Module 4 merge logic
    let addedCount = 0;

    for (const item of confirmed_items) {
      const itemName = (item.item_name || '').toLowerCase().trim();
      const unit = (item.unit || 'pcs').trim();
      const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
      const category = (item.category || 'Other').trim();
      const catalogItemId = item.catalog_item_id && !item.catalog_item_id.startsWith('seed-') ? item.catalog_item_id : null;

      if (!itemName || !unit) {
        continue;
      }

      // Check existing row in inventory
      const { data: existingRow } = await (supabase.from('inventory_items') as any)
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('item_name', itemName)
        .eq('unit', unit)
        .maybeSingle();

      if (existingRow) {
        // Merge quantities
        await (supabase.from('inventory_items') as any)
          .update({
            quantity: Number(existingRow.quantity) + quantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRow.id)
          .eq('user_id', user.id);
      } else {
        // Insert new row
        await (supabase.from('inventory_items') as any).insert({
          user_id: user.id,
          catalog_item_id: catalogItemId,
          item_name: itemName,
          category,
          quantity,
          unit,
          added_via: 'receipt',
        });
      }

      addedCount += 1;
    }

    const responsePayload: ConfirmReceiptResponse = {
      success: true,
      added_items_count: addedCount,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error('POST /api/receipt/confirm error:', error);
    return NextResponse.json({ error: 'Failed to confirm receipt scan' }, { status: 500 });
  }
}
