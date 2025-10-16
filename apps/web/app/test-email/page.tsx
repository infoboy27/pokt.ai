'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Users,
  CreditCard,
  AlertTriangle,
  Key,
  Zap
} from 'lucide-react';

export default function TestEmailPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testEmailTypes = [
    {
      type: 'default',
      name: 'Test Email',
      description: 'Basic test email to verify SendGrid connection',
      icon: <Mail className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      type: 'invitation',
      name: 'Team Invitation',
      description: 'Team member invitation email',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    {
      type: 'welcome',
      name: 'Welcome Email',
      description: 'Welcome email for new users',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    {
      type: 'billing',
      name: 'Billing Notification',
      description: 'Billing and payment notification',
      icon: <CreditCard className="h-5 w-5" />,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    {
      type: 'usage',
      name: 'Usage Alert',
      description: 'Usage limit alert email',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    {
      type: 'password-reset',
      name: 'Password Reset',
      description: 'Password reset email',
      icon: <Key className="h-5 w-5" />,
      color: 'bg-red-100 text-red-800 border-red-200'
    }
  ];

  const sendTestEmail = async (type: string) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          email: 'jonathanmaria@gmail.com'
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📧 SendGrid Email Testing
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Test pokt.ai email service with SendGrid integration
          </p>
          <Badge className="bg-green-100 text-green-800 border-green-200 text-lg px-4 py-2">
            Target: jonathanmaria@gmail.com
          </Badge>
        </div>

        {/* SendGrid Configuration */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5 text-blue-600" />
              SendGrid Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-gray-700">Server:</p>
                <p className="text-gray-600">smtp.sendgrid.net</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Port:</p>
                <p className="text-gray-600">587 (TLS)</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Username:</p>
                <p className="text-gray-600">apikey</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Status:</p>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  ✅ Configured
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testEmailTypes.map((emailType) => (
            <Card key={emailType.type} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  {emailType.icon}
                  <span className="ml-2">{emailType.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{emailType.description}</p>
                <Button
                  onClick={() => sendTestEmail(emailType.type)}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Test
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Results */}
        {result && (
          <Card className={`${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                {result.success ? (
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="mr-2 h-5 w-5 text-red-600" />
                )}
                Email Test Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Status:</strong> {result.success ? '✅ Success' : '❌ Failed'}</p>
                <p><strong>Message:</strong> {result.message}</p>
                <p><strong>Email:</strong> {result.email}</p>
                <p><strong>Type:</strong> {result.type}</p>
                {result.error && (
                  <p><strong>Error:</strong> {result.error}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle>📋 Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Click any "Send Test" button above</li>
              <li>Wait for the loading indicator to complete</li>
              <li>Check the result card for success/failure status</li>
              <li>Check jonathanmaria@gmail.com inbox for the email</li>
              <li>Verify the email design and content</li>
            </ol>
            <p className="mt-4 text-sm text-gray-600">
              <strong>Note:</strong> All emails are sent to jonathanmaria@gmail.com for testing purposes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}










