'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  ExternalLink,
  Server,
  Activity,
  Clock,
  DollarSign,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableNetworks, setAvailableNetworks] = useState<any[]>([]);
  const [networksLoading, setNetworksLoading] = useState(true);
  const [newEndpoint, setNewEndpoint] = useState({
    name: '',
    chainId: 1, // Default to Ethereum mainnet
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEndpoints();
    loadAvailableNetworks();
  }, []);

  const loadAvailableNetworks = async () => {
    try {
      setNetworksLoading(true);
      const response = await fetch('/api/networks/detect');
      if (response.ok) {
        const data = await response.json();
        setAvailableNetworks(data.networks || []);
        console.log(`[ENDPOINTS] Loaded ${data.networks.length} available networks (cached: ${data.metadata.cached})`);
      } else {
        // Fallback to default networks if detection fails
        setAvailableNetworks([
          { id: 1, name: 'Ethereum', icon: '⟠', status: '✅ Online', chainId: 1 },
          { id: 42161, name: 'Arbitrum One', icon: '🔵', status: '✅ Online', chainId: 42161 },
          { id: 10, name: 'Optimism', icon: '🔴', status: '✅ Online', chainId: 10 },
          { id: 8453, name: 'Base', icon: '🔷', status: '✅ Online', chainId: 8453 },
        ]);
      }
    } catch (error) {
      console.error('[ENDPOINTS] Error loading networks:', error);
      // Use fallback networks
      setAvailableNetworks([
        { id: 1, name: 'Ethereum', icon: '⟠', status: '✅ Online', chainId: 1 },
      ]);
    } finally {
      setNetworksLoading(false);
    }
  };

  const loadEndpoints = async () => {
    try {
      setLoading(true);
      // Don't use localStorage for orgId - let the API use the first organization
      // This ensures consistency with the dashboard which uses the first organization
      const url = `/api/endpoints?t=${Date.now()}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.endpoints) {
          // Use actual endpoint tokens from the API
          setEndpoints(data.endpoints);
          console.log('[ENDPOINTS PAGE] Loaded', data.endpoints.length, 'endpoints');
        }
      } else {
        console.error('[ENDPOINTS PAGE] Failed to load endpoints:', response.status);
        setEndpoints([]);
      }
    } catch (error) {
      console.error('[ENDPOINTS PAGE] Error loading endpoints:', error);
      setEndpoints([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  // Removed toggleTokenVisibility since we use static API key

  const createEndpoint = async () => {
    if (!newEndpoint.name || !newEndpoint.chainId) {
      toast({
        title: 'Error',
        description: 'Please enter a name and select a blockchain',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/production/create-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-for-testing',
          'X-Organization-ID': 'org-1',
        },
        body: JSON.stringify({
          name: newEndpoint.name,
          chainId: newEndpoint.chainId,
          description: `Endpoint for ${newEndpoint.name}`,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        const newEndpointData = responseData.endpoint; // Production API returns { endpoint: {...} }
        // Use actual endpoint token from the API
        const endpointWithToken = {
          ...newEndpointData,
          relays: 0
        };
        setEndpoints(prev => [endpointWithToken, ...prev]);
        setNewEndpoint({ name: '', chainId: 1 });
        setIsCreateDialogOpen(false);
        
        toast({
          title: 'Success!',
          description: `${newEndpoint.name} endpoint created successfully`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create endpoint');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create endpoint',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEndpoint = async (endpointId: string) => {
    try {
      const endpoint = endpoints.find(e => e.id === endpointId);
      if (!endpoint) return;

      const response = await fetch(`/api/endpoints/${endpointId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setEndpoints(prev => prev.filter(e => e.id !== endpointId));
        toast({
          title: 'Endpoint Deleted',
          description: `${endpoint.name} has been permanently deleted`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete endpoint');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete endpoint',
        variant: 'destructive',
      });
    }
  };

  const handleNetworkChange = (chainIdStr: string) => {
    const chainId = parseInt(chainIdStr);
    const network = availableNetworks.find(n => n.chainId === chainId);
    if (network) {
      setNewEndpoint(prev => ({
        ...prev,
        chainId: network.chainId,
        name: prev.name || network.name,
      }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Your RPC Endpoints</h1>
          <p className="text-gray-600 mt-2">Create and manage blockchain RPC endpoints instantly</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create New Endpoint</span>
              <span className="sm:hidden">Create Endpoint</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                Create New RPC Endpoint
              </DialogTitle>
              <DialogDescription>
                Choose a blockchain network to create your dedicated RPC endpoint
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Endpoint Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-semibold">Endpoint Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., My Ethereum Mainnet"
                  value={newEndpoint.name}
                  onChange={(e) => setNewEndpoint(prev => ({ ...prev, name: e.target.value }))}
                  className="text-base"
                />
              </div>

              {/* Blockchain Network Selector - Auto-detected from Shannon */}
              <div className="space-y-2">
                <Label htmlFor="network" className="text-base font-semibold">Select Blockchain Network</Label>
                {networksLoading ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-gray-600">Detecting available networks...</span>
                  </div>
                ) : (
                  <Select
                    value={newEndpoint.chainId.toString()}
                    onValueChange={handleNetworkChange}
                    disabled={availableNetworks.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{availableNetworks.find(n => n.chainId === newEndpoint.chainId)?.icon || '🔗'}</span>
                          <span>{availableNetworks.find(n => n.chainId === newEndpoint.chainId)?.name || 'Select network'}</span>
                          <span className="text-xs text-green-600 ml-auto">{availableNetworks.find(n => n.chainId === newEndpoint.chainId)?.status}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableNetworks.map((network, index) => (
                        <SelectItem key={network.serviceId || network.id || `${network.chainId}-${index}`} value={network.chainId.toString()}>
                          <div className="flex items-center gap-3 py-1">
                            <span className="text-xl">{network.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium">{network.name}</div>
                              <div className="text-xs text-green-600">{network.status}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-gray-500">
                  🔄 Available via PATH Gateway • {availableNetworks.length} networks available
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createEndpoint} 
                disabled={loading || !newEndpoint.chainId}
                className="gap-2"
              >
                {loading ? 'Creating...' : 'Create Endpoint'}
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State */}
      {!loading && endpoints.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Server className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No Endpoints Yet</h3>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Create your first RPC endpoint to start building on blockchain networks
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Create Your First Endpoint
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && endpoints.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading your endpoints...</div>
        </div>
      )}

      {/* Endpoints List - Responsive Format */}
      {!loading && endpoints.length > 0 && (
        <div className="space-y-3">
          {endpoints.map((endpoint) => {
            const network = availableNetworks.find(n => n.chainId === endpoint.chainId);
            
            return (
              <div key={endpoint.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow gap-4">
                {/* Header Section */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-lg">
                    {network?.icon || '🌐'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 truncate">{endpoint.name}</div>
                    <div className="text-sm text-gray-500 truncate">{network?.name || `Chain ${endpoint.chainId}`}</div>
                  </div>
                </div>
                
                {/* Stats and Actions Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                  {/* Stats */}
                  <div className="flex items-center gap-3 sm:gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-1">
                      <Activity className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600">{(endpoint.billing?.totalRelays || endpoint.relays || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600">${(endpoint.billing?.estimatedMonthlyCostDollars || 0).toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600">{new Date(endpoint.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(endpoint.endpointUrl, 'Endpoint URL')}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy URL
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={endpoint.endpointUrl} target="_blank" rel="noopener noreferrer" className="text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Test
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEndpoint(endpoint.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
