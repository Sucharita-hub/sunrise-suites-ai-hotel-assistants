import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, LoaderCircle, Paperclip, RotateCcw } from "lucide-react";
import { askAssistant } from "../api";
import ChatMessage from "./ChatMessage";
import QuickQuestions from "./QuickQuestions";

function timeNow() {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());
}

const initialMessages = [
  {
    role: "assistant",
    content: "Hello! I'm your Sunrise Suites concierge. Ask me anything about our rooms, amenities, policies, or availability.",
    time: timeNow()
  }
];

export default function ChatWindow() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, error]);

  async function sendMessage(text = input) {
    const message = text.trim();
    if (!message || loading) return;

    const userMessage = { role: "user", content: message, time: timeNow() };
    const history = messages.map(({ role, content }) => ({ role, content }));

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const result = await askAssistant(message, history);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: result.answer,
          time: timeNow()
        }
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages(initialMessages);
    setInput("");
    setError("");
  }

  return (
    <section className="chat-section" id="assistant">
      <div className="chat-hero">
        <div className="hero-overlay">
          <span className="hero-pill"><Bot size={14} /> AI Concierge</span>
          <h1>Relax. Your stay starts here.</h1>
          <p>Get instant answers about Sunrise Suites, or let us help you find the right room.</p>
        </div>
      </div>

      <div className="chat-shell">
        <div className="chat-header">
          <div className="chat-agent">
            <div className="avatar bot-avatar"><Bot size={18} /></div>
            <div>
              <strong>Sunrise Concierge</strong>
              <span><i /> Online</span>
            </div>
          </div>
          <button className="reset-button" onClick={reset} title="New conversation">
            <RotateCcw size={16} /> New chat
          </button>
        </div>

        <div className="messages">
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}

          {loading && (
            <div className="message-row assistant-row">
              <div className="avatar bot-avatar"><Bot size={17} /></div>
              <div className="typing-bubble">
                <LoaderCircle size={16} className="spin" />
                <span>Checking that for you...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="chat-error">
              <div>
                <strong>Something went wrong</strong>
                <span>{error}</span>
              </div>
              <button onClick={() => sendMessage(messages[messages.length - 1]?.content || "")}>
                Try again
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {messages.length === 1 && <QuickQuestions onSelect={sendMessage} />}

        <form className="message-composer" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
          <button type="button" className="composer-icon" title="Attachment is not required for this demo">
            <Paperclip size={18} />
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about rooms, breakfast, check-in..."
            disabled={loading}
          />
          <button className="send-button" disabled={!input.trim() || loading} aria-label="Send message">
            {loading ? <LoaderCircle size={18} className="spin" /> : <ArrowUp size={19} />}
          </button>
        </form>
      </div>
    </section>
  );
}
