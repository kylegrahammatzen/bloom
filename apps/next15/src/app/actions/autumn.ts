'use server';

import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';

/**
 * Server action to send a message with feature gating and usage tracking
 */
export async function sendMessage(message: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  // Check if user has access to messages feature
  const { data } = await auth.api.autumn?.check({
    headers: { cookie: cookieHeader },
    body: { featureId: 'messages' },
  }) || { data: { allowed: false } };

  if (!data.allowed) {
    throw new Error('Message limit reached. Please upgrade to continue.');
  }

  // Send the message (simulated)
  console.log('Sending message:', message);

  // Track usage
  await auth.api.autumn?.track({
    headers: { cookie: cookieHeader },
    body: { featureId: 'messages', value: 1 },
  });

  return { success: true };
}

/**
 * Server action to use AI tokens with feature gating and usage tracking
 */
export async function useAITokens(tokenCount: number) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  // Check if user has enough AI tokens
  const { data } = await auth.api.autumn?.check({
    headers: { cookie: cookieHeader },
    body: { featureId: 'ai_tokens' },
  }) || { data: { allowed: false } };

  if (!data.allowed) {
    throw new Error('AI token limit reached. Please upgrade to continue.');
  }

  if (data.remaining !== undefined && data.remaining < tokenCount) {
    throw new Error(`Insufficient tokens. Required: ${tokenCount}, Available: ${data.remaining}`);
  }

  // Use the AI tokens (simulated)
  console.log('Using AI tokens:', tokenCount);

  // Track usage
  await auth.api.autumn?.track({
    headers: { cookie: cookieHeader },
    body: { featureId: 'ai_tokens', value: tokenCount },
  });

  return { success: true };
}

/**
 * Server action to create a checkout session for upgrading
 */
export async function upgradeToProPlan() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  const result = await auth.api.autumn?.checkout({
    headers: { cookie: cookieHeader },
    body: {
      productId: 'pro',
      successUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard?upgraded=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/pricing`,
    },
  });

  if (!result?.url) {
    throw new Error('Failed to create checkout session');
  }

  return { checkoutUrl: result.url };
}

/**
 * Server action to get customer data
 */
export async function getCustomerData() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  const customer = await auth.api.autumn?.getCustomer({
    headers: { cookie: cookieHeader },
  });

  return customer;
}

/**
 * Server action to attach product (upgrade/downgrade)
 */
export async function attachProduct(productId: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  const result = await auth.api.autumn?.attach({
    headers: { cookie: cookieHeader },
    body: {
      productId,
      successUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/dashboard?upgraded=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/pricing`,
    },
  });

  if (!result) {
    throw new Error('Failed to attach product');
  }

  return result;
}

/**
 * Server action to cancel subscription
 */
export async function cancelSubscription(productId?: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  await auth.api.autumn?.cancel({
    headers: { cookie: cookieHeader },
    body: { productId },
  });

  return { success: true };
}

/**
 * Server action to get billing portal URL
 */
export async function getBillingPortalUrl() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  const result = await auth.api.autumn?.getBillingPortal({
    headers: { cookie: cookieHeader },
    body: {
      returnUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/settings/billing`,
    },
  });

  if (!result?.url) {
    throw new Error('Failed to get billing portal URL');
  }

  return { url: result.url };
}

/**
 * Server action to create entity (seat, workspace, etc.)
 */
export async function createEntity(entityFeatureId: string, data?: Record<string, any>) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  const entity = await auth.api.autumn?.createEntity({
    headers: { cookie: cookieHeader },
    body: {
      entityFeatureId,
      data,
    },
  });

  return entity;
}

/**
 * Server action to query usage data
 */
export async function queryUsage(featureId?: string, startDate?: string, endDate?: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  const result = await auth.api.autumn?.query({
    headers: { cookie: cookieHeader },
    body: {
      featureId,
      startDate,
      endDate,
    },
  });

  return result;
}
