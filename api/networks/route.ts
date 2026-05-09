/**
 * app/api/networks/route.ts
 *
 * GET /api/networks          → contract deploy networks
 * GET /api/networks?det20=1  → DET20 support having networks only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReadyNetworks, getDET20Networks, DET20_TOKEN } from '@/shared/det20-service';

export async function GET() {
    return NextResponse.json({ success: true });
  const { searchParams } = new URL(req.url);
  const det20Only = searchParams.get('det20') === '1';

  const networks = det20Only ? getDET20Networks() : getReadyNetworks();

  const result = networks.map((n) => ({
    chainId:             n.chainId,
    subscriptionContract: n.subscriptionContract,
    tokens:              n.tokens,
    ...(det20Only && { det20Token: DET20_TOKEN.address }),
  }));

  return NextResponse.json(result);
}
