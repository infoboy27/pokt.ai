'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Server, 
  Settings, 
  Activity,
  Key,
  BarChart3,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface Endpoint {
  id: string;
  name: string;
  baseUrl: string;
  healthUrl: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  networks: Network[];
  apiKeys: ApiKey[];
  healthChecks: HealthCheck[];
}

interface Network {
  id: string;
  code: string;
  chainId?: number;
  rpcUrl: string;
  wsUrl?: string;
  isTestnet: boolean;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiKey {
  id: string;
  label: string;
  headerName: string;
  rpsLimit: number;
  rpdLimit: number;
  rpmLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HealthCheck {
  id: string;
  ok: boolean;
  httpStatus?: number;
  latencyMs?: number;
  checkedAt: string;
  meta?: any;
}

export default function EndpointDetailPage() {
  const params = useParams();
  const [endpoint, setEndpoint] = useState<Endpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchEndpoint = async () => {
      try {
        // Temporarily use hardcoded data until database connection is fixed
        if (params.id === 'shannon-gateway' || params.id === 'shannon-gateway-2' || params.id === '1') {
          setEndpoint({
            id: params.id as string,
            name: 'Shannon Customer Gateway',
            baseUrl: 'http://135.125.163.236:4000',
            healthUrl: 'http://135.125.163.236:4000/health',
            description: 'Customer-facing RPC gateway with 30+ blockchain networks',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            networks: [
              // Mainnet Networks
              { id: '1', code: 'eth', chainId: 1, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/eth', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '2', code: 'bsc', chainId: 56, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/bsc', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '3', code: 'poly', chainId: 137, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/poly', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '4', code: 'avax', chainId: 43114, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/avax', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '5', code: 'arb-one', chainId: 42161, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/arb-one', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '6', code: 'opt', chainId: 10, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/opt', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '7', code: 'base', chainId: 8453, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/base', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '8', code: 'linea', chainId: 59144, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/linea', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '9', code: 'mantle', chainId: 5000, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/mantle', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '10', code: 'bera', chainId: 80085, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/bera', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '11', code: 'fuse', chainId: 122, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/fuse', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '12', code: 'fraxtal', chainId: 252, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/fraxtal', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '13', code: 'metis', chainId: 1088, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/metis', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '14', code: 'sui', chainId: null, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/sui', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '15', code: 'blast', chainId: 81457, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/blast', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '16', code: 'boba', chainId: 288, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/boba', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '17', code: 'celo', chainId: 42220, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/celo', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '18', code: 'fantom', chainId: 250, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/fantom', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '19', code: 'gnosis', chainId: 100, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/gnosis', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '20', code: 'ink', chainId: null, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/ink', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '21', code: 'kava', chainId: 2222, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/kava', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '22', code: 'oasys', chainId: 248, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/oasys', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '23', code: 'solana', chainId: null, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/solana', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '24', code: 'sonic', chainId: null, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/sonic', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '25', code: 'anvil', chainId: 31337, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/anvil', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '26', code: 'pokt', chainId: null, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/pokt', isTestnet: false, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              // Testnet Networks
              { id: '27', code: 'opt-sepolia-testnet', chainId: 11155420, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/opt-sepolia-testnet', isTestnet: true, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '28', code: 'arb-sepolia-testnet', chainId: 421614, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/arb-sepolia-testnet', isTestnet: true, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '29', code: 'base-sepolia-testnet', chainId: 84532, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/base-sepolia-testnet', isTestnet: true, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '30', code: 'eth-holesky-testnet', chainId: 17000, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/eth-holesky-testnet', isTestnet: true, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              { id: '31', code: 'eth-sepolia-testnet', chainId: 11155111, rpcUrl: 'http://135.125.163.236:4000/v1/rpc/eth-sepolia-testnet', isTestnet: true, isEnabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            ],
            apiKeys: [
              { 
                id: '1', 
                label: 'Default API Key', 
                headerName: 'X-API-Key',
                rpsLimit: 100,
                rpdLimit: 1000000,
                rpmLimit: 30000000,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
            ],
            healthChecks: [
              { ok: true, latencyMs: 45, checkedAt: new Date().toISOString() },
            ],
          });
        } else {
          console.error('Endpoint not found');
        }
      } catch (error) {
        console.error('Failed to fetch endpoint:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEndpoint();
  }, [params.id]);

  const getHealthStatus = () => {
    const lastCheck = endpoint?.healthChecks[0];
    if (!lastCheck) return { status: 'unknown', icon: Clock, color: 'text-gray-500' };
    
    if (lastCheck.ok) {
      return { status: 'healthy', icon: CheckCircle, color: 'text-green-500' };
    } else {
      return { status: 'unhealthy', icon: XCircle, color: 'text-red-500' };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Loading endpoint details...</p>
        </div>
      </div>
    );
  }

  if (!endpoint) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Endpoint not found</p>
        </div>
      </div>
    );
  }

  const health = getHealthStatus();
  const HealthIcon = health.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{endpoint.name}</h1>
          <p className="text-gray-600">{endpoint.baseUrl}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={endpoint.isActive ? 'default' : 'secondary'}>
            {endpoint.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <div className="flex items-center space-x-1">
            <HealthIcon className={`h-4 w-4 ${health.color}`} />
            <span className="text-sm text-gray-500 capitalize">{health.status}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="networks">Networks</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="tester">RPC Tester</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Endpoint Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm">{endpoint.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Base URL</label>
                  <p className="text-sm font-mono">{endpoint.baseUrl}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Health URL</label>
                  <p className="text-sm font-mono">{endpoint.healthUrl}</p>
                </div>
                {endpoint.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-sm">{endpoint.description}</p>
                  </div>
                )}
                <div className="flex items-center space-x-2 pt-4">
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Activity className="mr-2 h-4 w-4" />
                    Health Check
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Networks</span>
                  <span className="font-semibold">{endpoint.networks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Keys</span>
                  <span className="font-semibold">{endpoint.apiKeys.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Health Check</span>
                  <span className="text-sm text-gray-500">
                    {endpoint.healthChecks[0]?.latencyMs || 0}ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm text-gray-500">
                    {new Date(endpoint.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Networks Tab */}
        <TabsContent value="networks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Networks</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Network
            </Button>
          </div>
          
          <div className="grid gap-4">
            {endpoint.networks.map((network) => (
              <Card key={network.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-medium">{network.code.toUpperCase()}</h3>
                        <p className="text-sm text-gray-500">
                          Chain ID: {network.chainId} • {network.isTestnet ? 'Testnet' : 'Mainnet'}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">{network.rpcUrl}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={network.isEnabled ? 'default' : 'secondary'}>
                        {network.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {network.isEnabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">API Keys</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Key
            </Button>
          </div>
          
          <div className="grid gap-4">
            {endpoint.apiKeys.map((key) => (
              <Card key={key.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{key.label}</h3>
                      <p className="text-sm text-gray-500">
                        {key.headerName} • {key.rpsLimit} RPS • {key.rpdLimit.toLocaleString()} RPD
                      </p>
                      <p className="text-xs text-gray-400">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={key.isActive ? 'default' : 'secondary'}>
                        {key.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Key className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <h2 className="text-lg font-semibold">Usage Analytics</h2>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                <p>Usage charts will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <h2 className="text-lg font-semibold">Health Checks</h2>
          <div className="grid gap-4">
            {endpoint.healthChecks.map((check) => (
              <Card key={check.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {check.ok ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {check.ok ? 'Healthy' : 'Unhealthy'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {check.latencyMs}ms • HTTP {check.httpStatus}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(check.checkedAt).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* RPC Tester Tab */}
        <TabsContent value="tester" className="space-y-6">
          <h2 className="text-lg font-semibold">RPC Tester</h2>
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <TestTube className="mx-auto h-12 w-12 mb-4" />
                <p>JSON-RPC tester will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


