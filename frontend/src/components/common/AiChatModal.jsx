import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon, PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';
import aiService from '../../services/aiService.js';

const AiChatModal = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Привет! Я помогу с задачами: приоритеты, дедлайны, разбиение на шаги. Чем помочь?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    const res = await aiService.sendMessage(text);
    setLoading(false);
    if (res.success) {
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
    } else {
      setMessages((m) => [...m, { role: 'assistant', content: 'Извините, сервис ИИ сейчас недоступен.' }]);
    }
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
      <div className="absolute inset-x-0 bottom-0 md:inset-0 md:m-auto md:h-[70vh] md:w-[800px] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-primary-600 text-white flex items-center justify-center mr-2">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <h3 className="font-medium">Помощь ИИ</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Messages */}
        <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
              <div
                className={
                  'inline-block max-w-[90%] px-3 py-2 rounded-xl ' +
                  (m.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800')
                }
              >
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
              className="flex-1 resize-none rounded-lg border px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <button onClick={send} disabled={loading} className="btn-primary">
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChatModal;

