import { Server, Socket } from 'socket.io';
import { query } from '../config/database';

const MAX_MESSAGE_LENGTH = 280;

/**
 * Look up a player's display name from the database.
 * Falls back to a truncated wallet address if no name is set.
 */
async function getPlayerName(walletAddress: string): Promise<string> {
  try {
    const result = await query(
      'SELECT name FROM users WHERE wallet_address = $1',
      [walletAddress],
    );
    const name = result.rows[0]?.name;
    return name || `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  } catch {
    return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  }
}

/**
 * Return all non-default Socket.IO rooms this socket has joined
 * (i.e. rooms prefixed with "room:").
 */
function getCurrentRoom(socket: Socket): string | null {
  for (const room of socket.rooms) {
    if (room.startsWith('room:')) return room;
  }
  return null;
}

/**
 * Register chat-related Socket.IO event handlers for a single connection.
 */
export function registerChatHandlers(io: Server, socket: Socket): void {
  const walletAddress: string = socket.data.walletAddress;

  console.log(`[socket] connected: ${walletAddress} (${socket.id})`);

  // ── join-room ────────────────────────────────────────────
  socket.on('join-room', async (payload: { nodeId: string }) => {
    const { nodeId } = payload || {};
    if (!nodeId || typeof nodeId !== 'string') return;

    const newRoom = `room:${nodeId}`;

    // Leave any previous game room first
    const currentRoom = getCurrentRoom(socket);
    if (currentRoom === newRoom) return; // already in this room

    if (currentRoom) {
      socket.leave(currentRoom);
      const name = await getPlayerName(walletAddress);
      io.to(currentRoom).emit('chat-system', {
        message: `${name} left the room`,
        timestamp: Date.now(),
      });
    }

    // Join the new room
    socket.join(newRoom);
    const name = await getPlayerName(walletAddress);
    socket.data.currentRoom = newRoom;
    socket.data.playerName = name;

    // Notify others in the room
    socket.to(newRoom).emit('chat-system', {
      message: `${name} entered the room`,
      timestamp: Date.now(),
    });
  });

  // ── leave-room ───────────────────────────────────────────
  socket.on('leave-room', async () => {
    const currentRoom = getCurrentRoom(socket);
    if (!currentRoom) return;

    socket.leave(currentRoom);
    const name = socket.data.playerName || await getPlayerName(walletAddress);
    socket.data.currentRoom = null;

    io.to(currentRoom).emit('chat-system', {
      message: `${name} left the room`,
      timestamp: Date.now(),
    });
  });

  // ── chat-message ─────────────────────────────────────────
  socket.on('chat-message', async (payload: { message: string }) => {
    const { message } = payload || {};
    if (!message || typeof message !== 'string') return;

    const trimmed = message.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_MESSAGE_LENGTH) return;

    const currentRoom = getCurrentRoom(socket);
    if (!currentRoom) return; // not in any room

    const name = socket.data.playerName || await getPlayerName(walletAddress);

    // Broadcast to everyone in the room (including sender)
    io.to(currentRoom).emit('chat-message', {
      sender: name,
      walletAddress,
      message: trimmed,
      timestamp: Date.now(),
    });
  });

  // ── disconnect ───────────────────────────────────────────
  socket.on('disconnect', () => {
    const currentRoom = socket.data.currentRoom as string | null;
    if (currentRoom) {
      const name = socket.data.playerName || walletAddress;
      io.to(currentRoom).emit('chat-system', {
        message: `${name} left the room`,
        timestamp: Date.now(),
      });
    }
    console.log(`[socket] disconnected: ${walletAddress} (${socket.id})`);
  });
}
