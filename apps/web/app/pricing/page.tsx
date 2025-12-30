'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Star } from 'lucide-react';


// Pay-as-you-go pricing: $1 per 1 million requests = $0.000001 per request
const COST_PER_REQUEST = 0.000001;

// Pay-as-you-go pricing examples
const pricingExamples = [
  {
    requests: 1000000, // 1M requests = $1
    description: 'Perfect for small applications',
  },
  {
    requests: 10000000, // 10M requests = $10
    description: 'Growing applications',
  },
  {
    requests: 100000000, // 100M requests = $100
    description: 'Medium to large applications',
  },
  {
    requests: 1000000000, // 1B requests = $1,000
    description: 'Enterprise scale',
  },
];

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

function formatCost(cost: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cost);
}

export default function PricingPage() {
  const [monthlyRequests, setMonthlyRequests] = useState(1000000);
  const [estimatedCost, setEstimatedCost] = useState(1.00);

  useEffect(() => {
    const cost = monthlyRequests * COST_PER_REQUEST;
    setEstimatedCost(cost);
  }, [monthlyRequests]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setMonthlyRequests(value);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-heading text-xl font-semibold text-primary">pokt.ai</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </Link>

            <Link href="/api/auth/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/api/auth/login">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-heading text-5xl md:text-6xl font-bold text-primary mb-6">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
          Pay only for what you use. No hidden fees, no monthly commitments.
        </p>
        <div className="mt-8 mb-8">
          <div className="inline-flex flex-col items-center space-y-2 bg-primary/10 px-8 py-4 rounded-lg">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-primary">$1</span>
              <span className="text-lg text-muted-foreground">per 1M requests</span>
            </div>
            <span className="text-sm text-muted-foreground">($0.000001 per request)</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Scale from 1,000 to millions of requests. No limits, no tiers, just simple pay-as-you-go pricing.
        </p>
      </section>

      {/* Pricing Examples */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-primary mb-4">
            Pricing Examples
          </h2>
          <p className="text-lg text-muted-foreground">
            See how much you'll pay based on your usage
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {pricingExamples.map((example, index) => {
            const cost = example.requests * COST_PER_REQUEST;
            return (
              <Card key={index} className="border-2 hover:border-primary transition-colors">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-primary mb-2">
                    {formatNumber(example.requests)}
                  </CardTitle>
                  <CardDescription className="text-base">
                    requests/month
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold mb-2">{formatCost(cost)}</div>
                  <p className="text-sm text-muted-foreground">{example.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pricing Calculator */}
        <Card className="max-w-2xl mx-auto border-2">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Calculate Your Cost</CardTitle>
            <CardDescription className="text-center">
              Enter your expected monthly requests to see your estimated cost
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="monthlyRequests" className="text-sm font-medium mb-2 block">
                  Monthly Requests
                </label>
                <input
                  type="number"
                  id="monthlyRequests"
                  placeholder="e.g., 1000000"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={monthlyRequests}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {formatCost(estimatedCost)}
                </div>
                <p className="text-sm text-muted-foreground">per month</p>
                <p className="text-xs text-muted-foreground mt-2">
                  $1 per 1M requests (${COST_PER_REQUEST.toFixed(6)} per request)
                </p>
              </div>
              <Link href="/api/auth/login" className="block">
                <Button className="w-full" size="lg">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* What's Included */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-primary mb-4">
            Everything Included
          </h2>
          <p className="text-lg text-muted-foreground">
            All features included with every request. No tiers, no limits.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-semibold">Unlimited Endpoints</span>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Create as many endpoints as you need
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-semibold">All 27+ Blockchains</span>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Access to all supported networks
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-semibold">Real-time Analytics</span>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Comprehensive usage and performance metrics
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-semibold">99.9% Uptime SLA</span>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Enterprise-grade reliability
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-semibold">Priority Support</span>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Fast response times for all users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-semibold">API Access</span>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                RESTful API with full documentation
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-semibold">Custom Rate Limits</span>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Configure limits per endpoint
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-semibold">Webhook Notifications</span>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Real-time event notifications
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-semibold">No Credit Card Required</span>
              </div>
              <p className="text-sm text-muted-foreground ml-8">
                Start free, pay only for what you use
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Additional Info */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl font-bold text-primary mb-4">
            Everything you need to scale
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Additional features and benefits included with all plans
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Global Network</h3>
            <p className="text-sm text-muted-foreground">
              Powered by Pocket Network's decentralized infrastructure
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-semibold mb-2">99.9% Uptime</h3>
            <p className="text-sm text-muted-foreground">
              Enterprise-grade reliability and availability
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Real-time Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive insights and performance metrics
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Developer Tools</h3>
            <p className="text-sm text-muted-foreground">
              SDKs, documentation, and developer support
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of developers building the future of Web3 with pokt.ai
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/api/auth/login">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-white !text-white !bg-transparent hover:!bg-white hover:!text-primary">
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="font-heading text-lg font-semibold text-primary">pokt.ai</span>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/docs" className="hover:text-foreground transition-colors">
                Documentation
              </Link>
              <Link href="/changelog" className="hover:text-foreground transition-colors">
                Changelog
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} pokt.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
