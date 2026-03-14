export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_employee_data: {
        Row: {
          aadhar_document_url: string | null
          aadhar_number: string | null
          admin_id: string
          bank_account_number: string | null
          bank_name: string | null
          city: string | null
          created_at: string
          current_address: string | null
          date_of_birth: string | null
          date_of_joining: string | null
          department: string | null
          designation: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          employee_id: string | null
          full_name: string
          gender: string | null
          id: string
          ifsc_code: string | null
          is_locked: boolean
          locked_at: string | null
          marital_status: string | null
          notes: string | null
          offer_letter_url: string | null
          pan_document_url: string | null
          pan_number: string | null
          permanent_address: string | null
          phone: string | null
          pincode: string | null
          profile_image_url: string | null
          salary: number | null
          state: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          aadhar_document_url?: string | null
          aadhar_number?: string | null
          admin_id: string
          bank_account_number?: string | null
          bank_name?: string | null
          city?: string | null
          created_at?: string
          current_address?: string | null
          date_of_birth?: string | null
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_id?: string | null
          full_name: string
          gender?: string | null
          id?: string
          ifsc_code?: string | null
          is_locked?: boolean
          locked_at?: string | null
          marital_status?: string | null
          notes?: string | null
          offer_letter_url?: string | null
          pan_document_url?: string | null
          pan_number?: string | null
          permanent_address?: string | null
          phone?: string | null
          pincode?: string | null
          profile_image_url?: string | null
          salary?: number | null
          state?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          aadhar_document_url?: string | null
          aadhar_number?: string | null
          admin_id?: string
          bank_account_number?: string | null
          bank_name?: string | null
          city?: string | null
          created_at?: string
          current_address?: string | null
          date_of_birth?: string | null
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_id?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          ifsc_code?: string | null
          is_locked?: boolean
          locked_at?: string | null
          marital_status?: string | null
          notes?: string | null
          offer_letter_url?: string | null
          pan_document_url?: string | null
          pan_number?: string | null
          permanent_address?: string | null
          phone?: string | null
          pincode?: string | null
          profile_image_url?: string | null
          salary?: number | null
          state?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_employee_data_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: true
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read_by: string[] | null
          message: string
          priority: string
          recipient_type: string
          recipients: string[] | null
          sender_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read_by?: string[] | null
          message: string
          priority?: string
          recipient_type?: string
          recipients?: string[] | null
          sender_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read_by?: string[] | null
          message?: string
          priority?: string
          recipient_type?: string
          recipients?: string[] | null
          sender_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          admin_id: string
          created_at: string
          haptic_enabled: boolean
          id: string
          notification_sound_enabled: boolean
          sound_enabled: boolean
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          haptic_enabled?: boolean
          id?: string
          notification_sound_enabled?: boolean
          sound_enabled?: boolean
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          haptic_enabled?: boolean
          id?: string
          notification_sound_enabled?: boolean
          sound_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_settings_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: true
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_todos: {
        Row: {
          admin_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_todos_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          name: string
          otp_email: string | null
          role: Database["public"]["Enums"]["admin_role"]
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          name: string
          otp_email?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          name?: string
          otp_email?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_pinned: boolean
          priority: string
          target_roles: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean
          priority?: string
          target_roles?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean
          priority?: string
          target_roles?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          admin_id: string
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          id: string
          marked_at: string | null
          marked_by: string | null
          overridden_at: string | null
          overridden_by: string | null
          override_reason: string | null
          override_status: string | null
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          override_status?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          override_status?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_settings: {
        Row: {
          created_at: string
          id: string
          min_days_threshold: number
          suspension_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          min_days_threshold?: number
          suspension_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          min_days_threshold?: number
          suspension_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      career_applications: {
        Row: {
          aadhar_url: string | null
          additional_documents: Json | null
          additional_notes: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_address: string | null
          full_name: string
          id: string
          mobile_number: string
          resume_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_applied_for: string
          skills: string | null
          state: string | null
          status: string
          updated_at: string
          why_join_thrylos: string | null
          years_of_experience: string | null
        }
        Insert: {
          aadhar_url?: string | null
          additional_documents?: Json | null
          additional_notes?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_address?: string | null
          full_name: string
          id?: string
          mobile_number: string
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_applied_for: string
          skills?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          why_join_thrylos?: string | null
          years_of_experience?: string | null
        }
        Update: {
          aadhar_url?: string | null
          additional_documents?: Json | null
          additional_notes?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_address?: string | null
          full_name?: string
          id?: string
          mobile_number?: string
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_applied_for?: string
          skills?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          why_join_thrylos?: string | null
          years_of_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_id: string | null
          certificate_type: string
          certificate_url: string | null
          course_name: string | null
          created_at: string
          id: string
          issue_date: string
          issued_by: string | null
          participant_email: string | null
          participant_name: string | null
          recipient_name: string
          updated_at: string
        }
        Insert: {
          certificate_id?: string | null
          certificate_type: string
          certificate_url?: string | null
          course_name?: string | null
          created_at?: string
          id?: string
          issue_date?: string
          issued_by?: string | null
          participant_email?: string | null
          participant_name?: string | null
          recipient_name: string
          updated_at?: string
        }
        Update: {
          certificate_id?: string | null
          certificate_type?: string
          certificate_url?: string | null
          course_name?: string | null
          created_at?: string
          id?: string
          issue_date?: string
          issued_by?: string | null
          participant_email?: string | null
          participant_name?: string | null
          recipient_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      content_work_logs: {
        Row: {
          admin_id: string
          content_type: string
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          platform: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          content_type: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          platform?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          content_type?: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          platform?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_work_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string
          document_url: string
          employee_id: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: string
          document_url: string
          employee_id: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string
          document_url?: string
          employee_id?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          aadhar_document_url: string | null
          aadhar_number: string | null
          bank_account_number: string | null
          bank_name: string | null
          city: string | null
          created_at: string
          created_by: string | null
          current_address: string | null
          date_of_birth: string | null
          date_of_joining: string
          department: string
          designation: string
          documents: Json | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          employee_id: string
          full_name: string
          gender: string | null
          id: string
          ifsc_code: string | null
          marital_status: string | null
          notes: string | null
          offer_letter_url: string | null
          pan_document_url: string | null
          pan_number: string | null
          permanent_address: string | null
          phone: string | null
          pincode: string | null
          profile_image_url: string | null
          salary: number | null
          state: string | null
          status: string
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          aadhar_document_url?: string | null
          aadhar_number?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          current_address?: string | null
          date_of_birth?: string | null
          date_of_joining: string
          department: string
          designation: string
          documents?: Json | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_id: string
          full_name: string
          gender?: string | null
          id?: string
          ifsc_code?: string | null
          marital_status?: string | null
          notes?: string | null
          offer_letter_url?: string | null
          pan_document_url?: string | null
          pan_number?: string | null
          permanent_address?: string | null
          phone?: string | null
          pincode?: string | null
          profile_image_url?: string | null
          salary?: number | null
          state?: string | null
          status?: string
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          aadhar_document_url?: string | null
          aadhar_number?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          current_address?: string | null
          date_of_birth?: string | null
          date_of_joining?: string
          department?: string
          designation?: string
          documents?: Json | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_id?: string
          full_name?: string
          gender?: string | null
          id?: string
          ifsc_code?: string | null
          marital_status?: string | null
          notes?: string | null
          offer_letter_url?: string | null
          pan_document_url?: string | null
          pan_number?: string | null
          permanent_address?: string | null
          phone?: string | null
          pincode?: string | null
          profile_image_url?: string | null
          salary?: number | null
          state?: string | null
          status?: string
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      esports_players: {
        Row: {
          created_at: string
          email: string
          entry_fees: number
          game_uid: string
          id: string
          payment_received: boolean
          player_name: string
          tournament_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          entry_fees?: number
          game_uid: string
          id?: string
          payment_received?: boolean
          player_name: string
          tournament_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          entry_fees?: number
          game_uid?: string
          id?: string
          payment_received?: boolean
          player_name?: string
          tournament_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          from_admin_id: string | null
          id: string
          is_anonymous: boolean
          message: string
          responded_at: string | null
          responded_by: string | null
          response: string | null
          status: string
          subject: string
          to_admin_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          from_admin_id?: string | null
          id?: string
          is_anonymous?: boolean
          message: string
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string
          subject: string
          to_admin_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          from_admin_id?: string | null
          id?: string
          is_anonymous?: boolean
          message?: string
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string
          subject?: string
          to_admin_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_from_admin_id_fkey"
            columns: ["from_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_to_admin_id_fkey"
            columns: ["to_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          is_recurring: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holidays_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          assigned_to: string | null
          created_at: string
          department: string
          email: string
          end_date: string | null
          id: string
          intern_email: string | null
          intern_id: string | null
          intern_name: string
          join_date: string | null
          mentor_id: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          department: string
          email: string
          end_date?: string | null
          id?: string
          intern_email?: string | null
          intern_id?: string | null
          intern_name: string
          join_date?: string | null
          mentor_id?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          department?: string
          email?: string
          end_date?: string | null
          id?: string
          intern_email?: string | null
          intern_id?: string | null
          intern_name?: string
          join_date?: string | null
          mentor_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internships_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internships_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          admin_id: string
          casual_leave_total: number
          casual_leave_used: number
          created_at: string
          id: string
          sick_leave_total: number
          sick_leave_used: number
          updated_at: string
          vacation_leave_total: number
          vacation_leave_used: number
          year: number
        }
        Insert: {
          admin_id: string
          casual_leave_total?: number
          casual_leave_used?: number
          created_at?: string
          id?: string
          sick_leave_total?: number
          sick_leave_used?: number
          updated_at?: string
          vacation_leave_total?: number
          vacation_leave_used?: number
          year?: number
        }
        Update: {
          admin_id?: string
          casual_leave_total?: number
          casual_leave_used?: number
          created_at?: string
          id?: string
          sick_leave_total?: number
          sick_leave_used?: number
          updated_at?: string
          vacation_leave_total?: number
          vacation_leave_used?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          admin_id: string
          created_at: string
          details: string | null
          id: string
          leave_category: string | null
          leave_date: string
          leave_type: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          details?: string | null
          id?: string
          leave_category?: string | null
          leave_date: string
          leave_type?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          details?: string | null
          id?: string
          leave_category?: string | null
          leave_date?: string
          leave_type?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_attendance_reviews: {
        Row: {
          absent_days: number
          admin_id: string
          created_at: string
          id: string
          is_suspended: boolean
          late_days: number
          month: number
          present_days: number
          reviewed_at: string | null
          reviewed_by: string | null
          suspension_end: string | null
          suspension_start: string | null
          total_working_days: number
          year: number
        }
        Insert: {
          absent_days?: number
          admin_id: string
          created_at?: string
          id?: string
          is_suspended?: boolean
          late_days?: number
          month: number
          present_days?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          suspension_end?: string | null
          suspension_start?: string | null
          total_working_days?: number
          year: number
        }
        Update: {
          absent_days?: number
          admin_id?: string
          created_at?: string
          id?: string
          is_suspended?: boolean
          late_days?: number
          month?: number
          present_days?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          suspension_end?: string | null
          suspension_start?: string | null
          total_working_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_attendance_reviews_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_attendance_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          admin_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_sessions: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string
          id: string
          is_used: boolean
          login_email: string
          otp_code: string
          otp_email: string
          verified_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          login_email: string
          otp_code: string
          otp_email: string
          verified_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          login_email?: string
          otp_code?: string
          otp_email?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "otp_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_verifications: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_received: boolean
          transaction_id: string
          updated_at: string
          user_name: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          payment_received?: boolean
          transaction_id: string
          updated_at?: string
          user_name: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_received?: boolean
          transaction_id?: string
          updated_at?: string
          user_name?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_scores: {
        Row: {
          admin_id: string
          attendance_score: number | null
          calculated_at: string
          id: string
          month: number
          overall_score: number | null
          punctuality_score: number | null
          remarks: string | null
          work_log_score: number | null
          year: number
        }
        Insert: {
          admin_id: string
          attendance_score?: number | null
          calculated_at?: string
          id?: string
          month: number
          overall_score?: number | null
          punctuality_score?: number | null
          remarks?: string | null
          work_log_score?: number | null
          year: number
        }
        Update: {
          admin_id?: string
          attendance_score?: number | null
          calculated_at?: string
          id?: string
          month?: number
          overall_score?: number | null
          punctuality_score?: number | null
          remarks?: string | null
          work_log_score?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_scores_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          option_index: number
          poll_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          is_anonymous: boolean
          options: Json
          question: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_anonymous?: boolean
          options?: Json
          question: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_anonymous?: boolean
          options?: Json
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_analytics: {
        Row: {
          comments_count: number
          created_at: string
          created_by: string | null
          date: string
          engagement_rate: number
          followers_gained: number
          followers_lost: number
          id: string
          impressions: number
          likes_count: number
          notes: string | null
          platform: string
          posts_count: number
          reach: number
          requests_received: number
          responses_sent: number
          shares_count: number
          total_followers: number
          updated_at: string
        }
        Insert: {
          comments_count?: number
          created_at?: string
          created_by?: string | null
          date?: string
          engagement_rate?: number
          followers_gained?: number
          followers_lost?: number
          id?: string
          impressions?: number
          likes_count?: number
          notes?: string | null
          platform: string
          posts_count?: number
          reach?: number
          requests_received?: number
          responses_sent?: number
          shares_count?: number
          total_followers?: number
          updated_at?: string
        }
        Update: {
          comments_count?: number
          created_at?: string
          created_by?: string | null
          date?: string
          engagement_rate?: number
          followers_gained?: number
          followers_lost?: number
          id?: string
          impressions?: number
          likes_count?: number
          notes?: string | null
          platform?: string
          posts_count?: number
          reach?: number
          requests_received?: number
          responses_sent?: number
          shares_count?: number
          total_followers?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_analytics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_orders: {
        Row: {
          created_at: string
          id: string
          order_type: string
          payment_amount: number
          payment_received: boolean
          post_account_link: string
          quantity: number
          service_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_type: string
          payment_amount?: number
          payment_received?: boolean
          post_account_link: string
          quantity?: number
          service_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_type?: string
          payment_amount?: number
          payment_received?: boolean
          post_account_link?: string
          quantity?: number
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      standup_logs: {
        Row: {
          admin_id: string
          blockers: string | null
          created_at: string
          date: string
          id: string
          mood: string | null
          today: string
          yesterday: string | null
        }
        Insert: {
          admin_id: string
          blockers?: string | null
          created_at?: string
          date?: string
          id?: string
          mood?: string | null
          today: string
          yesterday?: string | null
        }
        Update: {
          admin_id?: string
          blockers?: string | null
          created_at?: string
          date?: string
          id?: string
          mood?: string | null
          today?: string
          yesterday?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "standup_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      team_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          event_time: string | null
          event_type: string
          id: string
          is_all_day: boolean
          location: string | null
          target_roles: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string
          id?: string
          is_all_day?: boolean
          location?: string | null
          target_roles?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string
          id?: string
          is_all_day?: boolean
          location?: string | null
          target_roles?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_work_logs: {
        Row: {
          admin_id: string
          created_at: string
          description: string | null
          hours_spent: number | null
          id: string
          status: string
          title: string
          updated_at: string
          url: string | null
          work_type: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          description?: string | null
          hours_spent?: number | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          url?: string | null
          work_type: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          description?: string | null
          hours_spent?: number | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          url?: string | null
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_work_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_files: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_admin_role: {
        Args: {
          _role: Database["public"]["Enums"]["admin_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_hr_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      admin_role:
        | "super_admin"
        | "social_admin"
        | "esports_admin"
        | "tech_admin"
        | "content_admin"
        | "hr_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admin_role: [
        "super_admin",
        "social_admin",
        "esports_admin",
        "tech_admin",
        "content_admin",
        "hr_admin",
      ],
    },
  },
} as const
