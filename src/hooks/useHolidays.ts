import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Holiday {
  id: string;
  date: string;
  name: string;
  description?: string;
  is_recurring: boolean;
  created_by?: string;
  created_at: string;
}

export const useHolidays = () => {
  const { adminProfile } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHolidays = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setHolidays(data || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const addHoliday = useCallback(async (holiday: {
    date: string;
    name: string;
    description?: string;
    is_recurring?: boolean;
  }) => {
    if (!adminProfile?.id) return null;

    try {
      const { data, error } = await supabase
        .from('holidays')
        .insert({
          ...holiday,
          is_recurring: holiday.is_recurring || false,
          created_by: adminProfile.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setHolidays(prev => [...prev, data].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
      
      toast({ title: 'Holiday added successfully' });
      return data;
    } catch (error: any) {
      console.error('Error adding holiday:', error);
      toast({ title: 'Failed to add holiday', description: error.message, variant: 'destructive' });
      return null;
    }
  }, [adminProfile?.id]);

  const deleteHoliday = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHolidays(prev => prev.filter(h => h.id !== id));
      toast({ title: 'Holiday deleted successfully' });
      return true;
    } catch (error: any) {
      console.error('Error deleting holiday:', error);
      toast({ title: 'Failed to delete holiday', description: error.message, variant: 'destructive' });
      return false;
    }
  }, []);

  const isHoliday = useCallback((date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.some(h => h.date === dateStr);
  }, [holidays]);

  const getHolidaysInMonth = useCallback((year: number, month: number): Holiday[] => {
    return holidays.filter(h => {
      const holidayDate = new Date(h.date);
      return holidayDate.getFullYear() === year && holidayDate.getMonth() === month;
    });
  }, [holidays]);

  const getWorkingDaysExcludingHolidays = useCallback((
    year: number, 
    month: number, 
    upToDay: number
  ): number => {
    let workingDays = 0;
    for (let day = 1; day <= upToDay; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      // Exclude weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Check if it's not a holiday
        if (!isHoliday(date)) {
          workingDays++;
        }
      }
    }
    return workingDays;
  }, [isHoliday]);

  return {
    holidays,
    isLoading,
    fetchHolidays,
    addHoliday,
    deleteHoliday,
    isHoliday,
    getHolidaysInMonth,
    getWorkingDaysExcludingHolidays
  };
};

export default useHolidays;
