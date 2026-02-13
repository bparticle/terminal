'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface IframeGameProps {
  src: string;
  title: string;
  onExitRequested?: () => void;
  onMessage?: (data: any) => void;
}

const EXIT_FALLBACK_MS = 4000;

export default function IframeGame({ src, title, onExitRequested, onMessage }: IframeGameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Parse message data (supports both string JSON and object)
  const getMessageData = useCallback((event: MessageEvent): any | null => {
    const raw = event.data;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    if (typeof raw === 'object' && raw !== null) {
      return raw;
    }
    return null;
  }, []);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = getMessageData(event);
      if (!data) return;

      if (data.type === 'game_event') {
        onMessage?.(data);

        // If it's an exit event, clear the timeout
        if (data.event === 'exit') {
          if (exitTimeoutRef.current) {
            clearTimeout(exitTimeoutRef.current);
            exitTimeoutRef.current = null;
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onMessage, getMessageData]);

  // Request exit from game
  const requestExit = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'host_request', action: 'request_exit' },
        window.location.origin
      );

      // Fallback timeout
      exitTimeoutRef.current = setTimeout(() => {
        onExitRequested?.();
      }, EXIT_FALLBACK_MS);
    } else {
      onExitRequested?.();
    }
  }, [onExitRequested]);

  // ESC to exit
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        requestExit();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [requestExit]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'VT323', monospace",
      color: 'var(--primary-color)',
    }}>
      <div style={{ marginBottom: '10px', fontSize: '18px' }}>
        {title} | Press ESC to exit
      </div>

      <div style={{
        border: '2px solid var(--primary-color)',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '0 0 15px var(--primary-glow)',
        aspectRatio: '1',
        maxWidth: '600px',
        maxHeight: '600px',
        width: '80%',
        position: 'relative',
      }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '20px',
          }}>
            Loading game...
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={src}
          title={title}
          onLoad={() => setLoading(false)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: '#000',
          }}
          allow="autoplay; fullscreen"
        />
      </div>
    </div>
  );
}
