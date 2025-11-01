import { NextRequest, NextResponse } from 'next/server';
import { runETL } from '@/lib/etl';

// Protect this endpoint in production (add authentication)
export async function POST(request: NextRequest) {
  try {
    // Optional: Add API key authentication here
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ETL_API_KEY;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { stateCode, financialYear, month } = body;

    console.log('Manual ETL trigger:', { stateCode, financialYear, month });

    const result = await runETL(stateCode, financialYear, month);

    return NextResponse.json({
      success: true,
      message: 'ETL completed successfully',
      result,
    });
  } catch (error: any) {
    console.error('ETL Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
