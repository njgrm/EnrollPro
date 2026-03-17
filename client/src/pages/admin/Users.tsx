import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { sileo } from 'sileo';
import { 
  UserCog, 
  Plus, 
  Edit2, 
  Key, 
  UserMinus, 
  UserCheck, 
  RefreshCw, 
  ShieldAlert,
  Check,
  Copy
} from 'lucide-react';
import api from '@/api/axiosInstance';
import { toastApiError } from '@/hooks/useApiToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'REGISTRAR' | 'TEACHER' | 'SYSTEM_ADMIN';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  createdBy: { name: string } | null;
}

interface FetchUsersParams {
  page: number;
  limit: number;
  role?: string;
  isActive?: boolean;
}

function generatePassword() {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let retVal = "";
  
  // Ensure at least one of each required type
  retVal += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  retVal += "0123456789"[Math.floor(Math.random() * 10)];
  retVal += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)];
  
  for (let i = 0; i < length - 3; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle
  return retVal.split('').sort(() => 0.5 - Math.random()).join('');
}

export default function AdminUsers() {
  const { schoolName } = useSettingsStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deactivateId, setDeactivateId] = useState<number | null>(null);
  const [reactivateId, setReactivateId] = useState<number | null>(null);

  // Form States
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'TEACHER' as 'REGISTRAR' | 'TEACHER',
    password: '',
    mustChangePassword: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: FetchUsersParams = { page, limit: 20 };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active';
      
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users);
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await api.post('/admin/users', formData);
      sileo.success({ title: 'Account Created', description: `${formData.name} has been added as a ${formData.role.toLowerCase()}.` });
      setCreateOpen(false);
      fetchUsers();
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}`, {
        name: formData.name,
        email: formData.email,
        role: formData.role
      });
      sileo.success({ title: 'Account Updated', description: 'Changes saved successfully. User must re-login for role changes.' });
      setEditOpen(false);
      fetchUsers();
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${selectedUser.id}/reset-password`, {
        newPassword: formData.password,
        mustChangePassword: formData.mustChangePassword
      });
      sileo.success({ title: 'Password Reset', description: `New password generated for ${selectedUser.name}.` });
      setResetOpen(false);
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number, action: 'deactivate' | 'reactivate') => {
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${id}/${action}`);
      sileo.success({ 
        title: action === 'deactivate' ? 'Account Deactivated' : 'Account Reactivated',
        description: `User status updated successfully.`
      });
      setDeactivateId(null);
      setReactivateId(null);
      fetchUsers();
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserCog className="h-8 w-8 text-[hsl(var(--primary))]" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Provision and manage staff accounts{schoolName ? ` for ${schoolName}` : ''}
          </p>
        </div>
        <Button onClick={() => {
          setFormData({ name: '', email: '', role: 'TEACHER', password: generatePassword(), mustChangePassword: true });
          setCreateOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold">System Users</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold uppercase opacity-60">Role:</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="REGISTRAR">Registrars</SelectItem>
                    <SelectItem value="TEACHER">Teachers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold uppercase opacity-60">Status:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={fetchUsers}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Last Login</th>
                  <th className="px-4 py-3 text-left font-medium">Created By</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-4 py-4"><div className="h-4 bg-muted rounded w-full"></div></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No users found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className={`hover:bg-muted/30 transition-colors ${!user.isActive ? 'opacity-60 bg-muted/10' : ''}`}>
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={
                          user.role === 'REGISTRAR' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                          user.role === 'TEACHER' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                          'border-purple-200 bg-purple-50 text-purple-700'
                        }>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                          <span className="text-xs">{user.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                        }) : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-xs">{user.createdBy?.name || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-xs"
                            onClick={() => {
                              setSelectedUser(user);
                              setFormData({ name: user.name, email: user.email, role: user.role as 'REGISTRAR' | 'TEACHER', password: '', mustChangePassword: true });
                              setEditOpen(true);
                            }}
                          >
                            <Edit2 className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-xs"
                            onClick={() => {
                              setSelectedUser(user);
                              setFormData({ ...formData, password: generatePassword(), mustChangePassword: true });
                              setResetOpen(true);
                            }}
                          >
                            <Key className="h-3 w-3 mr-1" /> Reset PW
                          </Button>
                          {user.isActive ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeactivateId(user.id)}
                            >
                              <UserMinus className="h-3 w-3 mr-1" /> Deactivate
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50"
                              onClick={() => setReactivateId(user.id)}
                            >
                              <UserCheck className="h-3 w-3 mr-1" /> Reactivate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Create User Account</DialogTitle>
            <DialogDescription>Add a new Registrar or Teacher to the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input 
                placeholder="e.g. Cruz, Regina A." 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input 
                type="email" 
                placeholder="registrar@school.edu.ph" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
              />
              <p className="text-[10px] text-muted-foreground italic">This will be the unique login email.</p>
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <RadioGroup value={formData.role} onValueChange={(v: 'REGISTRAR' | 'TEACHER') => setFormData({ ...formData, role: v })} className="flex flex-col gap-3 mt-2">
                <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                  <RadioGroupItem value="REGISTRAR" id="role-reg" className="mt-1" />
                  <Label htmlFor="role-reg" className="flex flex-col gap-1 cursor-pointer">
                    <span className="font-bold">Registrar</span>
                    <span className="text-xs text-muted-foreground leading-normal">Full access to enrollment, applications, students, and school settings.</span>
                  </Label>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                  <RadioGroupItem value="TEACHER" id="role-tea" className="mt-1" />
                  <Label htmlFor="role-tea" className="flex flex-col gap-1 cursor-pointer">
                    <span className="font-bold">Teacher</span>
                    <span className="text-xs text-muted-foreground leading-normal">Read-only access to assigned sections and class lists. Scoped dashboard.</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Temporary Password *</Label>
              <div className="flex gap-2">
                <Input 
                  value={formData.password} 
                  onChange={e => setFormData({ ...formData, password: e.target.value })} 
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => setFormData({ ...formData, password: generatePassword() })} title="Generate new password">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard(formData.password)} title="Copy to clipboard">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="must-change" 
                checked={formData.mustChangePassword} 
                onCheckedChange={(v: boolean) => setFormData({ ...formData, mustChangePassword: v })} 
              />
              <Label htmlFor="must-change" className="text-sm cursor-pointer">Require password change on first login</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting || !formData.name || !formData.email || !formData.password}>
              {submitting ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-112.5">
          <DialogHeader>
            <DialogTitle>Edit User Account</DialogTitle>
            <DialogDescription>Update profile details for {selectedUser?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={formData.role} onValueChange={(v: 'REGISTRAR' | 'TEACHER') => setFormData({ ...formData, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGISTRAR">Registrar</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleEdit} disabled={submitting || !formData.name || !formData.email}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-112.5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-600" />
              Reset Password
            </DialogTitle>
            <DialogDescription>Generate a new temporary password for {selectedUser?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-100 text-xs text-orange-800 leading-relaxed">
              <strong>Warning:</strong> Existing login sessions for this user will be invalidated. Share the new password through a secure offline channel.
            </div>
            <div className="space-y-2">
              <Label>New Password *</Label>
              <div className="flex gap-2">
                <Input 
                  value={formData.password} 
                  onChange={e => setFormData({ ...formData, password: e.target.value })} 
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => setFormData({ ...formData, password: generatePassword() })}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard(formData.password)}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="reset-must-change" 
                checked={formData.mustChangePassword} 
                onCheckedChange={(v: boolean) => setFormData({ ...formData, mustChangePassword: v })} 
              />
              <Label htmlFor="reset-must-change" className="text-sm cursor-pointer">Require password change on next login</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={submitting || !formData.password}>
              {submitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={!!deactivateId}
        onOpenChange={(open) => !open && setDeactivateId(null)}
        title="Deactivate Account"
        description="This user will immediately lose access to the system. All their historical data (audit logs, approvals) will be preserved."
        confirmText="Yes, Deactivate"
        onConfirm={() => deactivateId && handleToggleStatus(deactivateId, 'deactivate')}
        loading={submitting}
      />

      <ConfirmationModal
        open={!!reactivateId}
        onOpenChange={(open) => !open && setReactivateId(null)}
        title="Reactivate Account"
        description="This user will regain access to the system with their previous role and permissions."
        confirmText="Yes, Reactivate"
        onConfirm={() => reactivateId && handleToggleStatus(reactivateId, 'reactivate')}
        loading={submitting}
      />
    </div>
  );
}
