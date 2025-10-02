'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Server, 
  Activity, 
  Clock 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Endpoint {
  id: string;
  name: string;
  chainId: string;
  endpointUrl: string;
  rpcUrl: string;
  token: string;
  rateLimit: number;
  status: string;
  createdAt: string;
  billing: {
    totalRelays: number;
    monthlyRelays: number;
    estimatedMonthlyCost: number;
    estimatedMonthlyCostDollars: number;
  };
}

export default function SimpleEndpointsPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({
    name: '',
    chainId: '',
    rateLimit: 1000,
  });
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Network names mapping for display
  const networkNames: Record<string, string> = {
    'F003': 'Ethereum Mainnet',
    'F00C': 'Polygon',
    'F00B': 'BSC',
    'F00A': 'Arbitrum',
    'F00E': 'Optimism',
  };

  // Load endpoints function
  const loadEndpoints = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/endpoints');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.endpoints && Array.isArray(data.endpoints)) {
          setEndpoints(data.endpoints);
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Create endpoint function
  const handleCreateEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/endpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newEndpoint.name,
          chainId: newEndpoint.chainId,
          rateLimit: newEndpoint.rateLimit,
        }),
      });


      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Endpoint created successfully',
        });
        setIsCreateDialogOpen(false);
        setNewEndpoint({ name: '', chainId: '', rateLimit: 1000 });
        loadEndpoints(); // Refresh
      } else {
        throw new Error('Failed to create endpoint');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create endpoint',
        variant: 'destructive',
      });
    }
  };

  // Load endpoints on mount
  useEffect(() => {
    loadEndpoints();
  }, []);

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  // Toggle token visibility
  const toggleTokenVisibility = (endpointId: string) => {
    setShowTokens(prev => ({
      ...prev,
      [endpointId]: !prev[endpointId]
    }));
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
                Create a new RPC endpoint for your application
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEndpoint} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Endpoint Name</Label>
                <Input
                  id="name"
                  value={newEndpoint.name}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
                  placeholder="My RPC Endpoint"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chainId">Network</Label>
                <Select
                  value={newEndpoint.chainId}
                  onValueChange={(value) => setNewEndpoint({ ...newEndpoint, chainId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F003">Ethereum Mainnet</SelectItem>
                    <SelectItem value="F00C">Polygon</SelectItem>
                    <SelectItem value="F00B">BSC</SelectItem>
                    <SelectItem value="F00A">Arbitrum</SelectItem>
                    <SelectItem value="F00E">Optimism</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rateLimit">Rate Limit (requests/second)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={newEndpoint.rateLimit}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, rateLimit: parseInt(e.target.value) || 1000 })}
                  min="1"
                  max="10000"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Endpoint</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Debug Panel */}
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
        <h3 className="font-bold text-yellow-800 mb-2">Simple Debug Panel</h3>
        <div className="space-x-2">
          <Button onClick={loadEndpoints} variant="outline" className="bg-white">
            🔥 Load Endpoints
          </Button>
            🔍 Check State
          </Button>
        </div>
        <p className="text-sm text-yellow-700 mt-2">
          Current state: Loading={loading ? 'true' : 'false'}, Endpoints={endpoints.length}
        </p>
      </div>

      {/* Endpoints Display */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-lg">Loading endpoints...</div>
        </div>
      ) : endpoints.length > 0 ? (
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
                        {networkNames[endpoint.chainId] || endpoint.chainId}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={endpoint.status === 'active' ? 'default' : 'secondary'}>
                    {endpoint.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* RPC URL */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">RPC URL</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={endpoint.endpointUrl}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(endpoint.endpointUrl, 'RPC URL')}
                      >
                        <Copy className="w-4 h-4" />
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
                    <div className="text-lg font-semibold">{(endpoint.billing?.totalRelays || 0).toLocaleString()}</div>
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
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



