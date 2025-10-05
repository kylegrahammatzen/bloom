import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());

    let result;

    switch (body.action) {
      case 'check':
        result = await auth.api.autumn?.check({
          headers,
          body: { featureId: body.featureId, productId: body.productId },
        });
        break;

      case 'track':
        result = await auth.api.autumn?.track({
          headers,
          body: { featureId: body.featureId, value: body.value },
        });
        break;

      case 'checkout':
        result = await auth.api.autumn?.checkout({
          headers,
          body: {
            productId: body.productId,
            successUrl: body.successUrl,
            cancelUrl: body.cancelUrl,
          },
        });
        break;

      case 'getCustomer':
        result = await auth.api.autumn?.getCustomer({ headers });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.status || 500 }
    );
  }
}
