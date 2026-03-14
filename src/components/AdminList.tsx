
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Database } from '@/types/database';
import { castToAdminProfiles } from '@/utils/adminTypeCasting';

type AdminProfile = Database['public']['Tables']['admins']['Row'];

interface AdminListProps {
  admins: any[];
  onAdminsChange: (admins: AdminProfile[]) => void;
}

const AdminList: React.FC<AdminListProps> = ({ admins, onAdminsChange }) => {
  // Cast the admins to the proper type and update parent component
  React.useEffect(() => {
    const typedAdmins = castToAdminProfiles(admins);
    onAdminsChange(typedAdmins);
  }, [admins, onAdminsChange]);

  const typedAdmins = castToAdminProfiles(admins);

  return (
    <div className="space-y-2">
      {typedAdmins.map((admin) => (
        <div key={admin.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5">
          <Avatar className="h-8 w-8">
            <AvatarImage src={admin.avatar || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xs">
              {admin.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{admin.name}</p>
            <p className="text-xs text-muted-foreground">{admin.role.replace('_', ' ')}</p>
          </div>
          <div className={`w-2 h-2 rounded-full ${admin.is_active ? 'bg-green-500' : 'bg-gray-500'}`} />
        </div>
      ))}
    </div>
  );
};

export default AdminList;
