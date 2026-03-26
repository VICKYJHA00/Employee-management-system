
import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Search, Filter, RefreshCw } from 'lucide-react';
import { Database } from '@/types/database';
import { castToAdminProfiles } from '@/utils/adminTypeCasting';

type AdminProfile = Database['public']['Tables']['admins']['Row'];

interface AdminListProps {
  admins: any[];
  onAdminsChange: (admins: AdminProfile[]) => void;
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-red-500/10 text-red-400 border-red-500/20',
  tech_admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  esports_admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  social_admin: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  hr_admin: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const AdminList: React.FC<AdminListProps> = ({ admins, onAdminsChange }) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Cast admins
  const typedAdmins = useMemo(() => castToAdminProfiles(admins), [admins]);

  useEffect(() => {
    onAdminsChange(typedAdmins);
  }, [typedAdmins, onAdminsChange]);

  // Filter logic
  const filteredAdmins = useMemo(() => {
    return typedAdmins.filter((admin) => {
      const matchesSearch = admin.name.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter ? admin.role === roleFilter : true;
      const matchesActive =
        activeFilter === 'all'
          ? true
          : activeFilter === 'active'
          ? admin.is_active
          : !admin.is_active;

      return matchesSearch && matchesRole && matchesActive;
    });
  }, [typedAdmins, search, roleFilter, activeFilter]);

  const roles = Array.from(new Set(typedAdmins.map((a) => a.role)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Admin Management</h2>
          <p className="text-sm text-muted-foreground">Manage all admin users and permissions</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSearch('')}>
            <RefreshCw className="h-4 w-4 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search admins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          className="bg-background border rounded-md px-3 py-2 text-sm"
          onChange={(e) => setRoleFilter(e.target.value || null)}
        >
          <option value="">All Roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role.replace('_', ' ')}
            </option>
          ))}
        </select>

        <select
          className="bg-background border rounded-md px-3 py-2 text-sm"
          onChange={(e) => setActiveFilter(e.target.value as any)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Admins</p>
            <p className="text-2xl font-bold">{typedAdmins.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-400">
              {typedAdmins.filter((a) => a.is_active).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Inactive</p>
            <p className="text-2xl font-bold text-gray-400">
              {typedAdmins.filter((a) => !a.is_active).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin List */}
      <div className="grid gap-3">
        {filteredAdmins.map((admin) => (
          <Card key={admin.id} className="hover:bg-white/5 transition">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={admin.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                    {admin.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="font-semibold text-lg">{admin.name}</p>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>

                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={roleColors[admin.role] || ''}>
                      {admin.role.replace('_', ' ')}
                    </Badge>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        admin.is_active
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => console.log('View', admin.id)}>
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log('Edit', admin.id)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log('Toggle', admin.id)}>
                    {admin.is_active ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-500" onClick={() => console.log('Delete', admin.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ))}

        {filteredAdmins.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            No admins found.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminList;
