import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Bot, User, Loader2 } from "lucide-react";
import { useChatStore, type ChatMessage } from "../store/chatStore";

/* ── Chat Bubble ───────────────────────────────────────────── */
function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-primary/15 text-primary" : "bg-surface-card border border-hairline text-muted"
        }`}
      >
        {isUser ? <User size={16} strokeWidth={1.5} /> : <Bot size={16} strokeWidth={1.5} />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-white border border-hairline text-body rounded-tr-md"
            : "bg-surface-card border border-hairline text-body rounded-tl-md"
        }`}
      >
        {msg.content}
      </div>
    </motion.div>
  );
}

/* ── Typing Indicator ──────────────────────────────────────── */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex gap-3"
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-surface-card border border-hairline text-muted">
        <Bot size={16} strokeWidth={1.5} />
      </div>
      <div className="bg-surface-card border border-hairline rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-muted-soft animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-muted-soft animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-muted-soft animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ── AIPage ────────────────────────────────────────────────── */
export default function AIPage() {
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const error = useChatStore((s) => s.error);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // ── Send message ──
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage(text);
    setInput("");
  }, [input, isLoading, sendMessage, setInput]);

  // ── Keyboard: Enter to send ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center justify-between h-12 px-5 bg-canvas border-b border-hairline z-20">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-muted-soft hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          <span>返回</span>
        </Link>
        <h1 className="text-sm font-medium text-ink tracking-tight">AI 问答</h1>
        <div className="w-16" />
      </header>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-6 space-y-5 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}
        </AnimatePresence>

        {isLoading && <TypingIndicator />}

        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-center text-xs text-error bg-error/5 rounded-lg px-4 py-2 max-w-sm mx-auto"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input bar ── */}
      <div className="flex-shrink-0 border-t border-hairline bg-canvas px-5 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入建筑构造问题…"
            disabled={isLoading}
            className="flex-1 h-10 px-4 rounded-xl bg-surface-card border border-hairline
              text-sm text-body placeholder:text-muted-soft/60
              focus:outline-none focus:border-primary/40 focus:bg-white
              transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
              bg-primary text-white
              hover:bg-primary-active
              disabled:bg-hairline disabled:text-muted-soft disabled:cursor-not-allowed
              transition-all duration-200 active:scale-95"
          >
            {isLoading ? (
              <Loader2 size={18} strokeWidth={2} className="animate-spin" />
            ) : (
              <Send size={18} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
