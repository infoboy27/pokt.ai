'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Users, Shield, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TestEmailsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ [key: string]: boolean }>({});
  const [testEmail, setTestEmail] = useState('jonathanmaria@gmail.com');
  const [testName, setTestName] = useState('Jonathan Maria');

  const emailTests = [
    {
      id: 'team-invitation',
      title: 'Team Invitation',
      description: 'Send team member invitation email',
      icon: Users,
      color: 'bg-blue-500',
      action: async () => {
        const response = await fetch('/api/members/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            role: 'developer'
          })
        });
        return response.ok;
      }
    },
    {
      id: 'welcome-email',
      title: 'Welcome Email',
      description: 'Send welcome email for new organization',
      icon: CheckCircle,
      color: 'bg-green-500',
      action: async () => {
        const response = await fetch('/api/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Organization',
            description: 'Test organization',
            website: 'https://example.com',
            industry: 'Technology',
            size: '1-10',
            adminName: testName,
            adminEmail: testEmail
          })
        });
        return response.ok;
      }
    },
    {
      id: 'email-verification',
      title: 'Email Verification',
      description: 'Send email verification link',
      icon: Shield,
      color: 'bg-purple-500',
      action: async () => {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            name: testName
          })
        });
        return response.ok;
      }
    },
    {
      id: 'password-reset',
      title: 'Password Reset',
      description: 'Send password reset email',
      icon: Shield,
      color: 'bg-orange-500',
      action: async () => {
        const response = await fetch('/api/auth/password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail
          })
        });
        return response.ok;
      }
    },
    {
      id: 'usage-alert',
      title: 'Usage Alert',
      description: 'Send usage limit alert',
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      action: async () => {
        const response = await fetch('/api/usage/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'usage_limit',
            threshold: 80,
            currentValue: 85,
            message: 'You have reached 85% of your monthly usage limit.'
          })
        });
        return response.ok;
      }
    },
    {
      id: 'billing-alert',
      title: 'Billing Alert',
      description: 'Send billing threshold alert',
      icon: CreditCard,
      color: 'bg-red-500',
      action: async () => {
        const response = await fetch('/api/usage/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'cost_threshold',
            threshold: 100,
            currentValue: 120,
            message: 'Your monthly costs have reached $120, exceeding your $100 threshold.'
          })
        });
        return response.ok;
      }
    },
    {
      id: 'endpoint-alert',
      title: 'Endpoint Alert',
      description: 'Send endpoint down alert',
      icon: AlertTriangle,
      color: 'bg-red-600',
      action: async () => {
        const response = await fetch('/api/usage/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'endpoint_down',
            endpointId: 'eth_1234567890',
            message: 'Your Ethereum endpoint is currently down and not responding to requests.'
          })
        });
        return response.ok;
      }
    },
    {
      id: 'security-alert',
      title: 'Security Alert',
      description: 'Send security alert',
      icon: Shield,
      color: 'bg-red-700',
      action: async () => {
        const response = await fetch('/api/usage/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'unusual_activity',
            message: 'We detected unusual activity on your account. Please review your recent activity.'
          })
        });
        return response.ok;
      }
    }
  ];

  const runTest = async (test: typeof emailTests[0]) => {
    setLoading(true);
    try {
      const success = await test.action();
      setResults(prev => ({ ...prev, [test.id]: success }));
    } catch (error) {
      console.error(`Error running ${test.id} test:`, error);
      setResults(prev => ({ ...prev, [test.id]: false }));
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults({});
    
    for (const test of emailTests) {
      try {
        const success = await test.action();
        setResults(prev => ({ ...prev, [test.id]: success }));
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error running ${test.id} test:`, error);
        setResults(prev => ({ ...prev, [test.id]: false }));
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📧 Email Service Testing
          </h1>
          <p className="text-xl text-gray-600">
            Test all pokt.ai email functionality with SendGrid integration
          </p>
        </div>

        {/* Test Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Configure the test email recipient and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testEmail">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="jonathanmaria@gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="testName">Test Name</Label>
                <Input
                  id="testName"
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Jonathan Maria"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={runAllTests}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? 'Running Tests...' : '🚀 Run All Email Tests'}
          </Button>
        </div>

        {/* Email Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {emailTests.map((test) => {
            const Icon = test.icon;
            const result = results[test.id];
            const isSuccess = result === true;
            const isFailure = result === false;
            
            return (
              <Card key={test.id} className={`transition-all duration-200 hover:shadow-lg ${
                isSuccess ? 'ring-2 ring-green-500 bg-green-50' : 
                isFailure ? 'ring-2 ring-red-500 bg-red-50' : ''
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className={`p-2 rounded-lg ${test.color} text-white mr-3`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {test.title}
                    {isSuccess && <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />}
                    {isFailure && <AlertTriangle className="h-5 w-5 text-red-500 ml-auto" />}
                  </CardTitle>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => runTest(test)}
                    disabled={loading}
                    variant={isSuccess ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {loading ? 'Testing...' : isSuccess ? '✅ Test Passed' : isFailure ? '❌ Test Failed' : 'Run Test'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Results Summary */}
        {Object.keys(results).length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(results).filter(r => r === true).length}
                  </div>
                  <div className="text-sm text-green-600">Passed</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {Object.values(results).filter(r => r === false).length}
                  </div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.keys(results).length}
                  </div>
                  <div className="text-sm text-blue-600">Total Tests</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📋 Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Before Testing:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Ensure SendGrid API key is configured in environment variables</li>
                <li>Verify that noreply@pokt.ai is set up as a verified sender in SendGrid</li>
                <li>Check that the test email address is valid and accessible</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">What Each Test Does:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li><strong>Team Invitation:</strong> Sends a team member invitation with role and invite link</li>
                <li><strong>Welcome Email:</strong> Sends welcome email when creating a new organization</li>
                <li><strong>Email Verification:</strong> Sends email verification link for new accounts</li>
                <li><strong>Password Reset:</strong> Sends password reset link with security notice</li>
                <li><strong>Usage Alert:</strong> Sends usage limit warning with dashboard link</li>
                <li><strong>Billing Alert:</strong> Sends cost threshold alert with billing info</li>
                <li><strong>Endpoint Alert:</strong> Sends endpoint down notification</li>
                <li><strong>Security Alert:</strong> Sends security and unusual activity alerts</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}










