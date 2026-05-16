import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST() {
  revalidateTag('collections', 'max')
  revalidateTag('static-data', 'max')
  return NextResponse.json({ revalidated: true })
}
