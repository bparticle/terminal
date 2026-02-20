'use client';

interface ChatModeToggleProps {
  chatMode: boolean;
  onToggle: () => void;
  isSocketConnected: boolean;
  disabled?: boolean;
  disabledReason?: 'solo' | 'private';
}

export default function ChatModeToggle({
  chatMode,
  onToggle,
  isSocketConnected,
  disabled = false,
  disabledReason = 'solo',
}: ChatModeToggleProps) {
  const disabledTitle = disabledReason === 'private'
    ? 'No one can hear you here'
    : 'Chat disabled (solo mode)';

  return (
    <button
      type="button"
      className={`chat-toggle ${chatMode ? 'chat-toggle-active' : ''} ${disabled ? 'chat-toggle-disabled' : ''}`}
      onClick={disabled ? undefined : onToggle}
      title={
        disabled
          ? disabledTitle
          : chatMode
            ? 'Switch to command mode (Tab)'
            : 'Switch to talk mode (Tab)'
      }
      aria-label={chatMode ? 'Switch to command mode' : 'Switch to talk mode'}
      aria-disabled={disabled}
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
