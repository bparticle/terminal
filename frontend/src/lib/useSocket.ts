'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthProvider';

/** Payload received from the server for chat messages */
export interface ChatMessage {
  sender: string;
  walletAddress: string;
  message: string;
  timestamp: number;
}

/** Payload received from the server for system events */
export interface ChatSystemEvent {
  message: string;
  timestamp: number;
}

interface UseSocketOptions {
  onChatMessage?: (msg: ChatMessage) => void;
  onSystemEvent?: (evt: ChatSystemEvent) => void;
}

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function useSocket({ onChatMessage, onSystemEvent }: UseSocketOptions = {}) {
  const { session, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const currentRoomRef = useRef<string | null>(null);

  // Keep callback refs fresh without re-connecting
  const onChatMessageRef = useRef(onChatMessage);
  onChatMessageRef.current = onChatMessage;
  const onSystemEventRef = useRef(onSystemEvent);
  onSystemEventRef.current = onSystemEvent;

  // Connect / disconnect based on auth state
  useEffect(() => {
    if (!isAuthenticated || !session?.token) {
      // Disconnect if we lose auth
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Already connected with same token
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token: session.token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[socket] connected');
      setIsConnected(true);

      // Re-join room after reconnection
      if (currentRoomRef.current) {
        socket.emit('join-room', { nodeId: currentRoomRef.current });
      }
    });

    socket.on('disconnect', () => {
      console.log('[socket] disconnected');
      setIsConnected(false);
    });

    socket.on('chat-message', (msg: ChatMessage) => {
      onChatMessageRef.current?.(msg);
    });

    socket.on('chat-system', (evt: ChatSystemEvent) => {
      onSystemEventRef.current?.(evt);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, session?.token]);

  const joinRoom = useCallback((nodeId: string) => {
    currentRoomRef.current = nodeId;
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-room', { nodeId });
    }
  }, []);

  const leaveRoom = useCallback(() => {
    currentRoomRef.current = null;
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-room');
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat-message', { message });
    }
  }, []);

  return {
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
  };
}
