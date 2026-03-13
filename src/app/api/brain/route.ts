import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const tags = searchParams.get('tags');

  let query = supabase.from('brain_entries').select('*');

  if (category) {
    query = query.eq('category', category);
  }

  if (tags) {
    const tagList = tags.split(',');
    query = query.contains('tags', tagList);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { category, title, content, metadata, tags } = body;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('brain_entries')
    .insert({
      category: category || 'memory',
      title,
      content: content || null,
      metadata: metadata || {},
      tags: tags || [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
