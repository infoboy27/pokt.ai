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
  Search,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Network configuration with logos and categories
const NETWORKS = [
  // Mainnets - EVM
  { id: 'eth', name: 'Ethereum', category: 'EVM Mainnet', icon: '⟠', popular: true, chainId: 1 },
  { id: 'bsc', name: 'BNB Smart Chain', category: 'EVM Mainnet', icon: '🔶', popular: true, chainId: 56 },
  { id: 'poly', name: 'Polygon', category: 'EVM Mainnet', icon: '🟣', popular: true, chainId: 137 },
  { id: 'arb-one', name: 'Arbitrum One', category: 'EVM Mainnet', icon: '🔵', popular: true, chainId: 42161 },
  { id: 'opt', name: 'Optimism', category: 'EVM Mainnet', icon: '🔴', popular: true, chainId: 10 },
  { id: 'base', name: 'Base', category: 'EVM Mainnet', icon: '🔷', popular: true, chainId: 8453 },
  { id: 'avax', name: 'Avalanche', category: 'EVM Mainnet', icon: '❄️', chainId: 43114 },
  { id: 'linea', name: 'Linea', category: 'EVM Mainnet', icon: '📐', chainId: 59144 },
  { id: 'mantle', name: 'Mantle', category: 'EVM Mainnet', icon: '🌐', chainId: 5000 },
  { id: 'blast', name: 'Blast', category: 'EVM Mainnet', icon: '💥', chainId: 81457 },
  { id: 'fantom', name: 'Fantom', category: 'EVM Mainnet', icon: '👻', chainId: 250 },
  { id: 'gnosis', name: 'Gnosis Chain', category: 'EVM Mainnet', icon: '🦉', chainId: 100 },
  { id: 'celo', name: 'Celo', category: 'EVM Mainnet', icon: '🌱', chainId: 42220 },
  { id: 'metis', name: 'Metis', category: 'EVM Mainnet', icon: '🔷', chainId: 1088 },
  { id: 'boba', name: 'Boba Network', category: 'EVM Mainnet', icon: '🧋', chainId: 288 },
  { id: 'fuse', name: 'Fuse', category: 'EVM Mainnet', icon: '⚡', chainId: 122 },
  { id: 'kava', name: 'Kava', category: 'EVM Mainnet', icon: '🌿', chainId: 2222 },
  { id: 'fraxtal', name: 'Fraxtal', category: 'EVM Mainnet', icon: '❄️', chainId: 252 },
  { id: 'oasys', name: 'Oasys', category: 'EVM Mainnet', icon: '🎮', chainId: 248 },
  { id: 'ink', name: 'Ink', category: 'EVM Mainnet', icon: '🖊️', chainId: 200 },
  { id: 'bera', name: 'Berachain', category: 'EVM Mainnet', icon: '🐻', chainId: 80085 },
  { id: 'sonic', name: 'Sonic', category: 'EVM Mainnet', icon: '💨', chainId: 146 },
  
  // Non-EVM Mainnets
  { id: 'solana', name: 'Solana', category: 'Non-EVM Mainnet', icon: '◎', popular: true },
  { id: 'sui', name: 'Sui', category: 'Non-EVM Mainnet', icon: '💧' },
  { id: 'pokt', name: 'Pocket Network', category: 'Non-EVM Mainnet', icon: '🔮' },
  
  // Testnets
  { id: 'eth-sepolia-testnet', name: 'Ethereum Sepolia', category: 'Testnet', icon: '⟠', testnet: true },
  { id: 'eth-holesky-testnet', name: 'Ethereum Holesky', category: 'Testnet', icon: '⟠', testnet: true },
  { id: 'base-sepolia-testnet', name: 'Base Sepolia', category: 'Testnet', icon: '🔷', testnet: true },
  { id: 'arb-sepolia-testnet', name: 'Arbitrum Sepolia', category: 'Testnet', icon: '🔵', testnet: true },
  { id: 'opt-sepolia-testnet', name: 'Optimism Sepolia', category: 'Testnet', icon: '🔴', testnet: true },
  
  // Local Development
  { id: 'anvil', name: 'Anvil Local', category: 'Development', icon: '🔨' },
];

export default function EndpointsPage() {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  // Removed showTokens state since we use static API key
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newEndpoint, setNewEndpoint] = useState({
    name: '',
    chainId: 1, // Default to Ethereum mainnet
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEndpoints();
  }, []);

  const loadEndpoints = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/endpoints?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.endpoints) {
          // Override all tokens with static API key for display
          const staticApiKey = process.env.NEXT_PUBLIC_STATIC_API_KEY || 'sk_pokt_ai_static_key';
          const endpointsWithStaticKey = data.endpoints.map((endpoint: any) => ({
            ...endpoint,
            token: staticApiKey
          }));
          setEndpoints(endpointsWithStaticKey);
        }
      } else {
        setEndpoints([]);
      }
    } catch (error) {
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
        // Override token with static API key
        const staticApiKey = process.env.NEXT_PUBLIC_STATIC_API_KEY || 'sk_pokt_ai_static_key';
        const endpointWithStaticKey = {
          ...newEndpointData,
          token: staticApiKey,
          relays: 0
        };
        setEndpoints(prev => [endpointWithStaticKey, ...prev]);
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

  const selectNetwork = (networkId: string) => {
    const network = NETWORKS.find(n => n.id === networkId);
    if (network) {
      setNewEndpoint(prev => ({
        ...prev,
        chainId: network.chainId || 1, // Use numeric chainId, default to 1 (Ethereum)
        name: prev.name || network.name,
      }));
    }
  };

  const filteredNetworks = NETWORKS.filter(network => {
    const matchesSearch = network.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         network.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'popular' && network.popular) ||
                           (selectedCategory === 'mainnet' && !network.testnet && network.category.includes('Mainnet')) ||
                           (selectedCategory === 'testnet' && network.testnet);
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'popular', 'mainnet', 'testnet'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Your RPC Endpoints</h1>
          <p className="text-gray-600 mt-2">Create and manage blockchain RPC endpoints instantly</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Create New Endpoint
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

              {/* Search and Filter */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Select Blockchain Network</Label>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search networks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 flex-wrap">
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                      className="capitalize"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Network Grid */}
              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {filteredNetworks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => selectNetwork(network.id)}
                    className={`
                      relative p-4 rounded-lg border-2 text-left transition-all hover:shadow-md
                      ${newEndpoint.chainId === network.id 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-2xl flex-shrink-0">{network.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm truncate">{network.name}</div>
                          <div className="text-xs text-gray-500">{network.category}</div>
                        </div>
                      </div>
                      {newEndpoint.chainId === network.id && (
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    {network.popular && (
                      <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                        Popular
                      </Badge>
                    )}
                  </button>
                ))}
              </div>

              {filteredNetworks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No networks found matching your search
                </div>
              )}
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

      {/* Endpoints List - Compact List Format */}
      {!loading && endpoints.length > 0 && (
        <div className="space-y-3">
          {endpoints.map((endpoint) => {
            const network = NETWORKS.find(n => n.chainId === endpoint.chainId);
            
            return (
              <div key={endpoint.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-lg">
                    {network?.icon || '🌐'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{endpoint.name}</div>
                    <div className="text-sm text-gray-500">{network?.name || `Chain ${endpoint.chainId}`}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Activity className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{(endpoint.billing?.totalRelays || endpoint.relays || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">${(endpoint.billing?.estimatedMonthlyCostDollars || 0).toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{new Date(endpoint.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
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
