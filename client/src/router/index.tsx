import { createBrowserRouter } from 'react-router';

import AuthLayout from '@/layouts/AuthLayout';
import AppLayout from '@/layouts/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/dashboard/Index';
import Applications from '@/pages/applications/Index';
import Students from '@/pages/students/Index';
import Sections from '@/pages/sections/Index';
import AuditLogs from '@/pages/audit-logs/Index';
import Settings from '@/pages/settings/Index';
import NotFound from '@/pages/NotFound';

export const router = createBrowserRouter([
  // Auth routes
  {
    path: '/login',
    element: (
      <AuthLayout>
        <Login />
      </AuthLayout>
    ),
  },
  {
    path: '/register',
    element: (
      <AuthLayout>
        <Register />
      </AuthLayout>
    ),
  },

  // Protected routes
  {
    element: <ProtectedRoute allowedRoles={['REGISTRAR', 'TEACHER']} />,
    children: [
      {
        path: '/dashboard',
        element: (
          <AppLayout>
            <Dashboard />
          </AppLayout>
        ),
      },
      {
        path: '/applications',
        element: (
          <AppLayout>
            <Applications />
          </AppLayout>
        ),
      },
      {
        path: '/students',
        element: (
          <AppLayout>
            <Students />
          </AppLayout>
        ),
      },
      {
        path: '/sections',
        element: (
          <AppLayout>
            <Sections />
          </AppLayout>
        ),
      },
      {
        path: '/audit-logs',
        element: (
          <AppLayout>
            <AuditLogs />
          </AppLayout>
        ),
      },
      {
        path: '/settings',
        element: (
          <AppLayout>
            <Settings />
          </AppLayout>
        ),
      },
    ],
  },

  // Default redirect
  {
    path: '/',
    element: (
      <AuthLayout>
        <Login />
      </AuthLayout>
    ),
  },

  // Fallback
  { path: '*', element: <NotFound /> },
]);
