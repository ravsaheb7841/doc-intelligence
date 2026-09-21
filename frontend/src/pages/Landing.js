import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Upload, Brain, MessageSquare, Sparkles, ArrowRight,
  Zap, Shield, Target, CheckCircle2, Database, Search
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Upload,
      title: 'Smart Upload',
      description: 'Upload invoices, contracts, and receipts in PDF or image format.',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Brain,
      title: 'AI Extraction',
      description: 'Automatically extract structured data using OCR + LLM.',
      color: 'from-purple-500 to-violet-600',
    },
    {
      icon: MessageSquare,
      title: 'Chat with Documents',
      description: 'Ask questions and get answers from your documents using RAG.',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: Database,
      title: 'Vector Search',
      description: 'Semantic search across all your documents instantly.',
      color: 'from-amber-500 to-orange-600',
    },
  ];

  const trustIndicators = [
    'No credit card required',
    'AI-powered extraction',
    'Secure file processing',
    'Chat with documents',
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">
      {/* Navigation */}
      <nav className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md fixed w-full z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-500/25">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                DocIntel
              </span>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn-press bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-indigo-50/40 to-white dark:from-gray-900 dark:via-indigo-950/40 dark:to-gray-950"></div>
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-indigo-400/15 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Document Intelligence
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
              Extract Data from Documents
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                in Seconds
              </span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload invoices, contracts, and receipts. Our AI extracts structured data,
              identifies key fields, and lets you chat with your documents.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => navigate('/register')}
                className="btn-press group inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                Start Free
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-press inline-flex items-center justify-center px-8 py-3.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl font-semibold border-2 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                Sign In
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {trustIndicators.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Powerful Features
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to process documents with AI
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="stagger-item group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-10 sm:p-14 text-center text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <h2 className="relative text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Ready to automate your documents?
          </h2>
          <p className="relative text-blue-100 mb-8 max-w-xl mx-auto">
            Start free. No credit card required.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="relative btn-press inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-700 font-semibold rounded-xl shadow-lg hover:scale-[1.02] transition-all"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold">DocIntel</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} DocIntel. AI-Powered Document Intelligence.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;