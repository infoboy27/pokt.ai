'use client';

import { useState, useEffect } from 'react';
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
  Key,
  Crown,
  Users,
  Activity,
  Globe,
  Mail,
  Smartphone,
  CreditCard,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SettingsPage() {
  // Customer Settings State
  const [customerSettings, setCustomerSettings] = useState({
    // Profile Settings
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    
    // Notification Preferences
    emailNotifications: true,
    smsNotifications: false,
    usageAlerts: true,
    maintenanceAlerts: true,
    billingAlerts: true,
    
    // API Preferences
    defaultChain: 'ethereum',
    autoScale: true,
    rateLimitNotifications: true,
    
    // Security Preferences
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginNotifications: true,
  });

  // Admin Settings State
  const [adminSettings, setAdminSettings] = useState({
    // Portal Settings
    siteName: 'POKT.ai Portal',
    siteDescription: 'AI-powered RPC Gateway',
    maintenanceMode: false,
    registrationEnabled: true,
    
    // Admin Settings
    adminEmail: 'admin@pokt.ai',
    adminName: 'Portal Administrator',
    supportEmail: 'support@pokt.ai',
    
    // Security Settings
    sessionTimeout: 30,
    requireMFA: false,
    maxLoginAttempts: 5,
    passwordPolicy: 'strong',
    
    // Notification Settings
    emailNotifications: true,
    healthCheckAlerts: true,
    usageAlerts: true,
    systemAlerts: true,
    
    // Database Settings
    backupFrequency: 'daily',
    retentionDays: 30,
    autoBackup: true,
    
    // API Settings
    defaultRpsLimit: 100,
    defaultRpdLimit: 1000000,
    defaultRpmLimit: 30000000,
    globalRateLimit: true,
    
    // System Settings
    logLevel: 'info',
    debugMode: false,
    analyticsEnabled: true,
  });

  // User role state
  const [userRole, setUserRole] = useState<'admin' | 'customer' | 'loading'>('loading');
  const [saving, setSaving] = useState(false);

  // Detect user role
  useEffect(() => {
    const detectUserRole = async () => {
      try {
        // Check if user is admin by looking for admin-specific data or API endpoint
        const response = await fetch('/api/auth/me');
        const userData = await response.json();
        
        // Check if user has admin privileges
        const isAdmin = userData?.role === 'admin' || 
                       userData?.email?.includes('admin') || 
                       userData?.isAdmin === true;
        
        setUserRole(isAdmin ? 'admin' : 'customer');
      } catch (error) {
        console.error('Error detecting user role:', error);
        setUserRole('customer'); // Default to customer
      }
    };

    detectUserRole();
  }, []);

  const handleCustomerSave = async () => {
    setSaving(true);
    try {
      // Save customer settings
      await fetch('/api/settings/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerSettings),
      });
    } catch (error) {
      console.error('Error saving customer settings:', error);
    }
    setSaving(false);
  };

  const handleAdminSave = async () => {
    setSaving(true);
    try {
      // Save admin settings
      await fetch('/api/settings/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminSettings),
      });
    } catch (error) {
      console.error('Error saving admin settings:', error);
    }
    setSaving(false);
  };

  const handleCustomerInputChange = (key: string, value: any) => {
    setCustomerSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAdminInputChange = (key: string, value: any) => {
    setAdminSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Loading state
  if (userRole === 'loading') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Loading your settings...</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card animate-pulse h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  // Customer Settings Interface
  if (userRole === 'customer') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and notification settings
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <User className="mr-1 h-3 w-3" />
            Customer Account
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Settings */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5 text-blue-600" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={customerSettings.firstName}
                    onChange={(e) => handleCustomerInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={customerSettings.lastName}
                    onChange={(e) => handleCustomerInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerSettings.email}
                  onChange={(e) => handleCustomerInputChange('email', e.target.value)}
                  placeholder="your.email@company.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerSettings.phone}
                  onChange={(e) => handleCustomerInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={customerSettings.company}
                  onChange={(e) => handleCustomerInputChange('company', e.target.value)}
                  placeholder="Your company name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5 text-green-600" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Button
                  variant={customerSettings.emailNotifications ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCustomerInputChange('emailNotifications', !customerSettings.emailNotifications)}
                >
                  {customerSettings.emailNotifications ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via SMS</p>
                </div>
                <Button
                  variant={customerSettings.smsNotifications ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCustomerInputChange('smsNotifications', !customerSettings.smsNotifications)}
                >
                  {customerSettings.smsNotifications ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Usage Alerts</Label>
                  <p className="text-sm text-muted-foreground">Alert when approaching limits</p>
                </div>
                <Button
                  variant={customerSettings.usageAlerts ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCustomerInputChange('usageAlerts', !customerSettings.usageAlerts)}
                >
                  {customerSettings.usageAlerts ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notify about scheduled maintenance</p>
                </div>
                <Button
                  variant={customerSettings.maintenanceAlerts ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCustomerInputChange('maintenanceAlerts', !customerSettings.maintenanceAlerts)}
                >
                  {customerSettings.maintenanceAlerts ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Billing Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notify about billing updates</p>
                </div>
                <Button
                  variant={customerSettings.billingAlerts ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCustomerInputChange('billingAlerts', !customerSettings.billingAlerts)}
                >
                  {customerSettings.billingAlerts ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Preferences */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5 text-purple-600" />
                API Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="defaultChain">Default Blockchain</Label>
                <select
                  id="defaultChain"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={customerSettings.defaultChain}
                  onChange={(e) => handleCustomerInputChange('defaultChain', e.target.value)}
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="polygon">Polygon</option>
                  <option value="bsc">BSC</option>
                  <option value="avalanche">Avalanche</option>
                  <option value="arbitrum">Arbitrum</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Scale</Label>
                  <p className="text-sm text-muted-foreground">Automatically scale resources</p>
                </div>
                <Button
                  variant={customerSettings.autoScale ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCustomerInputChange('autoScale', !customerSettings.autoScale)}
                >
                  {customerSettings.autoScale ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Rate Limit Notifications</Label>
                  <p className="text-sm text-muted-foreground">Alert when rate limits are hit</p>
                </div>
                <Button
                  variant={customerSettings.rateLimitNotifications ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCustomerInputChange('rateLimitNotifications', !customerSettings.rateLimitNotifications)}
                >
                  {customerSettings.rateLimitNotifications ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-orange-600" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button
                  variant={customerSettings.twoFactorAuth ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCustomerInputChange('twoFactorAuth', !customerSettings.twoFactorAuth)}
                >
                  {customerSettings.twoFactorAuth ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={customerSettings.sessionTimeout}
                  onChange={(e) => handleCustomerInputChange('sessionTimeout', parseInt(e.target.value))}
                  min="5"
                  max="480"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Login Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notify about new login attempts</p>
                </div>
                <Button
                  variant={customerSettings.loginNotifications ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCustomerInputChange('loginNotifications', !customerSettings.loginNotifications)}
                >
                  {customerSettings.loginNotifications ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleCustomerSave} disabled={saving} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
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

  // Admin Settings Interface
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portal Administration</h1>
          <p className="text-muted-foreground">
            Configure system settings, security policies, and portal management
          </p>
        </div>
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <Crown className="mr-1 h-3 w-3" />
          Administrator
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Portal Settings */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="mr-2 h-5 w-5 text-blue-600" />
              Portal Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={adminSettings.siteName}
                onChange={(e) => handleAdminInputChange('siteName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Input
                id="siteDescription"
                value={adminSettings.siteDescription}
                onChange={(e) => handleAdminInputChange('siteDescription', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Enable maintenance mode for the portal</p>
              </div>
              <Button
                variant={adminSettings.maintenanceMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAdminInputChange('maintenanceMode', !adminSettings.maintenanceMode)}
              >
                {adminSettings.maintenanceMode ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Registration Enabled</Label>
                <p className="text-sm text-muted-foreground">Allow new user registrations</p>
              </div>
              <Button
                variant={adminSettings.registrationEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAdminInputChange('registrationEnabled', !adminSettings.registrationEnabled)}
              >
                {adminSettings.registrationEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Settings */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="mr-2 h-5 w-5 text-green-600" />
              Admin Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminSettings.adminEmail}
                onChange={(e) => handleAdminInputChange('adminEmail', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="adminName">Admin Name</Label>
              <Input
                id="adminName"
                value={adminSettings.adminName}
                onChange={(e) => handleAdminInputChange('adminName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={adminSettings.supportEmail}
                onChange={(e) => handleAdminInputChange('supportEmail', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-red-600" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={adminSettings.sessionTimeout}
                onChange={(e) => handleAdminInputChange('sessionTimeout', parseInt(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require MFA</Label>
                <p className="text-sm text-muted-foreground">Enable multi-factor authentication</p>
              </div>
              <Button
                variant={adminSettings.requireMFA ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAdminInputChange('requireMFA', !adminSettings.requireMFA)}
              >
                {adminSettings.requireMFA ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div>
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={adminSettings.maxLoginAttempts}
                onChange={(e) => handleAdminInputChange('maxLoginAttempts', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="passwordPolicy">Password Policy</Label>
              <select
                id="passwordPolicy"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={adminSettings.passwordPolicy}
                onChange={(e) => handleAdminInputChange('passwordPolicy', e.target.value)}
              >
                <option value="weak">Weak</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
                <option value="very-strong">Very Strong</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5 text-purple-600" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="logLevel">Log Level</Label>
              <select
                id="logLevel"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={adminSettings.logLevel}
                onChange={(e) => handleAdminInputChange('logLevel', e.target.value)}
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Debug Mode</Label>
                <p className="text-sm text-muted-foreground">Enable debug logging</p>
              </div>
              <Button
                variant={adminSettings.debugMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAdminInputChange('debugMode', !adminSettings.debugMode)}
              >
                {adminSettings.debugMode ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Analytics Enabled</Label>
                <p className="text-sm text-muted-foreground">Collect usage analytics</p>
              </div>
              <Button
                variant={adminSettings.analyticsEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAdminInputChange('analyticsEnabled', !adminSettings.analyticsEnabled)}
              >
                {adminSettings.analyticsEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5 text-yellow-600" />
              Database Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <select
                id="backupFrequency"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={adminSettings.backupFrequency}
                onChange={(e) => handleAdminInputChange('backupFrequency', e.target.value)}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <Label htmlFor="retentionDays">Retention Days</Label>
              <Input
                id="retentionDays"
                type="number"
                value={adminSettings.retentionDays}
                onChange={(e) => handleAdminInputChange('retentionDays', parseInt(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Backup</Label>
                <p className="text-sm text-muted-foreground">Automatically backup database</p>
              </div>
              <Button
                variant={adminSettings.autoBackup ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAdminInputChange('autoBackup', !adminSettings.autoBackup)}
              >
                {adminSettings.autoBackup ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5 text-indigo-600" />
              API Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defaultRpsLimit">Default RPS Limit</Label>
              <Input
                id="defaultRpsLimit"
                type="number"
                value={adminSettings.defaultRpsLimit}
                onChange={(e) => handleAdminInputChange('defaultRpsLimit', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="defaultRpdLimit">Default RPD Limit</Label>
              <Input
                id="defaultRpdLimit"
                type="number"
                value={adminSettings.defaultRpdLimit}
                onChange={(e) => handleAdminInputChange('defaultRpdLimit', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="defaultRpmLimit">Default RPM Limit</Label>
              <Input
                id="defaultRpmLimit"
                type="number"
                value={adminSettings.defaultRpmLimit}
                onChange={(e) => handleAdminInputChange('defaultRpmLimit', parseInt(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Global Rate Limit</Label>
                <p className="text-sm text-muted-foreground">Apply global rate limiting</p>
              </div>
              <Button
                variant={adminSettings.globalRateLimit ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleAdminInputChange('globalRateLimit', !adminSettings.globalRateLimit)}
              >
                {adminSettings.globalRateLimit ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleAdminSave} disabled={saving} className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white">
          {saving ? (
            <>
              <Server className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Admin Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


