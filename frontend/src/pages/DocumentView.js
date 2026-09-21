import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI, extractionAPI, chatAPI } from '../services/api';
import {
  FileText, Brain, MessageSquare, Database, ChevronLeft, Loader2,
  AlertCircle, Copy, Check, Zap, RefreshCw, Download, Hash
} from 'lucide-react';

const DocumentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [extraction, setExtraction] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('text');

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const res = await documentsAPI.get(id);
      setDoc(res.data);
      if (res.data.extraction) setExtraction(res.data.extraction);
    } catch (err) {
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    setError('');
    try {
      await documentsAPI.process(id);
      await fetchDocument();
    } catch (err) {
      setError(err.response?.data?.detail || 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleExtract = async () => {
    setExtracting(true);
    setError('');
    try {
      const res = await extractionAPI.extract(id, { force: true });
      setExtraction(res.data.extraction);
      setActiveTab('extracted');
      await fetchDocument();
    } catch (err) {
      setError(err.response?.data?.detail || 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const handleIndex = async () => {
    setIndexing(true);
    setError('');
    try {
      await chatAPI.index(id);
      await fetchDocument();
    } catch (err) {
      setError(err.response?.data?.detail || 'Indexing failed');
    } finally {
      setIndexing(false);
    }
  };

  const copyExtraction = () => {
    navigator.clipboard.writeText(JSON.stringify(extraction, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(extraction, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extraction_${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Document not found</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const canProcess = ['uploaded', 'failed'].includes(doc.status);
  const canExtract = ['ready', 'extracted', 'indexed'].includes(doc.status);
  const canIndex = ['ready', 'extracted', 'indexed'].includes(doc.status);
  const isReady = ['ready', 'extracted', 'indexed'].includes(doc.status);

  const tabs = [
    { key: 'text', label: 'Extracted Text', icon: FileText, show: true },
    { key: 'extracted', label: 'Structured Data', icon: Brain, show: isReady },
    { key: 'pages', label: 'Pages', icon: FileText, show: doc.pages?.length > 0 },
  ].filter((t) => t.show);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold truncate">{doc.original_filename}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-300">
                <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                {doc.page_count > 0 && (
                  <>
                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                    <span>{doc.page_count} pages</span>
                  </>
                )}
                {doc.document_type && (
                  <>
                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                    <span className="capitalize px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-xs">
                      {doc.document_type}
                    </span>
                  </>
                )}
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  isReady
                    ? 'bg-emerald-500/20 text-emerald-200'
                    : doc.status === 'failed'
                    ? 'bg-red-500/20 text-red-200'
                    : 'bg-amber-500/20 text-amber-200'
                }`}>
                  {doc.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {canProcess && (
              <button
                onClick={handleProcess}
                disabled={processing}
                className="btn-press inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-semibold shadow-lg disabled:opacity-50 hover:shadow-xl transition-all"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {processing ? 'Processing...' : 'Process'}
              </button>
            )}

            {canExtract && (
              <button
                onClick={handleExtract}
                disabled={extracting}
                className="btn-press inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-semibold shadow-lg disabled:opacity-50 hover:shadow-xl transition-all"
              >
                {extracting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                {extracting ? 'Extracting...' : 'Extract Data'}
              </button>
            )}

            {canIndex && (
              <button
                onClick={handleIndex}
                disabled={indexing}
                className="btn-press inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl font-semibold disabled:opacity-50 hover:bg-white/20 transition-all"
              >
                {indexing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                {indexing ? 'Indexing...' : doc.status === 'indexed' ? 'Re-Index' : 'Index for Chat'}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-slide-down">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'text' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">OCR Text</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Confidence: {((doc.ocr_confidence || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="p-6">
            {doc.extracted_text ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 max-h-[600px] overflow-y-auto leading-relaxed">
                {doc.extracted_text}
              </pre>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No text extracted yet</p>
                {canProcess && (
                  <button
                    onClick={handleProcess}
                    className="btn-press inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Process document now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'extracted' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Structured Data</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {doc.document_type ? `Type: ${doc.document_type}` : 'Not extracted yet'}
              </p>
            </div>
            {extraction && (
              <div className="flex items-center gap-2">
                <button
                  onClick={copyExtraction}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={downloadJSON}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  JSON
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            {extraction ? (
              <div className="space-y-5">
                {/* Regular fields (non-array, non-object) */}
                {Object.entries(extraction)
                  .filter(
                    ([key, value]) =>
                      !Array.isArray(value) &&
                      (typeof value !== 'object' || value === null)
                  )
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-start gap-2 py-2 border-b border-gray-100 dark:border-gray-700"
                    >
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-1/3 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white sm:w-2/3 break-words">
                        {value === null || value === '' ? (
                          <span className="text-gray-400 italic">not found</span>
                        ) : typeof value === 'number' ? (
                          <span className="font-mono font-semibold">
                            {value.toLocaleString()}
                          </span>
                        ) : (
                          String(value)
                        )}
                      </span>
                    </div>
                  ))}

                {/* Line Items Table */}
                {extraction.line_items &&
                  Array.isArray(extraction.line_items) &&
                  extraction.line_items.length > 0 && (
                    <div className="pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-500 rounded"></span>
                        Line Items ({extraction.line_items.length})
                      </h3>
                      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                                Qty
                              </th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                                Unit Price
                              </th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {extraction.line_items.map((item, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                              >
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                  {idx + 1}
                                </td>
                                <td className="px-4 py-3 text-gray-900 dark:text-white">
                                  {item.description || item.name || '-'}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-mono">
                                  {item.quantity != null ? item.quantity : '-'}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-mono">
                                  {item.unit_price != null
                                    ? item.unit_price.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })
                                    : '-'}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-mono font-semibold">
                                  {item.amount != null
                                    ? item.amount.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Items Table (Receipts) */}
                {extraction.items &&
                  Array.isArray(extraction.items) &&
                  extraction.items.length > 0 &&
                  !extraction.line_items && (
                    <div className="pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-emerald-500 rounded"></span>
                        Items ({extraction.items.length})
                      </h3>
                      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                                Item
                              </th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                                Qty
                              </th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                                Price
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {extraction.items.map((item, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                              >
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                  {idx + 1}
                                </td>
                                <td className="px-4 py-3 text-gray-900 dark:text-white">
                                  {item.name || item.description || '-'}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-mono">
                                  {item.quantity != null ? item.quantity : '-'}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-mono font-semibold">
                                  {item.price != null
                                    ? item.price.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Other Arrays */}
                {Object.entries(extraction)
                  .filter(
                    ([key, value]) =>
                      Array.isArray(value) &&
                      !['line_items', 'items'].includes(key) &&
                      value.length > 0
                  )
                  .map(([key, value]) => (
                    <div key={key} className="pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 capitalize flex items-center gap-2">
                        <span className="w-1 h-4 bg-amber-500 rounded"></span>
                        {key.replace(/_/g, ' ')}
                      </h3>
                      <ul className="space-y-2">
                        {value.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
                            <span>
                              {typeof item === 'object'
                                ? JSON.stringify(item)
                                : String(item)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                {/* Nested Objects */}
                {Object.entries(extraction)
                  .filter(
                    ([key, value]) =>
                      typeof value === 'object' &&
                      value !== null &&
                      !Array.isArray(value)
                  )
                  .map(([key, value]) => (
                    <div key={key} className="pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                        {key.replace(/_/g, ' ')}
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                        {Object.entries(value).map(([k, v]) => (
                          <div
                            key={k}
                            className="flex justify-between text-sm py-1"
                          >
                            <span className="text-gray-500 capitalize">
                              {k.replace(/_/g, ' ')}
                            </span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No structured data extracted yet</p>
                {canExtract && (
                  <button
                    onClick={handleExtract}
                    className="btn-press inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Brain className="w-4 h-4" />
                    Extract data now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden p-6">
          {doc.pages?.length > 0 ? (
            <div className="space-y-6">
              {doc.pages.map((_, i) => (
                <div key={i} className="animate-slide-up">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-500" />
                    Page {i + 1}
                  </p>
                  <img
                    src={documentsAPI.getPageImage(id, i + 1)}
                    alt={`Page ${i + 1}`}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">No pages available</p>
          )}
        </div>
      )}

      {/* Chat CTA */}
      {doc.status === 'indexed' && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Ready to chat
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This document is indexed and ready for questions
              </p>
            </div>
            <button
              onClick={() => navigate(`/chat/${id}`)}
              className="btn-press inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/25"
            >
              <MessageSquare className="w-4 h-4" />
              Start Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentView;