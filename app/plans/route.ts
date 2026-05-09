/**
 * app/api/plans/route.ts
 *
 * GET  /api/plans        → plan list
 * POST /api/plans        → new plan create
 * POST /api/plans/det20  → DET20 native plan create (body lo { native: true } పంపండి)
 */

import { NextRequest, NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({
    success: true
  });
}
import { getPaymentService } from '@/shared/det20-service';

// ── GET /api/plans ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page  = Number(searchParams.get('page'))  || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const service = await getPaymentService();
    const result  = await service.client.listPlans({ page, limit });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[GET /api/plans]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST /api/plans ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body    = await req.json();
    const service = await getPaymentService();

    let plan;

    // If native: true is in the body, create a DET20 native plan
    if (body.native) {
      plan = await service.createNativeDET20Plan(body);
    } else {
      plan = await service.createDET20Plan(body);
    }

    const payUrl = service.getPayUrl(plan.planCode);
    return NextResponse.json({ plan, payUrl }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/plans]', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
