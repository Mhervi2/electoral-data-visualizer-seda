
import React from 'react';
import { Outlet } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';

const AdminLayout = () => {
  return (
    <Layout>
      <AdminProtectedRoute>
        <Outlet />
      </AdminProtectedRoute>
    </Layout>
  );
};

export default AdminLayout;
