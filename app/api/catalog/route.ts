import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { filterSeedCatalogItems, normalizeCatalogLimit, type CatalogItem } from '@/lib/catalog';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');
  const category = searchParams.get('category');
  const limit = normalizeCatalogLimit(searchParams.get('limit'));

  try {
    const supabase = createClient();
    let query = supabase
      .from('catalog_items')
      .select('id,name,category,default_unit', { count: 'exact' })
      .order('name', { ascending: true })
      .range(0, limit - 1);

    if (q?.trim()) {
      query = query.ilike('name', `%${q.trim()}%`);
    }

    if (category?.trim()) {
      query = query.eq('category', category.trim());
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const items = (data ?? []) as CatalogItem[];

    if (items.length === 0) {
      return NextResponse.json(filterSeedCatalogItems({ q, category, limit }));
    }

    return NextResponse.json({
      items,
      total: count ?? items.length
    });
  } catch {
    const fallback = filterSeedCatalogItems({ q, category, limit });

    return NextResponse.json(fallback);
  }
}
