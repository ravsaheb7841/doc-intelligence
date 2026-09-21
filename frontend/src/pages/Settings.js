import React, { useContext } from 'react';
import { AuthContext, ThemeContext } from '../App';
import {
  Settings as SettingsIcon, User, Sun, Moon, Bot, Mail,
  Shield, Database, FileText
} from 'lucide-react';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  const initials = (user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <User className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profile
          </h2>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/25">
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {user?.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {user?.email}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Name
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {user?.name || 'Not set'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Email
            </label>
            <p className="text-gray-900 dark:text-white font-medium break-all">
              {user?.email || 'Not set'}
            </p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Preferences
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {darkMode ? (
              <Moon className="w-5 h-5 text-indigo-500" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Theme</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Toggle between light and dark mode
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`btn-press inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              darkMode
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
            }`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      {/* AI Config */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Configuration
          </h2>
        </div>

        <div className="space-y-3">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/40">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              AI Provider
            </label>
            <p className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-500" />
              Groq AI (GPT-OSS-120B)
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                ACTIVE
              </span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              AI features are powered by Groq for ultra-fast inference
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Embedding Model
            </label>
            <p className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              BAAI/bge-small-en-v1.5
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Used for semantic search and document chat
            </p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Security
          </h2>
        </div>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            Documents are stored securely
          </p>
          <p className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            Your data is isolated to your account
          </p>
          <p className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            Files are never shared with other users
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;