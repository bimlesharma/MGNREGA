import { NextResponse } from 'next/server';
import { setupCronJobs } from '@/lib/cron';

export async function GET() {
  try {
    setupCronJobs();
    return NextResponse.json({ success: true, message: 'Cron jobs initialized' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
