import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/database';
import { castToAdminProfile } from '@/utils/adminTypeCasting';
import { toast } from '@/hooks/use-toast';

type AdminProfile = Database['public']['Tables']['admins']['Row'];

interface LocationData {
  ip: string;
  city: string;
  region: string;
  country: string;
  isp: string;
  timezone: string;
}

interface AuthContextType {
  user: User | null;
  adminProfile: AdminProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithOTP: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const fetchAdminProfile = async (userEmail: string, userId: string): Promise<boolean> => {
      try {
        console.log('Fetching admin profile for email:', userEmail);
        
        let { data: profile, error } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (error || !profile) {
          console.log('No profile found by user_id, trying email...');
          const { data: emailProfile, error: emailError } = await supabase
            .from('admins')
            .select('*')
            .eq('email', userEmail)
            .single();
          
          if (!emailError && emailProfile) {
            profile = emailProfile;
            await supabase.from('admins').update({ user_id: userId }).eq('email', userEmail);
          }
        }
        
        if (profile) {
          // Check admin status - logout if not active
          if (!profile.is_active || profile.status === 'suspended' || profile.status === 'on_leave') {
            const msg = !profile.is_active ? "Your account has been disabled." 
              : profile.status === 'suspended' ? "Your account has been suspended."
              : "You are currently on leave.";
            toast({ title: "Access Denied", description: msg + " Please contact super admin.", variant: "destructive" });
            await supabase.auth.signOut();
            setUser(null);
            setAdminProfile(null);
            setSession(null);
            return false;
          }
          setAdminProfile(castToAdminProfile(profile));
          return true;
        } else {
          setAdminProfile(null);
          return false;
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
        setAdminProfile(null);
        return false;
      }
    };

    const initializeAuth = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user?.email) {
          setTimeout(() => fetchAdminProfile(session.user.email!, session.user.id), 0);
        } else {
          setAdminProfile(null);
        }
      });

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.email) await fetchAdminProfile(session.user.email, session.user.id);
      setIsInitialized(true);
      return () => subscription.unsubscribe();
    };

    let cleanup: (() => void) | undefined;
    initializeAuth().then((c) => { cleanup = c; });
    return () => { if (cleanup) cleanup(); };
  }, []);

  const getLocationData = async (): Promise<LocationData> => {
    const unknown: LocationData = { ip: 'Unknown', city: 'Unknown', region: 'Unknown', country: 'Unknown', isp: 'Unknown', timezone: 'Unknown' };
    try {
      const response = await supabase.functions.invoke('get-location');
      if (response.data && !response.error) return { ...unknown, ...response.data };
    } catch { }
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ip = (await ipRes.json())?.ip;
      if (!ip) return unknown;
      const whois = await (await fetch(`https://ipwho.is/${ip}`)).json();
      return { ip, city: whois?.city || unknown.city, region: whois?.region || unknown.region, country: whois?.country || unknown.country, isp: whois?.connection?.isp || unknown.isp, timezone: whois?.timezone?.id || unknown.timezone };
    } catch { return unknown; }
  };

  const logLoginActivity = async (adminId: string, email: string, locationData: LocationData) => {
    try {
      await supabase.from('admin_activity_logs').insert({ admin_id: adminId, action: 'Logged in via OTP', details: { ...locationData, timestamp: new Date().toISOString() } } as any);
      await supabase.from('audit_logs').insert({ admin_id: adminId, action: 'LOGIN_OTP', details: { email, ip: locationData.ip, location: `${locationData.city}, ${locationData.region}, ${locationData.country}`, isp: locationData.isp, timezone: locationData.timezone } });
    } catch (error) { console.error('Error logging login activity:', error); }
  };

  const loginWithOTP = async (email: string, otp: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('verify-otp', { body: { email, otp } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (!data?.success) throw new Error('OTP verification failed');

    if (data.token_hash && data.type) {
      const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: data.type });
      if (verifyError) throw verifyError;
    } else if (data.actionLink) {
      const url = new URL(data.actionLink);
      const token_hash = url.searchParams.get('token_hash') || url.hash.split('token_hash=')[1]?.split('&')[0];
      if (token_hash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash, type: 'magiclink' as any });
        if (verifyError) throw verifyError;
      } else {
        window.location.href = data.actionLink;
        return;
      }
    }
    if (data.adminId) {
      const locationData = await getLocationData();
      await logLoginActivity(data.adminId, email, locationData);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const userId = data.user?.id;
    let adminId: string | undefined;
    const { data: byUserId } = await supabase.from('admins').select('id').eq('user_id', userId).limit(1);
    adminId = byUserId?.[0]?.id;
    if (!adminId) {
      const { data: byEmail } = await supabase.from('admins').select('id').eq('email', email).limit(1);
      adminId = byEmail?.[0]?.id;
    }
    if (adminId) {
      const locationData = await getLocationData();
      await logLoginActivity(adminId, email, locationData);
      await supabase.from('admins').update({ last_login: new Date().toISOString() }).eq('id', adminId);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAdminProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, adminProfile, session, login, loginWithOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};