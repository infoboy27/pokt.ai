'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Building, 
  Users, 
  Shield, 
  Bell,
  Save,
  Edit
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">Settings</h1>
          <p className="text-muted-foreground">Manage your organization and account settings</p>
        </div>
      </div>

      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-primary" />
            <CardTitle>Organization Settings</CardTitle>
          </div>
          <CardDescription>Update your organization's information and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input id="org-name" defaultValue="Demo Organization" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">Billing Email</Label>
              <Input id="org-email" defaultValue="billing@demo-org.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-address">Address</Label>
            <Input id="org-address" defaultValue="123 Demo Street, San Francisco, CA 94102" />
          </div>
          <div className="flex justify-end">
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>Team Members</CardTitle>
            </div>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>
          <CardDescription>Manage team members and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">JD</span>
                </div>
                <div>
                  <div className="font-medium">John Doe</div>
                  <div className="text-sm text-muted-foreground">john@demo-org.com</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Owner</Badge>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-secondary">JS</span>
                </div>
                <div>
                  <div className="font-medium">Jane Smith</div>
                  <div className="text-sm text-muted-foreground">jane@demo-org.com</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Developer</Badge>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Manage security settings and API keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Two-Factor Authentication</div>
                <div className="text-sm text-muted-foreground">Add an extra layer of security to your account</div>
              </div>
              <Button variant="outline">Enable</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Session Management</div>
                <div className="text-sm text-muted-foreground">View and manage active sessions</div>
              </div>
              <Button variant="outline">Manage Sessions</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">API Keys</div>
                <div className="text-sm text-muted-foreground">Manage API keys for programmatic access</div>
              </div>
              <Button variant="outline">Manage Keys</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Configure your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email Notifications</div>
              <div className="text-sm text-muted-foreground">Receive updates via email</div>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Usage Alerts</div>
              <div className="text-sm text-muted-foreground">Get notified when usage exceeds thresholds</div>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Billing Notifications</div>
              <div className="text-sm text-muted-foreground">Receive billing and payment updates</div>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <div className="font-medium text-red-600">Delete Organization</div>
              <div className="text-sm text-muted-foreground">
                Permanently delete your organization and all associated data
              </div>
            </div>
            <Button variant="destructive">Delete Organization</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
