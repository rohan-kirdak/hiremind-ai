import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  User,
  Bot,
  Compass,
  Briefcase,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import MarkdownRenderer from '../components/common/MarkdownRenderer';
import { sendChatMessage, fetchConversation, clearConversation } from '../api/agent.api';
import { useProfile } from '../context/ProfileContext';

export default function AssistantPage() {
  const { profile, setProfile, conversationId, setConversationId, hasProfile } = useProfile();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  // Initial welcome message if conversation is empty
  const defaultWelcomeMessage = {
    role: 'model',
    content: [
      `### Hello! I am your HireMind AI Career Assistant.`,
      `I operate as a hybrid multi-agent system coordinating three specialist capabilities:`,
      `- **Orchestrator Agent**: Identifies your intent and coordinates tasks.`,
      `- **Resume Agent**: Extracts structured profiles, skills, and professional domains.`,
      `- **Career Guidance Agent**: Explains match scores, analyzes skill gaps, and prepares interview questions.`,
      '',
      hasProfile
        ? `Your active profile is loaded (**${profile.designation || 'Candidate'}** with **${profile.skills?.length || 0} skills**). You can ask me for job recommendations or skill gap advice!`
        : `You haven't uploaded a resume yet. You can paste your resume text here, or head to **My Profile** to upload a PDF or DOCX file.`,
    ].join('\n'),
    timestamp: new Date().toISOString(),
  };

  // Load conversation history on mount if conversationId exists
  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      if (!conversationId) {
        setMessages([defaultWelcomeMessage]);
        return;
      }

      setFetchingHistory(true);
      try {
        const res = await fetchConversation(conversationId);
        if (isMounted && res?.success && res.conversation?.messages) {
          if (res.conversation.messages.length > 0) {
            setMessages(res.conversation.messages);
          } else {
            setMessages([defaultWelcomeMessage]);
          }
          if (res.conversation.candidateProfile) {
            setProfile(res.conversation.candidateProfile);
          }
        } else if (isMounted) {
          setMessages([defaultWelcomeMessage]);
        }
      } catch (err) {
        console.warn('Could not restore conversation history:', err);
        if (isMounted) {
          setMessages([defaultWelcomeMessage]);
        }
      } finally {
        if (isMounted) {
          setFetchingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [conversationId]);

  // Auto-scroll to bottom of message list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = typeof customText === 'string' ? customText : inputText;
    if (!textToSend.trim() || loading) return;

    setError(null);
    const userMessage = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const res = await sendChatMessage({
        message: textToSend.trim(),
        conversationId: conversationId || null,
        candidateProfile: profile || null,
      });

      if (res && res.success) {
        if (res.conversationId && res.conversationId !== conversationId) {
          setConversationId(res.conversationId);
        }

        if (res.candidateProfile) {
          setProfile(res.candidateProfile);
        }

        const assistantMessage = {
          role: 'model',
          content: res.answer || 'I could not process a response.',
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(res?.message || 'Agent returned an unsuccessful response.');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Unable to send message to AI Assistant.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear current chat conversation history?')) return;

    try {
      if (conversationId) {
        await clearConversation(conversationId);
      }
    } catch (e) {
      console.warn('Failed clearing conversation on server:', e);
    }
    setConversationId(null);
    setMessages([defaultWelcomeMessage]);
    setError(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const promptSuggestions = [
    { label: 'Recommend top jobs for my profile', prompt: 'Recommend the best matching jobs for my background.' },
    { label: 'What are my verified skill gaps?', prompt: 'Analyze my verified skill gaps across suitable target jobs.' },
    { label: 'Prepare interview questions', prompt: 'Generate interview questions and preparation advice for my role.' },
    { label: 'What does a Project Manager do?', prompt: 'What does a Project Manager do and what core methodologies do they use?' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Career Assistant</h1>
            <Badge variant="brand" size="sm">
              <Sparkles className="w-3 h-3 mr-1" />
              Hybrid Multi-Agent
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Orchestrator coordinating Resume and Career Guidance agents with deterministic matching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {conversationId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              icon={Trash2}
              className="text-xs text-slate-600 hover:text-rose-600"
            >
              Clear Chat
            </Button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 px-1">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                  isUser
                    ? 'bg-slate-800'
                    : 'bg-gradient-to-tr from-brand-700 to-brand-500'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm ${
                  isUser
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-tl-none'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 animate-spin" />
              <span>Orchestrator coordinating specialist agents...</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="py-2">
            <ErrorAlert
              title="Assistant Error"
              message={error}
              onRetry={() => handleSendMessage()}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="pt-2 pb-3 overflow-x-auto flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Suggestions:
        </span>
        {promptSuggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(item.prompt)}
            disabled={loading}
            className="text-xs px-3 py-1.5 bg-white border border-slate-200 hover:border-brand-400 hover:bg-brand-50/50 text-slate-700 rounded-lg whitespace-nowrap transition-colors disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm flex items-end gap-2">
        <textarea
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask HireMind AI for job recommendations, skill gap analysis, or resume guidance..."
          className="flex-1 max-h-32 p-2.5 text-sm bg-transparent focus:outline-none resize-none text-slate-900 placeholder:text-slate-400"
        />

        <Button
          variant="primary"
          size="md"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || loading}
          className="shrink-0 h-10 px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
