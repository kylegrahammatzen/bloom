import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AutumnCustomerResponse } from '@bloom/core';

export const AccountSubscription = async () => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');

  let customer: AutumnCustomerResponse | null = null;

  try {
    customer = await auth.api.autumn?.getCustomer({
      headers: { cookie: cookieHeader },
    }) || null;
  } catch (error) {
    console.log('[AccountSubscription] Failed to fetch customer:', error);
    return null;
  }

  if (!customer) {
    console.log('[AccountSubscription] No customer data returned from Autumn');
    return null;
  }

  return (
    <Card className="flex flex-col max-w-3xl">
      <CardContent className="flex-1 pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Plan</span>
            <Badge>{customer.plan || 'Free'}</Badge>
          </div>

          {customer.usage && Object.keys(customer.usage).length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Usage</span>
              <div className="space-y-1">
                {Object.entries(customer.usage).map(([feature, data]) => (
                  <div key={feature} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {feature.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono">
                      {data.used || 0} / {data.limit || 'Unlimited'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Manage Billing
        </Button>
      </CardFooter>
    </Card>
  );
};
