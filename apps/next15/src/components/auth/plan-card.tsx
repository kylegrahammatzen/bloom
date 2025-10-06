'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { upgradeProduct, cancelSubscription, reactivateSubscription } from '@/app/actions/autumn';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

type PlanCardProps = {
  id: string;
  name: string;
  price: number;
  features: Array<{
    name: string;
    limit: number | string;
    id: string;
  }>;
  status: 'current' | 'scheduled' | 'canceled' | 'available';
  canceledAt?: number | null;
  currentPrice: number;
  currentProductId: string;
  usage?: Record<string, {
    used: number;
    limit?: number;
    remaining?: number;
  }>;
  successUrl: string;
}

export const PlanCard = (props: PlanCardProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isUpgrade = props.price > props.currentPrice;
  const isDowngrade = props.price < props.currentPrice;

  const getButtonText = () => {
    if (props.status === 'canceled') return 'Reactivate';
    if (props.status === 'scheduled') return isUpgrade ? 'Upgrade' : 'Downgrade';
    return isUpgrade ? 'Upgrade' : 'Downgrade';
  };

  const handleChangePlan = () => {
    startTransition(async () => {
      try {
        if (props.status === 'canceled') {
          // Reactivate canceled subscription
          const url = await reactivateSubscription(props.id, props.successUrl);
          router.push(url);
        } else if (props.price === 0) {
          // Downgrading to free, cancel current subscription
          await cancelSubscription(props.currentProductId);
          router.push(props.successUrl);
        } else {
          // Otherwise use checkout for upgrade/change
          const url = await upgradeProduct(props.id, props.successUrl);
          router.push(url);
        }
      } catch (error) {
        console.error('Failed to change plan:', error);
      }
    });
  };

  return (
    <Card className="flex flex-col max-w-sm">
      <CardHeader>
        <CardTitle>{props.name}</CardTitle>
        <div className="text-2xl font-bold">
          ${props.price}/mo
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          <div className="text-sm font-medium">Features</div>
          <ul className="space-y-2">
            {props.features.map((feature) => {
              const isActive = props.status === 'current' || props.status === 'canceled';
              const usage = isActive ? props.usage?.[feature.id] : null;
              const showUsage = usage !== undefined && usage !== null;

              return (
                <li key={feature.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{feature.name}</span>
                    <span className="font-mono text-xs">
                      {showUsage ? `${usage.used} / ${feature.limit}` : feature.limit}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant={
            props.status === 'current' ? 'secondary' :
            props.status === 'scheduled' ? 'secondary' :
            isDowngrade ? 'outline' : 'default'
          }
          size="sm"
          className="w-full"
          onClick={handleChangePlan}
          disabled={isPending || props.status === 'scheduled' || props.status === 'current'}
        >
          {isPending ? 'Loading...' :
           props.status === 'current' ? 'Current Plan' :
           props.status === 'scheduled' ? 'Scheduled' :
           getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
};
