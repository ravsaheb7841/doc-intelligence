import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import {
  FileText, Upload, MessageSquare, Activity, Plus, Trash2,
  ArrowRight, FileCheck, Loader2, AlertCircle, Database,
  Search, RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await documentsAPI.list();
      setDocuments(res.data.documents || []);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this document? This cannot be undone.')) return;

    setDeletingId(id);
    try {
      await documentsAPI.delete(id);
      setDocuments((prev) => prev.filter((d) => d.document_id !== id));
    } catch (err) {
      alert('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = documents.filter((d) =>
    d.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    {
      label: 'Total Documents',
      value: documents.length,
      icon: FileText,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
    },
    {
      label: 'Ready',
      value: documents.filter((d) => ['ready', 'extracted', 'indexed'].includes(d.status)).length,
      icon: FileCheck,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
    },
    {
      label: 'Processing',
      value: documents.filter((d) => ['processing', 'converting', 'ocr'].includes(d.status)).length,
      icon: Loader2,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
    },
    {
      label: 'Failed',
      value: documents.filter((d) => d.status === 'failed').length,
      icon: AlertCircle,
      color: 'from-red-500 to-rose-600',
      shadow: 'shadow-red-500/25',
    },
  ];

  const statusStyle = (status) => {
    const styles = {
      uploaded: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      converting: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      ocr: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
      ready: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
      extracted: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
      indexed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    };
    return styles[status] || styles.uploaded;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="mt-1.5 text-blue-100 text-sm">
                Manage and analyze your documents
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/chat')}
              className="btn-press inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="btn-press group inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <Plus className="w-4 h-4" />
              Upload Document
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="stagger-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 card-hover"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${s.color} text-white shadow-md ${s.shadow} mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Documents */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Documents
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {filtered.length} of {documents.length} documents
              </p>
            </div>
            <button
              onClick={() => fetchDocuments(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Search */}
          {documents.length > 0 && (
            <div className="mt-4 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {documents.length === 0 ? 'No documents yet' : 'No matching documents'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              {documents.length === 0
                ? 'Upload your first document to get started'
                : 'Try a different search term'}
            </p>
            {documents.length === 0 && (
              <button
                onClick={() => navigate('/upload')}
                className="btn-press inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((doc, index) => (
              <div
                key={doc.document_id}
                onClick={() => navigate(`/documents/${doc.document_id}`)}
                className="stagger-item group flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer transition-colors"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {doc.original_filename}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                    {doc.page_count > 0 && (
                      <>
                        <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                        <span>{doc.page_count} pages</span>
                      </>
                    )}
                    {doc.document_type && (
                      <>
                        <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                        <span className="capitalize">{doc.document_type}</span>
                      </>
                    )}
                    {doc.created_at && (
                      <>
                        <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle(doc.status)}`}>
                  {doc.status}
                </span>

                <button
                  onClick={(e) => handleDelete(doc.document_id, e)}
                  disabled={deletingId === doc.document_id}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete document"
                >
                  {deletingId === doc.document_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>

                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;