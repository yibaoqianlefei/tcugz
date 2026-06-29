import { create } from "zustand";

/* ── Types ─────────────────────────────────────────────────── */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

/* ── Helpers ────────────────────────────────────────────────── */
let _msgCounter = 0;
function nextId(): string {
  _msgCounter++;
  return `msg-${Date.now()}-${_msgCounter}`;
}

/* ── Welcome message ────────────────────────────────────────── */
const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好！我是小g助教，专门帮同学们理解建筑构造知识。",
};

/* ── System prompt (Step 5) ──────────────────────────────────── */
const SYSTEM_PROMPT = `你是一个专业的建筑学助教，专门帮助建筑学大三学生理解建筑构造。回答需严谨、专业，并具有较强的空间逻辑感。回答时请分层次讲解（如结构层、找平层、防水层、保温层等），多用比喻和三维空间联想。如果遇到不懂的具体案例，请坦诚告知，并引导学生查阅教材。`;

/* ── API call ────────────────────────────────────────────────── */
async function fetchAIResponse(messages: ChatMessage[]): Promise<string> {
  // Build API-compatible message array (system + history, no ids)
  const apiMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch("/api/deepseek/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as any).error?.message || `请求失败 (${res.status})`
    );
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "（未获取到回复内容）";
}

/* ── Store ──────────────────────────────────────────────────── */
export const useChatStore = create<ChatState>((set) => ({
  messages: [WELCOME],
  isLoading: false,
  error: null,

  sendMessage: async (content: string) => {
    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      content: content.trim(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg],
      isLoading: true,
      error: null,
    }));

    try {
      const messages = useChatStore.getState().messages;
      const reply = await fetchAIResponse(messages);

      const aiMsg: ChatMessage = {
        id: nextId(),
        role: "assistant",
        content: reply,
      };

      set((s) => ({
        messages: [...s.messages, aiMsg],
        isLoading: false,
      }));
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : "请求失败，请稍后重试",
      });
    }
  },

  clearChat: () => {
    set({ messages: [WELCOME], error: null });
  },
}));
