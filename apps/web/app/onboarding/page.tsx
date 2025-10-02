'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  ArrowRight, 
  Server, 
  Zap, 
  Shield, 
  BarChart3,
  Globe,
  Settings
} from 'lucide-react';

const onboardingSteps = [
  {
    id: 1,
    title: "Welcome to pokt.ai!",
    description: "Let's get you set up with your first RPC endpoint in just a few steps.",
    icon: <CheckCircle className="w-8 h-8 text-green-500" />,
    features: [
      "AI-powered RPC infrastructure",
      "Multi-chain support",
      "Real-time monitoring",
      "Enterprise-grade security"
    ]
  },
  {
    id: 2,
    title: "Create Your First Endpoint",
    description: "Choose a blockchain network and create your first RPC endpoint.",
    icon: <Server className="w-8 h-8 text-blue-500" />,
    features: [
      "Ethereum Mainnet",
      "Polygon",
      "Arbitrum",
      "Optimism",
      "Base",
      "And many more..."
    ]
  },
  {
    id: 3,
    title: "Monitor Your Usage",
    description: "Track your API calls, monitor performance, and manage your endpoints.",
    icon: <BarChart3 className="w-8 h-8 text-purple-500" />,
    features: [
      "Real-time analytics",
      "Usage tracking",
      "Performance metrics",
      "Cost monitoring"
    ]
  },
  {
    id: 4,
    title: "You're All Set!",
    description: "Your pokt.ai account is ready. Start building amazing applications!",
    icon: <Zap className="w-8 h-8 text-yellow-500" />,
    features: [
      "Access to all features",
      "24/7 support",
      "Regular updates",
      "Community access"
    ]
  }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < onboardingSteps.length) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      router.push('/dashboard');
    }
  };

  const handleSkip = () => {
    router.push('/app/dashboard');
  };

  const currentStepData = onboardingSteps.find(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {onboardingSteps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / onboardingSteps.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / onboardingSteps.length) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {currentStepData?.icon}
            </div>
            <CardTitle className="text-2xl">{currentStepData?.title}</CardTitle>
            <p className="text-gray-600 mt-2">{currentStepData?.description}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {currentStepData?.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Step-specific content */}
            {currentStep === 2 && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">Popular Networks</h4>
                <div className="flex flex-wrap gap-2">
                  {['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base', 'Avalanche'].map(network => (
                    <Badge key={network} variant="secondary" className="text-xs">
                      {network}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-purple-900 mb-2">Analytics Dashboard</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                    <span>Real-time metrics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-purple-500" />
                    <span>Global coverage</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-purple-500" />
                    <span>Security monitoring</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-purple-500" />
                    <span>Custom alerts</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handleSkip}
                className="flex items-center space-x-2"
              >
                Skip for now
              </Button>
              
              <Button 
                onClick={handleNext}
                className="flex items-center space-x-2"
              >
                {currentStep === onboardingSteps.length ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step indicators */}
        <div className="flex justify-center space-x-2 mt-6">
          {onboardingSteps.map((step) => (
            <div
              key={step.id}
              className={`w-3 h-3 rounded-full transition-colors ${
                step.id <= currentStep 
                  ? 'bg-blue-600' 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}








