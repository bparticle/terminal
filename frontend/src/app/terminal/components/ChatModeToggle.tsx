'use client';

interface ChatModeToggleProps {
  chatMode: boolean;
  onToggle: () => void;
  isSocketConnected: boolean;
}

export default function ChatModeToggle({
  chatMode,
  onToggle,
  isSocketConnected,
}: ChatModeToggleProps) {
  return (
    <button
      type="button"
      className={`chat-toggle ${chatMode ? 'chat-toggle-active' : ''}`}
      onClick={onToggle}
      title={
        chatMode
          ? 'Switch to command mode (Tab)'
          : 'Switch to talk mode (Tab)'
      }
      aria-label={chatMode ? 'Switch to command mode' : 'Switch to talk mode'}
    >
      {chatMode ? (
        // Talk mode: speech bubble icon
        <span className="chat-toggle-label">
          <span className="chat-toggle-icon">&#9993;</span>
          TALK
        </span>
      ) : (
        // Command mode: terminal prompt
        <span className="chat-toggle-label">
          &gt;_
        </span>
      )}
      {chatMode && !isSocketConnected && (
        <span className="chat-toggle-offline" title="Reconnecting...">!</span>
      )}
    </button>
  );
}
