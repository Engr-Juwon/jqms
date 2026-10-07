import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HardHat,
  ShieldCheck,
  Box,
  WifiOff,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  FileSpreadsheet,
  ClipboardCheck,
  TrendingUp,
  Cpu,
  Layers,
  Sun,
  Moon,
  LogOut,
  User,
} from 'lucide-react';

import { Hero } from '@/components/home/Hero';
import { FeatureCard } from '@/components/home/FeatureCard';
import { BenefitsSection } from '@/components/home/BenefitsSection';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';

// ── Benefits data ────────────────────────────────────────────────────────────
const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Real-Time Project Visibility',
    description:
      'Track structural progress, NCR lifecycle, and inspection KPIs in a single executive dashboard updated in real time.',
  },
  {
    icon: ShieldCheck,
    title: 'ISO 9001:2015 Compliance',
    description:
      'Built-in audit trails, immutable NCR records, and compliant ITP workflows keep your quality management audit-ready.',
  },
  {
    icon: WifiOff,
    title: 'Offline-First Field Vault',
    description:
      'IndexedDB-backed local vault lets inspectors capture observations and photos in basements with zero connectivity.',
  },
  {
    icon: Cpu,
    title: '3D BIM Element Registry',
    description:
      'WebGL structural digital twin with live mesh shading (Pending → Poured → Approved) tied to each inspection record.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Statutory Test Tracking',
    description:
      'Cube crushing (BS EN 12390-3 / ASTM C39) results linked to pour permits with automatic pass/fail logic.',
  },
  {
    icon: Layers,
    title: '5-Tier Role Governance',
    description:
      '23 discrete civil-engineering roles from Super Admin and Quality Director down to Consultant and Subcontractor.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export const Index: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isLoading, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Derive display name initials for avatar
  const displayName = currentUser?.displayName || currentUser?.fullName || currentUser?.email || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white transition-colors">

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
            <img
              src="/assets/jqms-icon.png"
              alt="JQMS Icon"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/jqms-icon.png';
              }}
            />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>JQMS Enterprise</span>
              <span className="px-2 py-0.5 rounded bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-mono text-xs border border-brand-500/20 dark:border-brand-500/30">
                v2.0
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Civil Engineering QA/QC Management Platform
            </div>
          </div>
        </Link>

        {/* Right-side controls */}
        <div className="flex items-center gap-3">

          {/* ── Theme toggle ──────────────────────────────────────────── */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-700 transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* ── Auth area ─────────────────────────────────────────────── */}
          {isLoading ? (
            /* Skeleton while Firebase resolves the session */
            <div className="h-9 w-36 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : isAuthenticated && currentUser ? (
            /* ── Logged-in state ──────────────────────────────────────── */
            <div className="flex items-center gap-2">
              {/* Avatar pill showing name + role */}
              <div className="hidden sm:flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="w-7 h-7 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {initials || <User className="w-3.5 h-3.5" />}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    {currentUser.title?.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              {/* Go to Dashboard */}
              <Link
                to="/select-project"
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                aria-label="Sign out"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* ── Logged-out state ─────────────────────────────────────── */
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition flex items-center gap-2"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <Hero
        badge="Unified 3D BIM, Quality & Field Inspection Governance"
        title="Precision Quality Engineering for Mega Infrastructure & High-Rise Structures"
        subtitle="Unify 3D structural element tracking, Procore-standard site comments, non-conformance lifecycle (NCR), concrete cube crushing tests, permits to pour, and executive compliance reporting."
        primaryCtaLabel="Enter Project Workspace"
        primaryCtaLink="/login"
        secondaryCtaLabel="Explore Projects Directory"
        secondaryCtaLink="/select-project"
      />

      {/* ── Primary Feature Highlight — Project Management Dashboard ───── */}
      <section id="features" className="px-6 lg:px-12 py-20 max-w-7xl mx-auto w-full">
        {/* Section header */}
        <div className="flex flex-col items-center text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Platform Features
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Everything Your Team Needs, in One Place
          </h2>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-lg">
            From the executive Project Management Dashboard to field-level NCR workflows — built for civil engineering at scale.
          </p>
        </div>

        {/* ── Primary: Project Management Dashboard (full-width card) ─── */}
        <div className="mb-8">
          <div className="relative group p-8 md:p-10 rounded-3xl border-2 border-brand-500/30 dark:border-brand-500/20 bg-gradient-to-br from-brand-50 dark:from-brand-950/30 to-white dark:to-slate-900 shadow-xl shadow-brand-500/10 ring-1 ring-brand-500/10 transition-all duration-200 hover:border-brand-500/50 overflow-hidden">
            {/* Background accent blob */}
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-500/10 dark:bg-brand-500/5 blur-3xl pointer-events-none" aria-hidden="true" />

            {/* Primary badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-600 text-white text-[11px] font-bold tracking-wide uppercase mb-6">
              <Sparkles className="w-3 h-3" />
              Primary Feature
            </span>

            <div className="flex flex-col md:flex-row md:items-center gap-8">
              {/* Icon */}
              <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <LayoutDashboard className="w-10 h-10" />
              </div>

              {/* Copy */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-3">
                  Project Management Dashboard
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                  A single-pane-of-glass command centre displaying real-time NCR counts, inspection pass rates,
                  structural pour progress by level, and upcoming permit expirations — giving Quality Managers
                  and Directors instant situational awareness without digging through module reports.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['Live KPI Cards', 'Level Progress Tracking', 'NCR Lifecycle View', 'Pour Permit Countdown', 'Role-Scoped Data'].map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="flex-shrink-0">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-brand-500/30 transition-all duration-150 whitespace-nowrap"
                >
                  Open Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Secondary features grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Box}
            title="3D BIM Element Registry"
            description="Interactive WebGL structural digital twin with live status mesh shading (Pending, Inspected, Poured, Approved, Rejected)."
            accentColor="brand"
          />
          <FeatureCard
            icon={WifiOff}
            title="Offline-First Field Vault"
            description="IndexedDB local storage vault for basement field observations and photo markup with automatic background cloud sync."
            accentColor="amber"
          />
          <FeatureCard
            icon={ShieldCheck}
            title="5-Tier Role Governance"
            description="23 discrete civil engineering roles from Super Admin and Quality Director down to Consultant and Subcontractor."
            accentColor="emerald"
          />
          <FeatureCard
            icon={ClipboardCheck}
            title="NCR Lifecycle Management"
            description="End-to-end non-conformance tracking with automated notification chains, closure checklists, and statutory escalation."
            accentColor="rose"
          />
          <FeatureCard
            icon={FileSpreadsheet}
            title="Cube Test Registry"
            description="BS EN 12390-3 / ASTM C39 compliant cube crushing records linked to pour permits with pass/fail verdict logic."
            accentColor="sky"
          />
          <FeatureCard
            icon={HardHat}
            title="Site Comments & Inspections"
            description="Procore-standard site comments with photo markup, trade tagging, and linked inspection request workflows."
            accentColor="violet"
          />
        </div>
      </section>

      {/* ── Benefits Section ────────────────────────────────────────────── */}
      <BenefitsSection benefits={BENEFITS} />

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 px-6 lg:px-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center shadow-lg">
              <img
                src="/assets/jqms-icon.png"
                alt="JQMS"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/jqms-icon.png';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="font-extrabold text-base text-slate-900 dark:text-white">
                  JQMS Enterprise
                </span>
                <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-mono text-[10px] font-bold border border-brand-500/20">
                  ISO 9001:2015
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Next-generation civil engineering quality assurance, 3D BIM synchronization, and statutory inspection compliance.
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
              Sign In
            </Link>
            <Link to="/projects" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
              Projects Directory
            </Link>
            <a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
              Features
            </a>
            <Link to="/privacy-policy" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
              Privacy Policy
            </Link>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>BS EN 12390-3 / ASTM C39 Compliant</span>
            </span>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} JQMS Enterprise Platform. All rights reserved.</p>
          <p className="font-mono text-[10px]">Engineered for Civil Engineering &amp; Infrastructure Projects</p>
        </div>
      </footer>
    </div>
  );
};
