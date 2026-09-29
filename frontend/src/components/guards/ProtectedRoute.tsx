import React from 'react';
import { Navigate, useLocation, Link, Outlet } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { useAuth } from '../../context/useAuth';
import type { UserRole } from '../../types/auth.types';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <Result
          status="403"
          title="403"
          subTitle="Sorry, you do not have permission to access this page."
          extra={
            <Link to="/">
              <Button type="primary">Back to Home</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
