import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  Key,
  Loader2,
  RefreshCw,
  Server,
  Sparkles,
  X,
} from 'lucide-react';
import { api, type SupabaseStatus } from '../lib/api';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SupabaseStatus | null;
  onStatusUpdated: (status: SupabaseStatus) => void;
}

export function SupabaseModal({
  isOpen,
  onClose,
  status,
  onStatusUpdated,
}: SupabaseModalProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (status?.url) {
      setUrl(status.url);
    }
  }, [status]);

  if (!isOpen) return null;

  async function handleSaveAndTest(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setActionMessage(null);
    try {
      const updatedStatus = await api.updateSupabaseConfig({
        url: url.trim(),
        anonKey: anonKey.trim(),
        serviceRoleKey: serviceRoleKey.trim(),
      });
      onStatusUpdated(updatedStatus);
      if (updatedStatus.connected) {
        setActionMessage({ text: 'Connection successful! Live PostgreSQL persistence is active.' });
      } else {
        setActionMessage({
          text: updatedStatus.error || 'Connection failed. Please check your credentials and SQL schema.',
          error: true,
        });
      }
    } catch (err: any) {
      setActionMessage({
        text: err?.message || 'Failed to save and verify Supabase configuration.',
        error: true,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCopySchema() {
    try {
      const { sql } = await api.getSupabaseSchema();
      await navigator.clipboard.writeText(sql);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 3000);
    } catch {
      setActionMessage({ text: 'Unable to load schema.sql', error: true });
    }
  }

  async function handleSeedData() {
    setSeeding(true);
    setActionMessage(null);
    try {
      const res = await api.seedSupabase();
      setActionMessage({ text: res.message || 'Database successfully seeded with academic workspace data!' });
      const refreshed = await api.getSupabaseStatus();
      onStatusUpdated(refreshed);
    } catch (err: any) {
      setActionMessage({
        text: err?.message || 'Failed to seed Supabase database. Make sure schema.sql has been executed.',
        error: true,
      });
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="supabase-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0c101c] border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#3ecf8e]/20 to-[#3ecf8e]/5 border border-[#3ecf8e]/30 flex items-center justify-center text-[#3ecf8e]">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 id="supabase-modal-title" className="text-xl font-display font-semibold text-white">
              Supabase Backend Setup
            </h2>
            <p className="text-xs text-slate-400">
              Configure PostgreSQL cloud persistence for your courses, research notes, and syllabus.
            </p>
          </div>
        </div>

        {/* Live Status Card */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            status?.connected
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
              : status?.configured
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-200'
              : 'bg-white/[0.03] border-white/10 text-slate-300'
          }`}
        >
          {status?.connected ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0 text-sm">
            <div className="font-semibold flex items-center gap-2">
              <span>
                {status?.connected
                  ? 'Supabase Connected & Active'
                  : status?.configured
                  ? 'Supabase Configured (Action Required)'
                  : 'Running in Local Storage Mode'}
              </span>
              {status?.connected && (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  PostgreSQL Live
                </span>
              )}
            </div>
            <p className="text-xs opacity-90 mt-1 leading-relaxed">
              {status?.connected
                ? `Successfully connected to ${status.url}. All writes and reads sync directly with Supabase.`
                : status?.error ||
                  'No Supabase credentials detected. Data is saved locally in .data/edusphere-db.json.'}
            </p>

            {/* Table Row Counts */}
            {status?.connected && status.tables && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-emerald-500/20 text-xs">
                <div>
                  <span className="text-emerald-400/80">Courses:</span>{' '}
                  <strong className="text-white">{status.tables.courses ?? 0}</strong>
                </div>
                <div>
                  <span className="text-emerald-400/80">Modules:</span>{' '}
                  <strong className="text-white">{status.tables.syllabus_modules ?? 0}</strong>
                </div>
                <div>
                  <span className="text-emerald-400/80">Notes:</span>{' '}
                  <strong className="text-white">{status.tables.research_notes ?? 0}</strong>
                </div>
                <div>
                  <span className="text-emerald-400/80">Cards:</span>{' '}
                  <strong className="text-white">{status.tables.flashcards ?? 0}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action feedback message */}
        {actionMessage && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              actionMessage.error
                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
            }`}
          >
            {actionMessage.error ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <Check className="h-4 w-4 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Setup Form */}
        <form onSubmit={handleSaveAndTest} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="supa-url" className="text-xs font-medium text-slate-300">
                1. Supabase Project URL
              </label>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#3ecf8e] hover:underline flex items-center gap-1"
              >
                <span>Supabase Dashboard</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <input
              id="supa-url"
              type="url"
              required
              placeholder="https://your-project-ref.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="supa-anon" className="text-xs font-medium text-slate-300">
                2. Supabase Anon / Public API Key
              </label>
              <span className="text-[11px] text-slate-400">
                Project Settings ➔ API ➔ Project API keys
              </span>
            </div>
            <div className="relative">
              <input
                id="supa-anon"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2.5 pl-9 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm font-mono placeholder:text-slate-500 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e]"
              />
              <Key className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="supa-service" className="text-xs font-medium text-slate-300">
                3. Service Role Key (Optional — allows bypassing RLS)
              </label>
            </div>
            <div className="relative">
              <input
                id="supa-service"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={serviceRoleKey}
                onChange={(e) => setServiceRoleKey(e.target.value)}
                className="w-full px-3.5 py-2.5 pl-9 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm font-mono placeholder:text-slate-500 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e]"
              />
              <Server className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#3ecf8e] to-[#2fb377] text-slate-950 font-semibold text-sm shadow-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span>{saving ? 'Testing Connection...' : 'Save & Test Connection'}</span>
            </button>
          </div>
        </form>

        {/* Database Schema & Seeding Help Box */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/08 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Sparkles className="h-4 w-4 text-[#7c3aed]" />
              <span>Database Schema & Sample Data</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            If you just created your Supabase project, execute the SQL schema once in your Supabase SQL Editor to generate the tables and security policies.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopySchema}
              className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedSchema ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Schema Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy SQL Schema</span>
                </>
              )}
            </button>

            {status?.connected && (
              <button
                type="button"
                onClick={handleSeedData}
                disabled={seeding}
                className="px-3 py-1.5 rounded-lg bg-[#7c3aed]/20 hover:bg-[#7c3aed]/30 border border-[#7c3aed]/40 text-xs font-medium text-purple-200 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5 text-purple-400" />}
                <span>{seeding ? 'Seeding Tables...' : 'Seed Sample Academic Data'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
