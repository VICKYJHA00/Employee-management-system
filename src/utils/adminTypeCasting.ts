
import { Database } from '@/types/database';

type AdminProfile = Database['public']['Tables']['admins']['Row'];

export const castToAdminProfile = (data: any): AdminProfile => {
  return {
    ...data,
    role: data.role as AdminProfile['role']
  };
};

export const castToAdminProfiles = (data: any[]): AdminProfile[] => {
  return data.map(castToAdminProfile);
};
