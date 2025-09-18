'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  Send, 
  Copy, 
  CheckCircle,
  XCircle,
  Clock,
  Network
} from 'lucide-react';

interface Network {
  id: string;
  code: string;
  chainId?: number;
  rpcUrl: string;
}

interface TestResult {
  success: boolean;
  status: number;
  latency: number;
  request: any;
  response: any;
  network: Network;
  error?: string;
}

const mockNetworks: Network[] = [
  { id: '1', code: 'eth', chainId: 1, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/eth' },
  { id: '2', code: 'avax', chainId: 43114, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/avax' },
  { id: '3', code: 'bsc', chainId: 56, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/bsc' },
  { id: '4', code: 'opt', chainId: 10, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/opt' },
  { id: '5', code: 'arb-one', chainId: 42161, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/arb-one' },
  { id: '6', code: 'base', chainId: 8453, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/base' },
  { id: '7', code: 'poly', chainId: 137, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/poly' },
];

const commonMethods = [
  { method: 'eth_blockNumber', params: [], description: 'Get latest block number' },
  { method: 'eth_getBalance', params: ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 'latest'], description: 'Get account balance' },
  { method: 'eth_gasPrice', params: [], description: 'Get current gas price' },
  { method: 'eth_getTransactionCount', params: ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 'latest'], description: 'Get transaction count' },
  { method: 'eth_call', params: [{ to: '0x...', data: '0x...' }, 'latest'], description: 'Call contract method' },
];

export default function RpcTesterPage() {
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [requestBody, setRequestBody] = useState<string>('{\n  "jsonrpc": "2.0",\n  "method": "eth_blockNumber",\n  "params": [],\n  "id": 1\n}');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuickMethod = (method: typeof commonMethods[0]) => {
    const request = {
      jsonrpc: '2.0',
      method: method.method,
      params: method.params,
      id: Math.floor(Math.random() * 1000),
    };
    setRequestBody(JSON.stringify(request, null, 2));
  };

  const handleTest = async () => {
    if (!selectedNetwork) {
      alert('Please select a network');
      return;
    }

    setLoading(true);
    try {
      const network = mockNetworks.find(n => n.id === selectedNetwork);
      if (!network) {
        throw new Error('Network not found');
      }

      let request;
      try {
        request = JSON.parse(requestBody);
      } catch (error) {
        throw new Error('Invalid JSON in request body');
      }

      // Make real API call to test-rpc endpoint
      const response = await fetch('/api/admin/test-rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          networkId: selectedNetwork,
          request: request,
          apiKey: apiKey || undefined,
        }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.data) {
        setTestResult(responseData.data);
      } else {
        throw new Error(responseData.error?.message || 'API call failed');
      }
    } catch (error) {
      const result: TestResult = {
        success: false,
        status: 0,
        latency: 0,
        request: JSON.parse(requestBody),
        response: null,
        network: mockNetworks.find(n => n.id === selectedNetwork)!,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setTestResult(result);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">RPC Tester</h1>
        <p className="text-gray-600">Test JSON-RPC requests against your networks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TestTube className="mr-2 h-5 w-5" />
              Test Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="network">Network</Label>
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a network" />
                </SelectTrigger>
                <SelectContent>
                  {mockNetworks.map((network) => (
                    <SelectItem key={network.id} value={network.id}>
                      <div className="flex items-center space-x-2">
                        <Network className="h-4 w-4" />
                        <span>{network.code.toUpperCase()}</span>
                        {network.chainId && (
                          <Badge variant="secondary" className="text-xs">
                            {network.chainId}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="apiKey">API Key (Optional)</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="requestBody">Request Body</Label>
              <textarea
                id="requestBody"
                className="w-full h-40 p-3 border border-gray-300 rounded-md font-mono text-sm"
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder="Enter JSON-RPC request..."
              />
            </div>

            <Button onClick={handleTest} disabled={loading || !selectedNetwork} className="w-full">
              {loading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Request
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {commonMethods.map((method, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => handleQuickMethod(method)}
                >
                  <div className="text-left">
                    <div className="font-mono text-sm">{method.method}</div>
                    <div className="text-xs text-gray-500">{method.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Result */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {testResult.success ? (
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="mr-2 h-5 w-5 text-red-500" />
              )}
              Test Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Network</Label>
                <p className="text-sm font-mono">{testResult.network.code.toUpperCase()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <p className="text-sm">{testResult.status}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Latency</Label>
                <p className="text-sm">{testResult.latency}ms</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Request</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(testResult.request, null, 2))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-40">
                  {JSON.stringify(testResult.request, null, 2)}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Response</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(testResult.response, null, 2))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-40">
                  {testResult.error ? testResult.error : JSON.stringify(testResult.response, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


