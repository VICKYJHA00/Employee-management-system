
export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          role: 'super_admin' | 'betting_admin' | 'trading_admin' | 'social_admin' | 'esports_admin';
          avatar: string | null;
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          role: 'super_admin' | 'betting_admin' | 'trading_admin' | 'social_admin' | 'esports_admin';
          avatar?: string | null;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          role?: 'super_admin' | 'betting_admin' | 'trading_admin' | 'social_admin' | 'esports_admin';
          avatar?: string | null;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      uploaded_files: {
        Row: {
          id: string;
          name: string;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          file_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          file_path?: string;
          file_size?: number | null;
          mime_type?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          admin_id: string;
          date: string;
          status: 'present' | 'absent' | 'late';
          reason: string | null;
          marked_at: string;
          marked_by: string | null;
        };
        Insert: {
          id?: string;
          admin_id: string;
          date?: string;
          status: 'present' | 'absent' | 'late';
          reason?: string | null;
          marked_at?: string;
          marked_by?: string | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          sender_id: string;
          content: string;
          file_url: string | null;
          file_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          content: string;
          file_url?: string | null;
          file_name?: string | null;
          created_at?: string;
        };
      };
      analytics_data: {
        Row: {
          id: string;
          domain: string;
          metric_type: string;
          value: number;
          date: string;
          admin_id: string | null;
          created_at: string;
        };
      };
      payment_verifications: {
        Row: {
          id: string;
          user_name: string;
          user_email: string;
          transaction_id: string;
          amount: number | null;
          payment_received: boolean;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_name: string;
          user_email: string;
          transaction_id: string;
          amount?: number | null;
          payment_received?: boolean;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
        };
      };
      certificates: {
        Row: {
          id: string;
          certificate_id: string;
          participant_name: string;
          participant_email: string;
          course_name: string;
          issue_date: string;
          issued_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          certificate_id: string;
          participant_name: string;
          participant_email: string;
          course_name: string;
          issue_date?: string;
          issued_by: string;
          created_at?: string;
        };
      };
      internships: {
        Row: {
          id: string;
          intern_name: string;
          intern_email: string;
          intern_id: string;
          join_date: string;
          end_date: string | null;
          department: string | null;
          status: string;
          assigned_to: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          intern_name: string;
          intern_email: string;
          intern_id: string;
          join_date: string;
          end_date?: string | null;
          department?: string | null;
          status?: string;
          assigned_to?: string | null;
          created_at?: string;
        };
      };
      esports_players: {
        Row: {
          id: string;
          player_name: string;
          game_uid: string;
          email: string;
          tournament_name: string;
          entry_fees: number;
          payment_received: boolean;
          registered_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_name: string;
          game_uid: string;
          email: string;
          tournament_name: string;
          entry_fees: number;
          payment_received?: boolean;
          registered_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      social_media_orders: {
        Row: {
          id: string;
          post_account_link: string;
          service_type: string;
          order_type: string;
          quantity: number;
          payment_amount: number;
          payment_received: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_account_link: string;
          service_type: string;
          order_type: string;
          quantity: number;
          payment_amount: number;
          payment_received?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      trading_users: {
        Row: {
          id: string;
          user_name: string;
          email: string;
          wallet_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_name: string;
          email: string;
          wallet_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      player_stocks: {
        Row: {
          id: string;
          trading_user_id: string | null;
          player_name: string;
          shares_owned: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trading_user_id?: string | null;
          player_name: string;
          shares_owned?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_stocks: {
        Row: {
          id: string;
          trading_user_id: string | null;
          team_name: string;
          shares_owned: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trading_user_id?: string | null;
          team_name: string;
          shares_owned?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      betting_events: {
        Row: {
          id: string;
          event_name: string;
          user_name: string;
          email: string;
          bet_amount: number;
          fees_paid: number;
          payment_received: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_name: string;
          user_name: string;
          email: string;
          bet_amount: number;
          fees_paid: number;
          payment_received?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
