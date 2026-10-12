import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { getRoleLevel, ROLE_TITLES, canAccessRoute } from '@/lib/permissions';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import PageLoadingFallback from './PageLoadingFallback';

interface CompanyGuardProps {
  minRole?: number;
  children: React.ReactNode;
}

/**
 * Authentication + Authorization guard for /company/* routes.
 * Ensures the user is authenticated and has permission to access the specific route
 * using the unified canAccessRoute permission matrix.
 */
export const CompanyGuard: React.FC<CompanyGuardProps> = ({ minRole, children }) => {
  const { currentUser, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <PageLoadingFallback />
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userLevel = currentUser.role ? getRoleLevel(currentUser.role) : 1;
  const hasAccess = canAccessRoute(currentUser, location.pathname);

  if (!hasAccess || (minRole !== undefined && userLevel < minRole)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-red-500/30 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Company Administration — Access Restricted</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You do not have administrative authority to access this company governance module.
            Your current role is <span className="font-semibold text-slate-800 dark:text-slate-200">{ROLE_TITLES[currentUser.role] || currentUser.role}</span> (Level {userLevel}).
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Contact your Quality Manager or Super Admin to request elevated access.
          </p>
          <div className="pt-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Previous Screen</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
