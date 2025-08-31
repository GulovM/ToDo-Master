import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, PaperAirplaneIcon, SparklesIcon, PlusIcon, ChevronDownIcon, ChevronRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import aiService from '../../services/aiService.js';

const AiChatModal = ({ onClose, onRefresh, onNotify }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Привет! Я помогу с задачами: приоритеты, дедлайны, разбиение на шаги. Чем помочь?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [showRawPlan, setShowRawPlan] = useState(false);
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [lastExecuted, setLastExecuted] = useState(false);
  const listRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const refreshChats = async () => {
    const res = await aiService.listChats();
    if (res.success) setChats(res.chats || []);
  };

  useEffect(() => {
    refreshChats();
  }, []);

  const selectChat = async (c) => {
    const res = await aiService.getChatMessages(c.id);
    if (res.success) {
      setChatId(c.id);
      setMessages(res.messages || []);
      setPendingPlan(null);
      setRequiresConfirmation(false);
    }
  };

  const newChat = () => {
    setChatId(null);
    setMessages([{ role: 'assistant', content: 'Новый диалог. Чем помочь?' }]);
    setPendingPlan(null);
    setRequiresConfirmation(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    const res = await aiService.sendMessage(text, { chatId });
    setLoading(false);
    if (res.success) {
      if (res.chat_id && !chatId) {
        setChatId(res.chat_id);
        // refresh chats list
        refreshChats();
      }
      // If a confirmation is required, show the panel, suppress extra text
      setPendingPlan(res.plan || null);
      setRequiresConfirmation(!!res.requires_confirmation);
      if (!res.requires_confirmation) {
        setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
      }
    } else {
      setMessages((m) => [...m, { role: 'assistant', content: 'Извините, сервис ИИ сейчас недоступен.' }]);
    }
  };

  const confirm = async () => {
    if (!pendingPlan) return;
    setLoading(true);
    const res = await aiService.sendMessage('', { chatId, confirm: true, actions: pendingPlan });
    setLoading(false);
    if (res.success) {
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
      setPendingPlan(null);
      setRequiresConfirmation(false);
      setLastExecuted(true);
      // Trigger external data refresh (tasks/categories/stats)
      try { onRefresh && onRefresh(); } catch (_) {}
      try {
        if (onNotify) {
          const msg = res.created ? (Array.isArray(res.created) ? res.created.join('; ') : String(res.reply || 'Изменения выполнены')) : String(res.reply || 'Изменения выполнены');
          onNotify({ type: 'success', message: msg });
        }
      } catch (_) {}
    } else {
      setMessages((m) => [...m, { role: 'assistant', content: 'Не удалось подтвердить действие.' }]);
      try { onNotify && onNotify({ type: 'error', message: 'Не удалось подтвердить действие.' }); } catch (_) {}
    }
  };

  const renderPlanSummary = (plan) => {
    if (!plan) return null;
    const sec = (title, items, renderItem) => {
      if (!items || items.length === 0) return null;
      const list = showFullPlan ? items : items.slice(0, 6);
      return (
        <div className="mt-2">
          <div className="text-sm font-medium text-gray-800">{title} <span className="text-gray-500">({items.length})</span></div>
          <ul className="mt-1 space-y-1 text-sm text-gray-700">
            {list.map((it, idx) => (
              <li key={idx} className="list-disc ml-5">{renderItem(it)}</li>
            ))}
          </ul>
        </div>
      );
    };
    const fmtDate = (d) => (d ? new Date(d).toLocaleString() : null);
    return (
      <div className="mt-2">
        {sec('Создать категории', plan.categories, (c) => `${c.name}${c.color ? ` (${c.color})` : ''}`)}
        {sec('Создать задачи', plan.tasks, (t) => `${t.title}${t.priority ? ` • ${t.priority}` : ''}${t.deadline ? ` • ${fmtDate(t.deadline)}` : ''}${t.category ? ` • ${t.category}` : ''}`)}
        {sec('Обновить категории', plan.update_categories, (u) => `${u.name}${u.new_name ? ` → ${u.new_name}` : ''}${u.color ? ` • ${u.color}` : ''}${u.description ? ' • описание' : ''}`)}
        {sec('Обновить задачи', plan.update_tasks, (u) => `${u.id ? `#${u.id}` : (u.title || 'задача')}${u.priority ? ` • ${u.priority}` : ''}${u.deadline ? ` • ${fmtDate(u.deadline)}` : ''}${u.category ? ` • ${u.category}` : ''}${typeof u.is_done==='boolean' ? ` • ${u.is_done ? 'выполнить' : 'вернуть в работу'}` : ''}`)}
        {sec('Удалить категории', plan.delete_categories, (d) => `${d.name}`)}
        {sec('Удалить задачи', plan.delete_tasks, (d) => `${d.id ? `#${d.id}` : (d.title || 'по названию')}`)}
      </div>
    );
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* Left docked drawer */}
      <div className="absolute left-0 top-0 bottom-0 w-full sm:w-[420px] bg-white shadow-2xl border-r flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-primary-600 text-white flex items-center justify-center mr-2">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <h3 className="font-medium">Помощь ИИ</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refreshChats} className="text-gray-500 hover:text-gray-800" title="Обновить историю">
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            <button onClick={newChat} className="text-primary-600 hover:text-primary-800" title="Новый диалог">
              <PlusIcon className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* History accordion */}
        <div className="border-b">
          <button onClick={() => setHistoryOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-50">
            <span className="text-sm font-medium text-gray-700">История</span>
            {historyOpen ? <ChevronDownIcon className="h-4 w-4 text-gray-500" /> : <ChevronRightIcon className="h-4 w-4 text-gray-500" />}
          </button>
          {historyOpen && (
            <div className="max-h-56 overflow-auto">
              {(chats || []).map((c) => (
                <button key={c.id} onClick={() => selectChat(c)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 border-t first:border-t-0 ${chatId===c.id?'bg-gray-100':''}`}>
                  <div className="truncate font-medium text-gray-800">{c.title}</div>
                  <div className="text-xs text-gray-500">{new Date(c.updated_at).toLocaleString()}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation */}
        <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
              <div className={'inline-block max-w-[90%] px-3 py-2 rounded-xl ' + (m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-800')}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-left">
              <div className="inline-block bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-xl">
                Печатаю...
              </div>
            </div>
          )}

          {requiresConfirmation && pendingPlan && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="text-sm font-medium text-yellow-700 mb-1">Требуется подтверждение</div>
              {/* Checklist summary */}
              {renderPlanSummary(pendingPlan)}
              {/* Raw JSON toggle */}
              <div className="mt-2">
                <button onClick={() => setShowRawPlan(v=>!v)} className="text-xs text-gray-600 hover:text-gray-800 underline">
                  {showRawPlan ? 'Скрыть JSON' : 'Показать JSON'}
                </button>
                <button onClick={() => setShowFullPlan(v=>!v)} className="ml-3 text-xs text-gray-600 hover:text-gray-800 underline">
                  {showFullPlan ? 'Свернуть' : 'Показать всё'}
                </button>
              </div>
              {showRawPlan && (
                <pre className="mt-2 text-xs overflow-auto max-h-40 bg-white border rounded p-2">{JSON.stringify(pendingPlan, null, 2)}</pre>
              )}
              <div className="mt-2 flex gap-2">
                <button onClick={confirm} disabled={loading} className="btn-primary">Подтвердить</button>
                <button onClick={() => { setPendingPlan(null); setRequiresConfirmation(false); }} className="btn-secondary">Отмена</button>
              </div>
            </div>
          )}

          {/* After execution, show quick links to see changes */}
          {lastExecuted && !requiresConfirmation && (
            <div className="mt-3 text-right">
              <button onClick={() => navigate('/tasks')} className="text-sm text-primary-700 hover:text-primary-900 underline mr-3">Перейти к задачам</button>
              <button onClick={() => navigate('/categories')} className="text-sm text-primary-700 hover:text-primary-900 underline">Перейти к категориям</button>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-white">
          <div className="flex items-center space-x-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Спросите про приоритеты, дедлайны, план..."
              disabled={requiresConfirmation || loading}
              className="flex-1 resize-none rounded-lg border px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            <button onClick={send} disabled={loading || requiresConfirmation} className="btn-primary disabled:opacity-50">
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChatModal;
