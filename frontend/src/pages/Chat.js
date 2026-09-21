import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { chatAPI, documentsAPI } from '../services/api';
import {
  Send, Bot, MessageSquare, Loader2, Sparkles, Copy, Check,
  Trash2, FileText
} from 'lucide-react';

const Chat = () => {
  const { documentId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(documentId || null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    'What is the total amount?',
    'Who is the vendor?',
    'What is the invoice date?',
    'Summarize this document',
    'What are the payment terms?',
  ];

  useEffect(() => {
    fetchDocuments();
    fetchHistory();
  }, [selectedDoc]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiThinking]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDocuments = async () => {
    try {
      const res = await documentsAPI.list();
      const indexed = (res.data.documents || []).filter(
        (d) => d.status === 'indexed' || d.status === 'extracted' || d.status === 'ready'
      );
      setDocuments(indexed);
    } catch (err) {
      console.error('Failed to load documents');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await chatAPI.history(selectedDoc);
      const history = (res.data.history || [])
        .reverse()
        .map((item) => ({
          question: item.question,
          answer: item.answer,
          sources: item.sources,
          timestamp: item.created_at,
        }));
      setMessages(history);
    } catch (err) {
      console.error('Failed to load history');
    }
  };

  const sendMessage = async (customQuestion) => {
    const question = customQuestion || input.trim();
    if (!question || loading) return;

    setInput('');
    setLoading(true);
    setAiThinking(true);

    setMessages((prev) => [...prev, { question, answer: null }]);

    try {
      const res = await chatAPI.chat({
        question,
        document_id: selectedDoc,
        top_k: 5,
      });

      setMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = {
          question,
          answer: res.data.answer,
          sources: res.data.sources,
          chunks_used: res.data.chunks_used,
        };
        return newMsgs;
      });
    } catch (err) {
      setMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = {
          question,
          answer: err.response?.data?.detail || 'Failed to get response',
          error: true,
        };
        return newMsgs;
      });
    } finally {
      setLoading(false);
      setAiThinking(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Clear chat history?')) return;
    try {
      await chatAPI.clearHistory(selectedDoc);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear');
    }
  };

  const copyAnswer = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Document Chat
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ask questions about your documents
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {documents.length > 0 && (
            <select
              value={selectedDoc || ''}
              onChange={(e) => setSelectedDoc(e.target.value || null)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/40"
            >
              <option value="">All documents</option>
              {documents.map((d) => (
                <option key={d.document_id} value={d.document_id}>
                  {d.original_filename}
                </option>
              ))}
            </select>
          )}
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm mb-4">
        <div className="p-5">
          {messages.length === 0 && !aiThinking ? (
            <div className="flex flex-col items-center justify-center py-16 animate-scale-in">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/30 mb-6">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Ask your documents anything
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
                Get instant answers based on the content of your uploaded documents.
              </p>

              {documents.length === 0 ? (
                <div className="text-center text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 rounded-xl">
                  <FileText className="w-4 h-4 inline mr-2" />
                  No indexed documents. Upload and process a document first.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5 justify-center max-w-xl">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="stagger-item group px-4 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-sm border border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all"
                      style={{ animationDelay: `${i * 0.06}s` }}
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                        {q}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((msg, idx) => (
                <div key={idx} className="animate-slide-up space-y-3">
                  {/* User */}
                  <div className="flex justify-end">
                    <div className="flex items-end gap-2 max-w-[75%]">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-2xl rounded-br-md shadow-md shadow-blue-500/20">
                        <p className="text-sm leading-relaxed">{msg.question}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI */}
                  {msg.answer && (
                    <div className="flex justify-start group">
                      <div className="flex items-start gap-3 max-w-[85%]">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/25">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="relative">
                          <div
                            className={`px-4 py-3 rounded-2xl rounded-tl-md shadow-sm border ${
                              msg.error
                                ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
                                : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                              {msg.answer}
                            </p>

                            {msg.sources?.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
                                  Sources ({msg.chunks_used || msg.sources.length}):
                                </p>
                                <div className="space-y-1">
                                  {msg.sources.slice(0, 3).map((s, i) => (
                                    <div
                                      key={i}
                                      className="text-xs text-gray-500 dark:text-gray-400 truncate"
                                    >
                                      · {s.preview?.substring(0, 90)}...
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => copyAnswer(msg.answer, idx)}
                            className="absolute -right-2 -bottom-2 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-md border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy answer"
                          >
                            {copiedIndex === idx ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {aiThinking && (
                <div className="flex justify-start animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 px-5 py-3.5 rounded-2xl rounded-tl-md flex items-center gap-1.5">
                      <span className="typing-dot text-gray-500"></span>
                      <span className="typing-dot text-gray-500"></span>
                      <span className="typing-dot text-gray-500"></span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={
              documents.length === 0
                ? 'Upload and index a document first...'
                : 'Ask a question about your documents...'
            }
            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
            disabled={loading || documents.length === 0}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || documents.length === 0}
            className="btn-press flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
          Press Enter to send · AI answers based on your document content
        </p>
      </div>
    </div>
  );
};

export default Chat;