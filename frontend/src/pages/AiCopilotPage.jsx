import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, User, FileText, ArrowRight, 
  Calculator, CheckCircle2, TrendingUp, ShieldAlert, 
  Copy, Check, RefreshCw, MessageSquare, Zap, Lightbulb
} from 'lucide-react';
import { formatCurrency } from '../utils/masking';
import { aiApi } from '../services/api';
import { useAuth, ROLES } from '../context/AuthContext';

const PROMPT_SUGGESTIONS_BORROWER = [
  'How can I improve my loan approval odds for ₹10 Lakhs?',
  'What is the optimal tenure to reduce my monthly FOIR?',
  'How much loan can I get if I add a co-applicant earning ₹35k/mo?',
  'Why did my loan get flagged for exception review?'
];

const PROMPT_SUGGESTIONS_OFFICER = [
  'Draft regulatory credit appraisal memo for near-prime cohort',
  'Analyze portfolio risk concentration across CIBIL 680-720',
  'Suggest mitigating conditions for borderline 52% FOIR case',
  'Summarize top reasons for rejection this week'
];

const AiCopilotPage = () => {
  const { currentRole } = useAuth();
  const messagesEndRef = useRef(null);

  const [copilotPersona, setCopilotPersona] = useState(
    currentRole === ROLES.APPLICANT ? 'BORROWER' : 'OFFICER'
  );

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: copilotPersona === 'BORROWER'
        ? `👋 Hello! I am your **AI Loan Copilot & Credit Health Advisor**. Ask me anything about improving your approval odds, optimizing your monthly EMI, or checking your maximum borrowing capacity.`
        : `👋 Welcome Credit Officer! I am your **AI Underwriting Copilot**. I can help you draft audit-ready credit appraisal memos, assess portfolio concentration, or evaluate mitigating risk factors for borderline cases.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text || text.trim() === '') return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    try {
      const res = await aiApi.copilotChat({
        message: text,
        persona: copilotPersona,
        context: { role: currentRole }
      });

      if (res.success && res.data) {
        const aiMsg = {
          id: Date.now() + 1,
          sender: 'ai',
          text: res.data.reply,
          suggestions: res.data.suggestions,
          cardType: res.data.cardType,
          cardData: res.data.cardData,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Sorry, I encountered an issue communicating with the AI Copilot engine. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-150px)] flex flex-col space-y-3 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Header & Persona Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
            <Bot className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                AI Underwriting Copilot & Advisor
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
                GPT-4o Underwriting Fine-Tuned
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Real-time conversational underwriting guidance, credit health roadmaps & appraisal synthesis.
            </p>
          </div>
        </div>

        {/* Persona Mode Switcher */}
        <div className="flex items-center bg-[#161616] p-1 rounded-xl border border-[#333] shrink-0">
          <button
            type="button"
            onClick={() => {
              setCopilotPersona('BORROWER');
              setMessages([{
                id: Date.now(),
                sender: 'ai',
                text: 'Switched to **Borrower Advisory Mode**. Ask me how to optimize your loan ask, restructure tenure, or boost approval odds!',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }]);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              copilotPersona === 'BORROWER' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Borrower Advisor</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCopilotPersona('OFFICER');
              setMessages([{
                id: Date.now(),
                sender: 'ai',
                text: 'Switched to **Credit Officer Copilot Mode**. Ready to assist with credit appraisal memos, portfolio risk queries, and exception mitigation clauses.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }]);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              copilotPersona === 'OFFICER' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Underwriter Copilot</span>
          </button>
        </div>
      </div>

      {/* Main Chat Workbench */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-2xl flex flex-col flex-1 min-h-0">
        
        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-[#111] to-[#0e0e0e] min-h-0">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl space-y-3 ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                
                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none shadow-lg'
                      : 'bg-[#181818] border border-[#2c2c2c] text-gray-200 rounded-bl-none shadow-xl'
                  }`}
                >
                  <div className="prose prose-invert prose-xs whitespace-pre-wrap">
                    {m.text}
                  </div>

                  {m.sender === 'ai' && (
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#262626] text-[10px] text-gray-500">
                      <span>{m.timestamp}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(m.id, m.text)}
                        className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Rich Interactive Card (if returned) */}
                {m.cardType === 'CREDIT_ROADMAP' && m.cardData && (
                  <div className="bg-[#161616] border border-purple-500/30 rounded-xl p-3.5 space-y-2 text-xs animate-in fade-in">
                    <div className="flex items-center gap-2 text-purple-300 font-bold">
                      <TrendingUp className="w-4 h-4" />
                      <span>AI Projected Credit Trajectory</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                      <div className="bg-[#1c1c1c] p-2 rounded-lg border border-[#2a2a2a]">
                        <span className="text-gray-500 block text-[9px] uppercase">CIBIL Uplift</span>
                        <span className="font-extrabold text-emerald-400">{m.cardData.potentialCibilGain}</span>
                      </div>
                      <div className="bg-[#1c1c1c] p-2 rounded-lg border border-[#2a2a2a]">
                        <span className="text-gray-500 block text-[9px] uppercase">Target FOIR</span>
                        <span className="font-extrabold text-purple-300 font-mono">{m.cardData.targetFoir}</span>
                      </div>
                      <div className="bg-[#1c1c1c] p-2 rounded-lg border border-[#2a2a2a]">
                        <span className="text-gray-500 block text-[9px] uppercase">Max Eligible</span>
                        <span className="font-extrabold text-amber-400">{formatCurrency(m.cardData.maxEligibleAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {m.cardType === 'EMI_SIMULATION' && m.cardData && (
                  <div className="bg-[#161616] border border-emerald-500/30 rounded-xl p-3.5 space-y-2 text-xs animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <Calculator className="w-4 h-4" />
                      <span>Tenure Restructuring Savings</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                      <div className="bg-[#1c1c1c] p-2 rounded-lg border border-[#2a2a2a]">
                        <span className="text-gray-500 block text-[9px] uppercase">Current 36M</span>
                        <span className="font-bold text-gray-300">{formatCurrency(m.cardData.currentEmi)}/mo</span>
                      </div>
                      <div className="bg-[#1c1c1c] p-2 rounded-lg border border-[#2a2a2a]">
                        <span className="text-gray-500 block text-[9px] uppercase">Optimized 60M</span>
                        <span className="font-extrabold text-emerald-400">{formatCurrency(m.cardData.optimizedEmi)}/mo</span>
                      </div>
                      <div className="bg-[#1c1c1c] p-2 rounded-lg border border-[#2a2a2a]">
                        <span className="text-gray-500 block text-[9px] uppercase">Monthly Relief</span>
                        <span className="font-extrabold text-amber-400">+{formatCurrency(m.cardData.monthlySavings)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Follow-up Suggestion Chips */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(s)}
                        className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-[#262626] border border-[#333] hover:border-purple-500/40 text-gray-300 hover:text-white rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}

              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-gray-400 text-xs pl-1 animate-pulse">
              <Bot className="w-4 h-4 text-purple-400 animate-spin" />
              <span>AI Copilot is synthesizing underwriting recommendation...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Starters Bar */}
        <div className="px-5 py-2.5 bg-[#141414] border-t border-[#222] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 shrink-0">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Starters:</span>
          </div>

          {(copilotPersona === 'BORROWER' ? PROMPT_SUGGESTIONS_BORROWER : PROMPT_SUGGESTIONS_OFFICER).map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(p)}
              className="px-2.5 py-1 bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] text-gray-300 hover:text-white rounded-lg text-[11px] shrink-0 transition-all truncate max-w-xs"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 bg-[#111] border-t border-[#2a2a2a] flex items-center gap-3"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              copilotPersona === 'BORROWER'
                ? "Ask anything about loan eligibility, FOIR optimization, or CIBIL improvements..."
                : "Ask for portfolio risk breakdowns, credit memos, or exception clauses..."
            }
            className="flex-1 bg-[#181818] border border-[#333] focus:border-purple-500 text-white rounded-xl px-4 py-3 text-xs focus:outline-none transition-all placeholder:text-gray-600"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg disabled:opacity-40"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>

    </div>
  );
};

export default AiCopilotPage;
