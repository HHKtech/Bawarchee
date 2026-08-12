import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    items: [],
    message: 'Public catalog endpoint placeholder. Module 3 will implement item catalog search.'
  });
}
