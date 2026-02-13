'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@/context/AuthProvider';
import { setAuthContext } from '@/lib/api';
import { GameEngine } from '@/lib/game-engine';
import { processCommand, TerminalContext } from '@/lib/terminal-commands';
import Monitor from './components/Monitor';
import StatsBox from './components/StatsBox';
import InventoryBox from './components/InventoryBox';
import SnakeGame from '@/components/terminal/SnakeGame';
import './game-terminal.css';

interface OutputLine {
  text: string;
  isUser?: boolean;
  className?: string;
  timestamp: number;
}

export default function GameTerminal() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { isAuthenticated, isAuthenticating, getAuthHeaders, authenticate, isInitialized } = useAuth();

  const [output, setOutput] = useState<OutputLine[]>([]);
  const [input, setInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState('HUB');
  const [inventory, setInventory] = useState<Array<{ name: string }>>([]);
  const [theme, setThemeState] = useState('1');
  const [pendingRestart, setPendingRestart] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const engineRef = useRef<GameEngine | null>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set auth context for API client
  useEffect(() => {
    if (isAuthenticated) {
      setAuthContext({ getAuthHeaders, authenticate });
    }
  }, [isAuthenticated, getAuthHeaders, authenticate]);

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('terminalTheme') || '1';
    setThemeState(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const setTheme = useCallback((t: string) => {
    setThemeState(t);
    localStorage.setItem('terminalTheme', t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  // Output helpers
  const addOutput = useCallback((text: string, className?: string) => {
    setOutput((prev) => [
      ...prev,
      { text, className, timestamp: Date.now() },
    ]);
  }, []);

  const addUserOutput = useCallback((text: string) => {
    setOutput((prev) => [
      ...prev,
      { text: `> ${text}`, isUser: true, className: 'text-gray-400', timestamp: Date.now() },
    ]);
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  // Initialize game engine when authenticated
  useEffect(() => {
    if (isAuthenticated && publicKey && !engineRef.current) {
      const engine = new GameEngine(
        addOutput,
        setCurrentLocation,
        setInventory,
        (gameId: string) => {
          setActiveGame(gameId);
        }
      );

      engineRef.current = engine;
      engine.initialize(publicKey.toBase58());
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [isAuthenticated, publicKey]);

  // Show welcome message
  useEffect(() => {
    if (isInitialized && !connected) {
      addOutput('=== TERMINAL ADVENTURE v1.0 ===', 'text-cyan-400');
      addOutput('');
      addOutput('Connect your Solana wallet to begin.', 'text-white');
      addOutput('Type "help" for a list of commands.', 'text-gray-400');
      addOutput('');
    }
  }, [isInitialized, connected]);

  // Handle form submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();

      // Echo user input (even if empty for "enter to continue")
      if (trimmed) {
        addUserOutput(trimmed);
      }

      // Build terminal context
      const ctx: TerminalContext = {
        engine: engineRef.current,
        walletAddress: publicKey?.toBase58() || null,
        connected,
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
      } else if (trimmed && !connected) {
        addOutput('Unknown command. Type "help" for available commands.', 'text-gray-400');
      }

      setInput('');
    },
    [input, publicKey, connected, theme, pendingRestart, addOutput, addUserOutput, clearOutput, setTheme, setVisible, disconnect]
  );

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

  // Focus input on click
  const handleTerminalClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="terminal-page">
      <div className="retro-container">
        {/* Main Terminal */}
        <div className="terminal-section" onClick={handleTerminalClick}>
          <div className="terminal-header">
            <span>TERMINAL ADVENTURE v1.0</span>
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

          <div className="terminal-output">
            {isAuthenticating && (
              <div className="terminal-line text-yellow-400">
                Authenticating wallet...
              </div>
            )}
            {output.map((line, i) => (
              <div
                key={`${line.timestamp}-${i}`}
                className={`terminal-line ${line.className || ''} ${line.isUser ? 'user-input' : ''}`}
              >
                {line.text}
              </div>
            ))}
            <div ref={outputEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="terminal-input-form">
            <span className="terminal-prompt">&gt;_</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="terminal-input"
              autoFocus
              autoComplete="off"
              placeholder={connected ? 'Enter command...' : 'Connect wallet to start'}
              disabled={activeGame !== null}
            />
          </form>

          {/* Snake game overlay */}
          {activeGame === 'snake' && (
            <div className="minigame-overlay">
              <SnakeGame
                onGameOver={handleSnakeGameOver}
                onExit={handleSnakeExit}
                autoStart
              />
            </div>
          )}
        </div>

        {/* Side Panel (Desktop) */}
        <div className="side-panel">
          <Monitor />
          <StatsBox walletAddress={publicKey?.toBase58() || null} />
          <InventoryBox items={inventory} />
        </div>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="mobile-overlay" onClick={() => setSidebarOpen(false)}>
            <div
              className="mobile-sidebar"
              onClick={(e) => e.stopPropagation()}
            >
              <Monitor />
              <StatsBox walletAddress={publicKey?.toBase58() || null} />
              <InventoryBox items={inventory} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
