// Google Analytics utility functions
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track custom events for pokt.ai
export const trackEndpointCreated = (endpointName: string, chainId: string) => {
  event({
    action: 'endpoint_created',
    category: 'engagement',
    label: `${endpointName} (${chainId})`,
  });
};

export const trackEndpointUsed = (endpointId: string, method: string) => {
  event({
    action: 'endpoint_used',
    category: 'engagement',
    label: `${endpointId} - ${method}`,
  });
};

export const trackUserSignup = (plan: string) => {
  event({
    action: 'sign_up',
    category: 'engagement',
    label: plan,
  });
};

export const trackUserLogin = () => {
  event({
    action: 'login',
    category: 'engagement',
  });
};

export const trackBillingEvent = (eventName: string, plan: string) => {
  event({
    action: eventName,
    category: 'billing',
    label: plan,
  });
};








