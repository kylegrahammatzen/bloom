// Define features
export const messages = {
  id: 'messages',
  name: 'Messages',
  type: 'single_use',
};

export const aiTokens = {
  id: 'ai_tokens',
  name: 'AI Tokens',
  type: 'single_use',
};

export const advancedAnalytics = {
  id: 'advanced_analytics',
  name: 'Advanced Analytics',
  type: 'boolean',
};

// Define products
export const free = {
  id: 'free',
  name: 'Free',
  is_default: true,
  items: [
    // 100 messages per month
    {
      feature_id: messages.id,
      included_usage: 100,
      interval: 'month',
    },
    // 1000 AI tokens per month
    {
      feature_id: aiTokens.id,
      included_usage: 1000,
      interval: 'month',
    },
  ],
};

export const pro = {
  id: 'pro',
  name: 'Pro',
  items: [
    // $20 per month
    {
      price: 20,
      interval: 'month',
    },
    // 1000 messages per month
    {
      feature_id: messages.id,
      included_usage: 1000,
      interval: 'month',
    },
    // 10000 AI tokens per month
    {
      feature_id: aiTokens.id,
      included_usage: 10000,
      interval: 'month',
    },
    // Advanced analytics (boolean feature)
    {
      feature_id: advancedAnalytics.id,
    },
  ],
};

export const features = [messages, aiTokens, advancedAnalytics];
export const products = [free, pro];
