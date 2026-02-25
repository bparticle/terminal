'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@/context/AuthProvider';
import { setAuthContext, getUserProfile, updateProfileName, fetchWithAuth } from '@/lib/api';
import { GameEngine, SignAndSubmitFn } from '@/lib/game-engine';
import { processCommand, TerminalContext } from '@/lib/terminal-commands';
import Monitor from './components/Monitor';
import StatsBox from './components/StatsBox';
import InventoryBox from './components/InventoryBox';
import PlayersPanel from './components/PlayersPanel';
import ChatModeToggle from './components/ChatModeToggle';
import ScanlineTitle from './components/ScanlineTitle';
import { APP_VERSION } from '@/lib/version';
import SnakeGame from '@/components/terminal/SnakeGame';
import IframeGame from '@/components/terminal/IframeGame';
import { useSocket, ChatMessage, ChatSystemEvent } from '@/lib/useSocket';
import './game-terminal.css';

const godotGameConfig: Record<string, { title: string; src: string }> = {
  snake_godot: { title: 'Snake', src: '/games/snake/snake.html' },
};

function parseFormattedText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={i} className="text-emphasis">{part.slice(2, -2)}</span>;
    }
    return part;
  });
}

interface OutputLine {
  text: string;
  isUser?: boolean;
  className?: string;
  timestamp: number;
  id?: string;
}

type OnboardingState = 'idle' | 'checking' | 'ask_name' | 'done';

export default function GameTerminal() {
  const { publicKey, connected, disconnect, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const { isAuthenticated, isAuthenticating, getAuthHeaders, authenticate, isInitialized } = useAuth();

  const [output, setOutput] = useState<OutputLine[]>([]);
  const [input, setInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState('HUB');
  const [inventory, setInventory] = useState<Array<{ name: string; soulbound?: boolean; assetId?: string; isFrozen?: boolean }>>([]);
  const [theme, setThemeState] = useState('1');
  const [pendingRestart, setPendingRestart] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>('idle');
  const [chatMode, setChatMode] = useState(false);
  const [soloMode, setSoloMode] = useState(false);
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [monitorImageUrl, setMonitorImageUrl] = useState<string | null>(null);

  const engineRef = useRef<GameEngine | null>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const terminalOutputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentNodeIdRef = useRef<string | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const wasAuthenticatedRef = useRef(false);
  const pfpImageUrlRef = useRef<string | null>(null);

  // ── Refs for use in stable callbacks ──────────
  const soloModeRef = useRef(soloMode);
  useEffect(() => {
    soloModeRef.current = soloMode;
  }, [soloMode]);

  const isPrivateRoomRef = useRef(isPrivateRoom);
  useEffect(() => {
    isPrivateRoomRef.current = isPrivateRoom;
  }, [isPrivateRoom]);

  // ── Monitor image (display-image / clear-display events) ──
  useEffect(() => {
    const handleDisplay = (e: CustomEvent<{ imageUrl: string }>) => {
      setMonitorImageUrl(e.detail.imageUrl || null);
    };
    const handleClear = () => setMonitorImageUrl(null);

    window.addEventListener('display-image', handleDisplay as EventListener);
    window.addEventListener('clear-display', handleClear);
    return () => {
      window.removeEventListener('display-image', handleDisplay as EventListener);
      window.removeEventListener('clear-display', handleClear);
    };
  }, []);

  // ── Socket.IO for room chat ──────────────────────────────
  const handleChatMessage = useCallback((msg: ChatMessage) => {
    if (soloModeRef.current || isPrivateRoomRef.current) return;
    const isMe = msg.sender === playerName;
    const prefix = isMe ? '[You]' : `[${msg.sender}]`;
    setOutput((prev) => [
      ...prev,
      {
        text: `${prefix}: ${msg.message}`,
        className: isMe ? 'chat-message chat-message-self' : 'chat-message',
        timestamp: msg.timestamp,
      },
    ]);
  }, [playerName]);

  const handleSystemEvent = useCallback((evt: ChatSystemEvent) => {
    if (soloModeRef.current || isPrivateRoomRef.current) return;
    setOutput((prev) => [
      ...prev,
      {
        text: `* ${evt.message}`,
        className: 'chat-system',
        timestamp: evt.timestamp,
      },
    ]);
  }, []);

  const { isConnected: isSocketConnected, joinRoom, leaveRoom, sendMessage } = useSocket({
    onChatMessage: handleChatMessage,
    onSystemEvent: handleSystemEvent,
  });

  // Wraps setCurrentLocation to also join/leave the Socket.IO room.
  // roomId is the chat cluster identifier (chat_room field on the node, or nodeId if unset).
  const handleLocationChange = useCallback((location: string, nodeId?: string, roomId?: string) => {
    setCurrentLocation(location);
    if (nodeId) {
      currentNodeIdRef.current = nodeId;

      // Check if the node is social (chat-enabled) or private (isolated)
      const isSocial = engineRef.current?.isSocialNode() ?? true;
      setIsPrivateRoom(!isSocial);

      if (isSocial) {
        // Use the cluster room ID when provided; fall back to the node ID.
        joinRoom(roomId ?? nodeId);
      } else {
        // Leave room so other players can't see or message you here
        leaveRoom();
        setChatMode(false);
      }
    }
  }, [joinRoom, leaveRoom]);

  // Set auth context for API client
  useEffect(() => {
    if (isAuthenticated) {
      setAuthContext({ getAuthHeaders, authenticate });
    }
  }, [isAuthenticated, getAuthHeaders, authenticate]);

  // Load theme and solo mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('terminalTheme') || '1';
    setThemeState(saved);
    document.documentElement.setAttribute('data-theme', saved);

    const savedSolo = localStorage.getItem('soloMode') === 'true';
    setSoloMode(savedSolo);
  }, []);

  const setTheme = useCallback((t: string) => {
    setThemeState(t);
    localStorage.setItem('terminalTheme', t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  // Output helpers
  const addOutput = useCallback((text: string, className?: string, id?: string) => {
    setOutput((prev) => {
      if (id) {
        const idx = prev.findIndex((line) => line.id === id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], text, className, timestamp: Date.now() };
          return updated;
        }
      }
      return [...prev, { text, className, timestamp: Date.now(), id }];
    });
  }, []);

  const addUserOutput = useCallback((text: string) => {
    setOutput((prev) => [
      ...prev,
      { text: `> ${text}`, isUser: true, className: 'text-gray-400', timestamp: Date.now() },
    ]);
  }, []);

  // Sign a partially-signed transaction and return the fully-signed tx as base64.
  // The backend submits to Helius directly (bypasses frontend RPC proxy).
  const signAndSubmit: SignAndSubmitFn = useCallback(async (txBase64: string): Promise<string> => {
    if (!signTransaction) throw new Error('Wallet does not support signing');
    const txBytes = Buffer.from(txBase64, 'base64');
    const transaction = VersionedTransaction.deserialize(txBytes);
    const signed = await signTransaction(transaction);
    return Buffer.from(signed.serialize()).toString('base64');
  }, [signTransaction]);

  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  // Estimate how many terminal lines fit in the output viewport.
  const getStoryPageSize = useCallback((): number => {
    const outputEl = terminalOutputRef.current;
    if (!outputEl) return 14;

    const styles = window.getComputedStyle(outputEl);
    const lineHeightRaw = parseFloat(styles.lineHeight);
    const fontSizeRaw = parseFloat(styles.fontSize);
    const lineHeight = Number.isFinite(lineHeightRaw) ? lineHeightRaw : (Number.isFinite(fontSizeRaw) ? fontSizeRaw * 1.4 : 30);

    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    const availableHeight = Math.max(0, outputEl.clientHeight - paddingTop - paddingBottom);
    const visibleLines = Math.floor(availableHeight / Math.max(1, lineHeight));

    return Math.max(4, visibleLines);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  // ============================================================
  // ONBOARDING: Check profile after auth, ask for name if needed
  // ============================================================
  useEffect(() => {
    if (!isAuthenticated || !publicKey || onboardingState !== 'idle') return;

    setOnboardingState('checking');

    getUserProfile()
      .then((profile) => {
        if (profile.name) {
          // Returning user - skip onboarding
          setPlayerName(profile.name);
          setOnboardingState('done');
          addOutput('=== TERMINAL ADVENTURE v1.0 ===', 'text-cyan-400');
          addOutput('');
          addOutput(`Welcome back, ${profile.name}.`, 'text-green-400');
          addOutput('Resuming your adventure...', 'text-gray-400');
          addOutput('');

          if (profile.pfp_image_url) {
            pfpImageUrlRef.current = profile.pfp_image_url;
          }
        } else {
          // New user - start onboarding
          setOnboardingState('ask_name');
          addOutput('=== TERMINAL ADVENTURE v1.0 ===', 'text-cyan-400');
          addOutput('');
          addOutput('Initializing new user profile...', 'text-yellow-400');
          addOutput('');
          addOutput('Before we begin, traveler, what shall we call you?', 'text-white');
          addOutput('Enter your name:', 'text-cyan-400');
        }
      })
      .catch(() => {
        // Fallback: proceed with onboarding
        setOnboardingState('ask_name');
        addOutput('=== TERMINAL ADVENTURE v1.0 ===', 'text-cyan-400');
        addOutput('');
        addOutput('What shall we call you, traveler?', 'text-white');
        addOutput('Enter your name:', 'text-cyan-400');
      });
  }, [isAuthenticated, publicKey, onboardingState]);

  // Initialize game engine AFTER onboarding is done
  useEffect(() => {
    if (onboardingState !== 'done' || !publicKey || engineRef.current) return;

    const engine = new GameEngine(
      addOutput,
      handleLocationChange,
      setInventory,
      (gameId: string) => {
        if (godotGameConfig[gameId]) {
          setActiveGame(gameId);
        } else if (gameId === 'snake') {
          setActiveGame('snake');
        } else {
          addOutput(`Unknown game: ${gameId}`, 'text-red-400');
          addOutput('Press ENTER to continue...', 'text-gray-400');
        }
      },
      signAndSubmit,
      getStoryPageSize,
    );

    engineRef.current = engine;

    engine.initialize(publicKey.toBase58(), playerName || 'Wanderer', pfpImageUrlRef.current || undefined);

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [onboardingState, publicKey, playerName, handleLocationChange, signAndSubmit, getStoryPageSize]);

  // Heartbeat: send presence every 60 seconds while authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Immediate heartbeat
    fetchWithAuth('users/heartbeat', { method: 'POST' }).catch(() => {});

    const interval = setInterval(() => {
      fetchWithAuth('users/heartbeat', { method: 'POST' }).catch(() => {});
    }, 60_000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Track auth state transitions: clean up persona when auth is lost
  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticatedRef.current = true;
    } else if (wasAuthenticatedRef.current && isInitialized) {
      wasAuthenticatedRef.current = false;
      setPlayerName(null);
      setMonitorImageUrl(null);
      setOnboardingState('idle');
      setInventory([]);
      setCurrentLocation('HUB');
      setChatMode(false);

      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }

      window.dispatchEvent(new CustomEvent('clear-display'));

      addOutput('');
      addOutput('Session ended. Please reconnect your wallet to continue.', 'text-yellow-400');
      addOutput('');
    }
  }, [isAuthenticated, isInitialized]);

  // Show welcome message only when not connected and not authenticating
  useEffect(() => {
    if (isInitialized && !connected && !isAuthenticated && !isAuthenticating) {
      addOutput('=== TERMINAL ADVENTURE v1.0 ===', 'text-cyan-400');
      addOutput('');
      addOutput('Connect your Solana wallet to begin.', 'text-white');
      addOutput('Type "help" for a list of commands.', 'text-gray-400');
      addOutput('');
    }
  }, [isInitialized, connected, isAuthenticated, isAuthenticating]);

  // Handle onboarding name input
  const handleOnboardingInput = useCallback(
    async (value: string) => {
      const trimmed = value.trim();

      if (onboardingState === 'ask_name') {
        if (!trimmed) {
          addOutput('Please enter a name (2-20 characters):', 'text-yellow-400');
          return;
        }

        if (trimmed.length < 2 || trimmed.length > 20) {
          addOutput('Name must be between 2 and 20 characters. Try again:', 'text-red-400');
          return;
        }

        // Save name to backend
        addOutput(`Setting name to "${trimmed}"...`, 'text-yellow-400');

        try {
          await updateProfileName(trimmed);
          setPlayerName(trimmed);
          addOutput('');
          addOutput(`Identity confirmed: ${trimmed}`, 'text-green-400');
          addOutput('');
          addOutput('Initializing SCANLINES...', 'text-yellow-400');
          addOutput('');
          setOnboardingState('done');
        } catch {
          addOutput('Failed to save name. Try again:', 'text-red-400');
        }
      }
    },
    [onboardingState, addOutput]
  );

  // Toggle solo mode
  const toggleSoloMode = useCallback(() => {
    setSoloMode((prev) => {
      const next = !prev;
      localStorage.setItem('soloMode', String(next));
      if (next) {
        setChatMode(false);
      }
      return next;
    });
  }, []);

  // Toggle chat mode (blocked by solo mode or private rooms)
  const toggleChatMode = useCallback(() => {
    if (soloMode || isPrivateRoom) return;
    setChatMode((prev) => !prev);
  }, [soloMode, isPrivateRoom]);

  // Handle form submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();

      // During onboarding, route all input to the onboarding handler
      if (onboardingState === 'ask_name') {
        if (trimmed) addUserOutput(trimmed);
        await handleOnboardingInput(input);
        setInput('');
        return;
      }

      // ── Chat mode: send message instead of processing commands ──
      if (chatMode && trimmed) {
        sendMessage(trimmed);
        setInput('');
        return;
      }

      // Echo user input (even if empty for "enter to continue")
      if (trimmed) {
        addUserOutput(trimmed);
      }

      // Build terminal context
      const ctx: TerminalContext = {
        engine: engineRef.current,
        walletAddress: publicKey?.toBase58() || null,
        connected,
        isAuthenticated,
        addOutput,
        clearOutput,
        openWalletModal: () => setVisible(true),
        disconnectWallet: () => disconnect(),
        setTheme,
        currentTheme: theme,
        pendingRestart,
        setPendingRestart,
      };

      // Try game engine first
      if (engineRef.current) {
        if (engineRef.current.canHandleInput(input)) {
          await engineRef.current.processInput(input);
          setInput('');
          return;
        }
      }

      // Try terminal commands
      if (trimmed && processCommand(trimmed, ctx)) {
        setInput('');
        return;
      }

      // Try game engine as fallback (for numbered choices)
      if (engineRef.current && trimmed) {
        await engineRef.current.processInput(input);
      } else if (trimmed && !isAuthenticated) {
        addOutput('Unknown command. Type "help" for available commands.', 'text-gray-400');
      }

      setInput('');
    },
    [input, publicKey, connected, isAuthenticated, theme, pendingRestart, onboardingState, chatMode, addOutput, addUserOutput, clearOutput, setTheme, setVisible, disconnect, handleOnboardingInput, sendMessage]
  );

  // Re-focus input when returning from a mini-game
  useEffect(() => {
    if (activeGame === null) {
      // Small delay to ensure overlay is gone before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeGame]);

  // Handle Snake game events
  const handleSnakeGameOver = useCallback(
    (score: number) => {
      if (engineRef.current) {
        engineRef.current.handleMinigameEvent('game_over', { score });
      }
      setActiveGame(null);
    },
    []
  );

  const handleSnakeExit = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.handleMinigameEvent('exit', { score: 0 });
    }
    setActiveGame(null);
  }, []);

  // Godot iframe game handlers
  const handleGodotMessage = useCallback((data: any) => {
    if (!engineRef.current || !data?.event) return;
    const event: string = data.event;
    const metrics: Record<string, any> = data.metrics || {};
    engineRef.current.handleMinigameEvent(event, metrics);
    if (!engineRef.current.isMinigameRunning()) {
      setActiveGame(null);
    }
  }, []);

  const handleGodotExit = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.handleMinigameEvent('exit', { score: 0 });
    }
    setActiveGame(null);
  }, []);

  // Handle clicking a choice or "press ENTER to continue"
  const handleChoiceClick = useCallback(
    (value: string) => {
      // Set input and submit programmatically
      setInput(value);
      // We need to submit after the state update, so use a microtask
      setTimeout(async () => {
        if (value) {
          addUserOutput(value);
        }

        const ctx: TerminalContext = {
          engine: engineRef.current,
          walletAddress: publicKey?.toBase58() || null,
          connected,
          isAuthenticated,
          addOutput,
          clearOutput,
          openWalletModal: () => setVisible(true),
          disconnectWallet: () => disconnect(),
          setTheme,
          currentTheme: theme,
          pendingRestart,
          setPendingRestart,
        };

        if (engineRef.current) {
          if (engineRef.current.canHandleInput(value)) {
            await engineRef.current.processInput(value);
            setInput('');
            inputRef.current?.focus();
            return;
          }
        }

        if (value && processCommand(value, ctx)) {
          setInput('');
          inputRef.current?.focus();
          return;
        }

        if (engineRef.current && value) {
          await engineRef.current.processInput(value);
        }

        setInput('');
        inputRef.current?.focus();
      }, 0);
    },
    [publicKey, connected, isAuthenticated, theme, pendingRestart, addOutput, addUserOutput, clearOutput, setTheme, setVisible, disconnect]
  );

  const handleTerminalMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Focus input on click, but not if user is selecting text
  const handleTerminalClick = useCallback((e: React.MouseEvent) => {
    const dx = e.clientX - mouseDownPosRef.current.x;
    const dy = e.clientY - mouseDownPosRef.current.y;
    if (dx * dx + dy * dy > 25) return;

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) return;

    inputRef.current?.focus();
  }, []);

  return (
    <div className="terminal-page">
      <div className="title-header">
        <ScanlineTitle variant={5} />
        <span className="version-badge">v{APP_VERSION}</span>
      </div>
      <div className="retro-container">
        {/* Main Terminal */}
        <div className="terminal-section" onMouseDown={handleTerminalMouseDown} onClick={handleTerminalClick}>
          <div className="terminal-header">
            <span>TERMINAL ADVENTURE</span>
            <span className="terminal-location">{currentLocation}</span>
            {/* Mobile sidebar toggle */}
            <button
              className="sidebar-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }}
            >
              ☰
            </button>
          </div>

          <div
            ref={terminalOutputRef}
            className="terminal-output"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {isAuthenticating && (
              <div className="terminal-line text-yellow-400">
                Authenticating wallet...
              </div>
            )}
            {output.map((line, i) => {
              const choiceMatch = line.text.match(/^\[(\d+)\]\s/);
              const isEnterPrompt = line.text.includes('Press ENTER');
              const isLocked = line.className === 'choice-locked';
              const isClickable = (choiceMatch || isEnterPrompt) && !line.isUser && !isLocked;

              return (
                <div
                  key={`${line.timestamp}-${i}`}
                  className={`terminal-line ${line.className || ''} ${line.isUser ? 'user-input' : ''} ${isClickable ? 'clickable-line' : ''}`}
                  onClick={
                    isClickable
                      ? (e) => {
                          e.stopPropagation();
                          if (choiceMatch) {
                            handleChoiceClick(choiceMatch[1]);
                          } else {
                            handleChoiceClick('');
                          }
                        }
                      : undefined
                  }
                >
                  {line.text ? parseFormattedText(line.text) : '\u00A0'}
                </div>
              );
            })}
            <div ref={outputEndRef} />
          </div>

          <form onSubmit={handleSubmit} className={`terminal-input-form ${chatMode ? 'chat-mode' : ''}`}>
            {isAuthenticated && onboardingState === 'done' ? (
              <ChatModeToggle
                chatMode={chatMode}
                onToggle={toggleChatMode}
                isSocketConnected={isSocketConnected}
                disabled={soloMode || isPrivateRoom}
                disabledReason={isPrivateRoom ? 'private' : 'solo'}
              />
            ) : (
              <span className="terminal-prompt">&gt;_</span>
            )}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && isAuthenticated && onboardingState === 'done' && !soloMode && !isPrivateRoom) {
                  e.preventDefault();
                  toggleChatMode();
                }
              }}
              className="terminal-input"
              autoFocus
              autoComplete="off"
              placeholder={
                onboardingState === 'ask_name'
                  ? 'Enter your name...'
                  : chatMode
                    ? 'Talk to nearby players...'
                    : isAuthenticated
                      ? 'Enter command...'
                      : 'Connect wallet to start'
              }
              disabled={activeGame !== null}
            />
            {isAuthenticated && onboardingState === 'done' && (
              <button
                type="button"
                className={`solo-toggle ${soloMode ? 'solo-toggle-active' : ''}`}
                onClick={toggleSoloMode}
                title={soloMode ? 'Exit solo mode' : 'Solo mode - mute all chat'}
                aria-label={soloMode ? 'Exit solo mode' : 'Enable solo mode'}
              >
                SOLO
              </button>
            )}
          </form>

          {/* Canvas snake game overlay */}
          {activeGame === 'snake' && (
            <div className="minigame-overlay">
              <SnakeGame
                onGameOver={handleSnakeGameOver}
                onExit={handleSnakeExit}
                autoStart
              />
            </div>
          )}

          {/* Godot iframe game overlay */}
          {activeGame && godotGameConfig[activeGame] && (
            <div className="minigame-overlay">
              <IframeGame
                title={godotGameConfig[activeGame].title}
                src={godotGameConfig[activeGame].src}
                onMessage={handleGodotMessage}
                onExitRequested={handleGodotExit}
              />
            </div>
          )}
        </div>

        {/* Side Panel (Desktop) */}
        <div className="side-panel">
          <Monitor imageUrl={monitorImageUrl} />
          <StatsBox walletAddress={publicKey?.toBase58() || null} />
          <InventoryBox items={inventory} />
          <PlayersPanel currentPlayerName={playerName} isolated={isPrivateRoom} />
        </div>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="mobile-overlay" onClick={() => setSidebarOpen(false)}>
            <div
              className="mobile-sidebar"
              onClick={(e) => e.stopPropagation()}
            >
              <Monitor imageUrl={monitorImageUrl} />
              <StatsBox walletAddress={publicKey?.toBase58() || null} />
              <InventoryBox items={inventory} />
              <PlayersPanel currentPlayerName={playerName} isolated={isPrivateRoom} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
