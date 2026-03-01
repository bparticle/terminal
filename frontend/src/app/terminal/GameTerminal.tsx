'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@/context/AuthProvider';
import { setAuthContext, getUserProfile, updateProfileName, fetchWithAuth } from '@/lib/api';
import { GameEngine, SignAndSubmitFn } from '@/lib/game-engine';
import { processCommand, TerminalContext } from '@/lib/terminal-commands';
import Monitor from './components/Monitor';
import SidebarWalletPanel from './components/SidebarWalletPanel';
import InventoryBox from './components/InventoryBox';
import PlayersPanel from './components/PlayersPanel';
import ChatModeToggle from './components/ChatModeToggle';
import GalleryOverlay from './components/GalleryOverlay';
import CampaignOverlay from './components/CampaignOverlay';
import { APP_VERSION } from '@/lib/version';
import SnakeGame from '@/components/terminal/SnakeGame';
import IframeGame from '@/components/terminal/IframeGame';
import { useSocket, ChatMessage, ChatSystemEvent } from '@/lib/useSocket';
import { getCampaigns } from '@/lib/campaign-api';
import { getLastPlayedCampaign } from '@/lib/game-api';
import { applySkin } from '@/skins/applySkin';
import { resolveSkin } from '@/skins/resolver';
import { getAdminSkinOverrideStorageKey, readAdminSkinOverride, writeAdminSkinOverride } from '@/skins/admin-override';
import SkinTitleRenderer from '@/skins/title-renderer';
import './game-terminal.css';

const godotGameConfig: Record<string, { title: string; src: string }> = {
  snake_godot: { title: 'Snake', src: '/games/snake/snake.html' },
};

const NEWSROOM_COFFEE_STAIN_ASSETS = [
  '/assets/cup-coffee-stain-1_s.png',
  '/assets/cup-coffee-stain-2_s.png',
  '/assets/cup-coffee-stain-3_s.png',
];

function resolveHostCampaignSubdomain(hostname: string): string | null {
  const normalized = hostname.toLowerCase();
  if (!normalized || normalized === 'localhost') return null;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(normalized)) return null; // IPv4 local/dev access

  const labels = normalized.split('.').filter(Boolean);
  if (labels.length < 3) return null;

  const subdomain = labels[0];
  if (subdomain === 'www') return null;
  return subdomain;
}

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
const MAX_OUTPUT_LINES = 800;

function capOutputLines(lines: OutputLine[]): OutputLine[] {
  if (lines.length <= MAX_OUTPUT_LINES) return lines;
  return lines.slice(lines.length - MAX_OUTPUT_LINES);
}

export default function GameTerminal() {
  const { publicKey, connected, disconnect, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const { session, isAuthenticated, isAuthenticating, getAuthHeaders, authenticate, isInitialized } = useAuth();

  const [output, setOutput] = useState<OutputLine[]>([]);
  const [input, setInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState('HUB');
  const [inventory, setInventory] = useState<Array<{ name: string; soulbound?: boolean; assetId?: string; isFrozen?: boolean }>>([]);
  const [pendingRestart, setPendingRestart] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>('idle');
  const [chatMode, setChatMode] = useState(false);
  const [soloMode, setSoloMode] = useState(false);
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [awayPlayers, setAwayPlayers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [monitorImageUrl, setMonitorImageUrl] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [campaignAssignedSkinId, setCampaignAssignedSkinId] = useState<string | null>(null);
  const [activeNodeSetId, setActiveNodeSetId] = useState<string>('terminal-core');
  const [adminSkinOverrideId, setAdminSkinOverrideId] = useState<string | null>(null);

  const engineRef = useRef<GameEngine | null>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const terminalOutputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentNodeIdRef = useRef<string | null>(null);
  const mouseDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const wasAuthenticatedRef = useRef(false);
  const pfpImageUrlRef = useRef<string | null>(null);
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const historyDraftRef = useRef<string>('');

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

  // Keep engine progression flags in sync with profile avatar updates from any UI path
  // (terminal command, gallery overlay, reclaim flow, etc.).
  useEffect(() => {
    const handleProfilePfpUpdated = (e: CustomEvent<{ imageUrl: string | null }>) => {
      const imageUrl = e.detail?.imageUrl || null;
      pfpImageUrlRef.current = imageUrl;
      engineRef.current?.syncProfilePfp(imageUrl);
    };

    window.addEventListener('profile-pfp-updated', handleProfilePfpUpdated as EventListener);
    return () => {
      window.removeEventListener('profile-pfp-updated', handleProfilePfpUpdated as EventListener);
    };
  }, []);

  // ── Gallery open event (used by terminal command + UI actions) ──
  useEffect(() => {
    const openGallery = () => setGalleryOpen(true);
    window.addEventListener('open-gallery', openGallery);
    return () => {
      window.removeEventListener('open-gallery', openGallery);
    };
  }, []);

  // ── Campaign screen open event (used by UI actions) ──
  useEffect(() => {
    const openCampaign = () => setCampaignOpen(true);
    window.addEventListener('open-campaign', openCampaign);
    return () => {
      window.removeEventListener('open-campaign', openCampaign);
    };
  }, []);

  // Resolve active campaign and its assigned skin for all visitors.
  // Priority:
  //   1) Campaign subdomain match from the current host (e.g. newsroom.scanlines.io)
  //   2) User's most recently played campaign (authenticated only)
  //   3) First active campaign
  // Retry once on failure so a transient network error doesn't leave the player
  // stuck (engine won't start without activeCampaignId).
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      const lastPlayedPromise = isAuthenticated
        ? getLastPlayedCampaign()
        : Promise.resolve(null);

      return Promise.all([getCampaigns(), lastPlayedPromise])
        .then(([rows, lastPlayed]) => {
          if (cancelled) return;
          const hostSubdomain = resolveHostCampaignSubdomain(window.location.hostname);
          const subdomainCampaign = hostSubdomain
            ? rows.find((campaign) => (campaign.subdomain || '').toLowerCase() === hostSubdomain)
            : null;
          const preferredCampaign = lastPlayed?.campaign_id
            ? rows.find((campaign) => campaign.id === lastPlayed.campaign_id)
            : null;
          const selectedCampaign = subdomainCampaign || preferredCampaign || rows[0];

          if (!selectedCampaign) {
            // No campaigns in the system — the engine cannot start without one.
            // Show a clear message rather than silently hanging.
            addOutput('', undefined);
            addOutput('No campaigns available. Ask an admin to create one.', 'text-yellow-400');
            return;
          }

          if (hostSubdomain && !subdomainCampaign) {
            addOutput('', undefined);
            addOutput(
              `[CAMPAIGN] No active campaign mapped to subdomain "${hostSubdomain}". Falling back to default campaign.`,
              'text-yellow-400'
            );
          }
          setActiveCampaignId(selectedCampaign.id);
          setCampaignAssignedSkinId(selectedCampaign.skin_id ?? null);
          setActiveNodeSetId(selectedCampaign.node_set_id || 'terminal-core');
        })
        .catch(() => {
          if (cancelled) return;
          // Retry once after 3 seconds on failure
          setTimeout(() => {
            if (!cancelled) load();
          }, 3000);
        });
    };
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps -- addOutput is stable

  const resolvedSkin = useMemo(
    () =>
      resolveSkin({
        forcedSkinId: adminSkinOverrideId || campaignAssignedSkinId || null,
      }),
    [campaignAssignedSkinId, adminSkinOverrideId]
  );

  // Admin-only persisted skin override for cross-page testing.
  useEffect(() => {
    const isAdmin = !!session?.user?.is_admin;
    if (!isAdmin) {
      setAdminSkinOverrideId(null);
      return;
    }
    setAdminSkinOverrideId(readAdminSkinOverride());
  }, [session]);

  // Persist admin override when changed by admin terminal command.
  useEffect(() => {
    if (!session?.user?.is_admin) return;
    writeAdminSkinOverride(adminSkinOverrideId);
  }, [adminSkinOverrideId, session]);

  // React to admin-panel changes made in another tab/window.
  useEffect(() => {
    if (!session?.user?.is_admin) return;
    const key = getAdminSkinOverrideStorageKey();
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      setAdminSkinOverrideId(readAdminSkinOverride());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [session]);

  // Apply skin CSS variables and data-skin attribute to document root.
  useEffect(() => applySkin(resolvedSkin.config), [resolvedSkin]);

  // Newsroom-only ambient texture: random coffee stain overlays.
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const outputEl = terminalOutputRef.current;
    const stainVarNames = [
      '--newsroom-stain-1',
      '--newsroom-stain-2',
      '--newsroom-stain-3',
      '--newsroom-stain-1-x',
      '--newsroom-stain-2-x',
      '--newsroom-stain-3-x',
      '--newsroom-stain-1-y',
      '--newsroom-stain-2-y',
      '--newsroom-stain-3-y',
      '--newsroom-stain-1-size',
      '--newsroom-stain-2-size',
      '--newsroom-stain-3-size',
    ];

    const clearVars = () => {
      for (const name of stainVarNames) {
        root.style.removeProperty(name);
      }
    };

    if (resolvedSkin.skinId !== 'newsroom') {
      clearVars();
      return clearVars;
    }

    const randomPercent = (min: number, max: number) =>
      `${Math.round(min + Math.random() * (max - min))}%`;
    const randomAsset = () => NEWSROOM_COFFEE_STAIN_ASSETS[Math.floor(Math.random() * NEWSROOM_COFFEE_STAIN_ASSETS.length)];
    const viewportHeight = Math.max(420, outputEl?.clientHeight ?? 0);
    const randomSize = (height: number) => {
      const maxSize = Math.max(110, Math.min(260, height - 56));
      const minSize = Math.max(90, Math.min(170, maxSize - 20));
      return Math.round(minSize + Math.random() * (maxSize - minSize));
    };
    const randomSafeY = (size: number, height: number, scrollTop: number = 0) => {
      const minY = scrollTop + 12;
      const maxSafeY = Math.max(minY, scrollTop + height - size - 12);
      return Math.round(minY + Math.random() * (maxSafeY - minY));
    };

    type StainState = { asset: string; x: string; y: number; size: number };
    const stains: StainState[] = Array.from({ length: 3 }, () => {
      const size = randomSize(viewportHeight);
      return {
        asset: randomAsset(),
        x: randomPercent(-8, 88),
        y: randomSafeY(size, viewportHeight),
        size,
      };
    });

    const applyStain = (index: number, stain: StainState) => {
      const n = index + 1;
      root.style.setProperty(`--newsroom-stain-${n}`, `url("${stain.asset}")`);
      root.style.setProperty(`--newsroom-stain-${n}-x`, stain.x);
      root.style.setProperty(`--newsroom-stain-${n}-y`, `${Math.round(stain.y)}px`);
      root.style.setProperty(`--newsroom-stain-${n}-size`, `${stain.size}px auto`);
    };

    for (let i = 0; i < stains.length; i++) {
      applyStain(i, stains[i]);
    }

    // Rotate one stain every ~4 new child elements added to the output.
    // MutationObserver is used instead of scroll events because the terminal
    // auto-scrolls programmatically (scrollIntoView), which fires unreliable
    // scroll events mid-animation with stale scrollTop values.
    let stainIndex = 0;
    let childCount = outputEl?.childElementCount ?? 0;
    const LINES_PER_UPDATE = 4;

    const observer = new MutationObserver(() => {
      if (!outputEl) return;
      const newCount = outputEl.childElementCount;
      const added = newCount - childCount;
      if (added < LINES_PER_UPDATE) return;
      const updates = Math.floor(added / LINES_PER_UPDATE);
      childCount += updates * LINES_PER_UPDATE;

      const height = Math.max(420, outputEl.clientHeight);
      for (let u = 0; u < updates; u++) {
        const index = stainIndex % stains.length;
        stainIndex++;
        const nextSize = randomSize(height);
        stains[index] = {
          asset: randomAsset(),
          x: randomPercent(-8, 88),
          y: randomSafeY(nextSize, height, outputEl.scrollTop),
          size: nextSize,
        };
        applyStain(index, stains[index]);
      }
    });

    if (outputEl) observer.observe(outputEl, { childList: true });

    return () => {
      observer.disconnect();
      clearVars();
    };
  }, [resolvedSkin.skinId]);

  // ── Socket.IO for room chat ──────────────────────────────
  const handleChatMessage = useCallback((msg: ChatMessage) => {
    if (soloModeRef.current || isPrivateRoomRef.current) return;
    const isMe = msg.sender === playerName;
    const prefix = isMe ? '[You]' : `[${msg.sender}]`;
    setOutput((prev) =>
      capOutputLines([
        ...prev,
        {
        text: `${prefix}: ${msg.message}`,
        className: isMe ? 'chat-message chat-message-self' : 'chat-message',
        timestamp: msg.timestamp,
        },
      ])
    );
  }, [playerName]);

  const handleSystemEvent = useCallback((evt: ChatSystemEvent) => {
    if (soloModeRef.current || isPrivateRoomRef.current) return;
    setOutput((prev) =>
      capOutputLines([
        ...prev,
        {
        text: `* ${evt.message}`,
        className: 'chat-system',
        timestamp: evt.timestamp,
        },
      ])
    );
  }, []);

  const handlePlayerStatus = useCallback(({ name, status }: { name: string; status: 'active' | 'away' }) => {
    setAwayPlayers((prev) => {
      const next = new Set(prev);
      if (status === 'away') next.add(name);
      else next.delete(name);
      return next;
    });
  }, []);

  const handlePlayerTyping = useCallback(({ name }: { name: string }) => {
    setTypingUsers((prev) => new Set(prev).add(name));
    const existing = typingTimersRef.current.get(name);
    if (existing) clearTimeout(existing);
    typingTimersRef.current.set(name, setTimeout(() => {
      setTypingUsers((prev) => { const next = new Set(prev); next.delete(name); return next; });
      typingTimersRef.current.delete(name);
    }, 3_000));
  }, []);

  const { isConnected: isSocketConnected, joinRoom, leaveRoom, sendMessage, setUserStatus, emitTyping } = useSocket({
    onChatMessage: handleChatMessage,
    onSystemEvent: handleSystemEvent,
    onPlayerStatus: handlePlayerStatus,
    onPlayerTyping: handlePlayerTyping,
  });

  // Wraps setCurrentLocation to also join/leave the Socket.IO room.
  // roomId is the chat cluster identifier (chat_room field on the node, or nodeId if unset).
  const handleLocationChange = useCallback((location: string, nodeId?: string, roomId?: string) => {
    setCurrentLocation(location);
    // Clear per-room transient state on every room change
    setAwayPlayers(new Set());
    setTypingUsers(new Set());
    typingTimersRef.current.forEach(clearTimeout);
    typingTimersRef.current.clear();
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

  // Load solo mode from localStorage
  useEffect(() => {
    const savedSolo = localStorage.getItem('soloMode') === 'true';
    setSoloMode(savedSolo);
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
      return capOutputLines([...prev, { text, className, timestamp: Date.now(), id }]);
    });
  }, []);

  const addUserOutput = useCallback((text: string) => {
    setOutput((prev) =>
      capOutputLines([
        ...prev,
        { text: `> ${text}`, isUser: true, className: 'text-gray-400', timestamp: Date.now() },
      ])
    );
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
    if (onboardingState !== 'done' || !publicKey || !activeCampaignId || engineRef.current) return;

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

    engine.initialize(publicKey.toBase58(), activeCampaignId, activeNodeSetId, playerName || 'Wanderer', pfpImageUrlRef.current || undefined);

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [onboardingState, publicKey, playerName, activeCampaignId, activeNodeSetId, handleLocationChange, signAndSubmit, getStoryPageSize]);

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

  // Emit away/active status when the browser tab is hidden/shown
  useEffect(() => {
    const handleVisibility = () => setUserStatus(document.hidden ? 'away' : 'active');
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [setUserStatus]);

  // Clean up typing timers on unmount
  useEffect(() => {
    return () => { typingTimersRef.current.forEach(clearTimeout); };
  }, []);

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

  // Detect stuck state: wallet connected at adapter level but JWT auth never completed.
  // This happens when the user rejects the signature, a network blip occurs, or the
  // auto-auth effect can't retry (dependencies unchanged). Give them a clear escape hatch.
  useEffect(() => {
    if (!isInitialized || !connected || isAuthenticated || isAuthenticating) return;

    // Brief grace period so we don't flash during the normal auth flow (which takes ~1s)
    const timer = setTimeout(() => {
      addOutput('');
      addOutput('Wallet connected but not authenticated.', 'text-yellow-400');
      addOutput('Type "connect" to sign in, or "disconnect" to reset.', 'text-gray-400');
      addOutput('');
    }, 2500);

    return () => clearTimeout(timer);
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
      const rawInput = input;
      const trimmed = rawInput.trim();

      // During onboarding, route all input to the onboarding handler
      if (onboardingState === 'ask_name') {
        if (trimmed) addUserOutput(trimmed);
        await handleOnboardingInput(rawInput);
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
        commandHistoryRef.current.push(trimmed);
        if (commandHistoryRef.current.length > 50) {
          commandHistoryRef.current = commandHistoryRef.current.slice(commandHistoryRef.current.length - 50);
        }
        historyIndexRef.current = -1;
        historyDraftRef.current = '';
      }

      // Build terminal context
      const ctx: TerminalContext = {
        engine: engineRef.current,
        walletAddress: publicKey?.toBase58() || null,
        connected,
        isAuthenticated,
        isAuthenticating,
        isAdmin: !!session?.user?.is_admin,
        addOutput,
        clearOutput,
        openWalletModal: () => setVisible(true),
        disconnectWallet: () => disconnect(),
        authenticate,
        setSkinOverride: setAdminSkinOverrideId,
        currentSkinOverride: adminSkinOverrideId,
        currentSkinResolved: resolvedSkin.skinId,
        pendingRestart,
        setPendingRestart,
      };

      // Try game engine first
      if (engineRef.current) {
        if (engineRef.current.canHandleInput(rawInput)) {
          // Clear immediately so choice digits don't linger during async node transitions.
          setInput('');
          await engineRef.current.processInput(rawInput);
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
        setInput('');
        await engineRef.current.processInput(rawInput);
      } else if (trimmed && !isAuthenticated) {
        addOutput('Unknown command. Type "help" for available commands.', 'text-gray-400');
      }

      setInput('');
    },
    [input, publicKey, connected, isAuthenticated, isAuthenticating, session, adminSkinOverrideId, resolvedSkin.skinId, pendingRestart, onboardingState, chatMode, addOutput, addUserOutput, clearOutput, setVisible, disconnect, handleOnboardingInput, sendMessage]
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

  const openGallery = useCallback(() => {
    setGalleryOpen(true);
  }, []);

  const closeGallery = useCallback(() => {
    setGalleryOpen(false);
    // Re-focus terminal input after closing the overlay.
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleWalletPrimaryAction = useCallback(async () => {
    if (!connected) {
      setVisible(true);
      return;
    }

    if (!isAuthenticated) {
      try {
        addOutput('Verifying wallet signature...', 'text-cyan-400');
        await authenticate();
      } catch {
        addOutput('Wallet verification failed. Please try again.', 'text-red-400');
      }
      return;
    }

    setVisible(true);
  }, [connected, isAuthenticated, setVisible, authenticate, addOutput]);

  const openCampaign = useCallback(() => {
    setCampaignOpen(true);
  }, []);

  const closeCampaign = useCallback(() => {
    setCampaignOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const switchCampaign = useCallback(async (campaignId: string, skinId?: string | null, nodeSetId?: string | null) => {
    if (!campaignId || campaignId === activeCampaignId) {
      setCampaignOpen(false);
      return;
    }

    // Best-effort save of the current campaign before React tears down the engine.
    if (engineRef.current) {
      try {
        await engineRef.current.autoSave();
      } catch {
        // Non-fatal; allow switching even if save fails.
      }
    }

    addOutput('', undefined);
    addOutput('[CAMPAIGN] Switching context...', 'text-cyan-400');

    setCampaignOpen(false);
    setActiveCampaignId(campaignId);
    setCampaignAssignedSkinId(skinId ?? null);
    setActiveNodeSetId(nodeSetId || 'terminal-core');

    window.dispatchEvent(new CustomEvent('game-progress-updated'));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [activeCampaignId, addOutput]);

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
      // Clear immediately so clicked choice values don't appear in the input field.
      setInput('');
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
          isAuthenticating,
          isAdmin: !!session?.user?.is_admin,
          addOutput,
          clearOutput,
          openWalletModal: () => setVisible(true),
          disconnectWallet: () => disconnect(),
          authenticate,
          setSkinOverride: setAdminSkinOverrideId,
          currentSkinOverride: adminSkinOverrideId,
          currentSkinResolved: resolvedSkin.skinId,
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
    [publicKey, connected, isAuthenticated, isAuthenticating, session, adminSkinOverrideId, resolvedSkin.skinId, pendingRestart, addOutput, addUserOutput, clearOutput, setVisible, disconnect]
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
        <SkinTitleRenderer title={resolvedSkin.config.title} />
        <span className="version-badge">v{APP_VERSION}</span>
        {adminSkinOverrideId && !!session?.user?.is_admin && (
          <span
            className="version-badge"
            style={{ background: '#7c3aed', color: '#fff', marginLeft: '0.5rem', cursor: 'default' }}
            title={`Admin skin override active: "${adminSkinOverrideId}". Use /skin clear to remove.`}
          >
            SKIN: {adminSkinOverrideId}
          </span>
        )}
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

              if (isClickable) {
                return (
                  <button
                    key={`${line.timestamp}-${i}`}
                    type="button"
                    className={`terminal-line terminal-line-button ${line.className || ''} ${line.isUser ? 'user-input' : ''} clickable-line`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (choiceMatch) {
                        handleChoiceClick(choiceMatch[1]);
                      } else {
                        handleChoiceClick('');
                      }
                    }}
                  >
                    {line.text ? parseFormattedText(line.text) : '\u00A0'}
                  </button>
                );
              }

              return (
                <div
                  key={`${line.timestamp}-${i}`}
                  className={`terminal-line ${line.className || ''} ${line.isUser ? 'user-input' : ''}`}
                >
                  {line.text ? parseFormattedText(line.text) : '\u00A0'}
                </div>
              );
            })}
            <div ref={outputEndRef} />
          </div>

          <form onSubmit={handleSubmit} className={`terminal-input-form ${chatMode ? 'chat-mode' : ''}`}>
            {isAuthenticated && onboardingState === 'done' && !isPrivateRoom ? (
              <ChatModeToggle
                chatMode={chatMode}
                onToggle={toggleChatMode}
                isSocketConnected={isSocketConnected}
                disabled={soloMode}
                disabledReason="solo"
              />
            ) : (
              <span className="terminal-prompt">&gt;_</span>
            )}
            <input
              ref={inputRef}
              type="text"
              aria-label="Terminal command input"
              value={input}
              onChange={(e) => {
                const nextValue = e.target.value;
                setInput(nextValue);
                if (historyIndexRef.current !== -1) {
                  historyIndexRef.current = -1;
                }
                historyDraftRef.current = nextValue;
                if (chatMode) emitTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && isAuthenticated && onboardingState === 'done' && !soloMode && !isPrivateRoom) {
                  e.preventDefault();
                  toggleChatMode();
                  return;
                }

                if (e.key === 'ArrowUp' && onboardingState === 'done' && !chatMode) {
                  const history = commandHistoryRef.current;
                  if (history.length === 0) return;
                  e.preventDefault();

                  if (historyIndexRef.current === -1) {
                    historyDraftRef.current = input;
                    historyIndexRef.current = history.length - 1;
                  } else if (historyIndexRef.current > 0) {
                    historyIndexRef.current -= 1;
                  }

                  setInput(history[historyIndexRef.current] ?? '');
                  return;
                }

                if (e.key === 'ArrowDown' && onboardingState === 'done' && !chatMode) {
                  if (historyIndexRef.current === -1) return;
                  e.preventDefault();

                  const history = commandHistoryRef.current;
                  if (historyIndexRef.current < history.length - 1) {
                    historyIndexRef.current += 1;
                    setInput(history[historyIndexRef.current] ?? '');
                    return;
                  }

                  historyIndexRef.current = -1;
                  setInput(historyDraftRef.current);
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
            {isAuthenticated && onboardingState === 'done' && !isPrivateRoom && (
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
          <div className="side-panel-fixed">
            <Monitor imageUrl={monitorImageUrl} />
            <SidebarWalletPanel
              walletAddress={publicKey?.toBase58() || null}
              isWalletConnected={connected}
              isAuthenticated={isAuthenticated}
              isAuthenticating={isAuthenticating}
              onChangeWallet={() => void handleWalletPrimaryAction()}
              onDisconnectWallet={() => void disconnect()}
              onOpenCampaign={openCampaign}
              onOpenGallery={openGallery}
              hasLiveCampaigns={!!activeCampaignId}
            />
            <InventoryBox items={inventory} />
          </div>
          <div className="side-panel-scroll">
            <PlayersPanel currentPlayerName={playerName} isolated={isPrivateRoom} awayPlayers={awayPlayers} typingUsers={typingUsers} />
          </div>
        </div>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="mobile-overlay" onClick={() => setSidebarOpen(false)}>
            <div
              className="mobile-sidebar"
              onClick={(e) => e.stopPropagation()}
            >
              <Monitor imageUrl={monitorImageUrl} />
              <SidebarWalletPanel
                walletAddress={publicKey?.toBase58() || null}
                isWalletConnected={connected}
                isAuthenticated={isAuthenticated}
                isAuthenticating={isAuthenticating}
                onChangeWallet={() => void handleWalletPrimaryAction()}
                onDisconnectWallet={() => void disconnect()}
                onOpenCampaign={openCampaign}
                onOpenGallery={openGallery}
                hasLiveCampaigns={!!activeCampaignId}
              />
              <InventoryBox items={inventory} />
              <PlayersPanel currentPlayerName={playerName} isolated={isPrivateRoom} awayPlayers={awayPlayers} typingUsers={typingUsers} />
            </div>
          </div>
        )}

        <GalleryOverlay
          isOpen={galleryOpen}
          walletAddress={publicKey?.toBase58() || null}
          signAndSubmit={signAndSubmit}
          onClose={closeGallery}
        />
        <CampaignOverlay
          isOpen={campaignOpen}
          walletAddress={publicKey?.toBase58() || null}
          currentCampaignId={activeCampaignId}
          onSwitchCampaign={switchCampaign}
          onClose={closeCampaign}
        />
      </div>
    </div>
  );
}
