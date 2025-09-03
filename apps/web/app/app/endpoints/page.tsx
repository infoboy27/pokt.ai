'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Trash2, 
  ExternalLink,
  Server,
  Activity,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock data
const mockEndpoints = [
  {
    id: 'endpoint-1',
    name: 'Ethereum Mainnet',
    chainId: 'F003',
    endpointUrl: 'https://gateway.pokt.ai/rpc/endpoint_1',
    token: 'pokt_abc123def456',
    rateLimit: 1000,
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    relays: 85000,
  },
  {
    id: 'endpoint-2',
    name: 'Polygon',
    chainId: 'F00C',
    endpointUrl: 'https://gateway.pokt.ai/rpc/endpoint_2',
    token: 'pokt_xyz789uvw012',
    rateLimit: 500,
    status: 'active',
    createdAt: '2024-01-20T14:45:00Z',
    relays: 45000,
  },
  {
    id: 'endpoint-3',
    name: 'BSC',
    chainId: 'F00B',
    endpointUrl: 'https://gateway.pokt.ai/rpc/endpoint_3',
    token: 'pokt_mno345pqr678',
    rateLimit: 750,
    status: 'active',
    createdAt: '2024-01-25T09:15:00Z',
    relays: 32000,
  },
];

const chains = [
  { id: 'F003', name: 'Ethereum Mainnet' },
  { id: 'F00C', name: 'Polygon' },
  { id: 'F00B', name: 'BSC' },
  { id: 'F00A', name: 'Arbitrum' },
  { id: 'F00D', name: 'Avalanche' },
  { id: 'F00E', name: 'Optimism' },
];

export default function EndpointsPage() {
  const [endpoints, setEndpoints] = useState(mockEndpoints);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({
    name: '',
    chainId: '',
    rateLimit: 1000,
  });
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const toggleTokenVisibility = (endpointId: string) => {
    setShowTokens(prev => ({
      ...prev,
      [endpointId]: !prev[endpointId],
    }));
  };

  const createEndpoint = () => {
    if (!newEndpoint.name || !newEndpoint.chainId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const chain = chains.find(c => c.id === newEndpoint.chainId);
    const endpointId = `endpoint_${Date.now()}`;
    
    const newEndpointData = {
      id: endpointId,
      name: newEndpoint.name,
      chainId: newEndpoint.chainId,
      endpointUrl: `https://gateway.pokt.ai/rpc/${endpointId}`,
      token: `pokt_${Math.random().toString(36).substring(2, 15)}`,
      rateLimit: newEndpoint.rateLimit,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      relays: 0,
    };

    setEndpoints(prev => [newEndpointData, ...prev]);
    setNewEndpoint({ name: '', chainId: '', rateLimit: 1000 });
    setIsCreateDialogOpen(false);
    
    toast({
      title: 'Success!',
      description: `${newEndpoint.name} endpoint created successfully`,
    });
  };

  const deleteEndpoint = (endpointId: string) => {
    setEndpoints(prev => prev.filter(e => e.id !== endpointId));
    console.log('Endpoint deleted: The endpoint has been removed');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">RPC Endpoints</h1>
          <p className="text-muted-foreground">Manage your RPC endpoints and API keys</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Endpoint
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Endpoint</DialogTitle>
              <DialogDescription>
                Create a new RPC endpoint for your application.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Endpoint Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Ethereum Mainnet"
                  value={newEndpoint.name}
                  onChange={(e) => setNewEndpoint(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="chain">Blockchain Network</Label>
                <Select value={newEndpoint.chainId} onValueChange={(value) => setNewEndpoint(prev => ({ ...prev, chainId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a network" />
                  </SelectTrigger>
                  <SelectContent>
                    {chains.map((chain) => (
                      <SelectItem key={chain.id} value={chain.id}>
                        {chain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rateLimit">Rate Limit (requests/second)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={newEndpoint.rateLimit}
                  onChange={(e) => setNewEndpoint(prev => ({ ...prev, rateLimit: parseInt(e.target.value) || 1000 }))}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createEndpoint}>Create Endpoint</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Endpoints Grid */}
      <div className="grid gap-6">
        {endpoints.map((endpoint) => (
          <Card key={endpoint.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Server className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                    <CardDescription>
                      Chain ID: {endpoint.chainId} • Created {new Date(endpoint.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={endpoint.status === 'active' ? 'default' : 'secondary'}>
                    {endpoint.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteEndpoint(endpoint.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Endpoint URL */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Endpoint URL</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={endpoint.endpointUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(endpoint.endpointUrl, 'Endpoint URL')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a href={endpoint.endpointUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* API Token */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">API Token</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type={showTokens[endpoint.id] ? 'text' : 'password'}
                      value={endpoint.token}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleTokenVisibility(endpoint.id)}
                    >
                      {showTokens[endpoint.id] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(endpoint.token, 'API Token')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                    <Activity className="w-4 h-4" />
                    <span>Rate Limit</span>
                  </div>
                  <div className="text-lg font-semibold">{endpoint.rateLimit}/s</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                    <Server className="w-4 h-4" />
                    <span>Total Relays</span>
                  </div>
                  <div className="text-lg font-semibold">{endpoint.relays.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Created</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {new Date(endpoint.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 mt-6 pt-6 border-t">
                <Button variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Rotate Token
                </Button>
                <Button variant="outline" size="sm">
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {endpoints.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No endpoints yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Create your first RPC endpoint to get started with pokt.ai
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Endpoint
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
