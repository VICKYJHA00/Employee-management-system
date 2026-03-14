import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import RoleBasedLogin from './RoleBasedLogin';

const Index: React.FC = () => {
  const { user, session } = useAuth();

  console.log('Index page - user:', !!user, 'session:', !!session);

  // If user is authenticated, redirect to dashboard
  if (user && session) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise show the login page
  return <RoleBasedLogin />;
};

export default Index;
