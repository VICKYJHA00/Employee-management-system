import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CareerApplication {
  id: string;
  full_name: string;
  mobile_number: string;
  email: string;
  full_address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  date_of_birth: string | null;
  role_applied_for: string;
  years_of_experience: string | null;
  skills: string | null;
  why_join_thrylos: string | null;
  additional_notes: string | null;
  resume_url: string | null;
  aadhar_url: string | null;
  additional_documents: string[];
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

const CareerApplications: React.FC = () => {
  return <div />;
};

export default CareerApplications;
