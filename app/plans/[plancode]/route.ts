/**
 * app/api/plans/[planCode]/route.ts
 *
 * GET    /api/plans/:planCode  → plan details + pay URL
 * DELETE /api/plans/:planCode  → plan cancel
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentService } from '@/shared/det20-backend';

// ── GET /api/plans/:planCode ──────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { planCode: string } }
) {
  try {
    const service = await getPaymentService();
    const result  = await service.getPlanWithUrl(params.planCode);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error(`[GET /api/plans/${params.planCode}]`, err.message);
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

// ── DELETE /api/plans/:planCode ───────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { planCode: string } }
) {
  try {
    const service = await getPaymentService();
    const result  = await service.client.cancelPlan(params.planCode);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error(`[DELETE /api/plans/${params.planCode}]`, err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
