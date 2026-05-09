/**
 * app/api/webhooks/cryptopay/route.ts
 *
 * POST /api/webhooks/cryptopay  → CryptoPay events receive చేస్తుంది
 *
 * CryptoPay dashboard లో webhook URL:
 *   https://yourdomain.com/api/webhooks/cryptopay
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true
  }); 
}
import { createHmac, timingSafeEqual } from 'crypto';

// ── Signature verification ────────────────────────────────────────────────────

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return true; // If no secret is configured, skip verification

  if (!signature) return false;

  const expected = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  try {
    return timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expected,  'utf8')
    );
  } catch {
    return false;
  }
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleWebhookEvent(eventType: string, payload: any): Promise<void> {
  console.log(`[Webhook] Event: ${eventType}`, JSON.stringify(payload, null, 2));

  switch (eventType) {

    case 'subscription.payment.success':
    case 'payment.success': {
      const { subscriptionId, amount, token, txHash } = payload;
      console.log(`[Webhook] ✅ Payment success — sub: ${subscriptionId}, amount: ${amount} ${token?.symbol}, tx: ${txHash}`);
      // TODO: Mark subscription as paid in DB, extend access, send receipt email
      break;
    }

    case 'subscription.payment.failed':
    case 'payment.failed': {
      const { subscriptionId, reason } = payload;
      console.warn(`[Webhook] ❌ Payment failed — sub: ${subscriptionId}, reason: ${reason}`);
      // TODO: Send dunning email, add retry logic, suspend access if needed
      break;
    }

    case 'subscription.created': {
      const { subscriptionId, planCode } = payload;
      console.log(`[Webhook] 🆕 New subscription — sub: ${subscriptionId}, plan: ${planCode}`);
      // TODO: Provision access, send welcome email, update CRM
      break;
    }

    case 'subscription.cancelled': {
      const { subscriptionId } = payload;
      console.log(`[Webhook] 🚫 Cancelled — sub: ${subscriptionId}`);
      // TODO: Revoke access at period end, send cancellation confirmation
      break;
    }

    case 'subscription.updated': {
      const { subscriptionId, newAmount, newInterval } = payload;
      console.log(`[Webhook] 🔄 Updated — sub: ${subscriptionId}, amount: ${newAmount}, interval: ${newInterval}`);
      // TODO: Reflect the updated plan values in your database
      break;
    }

    case 'det20.reward.issued': {
      console.log('[Webhook] 🎁 DET20 reward issued', payload);
      // TODO: Handle DET20 token reward distribution
      break;
    }

    default:
      console.warn(`[Webhook] Unknown event: ${eventType}`);
  }
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Read raw body as text for HMAC signature verification
  const rawBody  = await req.text();
  const signature = req.headers.get('x-cryptopay-signature');

  if (!verifySignature(rawBody, signature)) {
    console.error('[Webhook] ❌ Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Send 200 immediately — CryptoPay expects a fast response
  // Process the event asynchronously after acknowledging receipt
  handleWebhookEvent(
    event.type ?? event.event,
    event.data  ?? event
  ).catch((err) => console.error('[Webhook] Handler error:', err));

  return NextResponse.json({ received: true }, { status: 200 });
}
