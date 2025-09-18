'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Copy, Check, Key } from 'lucide-react';

interface GenerateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  endpointId: string;
  endpointName: string;
  onKeyGenerated: (key: any) => void;
}

export default function GenerateKeyModal({
  isOpen,
  onClose,
  endpointId,
  endpointName,
  onKeyGenerated,
}: GenerateKeyModalProps) {
  const [label, setLabel] = useState('');
  const [rpsLimit, setRpsLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedKey, setGeneratedKey] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use localhost API since Traefik routing isn't working for admin API
      const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? '/api/admin/keys' 
        : 'http://localhost:3005/api/admin/keys';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label,
          endpointId,
          rpsLimit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate API key');
      }

      setGeneratedKey(data.data);
      onKeyGenerated(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedKey?.rawKey) {
      await navigator.clipboard.writeText(generatedKey.rawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setLabel('');
    setRpsLimit(100);
    setError('');
    setGeneratedKey(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Generate New API Key
            </CardTitle>
            <CardDescription>
              Create a new API key for {endpointName}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {!generatedKey ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="label">Key Label</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., Production API Key"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rpsLimit">Requests Per Second Limit</Label>
                <Input
                  id="rpsLimit"
                  type="number"
                  value={rpsLimit}
                  onChange={(e) => setRpsLimit(Number(e.target.value))}
                  min="1"
                  max="10000"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Generating...' : 'Generate Key'}
                </Button>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                ✅ API key generated successfully!
              </div>

              <div className="space-y-2">
                <Label>Your New API Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedKey.rawKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  ⚠️ Save this key securely. You won't be able to see it again.
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-md space-y-1">
                <p className="text-sm font-medium">Key Details:</p>
                <p className="text-sm text-gray-600">Label: {generatedKey.label}</p>
                <p className="text-sm text-gray-600">RPS Limit: {generatedKey.rpsLimit}</p>
                <p className="text-sm text-gray-600">Status: Active</p>
              </div>

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
