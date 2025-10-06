'use server';

import { auth } from '@/lib/auth';
import { getCookieHeader } from '@bloom/adapters/nextjs/server';
import type { AutumnEntity } from '@bloom/core';

/**
 * Server action to send a message with feature gating and usage tracking
 */
export async function sendMessage(message: string) {
  const cookie = await getCookieHeader();

  const result = await auth.api.autumn?.check({
    headers: { cookie },
    body: { featureId: 'messages' },
  });

  if (!result?.data.allowed) {
    throw new Error('Message limit reached. Please upgrade to continue.');
  }

  // Send the message (simulated)
  console.log('Sending message:', message);

  await auth.api.autumn?.track({
    headers: { cookie },
    body: { featureId: 'messages', value: 1 },
  });

  return { success: true };
}

/**
 * Server action to use AI tokens with feature gating and usage tracking
 */
export async function useAITokens(tokenCount: number) {
  const cookie = await getCookieHeader();

  const result = await auth.api.autumn?.check({
    headers: { cookie },
    body: { featureId: 'ai_tokens' },
  });

  if (!result?.data.allowed) {
    throw new Error('AI token limit reached. Please upgrade to continue.');
  }

  if (result.data.remaining !== undefined && result.data.remaining < tokenCount) {
    throw new Error(`Insufficient tokens. Required: ${tokenCount}, Available: ${result.data.remaining}`);
  }

  // Use the AI tokens (simulated)
  console.log('Using AI tokens:', tokenCount);

  await auth.api.autumn?.track({
    headers: { cookie },
    body: { featureId: 'ai_tokens', value: tokenCount },
  });

  return { success: true };
}

/**
 * Server action to upgrade/purchase product (creates Stripe checkout)
 */
export async function upgradeProduct(productId: string, successUrl: string) {
  const cookie = await getCookieHeader();

  const result = await auth.api.autumn?.checkout({
    headers: { cookie },
    body: { productId, successUrl },
  });

  if (!result?.url) {
    throw new Error('Failed to create checkout session');
  }

  return result.url;
}

/**
 * Server action to get billing portal URL
 */
export async function getBillingPortalUrl(returnUrl: string) {
  const cookie = await getCookieHeader();

  const result = await auth.api.autumn?.getBillingPortal({
    headers: { cookie },
    body: { returnUrl },
  });

  if (!result?.url) {
    throw new Error('Failed to get billing portal URL');
  }

  return result.url;
}

/**
 * Server action to cancel subscription
 */
export async function cancelSubscription(productId?: string) {
  const cookie = await getCookieHeader();

  await auth.api.autumn?.cancel({
    headers: { cookie },
    body: { productId },
  });

  return { success: true };
}

/**
 * Server action to create entity (seat, workspace, etc.)
 */
export async function createEntity(entities: AutumnEntity[] | AutumnEntity) {
  const cookie = await getCookieHeader();

  return await auth.api.autumn?.createEntity({
    headers: { cookie },
    body: { entities },
  });
}

/**
 * Server action to query usage data
 */
export async function queryUsage(featureId?: string, startDate?: string, endDate?: string) {
  const cookie = await getCookieHeader();

  return await auth.api.autumn?.query({
    headers: { cookie },
    body: { featureId, startDate, endDate },
  });
}

/**
 * Server action to get customer data
 */
export async function getCustomerData() {
  const cookie = await getCookieHeader();

  return await auth.api.autumn?.getCustomer({
    headers: { cookie },
  });
}
