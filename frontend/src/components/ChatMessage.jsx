import { Bot, User } from "lucide-react";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "user-row" : "assistant-row"}`}>
      {!isUser && <div className="avatar bot-avatar"><Bot size={17} /></div>}

      <div className={`message-group ${isUser ? "user-group" : ""}`}>
        <div className={`message-bubble ${isUser ? "user-bubble" : "assistant-bubble"}`}>
          {message.content}
        </div>
        <div className="message-time">{message.time || "Now"}</div>
      </div>

      {isUser && <div className="avatar user-avatar"><User size={17} /></div>}
    </div>
  );
}
