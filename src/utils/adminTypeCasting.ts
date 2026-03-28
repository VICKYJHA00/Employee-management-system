import { Database } from '@/types/database';

type AdminProfile = Database['public']['Tables']['admins']['Row'];

export const castToAdminProfile = (data: unknown): AdminProfile => {
  return {
    ...data as AdminProfile,
    role: (data as AdminProfile).role,
  };
};

export const castToAdminProfiles = (data: unknown[]): AdminProfile[] => {
  return data.map(castToAdminProfile);
};
