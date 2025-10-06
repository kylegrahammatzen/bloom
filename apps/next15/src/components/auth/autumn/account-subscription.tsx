import { auth } from '@/lib/auth';
import { getCookieHeader } from '@bloom/adapters/nextjs/server';
import type { AutumnCustomerResponse } from '@bloom/core';
import { products, features } from '../../../../autumn.config';
import type { Product } from '../../../../autumn.config';
import { PlanCard } from './plan-card';
import { ManageBillingButton } from './manage-billing-button';

export const AccountSubscription = async () => {
  const cookie = await getCookieHeader();

  let customer: AutumnCustomerResponse | null = null;

  try {
    customer = await auth.api.autumn?.getCustomer({
      headers: { cookie },
    }) || null;
  } catch (error) {
    return null;
  }

  if (!customer) {
    return null;
  }

  const activeProduct = customer.products?.find(p => p.status === 'active');
  const currentProductId = activeProduct?.id || 'free';
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

  // Get current price
  const currentProduct = products.find(p => p.id === currentProductId);
  const currentPrice = (currentProduct?.items.find(i => 'price' in i) as any)?.price || 0;

  // Map usage from features - features might be an object, not an array
  const usageMap: Record<string, { used: number; limit?: number; remaining?: number }> = {};
  const featuresArray = Array.isArray(customer.features)
    ? customer.features
    : customer.features ? Object.values(customer.features) : [];

  featuresArray.forEach((f: any) => {
    if (f.id) {
      usageMap[f.id] = {
        used: f.usage || 0,
        limit: f.included_usage || undefined,
        remaining: f.balance || undefined,
      };
    }
  });

  return (
    <div className="space-y-4">
      {activeProduct?.canceled_at && (
        <p className="text-sm text-muted-foreground">
          Current plan cancels {new Date(activeProduct.canceled_at).toLocaleDateString()}
        </p>
      )}
      <ManageBillingButton returnUrl={`${baseUrl}/`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        {products.map((product: Product) => {
          const price = (product.items.find(i => 'price' in i) as any)?.price || 0;

          // Find this product in customer's products
          const customerProduct = customer.products?.find(p => p.id === product.id);
          const isCurrent = product.id === currentProductId;

          // Determine status based on customer product data
          let status: 'current' | 'scheduled' | 'canceled' | 'available';
          if (isCurrent) {
            status = customerProduct?.canceled_at ? 'canceled' : 'current';
          } else if (customerProduct) {
            if (customerProduct.status === 'scheduled') {
              status = 'scheduled';
            } else {
              status = 'available';
            }
          } else {
            status = 'available';
          }

          const featureLimits = product.items
            .filter((item): item is { feature_id: string; included_usage?: number } => 'feature_id' in item)
            .map(item => ({
              name: features.find(f => f.id === item.feature_id)?.name || item.feature_id,
              limit: item.included_usage || 'Included',
              id: item.feature_id,
            }));

          return (
            <PlanCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={price}
              currentPrice={currentPrice}
              currentProductId={currentProductId}
              features={featureLimits}
              status={status}
              canceledAt={customerProduct?.canceled_at}
              usage={usageMap}
              successUrl={`${baseUrl}/`}
            />
          );
        })}
      </div>
    </div>
  );
};
