'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GenerateKeyModal from '@/components/generate-key-modal';
import { 
  Key, 
  Plus, 
  Copy, 
  Edit, 
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  Server,
  Activity
} from 'lucide-react';

interface ApiKey {
  id: string;
  label: string;
  headerName: string;
  rpsLimit: number;
  rpdLimit: number;
  rpmLimit: number;
  isActive: boolean;
  endpointId: string;
  endpoint: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  usage?: {
    totalRequests: number;
    lastUsed?: string;
  };
}

const mockApiKeys: ApiKey[] = [
  {
    id: '1',
    label: 'Default API Key',
    headerName: 'X-API-Key',
    rpsLimit: 100,
    rpdLimit: 1000000,
    rpmLimit: 30000000,
    isActive: true,
    endpointId: '1',
    endpoint: {
      id: '1',
      name: 'Shannon Customer Gateway',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usage: {
      totalRequests: 1250000,
      lastUsed: new Date().toISOString(),
    },
  },
  {
    id: '2',
    label: 'Development Key',
    headerName: 'X-API-Key',
    rpsLimit: 50,
    rpdLimit: 100000,
    rpmLimit: 1000000,
    isActive: true,
    endpointId: '1',
    endpoint: {
      id: '1',
      name: 'Shannon Customer Gateway',
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    usage: {
      totalRequests: 45000,
      lastUsed: new Date(Date.now() - 3600000).toISOString(),
    },
  },
  {
    id: '3',
    label: 'Legacy Key',
    headerName: 'X-API-Key',
    rpsLimit: 10,
    rpdLimit: 10000,
    rpmLimit: 100000,
    isActive: false,
    endpointId: '1',
    endpoint: {
      id: '1',
      name: 'Shannon Customer Gateway',
    },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    usage: {
      totalRequests: 0,
    },
  },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(mockApiKeys);
  const [showRawKeys, setShowRawKeys] = useState<Record<string, boolean>>({});
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleKeyVisibility = (keyId: string) => {
    setShowRawKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleKeyStatus = (keyId: string) => {
    setKeys(prev => prev.map(key => 
      key.id === keyId 
        ? { ...key, isActive: !key.isActive }
        : key
    ));
  };

  const deleteKey = (keyId: string) => {
    setKeys(prev => prev.filter(key => key.id !== keyId));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const handleKeyGenerated = (newKey: any) => {
    // Add the new key to the list
    const apiKey: ApiKey = {
      id: newKey.id,
      label: newKey.label,
      headerName: 'X-API-Key',
      rpsLimit: newKey.rpsLimit,
      rpdLimit: newKey.rpdLimit,
      rpmLimit: newKey.rpmLimit,
      isActive: newKey.isActive,
      endpointId: 'shannon-gateway',
      endpoint: {
        id: 'shannon-gateway',
        name: 'Shannon Customer Gateway',
      },
      createdAt: newKey.createdAt,
      updatedAt: newKey.createdAt,
      usage: {
        totalRequests: 0,
      },
    };
    
    setKeys(prev => [apiKey, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-600">Manage API keys and rate limits</p>
        </div>
        <Button onClick={() => setIsGenerateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Key
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keys.length}</div>
            <p className="text-xs text-muted-foreground">
              {keys.filter(k => k.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(keys.reduce((sum, key) => sum + (key.usage?.totalRequests || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keys.filter(k => k.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              {keys.filter(k => !k.isActive).length} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg RPS Limit</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(keys.reduce((sum, key) => sum + key.rpsLimit, 0) / keys.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per key
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Keys List */}
      <div className="grid gap-6">
        {keys.map((key) => (
          <Card key={key.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Key className="h-5 w-5 text-gray-400" />
                  <div>
                    <CardTitle className="text-lg">{key.label}</CardTitle>
                    <p className="text-sm text-gray-500">{key.endpoint.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={key.isActive ? 'default' : 'secondary'}>
                    {key.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Key Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Header Name</label>
                    <p className="text-sm font-mono">{key.headerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">RPS Limit</label>
                    <p className="text-sm">{key.rpsLimit.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">RPD Limit</label>
                    <p className="text-sm">{formatNumber(key.rpdLimit)}</p>
                  </div>
                </div>

                {/* Usage Stats */}
                {key.usage && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Requests</label>
                      <p className="text-sm">{formatNumber(key.usage.totalRequests)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Used</label>
                      <p className="text-sm">
                        {key.usage.lastUsed 
                          ? new Date(key.usage.lastUsed).toLocaleString()
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleKeyStatus(key.id)}
                    >
                      {key.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Rotate
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteKey(key.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {keys.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys found</h3>
            <p className="text-gray-500 mb-4">Get started by generating your first API key.</p>
            <Button onClick={() => setIsGenerateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Generate API Key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generate Key Modal */}
      <GenerateKeyModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        endpointId="shannon-gateway"
        endpointName="Shannon Customer Gateway"
        onKeyGenerated={handleKeyGenerated}
      />
    </div>
  );
}
