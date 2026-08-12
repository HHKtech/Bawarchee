import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractItemsFromReceipt } from '@/lib/gemini';
import { ReceiptItemExtracted, ScanReceiptResponse } from '@/lib/receipt-api-types';
import catalogSeed from '@/lib/catalog-seed.json';

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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided in request' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'image/jpeg';

    // 1. Upload receipt image to Supabase Storage 'receipts' bucket (with fallback URL if bucket/upload unavailable)
    const fileExt = file.name.split('.').pop() || 'jpg';
    const storagePath = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    let imageUrl = '';

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(storagePath, buffer, { contentType: mimeType, upsert: true });

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(storagePath);
      imageUrl = publicUrlData.publicUrl;
    } else {
      // Fallback placeholder image URL if storage bucket is not configured yet
      imageUrl = `/uploads/receipts/${storagePath}`;
    }

    // 2. Call Gemini extraction helper
    const rawExtractedItems = await extractItemsFromReceipt(buffer, mimeType);

    // 3. Load catalog items for fuzzy matching
    let catalogItems: Array<{ id?: string; name: string; category: string; default_unit: string }> = [];
    const { data: dbCatalog } = await (supabase.from('catalog_items') as any).select('*');

    if (dbCatalog && (dbCatalog as any[]).length > 0) {
      catalogItems = dbCatalog as any[];
    } else {
      catalogItems = catalogSeed.map((item, idx) => ({
        id: `seed-${idx}`,
        name: item.name,
        category: item.category,
        default_unit: item.default_unit,
      }));
    }

    // 4. Perform fuzzy matching against catalog
    const matchedItems: ReceiptItemExtracted[] = rawExtractedItems.map((rawItem) => {
      const suggested = (rawItem as any).suggested_name
  ? (rawItem as any).suggested_name.toLowerCase().trim()
  : rawItem.raw_text.toLowerCase().trim();
      // const suggested = rawItem.suggested_name.toLowerCase().trim();
      const rawText = rawItem.raw_text.toLowerCase().trim();

      let matched = catalogItems.find((c) => c.name.toLowerCase() === rawText);

      if (!matched) {
        matched = catalogItems.find(
          (c) => rawText.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(rawText)
        );
      }

      if (matched) {
        return {
          raw_text: rawItem.raw_text,
          item_name: matched.name,
          catalog_item_id: matched.id && !matched.id.startsWith('seed-') ? matched.id : null,
          category: matched.category,
          quantity: rawItem.quantity,
          unit: rawItem.unit || matched.default_unit,
          confidence: 0.85,
        };
      }

      return {
        raw_text: rawItem.raw_text,
        item_name: rawItem.raw_text,
        catalog_item_id: null,
        category: 'Other',
        quantity: rawItem.quantity,
        unit: rawItem.unit || 'pcs',
        confidence: 0.5,
      };
    });

    // 5. Insert scan record and scan items into DB
    let scanId = crypto.randomUUID();

    const { data: scanRow } = await (supabase.from('receipt_scans') as any)
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        status: 'pending',
      })
      .select('id')
      .single();

    if (scanRow?.id) {
      scanId = scanRow.id;

      await (supabase.from('receipt_scan_items') as any).insert(
        matchedItems.map((item) => ({
          scan_id: scanId,
          raw_text: item.raw_text,
          matched_catalog_item_id: item.catalog_item_id,
          suggested_name: item.item_name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          confidence: item.confidence,
        }))
      );
    }

    const responsePayload: ScanReceiptResponse = {
      scan_id: scanId,
      image_url: imageUrl,
      items: matchedItems,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error('POST /api/receipt/scan error:', error);
    return NextResponse.json({ error: 'Failed to scan receipt image' }, { status: 500 });
  }
}
