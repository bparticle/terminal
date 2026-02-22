import { GameEngine } from './game-engine';
import { checkWhitelistStatus, getMintHistory, checkMintStatus, getSoulboundItems, verifySoulbound } from './mint-api';
import { checkPfpStatus } from './pfp-api';
import { updateProfilePfp } from './api';

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
      ctx.addOutput('NFT:', 'text-yellow-400');
      ctx.addOutput('  mint          Mint commands (status/history/confirm)');
      ctx.addOutput('  soulbound     Soulbound item commands (list/verify)');
      ctx.addOutput('  pfp           PFP avatar commands (list/set/clear)');
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

  mint: {
    description: 'Mint commands',
    requiresWallet: true,
    execute: async (args, ctx) => {
      const sub = args.trim().toLowerCase();

      if (!sub || sub === 'help') {
        ctx.addOutput('=== MINT COMMANDS ===', 'text-cyan-400');
        ctx.addOutput('');
        ctx.addOutput('  mint status        Check whitelist eligibility');
        ctx.addOutput('  mint history       Show past mints');
        ctx.addOutput('  mint confirm <sig> Check transaction confirmation');
        ctx.addOutput('');
        return;
      }

      if (sub === 'status') {
        ctx.addOutput('Checking whitelist status...', 'text-gray-400');
        try {
          const status = await checkWhitelistStatus();
          if (status.whitelisted) {
            ctx.addOutput('You are whitelisted for minting.', 'text-green-400');
            if (status.remaining === -1) {
              ctx.addOutput('  Mints: unlimited', 'text-gray-400');
            } else {
              ctx.addOutput(`  Mints used: ${status.mints_used}/${status.max_mints} (${status.remaining} remaining)`, 'text-gray-400');
            }
          } else {
            ctx.addOutput('You are not whitelisted for minting.', 'text-red-400');
          }
        } catch {
          ctx.addOutput('Failed to check whitelist status.', 'text-red-400');
        }
        return;
      }

      if (sub === 'history') {
        ctx.addOutput('Fetching mint history...', 'text-gray-400');
        try {
          const { history } = await getMintHistory();
          if (history.length === 0) {
            ctx.addOutput('No mints found.', 'text-gray-400');
            return;
          }
          ctx.addOutput('=== MINT HISTORY ===', 'text-cyan-400');
          for (const entry of history) {
            const date = new Date(entry.created_at).toLocaleDateString();
            const statusColor = entry.status === 'confirmed' ? 'text-green-400' : entry.status === 'failed' ? 'text-red-400' : 'text-yellow-400';
            ctx.addOutput(`  ${date} | ${entry.nft_name} | ${entry.mint_type}`, 'text-white');
            ctx.addOutput(`    Status: ${entry.status}${entry.signature ? ` | Sig: ${entry.signature.slice(0, 16)}...` : ''}`, statusColor);
          }
        } catch {
          ctx.addOutput('Failed to fetch mint history.', 'text-red-400');
        }
        return;
      }

      if (sub.startsWith('confirm ')) {
        const sig = sub.substring(8).trim();
        if (!sig) {
          ctx.addOutput('Usage: mint confirm <signature>', 'text-yellow-400');
          return;
        }
        ctx.addOutput('Checking transaction...', 'text-gray-400');
        try {
          const result = await checkMintStatus(sig);
          if (result.confirmed) {
            ctx.addOutput(`Transaction confirmed (${result.status}).`, 'text-green-400');
          } else {
            ctx.addOutput(`Transaction status: ${result.status}`, 'text-yellow-400');
          }
        } catch {
          ctx.addOutput('Failed to check transaction status.', 'text-red-400');
        }
        return;
      }

      ctx.addOutput('Unknown subcommand. Type "mint" for help.', 'text-red-400');
    },
  },

  soulbound: {
    description: 'Soulbound item commands',
    requiresWallet: true,
    execute: async (args, ctx) => {
      const sub = args.trim().toLowerCase();

      if (!sub || sub === 'list') {
        ctx.addOutput('Fetching soulbound items...', 'text-gray-400');
        try {
          const { items } = await getSoulboundItems();
          if (items.length === 0) {
            ctx.addOutput('No soulbound items found.', 'text-gray-400');
            return;
          }
          ctx.addOutput('=== SOULBOUND ITEMS ===', 'text-cyan-400');
          for (const item of items) {
            const frozen = item.is_frozen ? 'FROZEN' : 'UNFROZEN';
            const frozenColor = item.is_frozen ? 'text-green-400' : 'text-yellow-400';
            ctx.addOutput(`  ${item.item_name}`, 'text-white');
            ctx.addOutput(`    Asset: ${item.asset_id.slice(0, 16)}... | Status: ${frozen}`, frozenColor);
          }
        } catch {
          ctx.addOutput('Failed to fetch soulbound items.', 'text-red-400');
        }
        return;
      }

      if (sub === 'verify') {
        ctx.addOutput('Verifying soulbound items on-chain...', 'text-gray-400');
        try {
          const { items } = await getSoulboundItems();
          if (items.length === 0) {
            ctx.addOutput('No soulbound items to verify.', 'text-gray-400');
            return;
          }
          let allFrozen = true;
          for (const item of items) {
            try {
              const status = await verifySoulbound(item.asset_id);
              if (status.isFrozen) {
                ctx.addOutput(`  ${item.item_name}: FROZEN (verified)`, 'text-green-400');
              } else {
                ctx.addOutput(`  ${item.item_name}: NOT FROZEN`, 'text-red-400');
                allFrozen = false;
              }
            } catch {
              ctx.addOutput(`  ${item.item_name}: verification failed`, 'text-yellow-400');
              allFrozen = false;
            }
          }
          if (allFrozen) {
            ctx.addOutput('All soulbound items verified.', 'text-green-400');
          }
        } catch {
          ctx.addOutput('Failed to verify soulbound items.', 'text-red-400');
        }
        return;
      }

      if (sub === 'help') {
        ctx.addOutput('=== SOULBOUND COMMANDS ===', 'text-cyan-400');
        ctx.addOutput('');
        ctx.addOutput('  soulbound          List soulbound items');
        ctx.addOutput('  soulbound list     List soulbound items');
        ctx.addOutput('  soulbound verify   Verify freeze status on-chain');
        ctx.addOutput('');
        return;
      }

      ctx.addOutput('Unknown subcommand. Type "soulbound help" for usage.', 'text-red-400');
    },
  },

  pfp: {
    description: 'PFP avatar commands',
    requiresWallet: true,
    execute: async (args, ctx) => {
      const sub = args.trim().toLowerCase();

      if (sub === 'help') {
        ctx.addOutput('=== PFP COMMANDS ===', 'text-cyan-400');
        ctx.addOutput('');
        ctx.addOutput('  pfp              List your PFPs');
        ctx.addOutput('  pfp list         List your PFPs');
        ctx.addOutput('  pfp set <n>      Set PFP #n as your avatar');
        ctx.addOutput('  pfp clear        Remove avatar (show matrix rain)');
        ctx.addOutput('');
        return;
      }

      if (!sub || sub === 'list') {
        ctx.addOutput('Fetching your PFPs...', 'text-gray-400');
        try {
          const status = await checkPfpStatus();
          if (status.pfps.length === 0) {
            ctx.addOutput('You don\'t have any PFPs yet.', 'text-gray-400');
            ctx.addOutput('Visit the Identity Terminal in-game to mint one.', 'text-gray-400');
            return;
          }
          ctx.addOutput('=== YOUR PFPS ===', 'text-cyan-400');
          ctx.addOutput('');
          status.pfps.forEach((pfp, idx) => {
            ctx.addOutput(`  [${idx + 1}]  ${pfp.name}`, 'text-white');
            ctx.addOutput(`       Asset: ${pfp.assetId.slice(0, 20)}...`, 'text-gray-400');
          });
          ctx.addOutput('');
          ctx.addOutput('Use "pfp set <number>" to set one as your avatar.', 'text-gray-400');
        } catch {
          ctx.addOutput('Failed to fetch PFPs.', 'text-red-400');
        }
        return;
      }

      if (sub.startsWith('set')) {
        const numStr = sub.substring(3).trim();
        const num = parseInt(numStr, 10);
        if (!numStr || isNaN(num) || num < 1) {
          ctx.addOutput('Usage: pfp set <number>', 'text-yellow-400');
          ctx.addOutput('Type "pfp list" to see your PFPs.', 'text-gray-400');
          return;
        }

        ctx.addOutput('Fetching your PFPs...', 'text-gray-400');
        try {
          const status = await checkPfpStatus();
          if (num > status.pfps.length) {
            ctx.addOutput(`Invalid selection. You have ${status.pfps.length} PFP${status.pfps.length !== 1 ? 's' : ''}.`, 'text-red-400');
            return;
          }

          const selected = status.pfps[num - 1];
          ctx.addOutput(`Setting ${selected.name} as your avatar...`, 'text-gray-400');
          await updateProfilePfp(selected.imageUri, selected.assetId);

          window.dispatchEvent(new CustomEvent('display-image', { detail: { imageUrl: selected.imageUri } }));
          ctx.addOutput(`Avatar updated to ${selected.name}.`, 'text-green-400');
        } catch {
          ctx.addOutput('Failed to update avatar.', 'text-red-400');
        }
        return;
      }

      if (sub === 'clear') {
        try {
          await updateProfilePfp('', '');
          window.dispatchEvent(new CustomEvent('clear-display'));
          ctx.addOutput('Avatar cleared. Matrix rain restored.', 'text-green-400');
        } catch {
          ctx.addOutput('Failed to clear avatar.', 'text-red-400');
        }
        return;
      }

      ctx.addOutput('Unknown subcommand. Type "pfp help" for usage.', 'text-red-400');
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
