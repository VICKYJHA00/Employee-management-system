
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type TableName = 'admins' | 'trading_users' | 'attendance' | 'betting_events' | 
                'certificates' | 'chat_messages' | 'esports_players' | 'internships' | 
                'payment_verifications' | 'social_media_orders' | 'uploaded_files' |
                'audit_logs' | 'files' | 'notifications';

export const useTableData = (tableName: TableName) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data: tableData, error: fetchError } = await supabase
          .from(tableName as any)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (fetchError) {
          console.error(`Error fetching ${tableName}:`, fetchError);
          setError(fetchError.message);
        } else {
          setData(tableData || []);
        }
      } catch (err) {
        console.error(`Error in useTableData for ${tableName}:`, err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableName]);

  return { data, loading, error };
};
