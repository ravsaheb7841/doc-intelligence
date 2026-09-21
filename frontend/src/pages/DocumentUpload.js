import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import {
  Upload, FileText, CheckCircle2, AlertCircle, X, Loader2, Zap,
  File, Shield
} from 'lucide-react';

const DocumentUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg'];

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleFile = (f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(ext)) {
      setError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit');
      return;
    }
    if (f.size === 0) {
      setError('File is empty');
      return;
    }
    setFile(f);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      const res = await documentsAPI.upload(file, (e) => {
        if (e.total) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      const documentId = res.data.document_id;
      setSuccess(true);

      // Auto-process
      setTimeout(async () => {
        try {
          await documentsAPI.process(documentId);
          navigate(`/documents/${documentId}`);
        } catch (err) {
          console.error('Process failed:', err);
          navigate(`/documents/${documentId}`);
        }
      }, 500);

    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
          <Zap className="w-4 h-4" />
          AI-Powered Extraction
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Upload Document
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Upload a PDF or image to extract data with AI
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-slide-down">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
        <div
          className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center transition-all duration-300 cursor-pointer ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
              : file
              ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !file && document.getElementById('file-upload')?.click()}
        >
          {!file ? (
            <div className="animate-scale-in">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 mb-6">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Drag & drop your document
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-1">
                or click to browse
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                Supports PDF, PNG, JPG · Max 50MB
              </p>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                onClick={(e) => e.stopPropagation()}
                className="btn-press inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 cursor-pointer hover:shadow-xl"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </label>
            </div>
          ) : (
            <div className="animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-6">
                {success ? (
                  <CheckCircle2 className="w-10 h-10 text-white" />
                ) : (
                  <File className="w-10 h-10 text-white" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 truncate max-w-md mx-auto">
                {file.name}
              </h3>
              <p className="text-gray-500 mb-6">{formatSize(file.size)}</p>

              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={handleUpload}
                  disabled={uploading || success}
                  className="btn-press inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Uploaded
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Upload & Process
                    </>
                  )}
                </button>
                {!uploading && !success && (
                  <button
                    onClick={() => setFile(null)}
                    className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Change File
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {uploading && (
          <div className="mt-6 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Uploading and processing...
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progress || 30}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-3">
              Running OCR and AI analysis...
            </p>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            icon: FileText,
            title: 'PDF, PNG, JPG',
            desc: 'Multiple formats supported',
            color: 'text-blue-500',
          },
          {
            icon: Shield,
            title: 'Secure Processing',
            desc: 'Files processed securely',
            color: 'text-emerald-500',
          },
          {
            icon: Zap,
            title: 'Instant Extraction',
            desc: 'AI extracts fields automatically',
            color: 'text-amber-500',
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="stagger-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <Icon className={`w-6 h-6 ${item.color} flex-shrink-0`} />
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentUpload;