'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Users, 
  Plus, 
  Mail, 
  MoreVertical,
  UserPlus,
  Shield,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock data
const members = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@demo-org.com',
    role: 'Owner',
    status: 'active',
    joinedAt: '2024-01-01',
    avatar: 'JD',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@demo-org.com',
    role: 'Developer',
    status: 'active',
    joinedAt: '2024-01-15',
    avatar: 'JS',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@demo-org.com',
    role: 'Developer',
    status: 'pending',
    joinedAt: '2024-02-01',
    avatar: 'BJ',
  },
];

const roles = [
  { value: 'owner', label: 'Owner', description: 'Full access to all features' },
  { value: 'admin', label: 'Admin', description: 'Manage organization and members' },
  { value: 'developer', label: 'Developer', description: 'Create and manage endpoints' },
  { value: 'viewer', label: 'Viewer', description: 'View-only access' },
];

export default function MembersPage() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    email: '',
    role: '',
  });
  const { toast } = useToast();

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'developer':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const inviteMember = () => {
    if (!newMember.email || !newMember.role) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Invitation sent!',
      description: `Invitation sent to ${newMember.email}`,
    });

    setNewMember({ email: '', role: '' });
    setIsInviteDialogOpen(false);
  };

  const removeMember = (memberId: string, memberName: string) => {
    toast({
      title: 'Member removed',
      description: `${memberName} has been removed from the organization`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">Team Members</h1>
          <p className="text-muted-foreground">Manage your organization's team members and their roles</p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newMember.role} onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={inviteMember}>
                <Mail className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? 's' : ''} in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{member.avatar}</span>
                  </div>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">{member.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getRoleColor(member.role)}>
                    {member.role}
                  </Badge>
                  <Badge className={getStatusColor(member.status)}>
                    {member.status}
                  </Badge>
                  {member.role !== 'Owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(member.id, member.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>Understand what each role can do in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => (
              <div key={role.value} className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">{role.label}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                <div className="space-y-1">
                  {role.value === 'owner' && (
                    <>
                      <div className="text-xs">✓ Full organization access</div>
                      <div className="text-xs">✓ Manage billing and settings</div>
                      <div className="text-xs">✓ Invite and remove members</div>
                    </>
                  )}
                  {role.value === 'admin' && (
                    <>
                      <div className="text-xs">✓ Manage organization settings</div>
                      <div className="text-xs">✓ Invite and manage members</div>
                      <div className="text-xs">✓ View billing information</div>
                    </>
                  )}
                  {role.value === 'developer' && (
                    <>
                      <div className="text-xs">✓ Create and manage endpoints</div>
                      <div className="text-xs">✓ View usage analytics</div>
                      <div className="text-xs">✓ Access API documentation</div>
                    </>
                  )}
                  {role.value === 'viewer' && (
                    <>
                      <div className="text-xs">✓ View endpoints and usage</div>
                      <div className="text-xs">✓ Read-only access</div>
                      <div className="text-xs">✓ No modification permissions</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
