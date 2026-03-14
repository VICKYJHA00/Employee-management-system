import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import RoleBasedLogin from './RoleBasedLogin';

const Login: React.FC = () => {
  const { user, session } = useAuth();

  console.log('Login page - user:', !!user, 'session:', !!session);

  // If user is authenticated, redirect to dashboard
  if (user && session) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise show the role-based login
  return <RoleBasedLogin />;
};

export default Login;
