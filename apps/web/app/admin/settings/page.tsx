'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Save, 
  User, 
  Shield, 
  Bell,
  Database,
  Server,
  Key
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'POKT.ai Portal',
    siteDescription: 'AI-powered RPC Gateway',
    maintenanceMode: false,
    
    // Admin Settings
    adminEmail: 'admin@pokt.ai',
    adminName: 'Portal Administrator',
    
    // Security Settings
    sessionTimeout: 30,
    requireMFA: false,
    maxLoginAttempts: 5,
    
    // Notification Settings
    emailNotifications: true,
    healthCheckAlerts: true,
    usageAlerts: true,
    
    // Database Settings
    backupFrequency: 'daily',
    retentionDays: 30,
    
    // API Settings
    defaultRpsLimit: 100,
    defaultRpdLimit: 1000000,
    defaultRpmLimit: 30000000,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const handleInputChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your portal settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Input
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => handleInputChange('siteDescription', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-gray-500">Enable maintenance mode for the portal</p>
              </div>
              <Button
                variant={settings.maintenanceMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleInputChange('maintenanceMode', !settings.maintenanceMode)}
              >
                {settings.maintenanceMode ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Admin Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => handleInputChange('adminEmail', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="adminName">Admin Name</Label>
              <Input
                id="adminName"
                value={settings.adminName}
                onChange={(e) => handleInputChange('adminName', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require MFA</Label>
                <p className="text-sm text-gray-500">Enable multi-factor authentication</p>
              </div>
              <Button
                variant={settings.requireMFA ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleInputChange('requireMFA', !settings.requireMFA)}
              >
                {settings.requireMFA ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div>
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleInputChange('maxLoginAttempts', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Send email notifications</p>
              </div>
              <Button
                variant={settings.emailNotifications ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleInputChange('emailNotifications', !settings.emailNotifications)}
              >
                {settings.emailNotifications ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Health Check Alerts</Label>
                <p className="text-sm text-gray-500">Alert on health check failures</p>
              </div>
              <Button
                variant={settings.healthCheckAlerts ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleInputChange('healthCheckAlerts', !settings.healthCheckAlerts)}
              >
                {settings.healthCheckAlerts ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Usage Alerts</Label>
                <p className="text-sm text-gray-500">Alert on high usage</p>
              </div>
              <Button
                variant={settings.usageAlerts ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleInputChange('usageAlerts', !settings.usageAlerts)}
              >
                {settings.usageAlerts ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Database Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <select
                id="backupFrequency"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={settings.backupFrequency}
                onChange={(e) => handleInputChange('backupFrequency', e.target.value)}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <Label htmlFor="retentionDays">Retention Days</Label>
              <Input
                id="retentionDays"
                type="number"
                value={settings.retentionDays}
                onChange={(e) => handleInputChange('retentionDays', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5" />
              API Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defaultRpsLimit">Default RPS Limit</Label>
              <Input
                id="defaultRpsLimit"
                type="number"
                value={settings.defaultRpsLimit}
                onChange={(e) => handleInputChange('defaultRpsLimit', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="defaultRpdLimit">Default RPD Limit</Label>
              <Input
                id="defaultRpdLimit"
                type="number"
                value={settings.defaultRpdLimit}
                onChange={(e) => handleInputChange('defaultRpdLimit', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="defaultRpmLimit">Default RPM Limit</Label>
              <Input
                id="defaultRpmLimit"
                type="number"
                value={settings.defaultRpmLimit}
                onChange={(e) => handleInputChange('defaultRpmLimit', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Server className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


