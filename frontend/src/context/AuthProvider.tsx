'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

interface AuthContextType {
  session: Session | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isInitialized: boolean;
  authenticate: () => Promise<void>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

interface Session {
  token: string;
  user: {
    id: string;
    wallet_address: string;
    is_admin: boolean;
    name?: string;
  };
  fingerprint: string;
  expiresAt: number;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'terminal_game_session';
const TOKEN_KEY = 'sessionToken';

function getFingerprint(): string {
  if (typeof window === 'undefined') return '';
  const ua = navigator.userAgent;
  const lang = navigator.language;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const screen = `${window.screen.width}x${window.screen.height}`;
  return btoa(`${ua}|${lang}|${tz}|${screen}`);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, signMessage, connected, disconnecting } = useWallet();
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const authAttemptRef = useRef(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load session from storage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed: Session = JSON.parse(stored);
        const fingerprint = getFingerprint();

        if (parsed.fingerprint === fingerprint && parsed.expiresAt > Date.now()) {
          setSession(parsed);
          localStorage.setItem(TOKEN_KEY, parsed.token);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(TOKEN_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
    }
    setIsInitialized(true);
  }, []);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (connected && publicKey && !session && isInitialized && !authAttemptRef.current) {
      authAttemptRef.current = true;
      authenticate().finally(() => {
        authAttemptRef.current = false;
      });
    }
  }, [connected, publicKey, isInitialized]);

  // Clean up on disconnect
  useEffect(() => {
    if (disconnecting) {
      logout();
    }
  }, [disconnecting]);

  // Token refresh timer
  useEffect(() => {
    if (session) {
      refreshTimerRef.current = setInterval(() => {
        const oneHourFromNow = Date.now() + 60 * 60 * 1000;
        if (session.expiresAt < oneHourFromNow && connected && publicKey) {
          authenticate().catch(console.error);
        }
      }, 5 * 60 * 1000); // Check every 5 minutes
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [session, connected, publicKey]);

  const authenticate = useCallback(async () => {
    if (!publicKey || !signMessage) {
      throw new Error('Wallet not connected');
    }

    setIsAuthenticating(true);

    try {
      const walletAddress = publicKey.toBase58();

      // 1. Request message from backend
      const msgResponse = await fetch('/api/proxy/auth/request-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress }),
      });

      if (!msgResponse.ok) {
        throw new Error('Failed to get auth message');
      }

      const { message } = await msgResponse.json();

      // 2. Sign message with wallet
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      const signatureBase58 = bs58.encode(signature);

      // 3. Verify with backend
      const verifyResponse = await fetch('/api/proxy/auth/verify-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          message,
          signature: signatureBase58,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Wallet verification failed');
      }

      const { token, user } = await verifyResponse.json();

      // 4. Store session
      const newSession: Session = {
        token,
        user,
        fingerprint: getFingerprint(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };

      setSession(newSession);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, [publicKey, signMessage]);

  const logout = useCallback(() => {
    setSession(null);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!session?.token) return {};
    return { Authorization: `Bearer ${session.token}` };
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        isAuthenticating,
        isInitialized,
        authenticate,
        logout,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
