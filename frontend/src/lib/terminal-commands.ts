import { GameEngine } from './game-engine';

export interface TerminalContext {
  engine: GameEngine | null;
  walletAddress: string | null;
  connected: boolean;
  addOutput: (text: string, className?: string) => void;
  clearOutput: () => void;
  openWalletModal: () => void;
  disconnectWallet: () => void;
  setTheme: (theme: string) => void;
  currentTheme: string;
  pendingRestart: boolean;
  setPendingRestart: (v: boolean) => void;
}

interface Command {
  description: string;
  execute: (args: string, ctx: TerminalContext) => Promise<void> | void;
  requiresWallet?: boolean;
}

export const commands: Record<string, Command> = {
  help: {
    description: 'Show available commands',
    execute: (_args, ctx) => {
      ctx.addOutput('=== TERMINAL COMMANDS ===', 'text-cyan-400');
      ctx.addOutput('');
      ctx.addOutput('General:', 'text-yellow-400');
      ctx.addOutput('  help          Show this help message');
      ctx.addOutput('  about         About this system');
      ctx.addOutput('  clear         Clear terminal output');
      ctx.addOutput('  theme [1-3]   Change color theme');
      ctx.addOutput('');
      ctx.addOutput('Wallet:', 'text-yellow-400');
      ctx.addOutput('  connect       Connect your wallet');
      ctx.addOutput('  disconnect    Disconnect wallet');
      ctx.addOutput('');
      ctx.addOutput('Game:', 'text-yellow-400');
      ctx.addOutput('  [number]      Select a choice');
      ctx.addOutput('  ENTER         Continue to next scene');
      ctx.addOutput('  look / l      Re-display current scene');
      ctx.addOutput('  inventory / i Show your inventory');
      ctx.addOutput('  save          Save game manually');
      ctx.addOutput('  load          Reload saved game');
      ctx.addOutput('  restart       Restart the game');
      ctx.addOutput('');
    },
  },

  about: {
    description: 'About this system',
    execute: (_args, ctx) => {
      ctx.addOutput('=== TERMINAL ADVENTURE v1.0 ===', 'text-cyan-400');
      ctx.addOutput('');
      ctx.addOutput('A retro CRT terminal text adventure game.');
      ctx.addOutput('Built with Next.js, Solana, and imagination.');
      ctx.addOutput('');
      ctx.addOutput('Connect your Solana wallet to begin your journey.');
      ctx.addOutput('Your progress is automatically saved every 30 seconds.');
      ctx.addOutput('');
    },
  },

  clear: {
    description: 'Clear terminal output',
    execute: (_args, ctx) => {
      ctx.clearOutput();
    },
  },

  connect: {
    description: 'Connect your wallet',
    execute: (_args, ctx) => {
      if (ctx.connected) {
        ctx.addOutput('Wallet already connected.', 'text-yellow-400');
        if (ctx.walletAddress) {
          ctx.addOutput(`Address: ${ctx.walletAddress}`, 'text-gray-400');
        }
      } else {
        ctx.openWalletModal();
      }
    },
  },

  disconnect: {
    description: 'Disconnect wallet',
    execute: (_args, ctx) => {
      if (!ctx.connected) {
        ctx.addOutput('No wallet connected.', 'text-gray-400');
      } else {
        ctx.disconnectWallet();
        ctx.addOutput('Wallet disconnected.', 'text-yellow-400');
      }
    },
  },

  theme: {
    description: 'Change color theme',
    execute: (args, ctx) => {
      const themeNum = args.trim();
      if (!themeNum) {
        ctx.addOutput('Available themes:', 'text-cyan-400');
        ctx.addOutput('  theme 1  Classic Green (default)');
        ctx.addOutput('  theme 2  Laser Blue');
        ctx.addOutput('  theme 3  Knight Rider Red');
        ctx.addOutput(`Current theme: ${ctx.currentTheme}`, 'text-gray-400');
        return;
      }

      if (['1', '2', '3'].includes(themeNum)) {
        ctx.setTheme(themeNum);
        const names: Record<string, string> = {
          '1': 'Classic Green',
          '2': 'Laser Blue',
          '3': 'Knight Rider Red',
        };
        ctx.addOutput(`Theme changed to: ${names[themeNum]}`, 'text-green-400');
      } else {
        ctx.addOutput('Invalid theme. Use: theme 1, theme 2, or theme 3', 'text-red-400');
      }
    },
  },

  look: {
    description: 'Re-display current scene',
    requiresWallet: true,
    execute: (_args, ctx) => {
      if (ctx.engine) {
        ctx.engine.displayCurrentNode();
      }
    },
  },

  l: {
    description: 'Re-display current scene (shortcut)',
    requiresWallet: true,
    execute: (_args, ctx) => {
      commands.look.execute(_args, ctx);
    },
  },

  inventory: {
    description: 'Show inventory',
    requiresWallet: true,
    execute: (_args, ctx) => {
      if (!ctx.engine) return;
      const items = ctx.engine.getInventory();
      if (items.length === 0) {
        ctx.addOutput('Your inventory is empty.', 'text-gray-400');
      } else {
        ctx.addOutput('=== INVENTORY ===', 'text-cyan-400');
        items.forEach((item) => {
          ctx.addOutput(`  - ${item}`, 'text-yellow-400');
        });
      }
    },
  },

  i: {
    description: 'Show inventory (shortcut)',
    requiresWallet: true,
    execute: (_args, ctx) => {
      commands.inventory.execute(_args, ctx);
    },
  },

  save: {
    description: 'Save game manually',
    requiresWallet: true,
    execute: async (_args, ctx) => {
      if (ctx.engine) {
        await ctx.engine.manualSave();
      }
    },
  },

  load: {
    description: 'Reload saved game',
    requiresWallet: true,
    execute: async (_args, ctx) => {
      if (ctx.engine) {
        await ctx.engine.reloadGame();
      }
    },
  },

  restart: {
    description: 'Restart the game',
    requiresWallet: true,
    execute: (_args, ctx) => {
      if (ctx.pendingRestart) {
        // Confirmed
        ctx.setPendingRestart(false);
        if (ctx.engine) {
          ctx.engine.restartGame();
        }
      } else {
        ctx.addOutput('Are you sure you want to restart? All progress will be reset.', 'text-yellow-400');
        ctx.addOutput('Type "restart" again to confirm.', 'text-yellow-400');
        ctx.setPendingRestart(true);
      }
    },
  },
};

/**
 * Process a terminal command. Returns true if handled.
 */
export function processCommand(input: string, ctx: TerminalContext): boolean {
  const trimmed = input.trim().toLowerCase();

  // Handle restart confirmation
  if (trimmed !== 'restart' && ctx.pendingRestart) {
    ctx.setPendingRestart(false);
    ctx.addOutput('Restart cancelled.', 'text-gray-400');
  }

  // Parse command and args
  const spaceIndex = trimmed.indexOf(' ');
  const cmd = spaceIndex > -1 ? trimmed.substring(0, spaceIndex) : trimmed;
  const args = spaceIndex > -1 ? input.trim().substring(spaceIndex + 1) : '';

  const command = commands[cmd];
  if (!command) return false;

  if (command.requiresWallet && !ctx.connected) {
    ctx.addOutput('Connect your wallet first. Type "connect".', 'text-yellow-400');
    return true;
  }

  command.execute(args, ctx);
  return true;
}
