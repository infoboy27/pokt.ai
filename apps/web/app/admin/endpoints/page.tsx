'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Server, 
  Plus, 
  Settings, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface Endpoint {
  id: string;
  name: string;
  baseUrl: string;
  healthUrl: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  networks: {
    id: string;
    code: string;
    chainId?: number;
    isEnabled: boolean;
  }[];
  apiKeys: {
    id: string;
    label: string;
    isActive: boolean;
  }[];
  healthChecks: {
    ok: boolean;
    latencyMs?: number;
    checkedAt: string;
  }[];
}

export default function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({
    name: '',
    baseUrl: '',
    healthUrl: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        // Use real backend API
        const response = await fetch('/api/endpoints', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'mock-jwt-token-for-testing'}`,
            'X-Organization-ID': localStorage.getItem('selectedOrgId') || 'org-1',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setEndpoints(data.endpoints || []);
        } else {
          // Fallback to hardcoded data
          setEndpoints([
            {
              id: 'shannon-gateway',
              name: 'Shannon Customer Gateway',
              baseUrl: 'http://135.125.163.236:4000',
              healthUrl: 'http://135.125.163.236:4000/health',
              description: 'Customer-facing RPC gateway with 30+ blockchain networks',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              networks: [
                // Mainnet Networks
                { id: '1', code: 'eth', chainId: 1, isEnabled: true },
                { id: '2', code: 'bsc', chainId: 56, isEnabled: true },
                { id: '3', code: 'poly', chainId: 137, isEnabled: true },
                { id: '4', code: 'avax', chainId: 43114, isEnabled: true },
                { id: '5', code: 'arb-one', chainId: 42161, isEnabled: true },
                { id: '6', code: 'opt', chainId: 10, isEnabled: true },
                { id: '7', code: 'base', chainId: 8453, isEnabled: true },
                { id: '8', code: 'linea', chainId: 59144, isEnabled: true },
                { id: '9', code: 'mantle', chainId: 5000, isEnabled: true },
                { id: '10', code: 'bera', chainId: 80085, isEnabled: true },
                { id: '11', code: 'fuse', chainId: 122, isEnabled: true },
                { id: '12', code: 'fraxtal', chainId: 252, isEnabled: true },
                { id: '13', code: 'metis', chainId: 1088, isEnabled: true },
                { id: '14', code: 'sui', chainId: 0, isEnabled: true },
                { id: '15', code: 'blast', chainId: 81457, isEnabled: true },
                { id: '16', code: 'boba', chainId: 288, isEnabled: true },
                { id: '17', code: 'celo', chainId: 42220, isEnabled: true },
                { id: '18', code: 'fantom', chainId: 250, isEnabled: true },
                { id: '19', code: 'gnosis', chainId: 100, isEnabled: true },
                { id: '20', code: 'ink', chainId: 0, isEnabled: true },
                { id: '21', code: 'kava', chainId: 2222, isEnabled: true },
                { id: '22', code: 'oasys', chainId: 248, isEnabled: true },
                { id: '23', code: 'solana', chainId: 0, isEnabled: true },
                { id: '24', code: 'sonic', chainId: 0, isEnabled: true },
                { id: '25', code: 'anvil', chainId: 31337, isEnabled: true },
                { id: '26', code: 'pokt', chainId: 0, isEnabled: true },
                // Testnet Networks
                { id: '27', code: 'opt-sepolia-testnet', chainId: 11155420, isEnabled: true },
                { id: '28', code: 'arb-sepolia-testnet', chainId: 421614, isEnabled: true },
                { id: '29', code: 'base-sepolia-testnet', chainId: 84532, isEnabled: true },
                { id: '30', code: 'eth-holesky-testnet', chainId: 17000, isEnabled: true },
                { id: '31', code: 'eth-sepolia-testnet', chainId: 11155111, isEnabled: true },
              ],
              apiKeys: [
                { id: '1', label: 'Default API Key', isActive: true },
              ],
              healthChecks: [
                { ok: true, latencyMs: 45, checkedAt: new Date().toISOString() },
              ],
            },
          ]);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchEndpoints();
  }, []);

  const createEndpoint = async () => {
    if (!newEndpoint.name || !newEndpoint.baseUrl) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/endpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'mock-jwt-token-for-testing'}`,
          'X-Organization-ID': localStorage.getItem('selectedOrgId') || 'org-1',
        },
        body: JSON.stringify({
          name: newEndpoint.name,
          baseUrl: newEndpoint.baseUrl,
          healthUrl: newEndpoint.healthUrl || `${newEndpoint.baseUrl}/health`,
          description: newEndpoint.description,
          isActive: true
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEndpoints(prev => [data.data, ...prev]);
        setNewEndpoint({ name: '', baseUrl: '', healthUrl: '', description: '' });
        setIsCreateDialogOpen(false);
        
        toast({
          title: 'Success!',
          description: `${newEndpoint.name} endpoint created successfully`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create endpoint');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create endpoint',
        variant: 'destructive',
      });
    }
  };

  const getHealthStatus = (endpoint: Endpoint) => {
    // Safety check: ensure healthChecks exists before accessing
    if (!endpoint.healthChecks || endpoint.healthChecks.length === 0) {
      return { status: 'unknown', icon: Clock, color: 'text-gray-500' };
    }
    
    const lastCheck = endpoint.healthChecks[0];
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Endpoints</h1>
            <p className="text-gray-600">Manage your RPC endpoints and configurations</p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Loading endpoints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Endpoints</h1>
          <p className="text-gray-600">Manage your RPC endpoints and configurations</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Endpoint
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Endpoint</DialogTitle>
              <DialogDescription>
                Add a new RPC endpoint to your admin panel.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Endpoint Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Shannon Customer Gateway"
                  value={newEndpoint.name}
                  onChange={(e) => setNewEndpoint(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="baseUrl">Base URL *</Label>
                <Input
                  id="baseUrl"
                  placeholder="e.g., http://135.125.163.236:4000"
                  value={newEndpoint.baseUrl}
                  onChange={(e) => setNewEndpoint(prev => ({ ...prev, baseUrl: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="healthUrl">Health Check URL</Label>
                <Input
                  id="healthUrl"
                  placeholder="e.g., http://135.125.163.236:4000/health (optional)"
                  value={newEndpoint.healthUrl}
                  onChange={(e) => setNewEndpoint(prev => ({ ...prev, healthUrl: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Describe this endpoint..."
                  value={newEndpoint.description}
                  onChange={(e) => setNewEndpoint(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createEndpoint}>
                Create Endpoint
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {endpoints.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Server className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No endpoints found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first endpoint.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Endpoint
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {endpoints.map((endpoint) => {
            const health = getHealthStatus(endpoint);
            const HealthIcon = health.icon;
            
            return (
              <Card key={endpoint.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Server className="h-5 w-5 text-gray-400" />
                      <div>
                        <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                        <p className="text-sm text-gray-500">{endpoint.baseUrl}</p>
                      </div>
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
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {endpoint.description && (
                      <p className="text-sm text-gray-600">{endpoint.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{endpoint.networks.length} Networks</p>
                          <p className="text-xs text-gray-500">
                            {endpoint.networks.filter(n => n.isEnabled).length} enabled
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Settings className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{endpoint.apiKeys.length} API Keys</p>
                          <p className="text-xs text-gray-500">
                            {endpoint.apiKeys.filter(k => k.isActive).length} active
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <HealthIcon className={`h-4 w-4 ${health.color}`} />
                        <div>
                          <p className="text-sm font-medium">
                            {endpoint.healthChecks?.[0]?.latencyMs || 0}ms
                          </p>
                          <p className="text-xs text-gray-500">Last check</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex space-x-2">
                        <Link href={`/admin/endpoints/${endpoint.id}`}>
                          <Button variant="outline" size="sm">
                            <Settings className="mr-2 h-4 w-4" />
                            Manage
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Health Check
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Created {new Date(endpoint.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


