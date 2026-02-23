import { GameNode, GameSave, Requirements, GameEffects } from './types/game';
import { gameNodes } from '@/data/game-nodes';
import { loadGame, startNewGame, saveGame, resetGame } from './game-api';
import { fetchOwnedNFTs, OwnedNFT } from './nft-helius';
import { checkWhitelistStatus, executeMint, mintSoulbound, mintSoulboundBackground, getSoulboundItems as fetchSoulboundItems, prepareMint, confirmMint } from './mint-api';
import { checkPfpStatus, mintPfp, preparePfpMint, confirmPfpMint } from './pfp-api';

// Default metadata URI for soulbound inventory items (uploaded to Arweave via Irys)
const INVENTORY_ITEM_URI = 'https://gateway.irys.xyz/27zv62z1d9L5xLpHZvXHuxJSmX36z63J21XH86WmyTr1';

// Items that are consumed or transformed during gameplay — skip soulbound minting
const CONSUMABLE_ITEMS = new Set([
  'glass_vial',
  'phosphor_residue',
  'corrupted_page',
  'first_pixel',
  'observation_code',
]);

type OutputFn = (text: string, className?: string, id?: string) => void;
type LocationChangeFn = (location: string, nodeId?: string) => void;
type InventoryChangeFn = (items: Array<{ name: string; soulbound?: boolean }>) => void;
type MiniGameStartFn = (gameId: string) => void;
export type SignAndSubmitFn = (transactionBase64: string) => Promise<string>;

interface MinigameGate {
  status: 'ready' | 'running' | 'complete';
  node: GameNode;
  metrics?: Record<string, any>;
  overrideNextNode?: string;
}

export class GameEngine {
  private currentNode: GameNode | null = null;
  private walletAddress: string = '';
  private save: GameSave | null = null;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private ownedNFTs: OwnedNFT[] = [];
  private soulboundItemNames: Set<string> = new Set();
  private minigameGate: MinigameGate | null = null;
  private quizState: {
    nodeId: string;
    attempts: number;
  } | null = null;
  // Maps displayed choice number (1,2,3...) to the actual choice object
  private displayedChoiceMap: Map<number, { id: number; next_node: string }> = new Map();
  private spinnerTimers = new Map<string, ReturnType<typeof setInterval>>();
  private static readonly SPINNER_FRAMES = ['|', '/', '-', '\\'];
  private pfpImageUrl: string | null = null;
  private pfpReclaimPending: { node: GameNode } | null = null;
  private pfpReclaimOffered = false;

  constructor(
    private outputFn: OutputFn,
    private locationChangeFn?: LocationChangeFn,
    private inventoryChangeFn?: InventoryChangeFn,
    private miniGameStartFn?: MiniGameStartFn,
    private signAndSubmitFn?: SignAndSubmitFn
  ) {}

  // ==========================================
  // LIFECYCLE
  // ==========================================

  async initialize(
    walletAddress: string,
    playerName: string = 'Wanderer',
    pfpImageUrl?: string,
  ): Promise<void> {
    this.walletAddress = walletAddress;
    this.pfpImageUrl = pfpImageUrl || null;

    try {
      const response = await loadGame(walletAddress);
      if (response) {
        this.save = response.save as unknown as GameSave;
        this.save.name = playerName;
        this.save.game_state.player_name = playerName;
      } else {
        const newResponse = await startNewGame('start', playerName);
        this.save = newResponse.save as unknown as GameSave;
        this.save.game_state = { player_name: playerName };
      }
    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.save = {
        wallet_address: walletAddress,
        current_node_id: 'start',
        location: 'HUB',
        game_state: { player_name: playerName },
        inventory: [],
        name: playerName,
      };
      this.outputFn('Playing in offline mode.', 'text-yellow-400');
    }

    // Load current node
    this.currentNode = gameNodes[this.save.current_node_id] || gameNodes['start'];

    // Start auto-save timer (30 seconds)
    this.autoSaveTimer = setInterval(() => this.autoSave(), 30000);

    // Fetch owned NFTs in background
    this.fetchNFTs(walletAddress);

    // Push loaded inventory to UI so it renders after a refresh
    if (this.save.inventory.length > 0) {
      this.inventoryChangeFn?.(this.buildInventoryItems());
    }

    // Only show PFP on the monitor if the current game state has earned it
    if (this.pfpImageUrl && this.save.game_state.has_pfp) {
      window.dispatchEvent(new CustomEvent('display-image', { detail: { imageUrl: this.pfpImageUrl } }));
    }

    // Display current node
    this.outputFn('');
    this.displayCurrentNode();
  }

  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  private async fetchNFTs(walletAddress: string): Promise<void> {
    try {
      this.ownedNFTs = await fetchOwnedNFTs(walletAddress);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    }

    // Fetch soulbound items in parallel
    try {
      const { items } = await fetchSoulboundItems();
      this.soulboundItemNames = new Set(items.map((i) => i.item_name));
    } catch (error) {
      console.error('Failed to fetch soulbound items:', error);
    }
  }

  // ==========================================
  // DISPLAY
  // ==========================================

  displayCurrentNode(): void {
    if (!this.currentNode || !this.save) return;

    const node = this.currentNode;

    // Apply effects on arrival
    if (node.effects) {
      this.applyEffects(node.effects);
    }

    // Handle different node types
    switch (node.type) {
      case 'nft_check':
        this.handleNftCheckNode(node);
        return;
      case 'quiz':
        this.handleQuizNode(node);
        return;
      case 'godot_game':
        this.handleGodotGameNode(node);
        return;
      case 'mint_action':
        this.handleMintActionNode(node);
        return;
      case 'pfp_mint':
        this.handlePfpMintNode(node);
        return;
      default:
        break;
    }

    // Resolve conditional content (first matching override wins, else base content)
    let resolvedContent = node.content;
    if (node.conditionalContent) {
      for (const variant of node.conditionalContent) {
        if (this.checkRequirements(variant.requirements)) {
          resolvedContent = variant.content;
          break;
        }
      }
    }

    const content = this.renderTemplate(resolvedContent);
    const lines = content.split('\n');
    for (const line of lines) {
      this.outputFn(line, 'text-white');
    }

    // Show choices with 3-tier visibility: hidden / locked / enabled
    // Display numbers are sequential (1, 2, 3...) regardless of internal choice IDs
    if (node.choices && node.choices.length > 0) {
      this.outputFn('');
      this.displayedChoiceMap.clear();
      let displayNum = 0;
      let anyShown = false;

      for (const choice of node.choices) {
        const isVisible = this.checkRequirements(choice.visibilityRequirements);
        if (!isVisible) continue;

        const isEnabled = this.checkRequirements(choice.requirements);
        anyShown = true;
        displayNum++;

        this.displayedChoiceMap.set(displayNum, { id: choice.id, next_node: choice.next_node });

        if (isEnabled) {
          this.outputFn(`[${displayNum}] ${choice.text}`, 'text-cyan-400');
        } else {
          const suffix = choice.lockedText || '[LOCKED]';
          this.outputFn(`[${displayNum}] ${choice.text} — ${suffix}`, 'choice-locked');
        }
      }

      if (!anyShown) {
        this.outputFn('There are no available options. Type "look" to re-examine or go back.', 'text-gray-400');
      }
    } else if (node.next_node) {
      this.outputFn('');
      this.outputFn('Press ENTER to continue...', 'text-gray-400');
    }

    // Update location
    if (node.location) {
      this.save.location = node.location;
      this.locationChangeFn?.(node.location, this.save.current_node_id);
    }
  }

  private handleNftCheckNode(node: GameNode): void {
    if (!this.save) return;

    // Check if player owns the required NFT
    const ownsNFT = node.nft_id
      ? this.ownedNFTs.some(
          (nft) => nft.id === node.nft_id || nft.data_hash === node.nft_id
        )
      : false;

    if (ownsNFT) {
      // Grant item if specified
      if (node.item_name && !this.save.inventory.includes(node.item_name)) {
        this.save.inventory.push(node.item_name);
        this.outputFn(`[Item obtained: ${node.item_name}]`, 'text-yellow-400');
        this.inventoryChangeFn?.(this.buildInventoryItems());
      }

      const content = this.renderTemplate(node.nft_owned_content || 'Access granted.');
      content.split('\n').forEach((line) => this.outputFn(line, 'text-green-400'));

      if (node.nft_owned_next_node) {
        this.outputFn('');
        this.outputFn('Press ENTER to continue...', 'text-gray-400');
        this.currentNode = { ...node, next_node: node.nft_owned_next_node };
      }
    } else {
      const content = this.renderTemplate(node.nft_missing_content || 'Access denied.');
      content.split('\n').forEach((line) => this.outputFn(line, 'text-red-400'));

      if (node.nft_missing_next_node) {
        this.outputFn('');
        this.outputFn('Press ENTER to continue...', 'text-gray-400');
        this.currentNode = { ...node, next_node: node.nft_missing_next_node };
      }
    }
  }

  private handleQuizNode(node: GameNode): void {
    if (!this.save) return;

    // Initialize quiz state
    const quizKey = `quiz_${node.id}`;
    const existingState = this.save.game_state[quizKey];

    if (existingState?.completed) {
      // Already completed, skip to success
      this.outputFn('You have already solved this challenge.', 'text-green-400');
      if (node.success_node) {
        this.outputFn('');
        this.outputFn('Press ENTER to continue...', 'text-gray-400');
        this.currentNode = { ...node, next_node: node.success_node };
      }
      return;
    }

    this.quizState = {
      nodeId: node.id,
      attempts: existingState?.attempts || 0,
    };

    // Show quiz content
    const content = this.renderTemplate(node.content);
    content.split('\n').forEach((line) => this.outputFn(line, 'text-white'));

    this.outputFn('');
    this.outputFn(node.question || 'Answer the question:', 'quiz-question');

    if (node.hint) {
      this.outputFn(`Hint: ${node.hint}`, 'text-gray-400');
    }

    this.outputFn('');
    this.outputFn('Type your answer:', 'text-yellow-400');
  }

  private handleGodotGameNode(node: GameNode): void {
    // Set up minigame gate
    this.minigameGate = {
      status: 'ready',
      node,
    };

    const content = this.renderTemplate(node.content);
    content.split('\n').forEach((line) => this.outputFn(line, 'text-white'));

    this.outputFn('');
    this.outputFn(node.start_prompt || 'Press ENTER to start the game!', 'text-cyan-400');
  }

  private startSpinner(text: string, id: string, className = 'text-cyan-400'): void {
    const existing = this.spinnerTimers.get(id);
    if (existing) clearInterval(existing);

    let frame = 0;
    const tick = () => {
      const ch = GameEngine.SPINNER_FRAMES[frame % GameEngine.SPINNER_FRAMES.length];
      this.outputFn(`  ${ch} ${text}`, className, id);
      frame++;
    };
    tick();
    this.spinnerTimers.set(id, setInterval(tick, 120));
  }

  private stopSpinner(id: string, text: string, success = true): void {
    const timer = this.spinnerTimers.get(id);
    if (timer) {
      clearInterval(timer);
      this.spinnerTimers.delete(id);
    }
    this.outputFn(
      `  ${success ? '\u2713' : '\u2717'} ${text}`,
      success ? 'text-gray-500' : 'text-red-400',
      id,
    );
  }

  private async handleMintActionNode(node: GameNode): Promise<void> {
    if (!this.save || !node.mint_config) return;

    // Display node content
    const content = this.renderTemplate(node.content);
    content.split('\n').forEach((line) => this.outputFn(line, 'text-white'));
    this.outputFn('');

    let mintStep = 0;
    const mintId = () => `mint-step-${mintStep}`;

    this.startSpinner('Checking mint eligibility', mintId());
    try {
      const status = await checkWhitelistStatus();
      if (!status.whitelisted) {
        this.stopSpinner(mintId(), 'Not whitelisted', false);
        if (node.mint_not_whitelisted_node) {
          this.outputFn('');
          this.outputFn('Press ENTER to continue...', 'text-gray-400');
          this.currentNode = { ...node, next_node: node.mint_not_whitelisted_node, choices: undefined };
        }
        return;
      }
      this.stopSpinner(mintId(), 'Eligibility confirmed');
      mintStep++;

      const mintConfig = node.mint_config;
      let result: any;

      if (mintConfig.soulbound) {
        this.startSpinner('Minting soulbound token', mintId(), 'text-yellow-400');
        result = await mintSoulbound(mintConfig);
        this.stopSpinner(mintId(), 'Soulbound token minted');
        this.soulboundItemNames.add(mintConfig.itemName || mintConfig.name);
        mintStep++;
      } else if (this.signAndSubmitFn) {
        this.startSpinner('Preparing transaction', mintId());
        const prepared = await prepareMint({
          name: mintConfig.name,
          uri: mintConfig.uri,
          symbol: mintConfig.symbol,
          collection: mintConfig.collection,
        });
        this.stopSpinner(mintId(), 'Transaction prepared');
        mintStep++;

        this.startSpinner('Awaiting wallet approval (0.05 SOL fee)', mintId(), 'text-yellow-400');
        const signedTxBase64 = await this.signAndSubmitFn(prepared.transactionBase64);
        this.stopSpinner(mintId(), 'Transaction signed');
        mintStep++;

        this.startSpinner('Confirming on-chain', mintId());
        result = await confirmMint(prepared.mintLogId, signedTxBase64);
        this.stopSpinner(mintId(), 'Confirmed on-chain');
        mintStep++;
      } else {
        this.startSpinner('Minting', mintId(), 'text-yellow-400');
        result = await executeMint(mintConfig);
        this.stopSpinner(mintId(), 'Minted');
        mintStep++;
      }

      this.outputFn(`Mint successful! Asset: ${result.assetId.slice(0, 16)}...`, 'text-green-400');

      if (mintConfig.itemName && !this.save.inventory.includes(mintConfig.itemName)) {
        this.save.inventory.push(mintConfig.itemName);
        this.outputFn(`[Item obtained: ${mintConfig.itemName}]`, 'text-yellow-400');
        this.inventoryChangeFn?.(this.buildInventoryItems());
      }

      this.save.game_state[`minted_${node.id}`] = true;
      this.save.game_state[`asset_${node.id}`] = result.assetId;

      if (node.mint_success_node) {
        this.outputFn('');
        this.outputFn('Press ENTER to continue...', 'text-gray-400');
        this.currentNode = { ...node, next_node: node.mint_success_node, choices: undefined };
      }

      await this.autoSave();
    } catch (error: any) {
      this.stopSpinner(mintId(), 'Error', false);

      const msg = this.extractErrorMessage(error);

      if (msg.includes('User rejected') || msg.includes('rejected the request')) {
        this.outputFn('Transaction cancelled.', 'text-yellow-400');
        this.outputFn('');
        this.displayCurrentNode();
        return;
      }

      if (this.isAuthError(msg)) {
        this.outputFn('Session expired — reconnect your wallet and try again.', 'text-red-400');
      } else {
        this.outputFn(`Minting failed: ${msg}`, 'text-red-400');
      }

      if (node.mint_failure_node) {
        this.outputFn('');
        this.outputFn('Press ENTER to continue...', 'text-gray-400');
        this.currentNode = { ...node, next_node: node.mint_failure_node, choices: undefined };
      }
    }
  }

  private async handlePfpMintNode(node: GameNode): Promise<void> {
    if (!this.save) return;

    // Reclaim path: player has a PFP from a previous playthrough but restarted
    if (this.pfpImageUrl && !this.save.game_state.has_pfp && !this.pfpReclaimOffered) {
      this.outputFn('The machine scans you —', 'text-white');
      this.outputFn('and stops. The scanner holds still.', 'text-white');
      this.outputFn('Not searching. Recognizing.', 'text-white');
      this.outputFn('');
      this.outputFn('> EXISTING IDENTITY DETECTED', 'text-yellow-400');
      this.outputFn('> PATTERN MATCH: 100%', 'text-yellow-400');
      this.outputFn('> "Your face is already on the chain.', 'text-yellow-400');
      this.outputFn('>  The machine remembers what it rendered."', 'text-yellow-400');
      this.outputFn('');
      this.outputFn('[1] Reclaim your identity (free)', 'text-cyan-400');
      this.outputFn('[2] Forge a new face (0.05 ◎)', 'text-cyan-400');

      this.pfpReclaimPending = { node };
      return;
    }

    // Display node content
    const content = this.renderTemplate(node.content);
    content.split('\n').forEach((line) => this.outputFn(line, 'text-white'));
    this.outputFn('');

    let pfpStep = 0;
    const pfpId = () => `pfp-step-${pfpStep}`;

    this.startSpinner('Checking PFP mint eligibility', pfpId());
    try {
      const status = await checkPfpStatus();

      if (!status.whitelisted) {
        this.stopSpinner(pfpId(), 'Not eligible', false);
        if (node.pfp_mint_not_eligible_node) {
          this.outputFn('');
          this.outputFn('Press ENTER to continue...', 'text-gray-400');
          this.currentNode = { ...node, next_node: node.pfp_mint_not_eligible_node, choices: undefined };
        }
        return;
      }

      if (!status.canMint) {
        this.stopSpinner(pfpId(), `All ${status.maxMints} mints used`, false);
        if (status.pfpCount > 0) {
          this.outputFn(`You own ${status.pfpCount} Scanlines PFP${status.pfpCount > 1 ? 's' : ''}.`, 'text-gray-400');
        }
        if (node.pfp_mint_limit_node) {
          this.outputFn('');
          this.outputFn('Press ENTER to continue...', 'text-gray-400');
          this.currentNode = { ...node, next_node: node.pfp_mint_limit_node, choices: undefined };
        }
        return;
      }

      this.stopSpinner(pfpId(), 'Eligibility confirmed');
      pfpStep++;

      const remaining = status.mintsRemaining === -1 ? '\u221E' : status.mintsRemaining;
      this.outputFn(`Mints remaining: ${remaining}/${status.maxMints}`, 'text-cyan-400');
      this.outputFn('');

      const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

      const stepActive = (text: string) => {
        this.startSpinner(text, pfpId());
      };
      const stepDone = (text: string) => {
        this.stopSpinner(pfpId(), text);
        pfpStep++;
      };

      let result: any;

      if (this.signAndSubmitFn) {
        this.outputFn('> IDENTITY GENERATION SEQUENCE', 'text-yellow-400 font-bold');
        this.outputFn('');

        const preparePromise = preparePfpMint();

        stepActive('Seeding identity generator');
        await delay(500 + Math.random() * 400);
        stepDone('Identity generator seeded');

        stepActive('Computing face vectors');
        await delay(400 + Math.random() * 300);
        stepDone('Face vectors computed');

        stepActive('Rendering feature matrix');
        await delay(400 + Math.random() * 300);
        stepDone('Feature matrix rendered');

        stepActive('Applying CRT phosphor mapping');
        await delay(300 + Math.random() * 200);
        stepDone('CRT phosphor mapping applied');

        stepActive('Encoding to chain format');
        const prepared = await preparePromise;
        stepDone('Encoded to chain format');

        stepActive('Submitting to Solana');
        this.outputFn('');
        this.outputFn('  Approve transaction in wallet (0.05 SOL fee)', 'text-yellow-400');
        const signedTxBase64 = await this.signAndSubmitFn(prepared.transactionBase64);
        stepDone('Submitted to Solana');

        stepActive('Confirming transaction');
        result = await confirmPfpMint(prepared.mintLogId, signedTxBase64);
        stepDone('Transaction confirmed');

        result.traits = prepared.pfpData.traits;
        result.imageUri = result.imageUri || prepared.pfpData.imageUri;
      } else {
        this.outputFn('> IDENTITY GENERATION SEQUENCE', 'text-yellow-400 font-bold');
        this.outputFn('');
        stepActive('Generating');
        result = await mintPfp();
        stepDone('Generated');
      }

      this.outputFn('');
      this.outputFn('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', 'text-green-400');
      this.outputFn('\u2551     YOUR SCANLINES PFP IS READY!     \u2551', 'text-green-400');
      this.outputFn('\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D', 'text-green-400');
      this.outputFn('');
      this.outputFn(`  Palette:    ${result.traits.paletteName}`, 'text-white');
      this.outputFn(`  Face:       ${result.traits.faceShape}`, 'text-white');
      this.outputFn(`  Eyes:       ${result.traits.eyeType}`, 'text-white');
      this.outputFn(`  Mouth:      ${result.traits.mouthStyle}`, 'text-white');
      this.outputFn(`  Hair:       ${result.traits.hairStyle}`, 'text-white');
      this.outputFn(`  Accessory:  ${result.traits.accessory}`, 'text-white');
      this.outputFn(`  Clothing:   ${result.traits.clothing}`, 'text-white');
      this.outputFn(`  Background: ${result.traits.bgPattern}`, 'text-white');
      this.outputFn(`  Style:      ${result.traits.pixelStyle}`, 'text-white');
      this.outputFn('');
      this.outputFn(`Asset: ${result.assetId.slice(0, 20)}...`, 'text-gray-400');

      // Show the PFP in the Monitor
      if (result.imageUri) {
        window.dispatchEvent(new CustomEvent('display-image', { detail: { imageUrl: result.imageUri } }));
      }

      // Set state flags
      this.save.game_state.has_pfp = true;
      this.save.game_state.pfp_count = (this.save.game_state.pfp_count || 0) + 1;

      if (node.pfp_mint_success_node) {
        this.outputFn('');
        this.outputFn('Press ENTER to continue...', 'text-gray-400');
        this.currentNode = { ...node, next_node: node.pfp_mint_success_node, choices: undefined };
      }

      await this.autoSave();
    } catch (error: any) {
      this.stopSpinner(pfpId(), 'Error', false);

      const msg = this.extractErrorMessage(error);

      if (msg.includes('User rejected') || msg.includes('rejected the request')) {
        this.outputFn('Transaction cancelled.', 'text-yellow-400');
        this.outputFn('');
        this.displayCurrentNode();
        return;
      }

      if (this.isAuthError(msg)) {
        this.outputFn('Session expired — reconnect your wallet and try again.', 'text-red-400');
      } else {
        this.outputFn(`PFP mint failed: ${msg}`, 'text-red-400');
      }

      if (node.pfp_mint_failure_node) {
        this.outputFn('');
        this.outputFn('Press ENTER to continue...', 'text-gray-400');
        this.currentNode = { ...node, next_node: node.pfp_mint_failure_node, choices: undefined };
      }
    }
  }

  /**
   * Build inventory items with soulbound annotation
   */
  private buildInventoryItems(): Array<{ name: string; soulbound?: boolean }> {
    if (!this.save) return [];
    return this.save.inventory.map((name) => ({
      name,
      soulbound: this.soulboundItemNames.has(name) || undefined,
    }));
  }

  // ==========================================
  // INPUT PROCESSING
  // ==========================================

  async processInput(input: string): Promise<void> {
    if (!this.save || !this.currentNode) return;

    const trimmed = input.trim();

    // Handle minigame gate
    if (this.minigameGate) {
      if (this.minigameGate.status === 'ready' && trimmed === '') {
        this.minigameGate.status = 'running';
        this.miniGameStartFn?.(this.minigameGate.node.game_id || 'snake');
        return;
      }
      if (this.minigameGate.status === 'complete' && trimmed === '') {
        const nextNode = this.minigameGate.overrideNextNode || this.minigameGate.node.next_node;
        this.minigameGate = null;
        if (nextNode) {
          await this.moveToNode(nextNode);
        }
        return;
      }
      if (this.minigameGate.status === 'running') {
        this.outputFn('Game in progress... press ESC to exit.', 'text-gray-400');
        return;
      }
    }

    // Handle PFP reclaim choice
    if (this.pfpReclaimPending) {
      const reclaimNode = this.pfpReclaimPending.node;
      if (trimmed === '1') {
        this.pfpReclaimPending = null;
        this.save.game_state.has_pfp = true;
        if (this.pfpImageUrl) {
          window.dispatchEvent(new CustomEvent('display-image', { detail: { imageUrl: this.pfpImageUrl } }));
        }
        await this.autoSave();
        await this.moveToNode('pfp_booth_reclaim_success');
      } else if (trimmed === '2') {
        this.pfpReclaimPending = null;
        this.pfpReclaimOffered = true;
        await this.handlePfpMintNode(reclaimNode);
      }
      return;
    }

    // Handle quiz mode
    if (this.quizState) {
      await this.handleQuizAnswer(trimmed);
      return;
    }

    // Check for numbered choice (display number maps to actual choice)
    const choiceNum = parseInt(trimmed);
    if (!isNaN(choiceNum) && this.currentNode.choices) {
      const mapped = this.displayedChoiceMap.get(choiceNum);
      if (mapped) {
        const choice = this.currentNode.choices.find((c) => c.id === mapped.id);
        if (choice && this.checkRequirements(choice.requirements)) {
          await this.moveToNode(choice.next_node);
          return;
        } else if (choice) {
          this.outputFn('You don\'t meet the requirements for that choice.', 'text-red-400');
          return;
        }
      }
    }

    // Check for ENTER to continue (linear nodes)
    if (trimmed === '' && this.currentNode.next_node) {
      await this.moveToNode(this.currentNode.next_node);
      return;
    }

    // Return false to indicate the engine didn't handle this input
    // (will be passed to terminal commands)
    return;
  }

  /**
   * Returns true if this input was handled by game logic
   */
  canHandleInput(input: string): boolean {
    const trimmed = input.trim();

    // Minigame gate
    if (this.minigameGate) return true;

    // PFP reclaim choice
    if (this.pfpReclaimPending) return true;

    // Quiz mode
    if (this.quizState) return true;

    // Numbered choice (check against displayed choice numbers)
    const choiceNum = parseInt(trimmed);
    if (!isNaN(choiceNum) && this.currentNode?.choices) {
      return this.displayedChoiceMap.has(choiceNum);
    }

    // Enter for linear progression
    if (trimmed === '' && this.currentNode?.next_node) return true;

    return false;
  }

  private async handleQuizAnswer(answer: string): Promise<void> {
    if (!this.quizState || !this.save) return;

    const node = gameNodes[this.quizState.nodeId];
    if (!node) return;

    const userAnswer = answer.toLowerCase().trim();

    if (!userAnswer) {
      if (node.exit_node) {
        this.quizState = null;
        await this.moveToNode(node.exit_node);
        return;
      }
      this.outputFn('Type your answer or a command:', 'text-gray-400');
      return;
    }

    this.quizState.attempts++;

    const quizKey = `quiz_${node.id}`;
    this.save.game_state[quizKey] = {
      attempts: this.quizState.attempts,
      completed: false,
    };

    // Support both single correct_answer and correct_answers array
    const acceptedAnswers: string[] = node.correct_answers
      ? node.correct_answers.map(a => String(a).toLowerCase().trim())
      : [String(node.correct_answer || '').toLowerCase().trim()];

    if (acceptedAnswers.includes(userAnswer)) {
      // Correct!
      this.save.game_state[quizKey].completed = true;

      if (node.success_message) {
        node.success_message.split('\n').forEach((line) =>
          this.outputFn(this.renderTemplate(line), 'text-green-400')
        );
      }

      if (node.success_effects) {
        this.applyEffects(node.success_effects);
      }

      this.quizState = null;

      if (node.success_node) {
        this.outputFn('');
        this.outputFn('Press ENTER to continue...', 'text-gray-400');
        this.currentNode = { ...node, next_node: node.success_node, choices: undefined };
      }

      await this.autoSave();
    } else {
      // Wrong answer
      const maxAttempts = node.max_attempts || Infinity;

      if (this.quizState.attempts >= maxAttempts) {
        // Final failure
        if (node.final_failure_message) {
          node.final_failure_message.split('\n').forEach((line) =>
            this.outputFn(this.renderTemplate(line), 'text-red-400')
          );
        }

        if (node.failure_effects) {
          this.applyEffects(node.failure_effects);
        }

        // Reset quiz attempts so the player can retry when they return
        this.save.game_state[quizKey] = { attempts: 0, completed: false };

        this.quizState = null;

        if (node.failure_node) {
          this.outputFn('');
          this.outputFn('Press ENTER to continue...', 'text-gray-400');
          this.currentNode = { ...node, next_node: node.failure_node, choices: undefined };
        }
      } else {
        // Show attempt-specific failure message
        const failIdx = this.quizState.attempts - 1;
        const failMsg = node.failure_messages?.[failIdx] || 'Incorrect. Try again.';
        this.outputFn(this.renderTemplate(failMsg), 'text-red-400');
        this.outputFn('');
        this.outputFn('Type your answer:', 'text-yellow-400');
      }

      await this.autoSave();
    }
  }

  // ==========================================
  // MINI-GAME INTEGRATION
  // ==========================================

  /**
   * Called by the terminal component when a mini-game sends an event
   */
  handleMinigameEvent(event: string, metrics: Record<string, any>): void {
    if (!this.minigameGate || !this.save) return;

    const node = this.minigameGate.node;
    const endEvent = node.end_event || 'game_over';

    // Store payload
    if (node.payload_store?.state_key) {
      if (node.payload_store.mode === 'last') {
        this.save.game_state[node.payload_store.state_key] = {
          ...metrics,
          recorded_at: Date.now(),
        };
      }
    }

    // Map metrics to state
    if (node.payload_state_map) {
      for (const [metricKey, mapping] of Object.entries(node.payload_state_map)) {
        const value = metrics[metricKey];
        if (value !== undefined) {
          const current = this.save.game_state[mapping.state_key] || 0;
          if (mapping.mode === 'increment') {
            const mult = mapping.multiplier || 1;
            this.save.game_state[mapping.state_key] = current + value * mult;
          } else {
            // 'set' - keep highest
            this.save.game_state[mapping.state_key] = Math.max(
              typeof current === 'number' ? current : 0,
              value
            );
          }
        }
      }
    }

    if (event === endEvent || event === 'exit') {
      this.minigameGate.status = 'complete';
      this.minigameGate.metrics = metrics;

      // Show end message
      if (node.end_message) {
        const msg = this.renderTemplate(node.end_message, metrics);
        msg.split('\n').forEach((line) => this.outputFn(line, 'text-white'));
      }

      // Evaluate rules
      if (node.payload_rules) {
        for (const rule of node.payload_rules) {
          if (this.evaluateRule(rule.when, event, metrics)) {
            if (rule.message) {
              const msg = this.renderTemplate(rule.message, metrics);
              msg.split('\n').forEach((line) => this.outputFn(line, 'text-cyan-400'));
            }
            if (rule.effects) {
              this.applyEffects(rule.effects);
            }
            if (rule.next_node) {
              this.minigameGate.overrideNextNode = rule.next_node;
            }
            break; // First matching rule wins
          }
        }
      }

      this.outputFn('');
      this.outputFn('Press ENTER to continue...', 'text-gray-400');
      this.autoSave();
    }
  }

  private evaluateRule(
    when: any,
    event: string,
    metrics: Record<string, any>
  ): boolean {
    if (!when) return true; // No condition = always matches

    if (when.event && when.event !== event) return false;

    if (when.metric) {
      const value = metrics[when.metric];
      if (value === undefined && when.op !== 'exists') return false;

      switch (when.op) {
        case 'eq': return value === when.value;
        case 'ne': return value !== when.value;
        case 'gt': return value > when.value;
        case 'gte': return value >= (when.value || 0);
        case 'lt': return value < when.value;
        case 'lte': return value <= when.value;
        case 'exists': return value !== undefined;
        default: return true;
      }
    }

    return true;
  }

  isMinigameRunning(): boolean {
    return this.minigameGate?.status === 'running';
  }

  getActiveGameId(): string | null {
    if (this.minigameGate?.status === 'running') {
      return this.minigameGate.node.game_id || null;
    }
    return null;
  }

  // ==========================================
  // NODE NAVIGATION
  // ==========================================

  async moveToNode(nodeId: string): Promise<void> {
    const node = gameNodes[nodeId];
    if (!node) {
      this.outputFn(`Error: Node "${nodeId}" not found.`, 'text-red-400');
      return;
    }

    this.currentNode = node;
    if (this.save) {
      this.save.current_node_id = nodeId;
    }

    this.outputFn(''); // Blank line separator

    this.displayCurrentNode();
    await this.autoSave();
  }

  // ==========================================
  // REQUIREMENTS & EFFECTS
  // ==========================================

  checkRequirements(requirements?: Requirements): boolean {
    if (!requirements || !this.save) return true;

    // Check item requirements
    if (requirements.has_item) {
      for (let i = 0; i < requirements.has_item.length; i++) {
        const hasItem = this.save.inventory.includes(requirements.has_item[i]);
        const negate = requirements.has_item_negate?.[i] || false;
        if (negate ? hasItem : !hasItem) return false;
      }
    }

    // Check state requirements
    if (requirements.state) {
      for (const [key, value] of Object.entries(requirements.state)) {
        if (this.save.game_state[key] !== value) return false;
      }
    }

    // Check NFT requirements
    if (requirements.has_nft) {
      const hasNFT = this.ownedNFTs.some(
        (nft) => nft.id === requirements.has_nft || nft.data_hash === requirements.has_nft
      );
      if (requirements.has_nft_negate ? hasNFT : !hasNFT) return false;
    }

    return true;
  }

  private applyEffects(effects: GameEffects): void {
    if (!this.save) return;

    if (effects.add_item) {
      for (const item of effects.add_item) {
        if (!this.save.inventory.includes(item)) {
          this.save.inventory.push(item);
          this.outputFn(`[Item obtained: ${item}]`, 'text-yellow-400');

          // Background soulbound mint — fire-and-forget, one per user per item
          // Skip consumable/transient items that will be removed or transformed
          if (!this.soulboundItemNames.has(item) && !CONSUMABLE_ITEMS.has(item)) {
            this.soulboundItemNames.add(item);
            mintSoulboundBackground(item, INVENTORY_ITEM_URI);
          }
        }
      }
      this.inventoryChangeFn?.(this.buildInventoryItems());
    }

    if (effects.remove_item) {
      for (const item of effects.remove_item) {
        const index = this.save.inventory.indexOf(item);
        if (index > -1) {
          this.save.inventory.splice(index, 1);
          this.outputFn(`[Item removed: ${item}]`, 'text-gray-400');
        }
      }
      this.inventoryChangeFn?.(this.buildInventoryItems());
    }

    if (effects.set_state) {
      this.save.game_state = {
        ...this.save.game_state,
        ...effects.set_state,
      };
    }

    if (effects.modify_state) {
      for (const [key, delta] of Object.entries(effects.modify_state)) {
        const current = typeof this.save.game_state[key] === 'number'
          ? this.save.game_state[key] : 0;
        this.save.game_state[key] = current + delta;
      }
    }
  }

  // ==========================================
  // TEMPLATE RENDERING
  // ==========================================

  private renderTemplate(text: string, extraContext?: Record<string, any>): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, path: string) => {
      const trimmedPath = path.trim();

      // Check extra context first (for metrics)
      if (extraContext && trimmedPath.startsWith('metrics.')) {
        const key = trimmedPath.substring(8);
        const value = extraContext[key];
        return value !== undefined ? String(value) : match;
      }

      // Check game state
      if (trimmedPath.startsWith('state.')) {
        const statePath = trimmedPath.substring(6);
        const value = this.getStatePath(statePath);
        return value !== undefined ? String(value) : match;
      }

      return match;
    });
  }

  private getStatePath(path: string): any {
    const keys = path.split('.');
    const disallowed = new Set(['__proto__', 'constructor', 'prototype']);
    let value: any = this.save?.game_state;
    for (const key of keys) {
      if (disallowed.has(key)) return undefined;
      value = value?.[key];
      if (value === undefined) return undefined;
    }
    return value;
  }

  // ==========================================
  // SAVE / LOAD
  // ==========================================

  async autoSave(): Promise<void> {
    if (!this.save || !this.save.wallet_address) return;

    try {
      const result = await saveGame({
        current_node_id: this.save.current_node_id,
        location: this.save.location,
        game_state: this.save.game_state,
        inventory: this.save.inventory,
        name: this.save.name || 'Wanderer',
        save_version: this.save.save_version,
      });

      if (result.save.save_version !== undefined) {
        this.save.save_version = result.save.save_version;
      }

      // Notify UI components (e.g. StatsBox) that progress may have changed
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('game-progress-updated'));
      }
    } catch (error: any) {
      if (error.message?.includes('version mismatch')) {
        this.outputFn('');
        this.outputFn('Game data was reset by an admin. Reloading...', 'text-yellow-400');
        await this.reloadGame();
        return;
      }
      console.error('Auto-save failed:', error);
    }
  }

  async manualSave(): Promise<void> {
    this.outputFn('Saving game...', 'text-yellow-400');
    await this.autoSave();
    this.outputFn('Game saved.', 'text-green-400');
  }

  async reloadGame(): Promise<void> {
    this.outputFn('Reloading game...', 'text-yellow-400');
    await this.initialize(this.walletAddress);
  }

  async restartGame(): Promise<void> {
    if (!this.walletAddress) return;

    try {
      await resetGame();

      const name = this.save?.name || 'Wanderer';
      const nextVersion = (this.save?.save_version || 1) + 1;
      this.save = {
        wallet_address: this.walletAddress,
        current_node_id: 'start',
        location: 'HUB',
        game_state: { player_name: name },
        inventory: [],
        name,
        save_version: nextVersion,
      };

      this.currentNode = gameNodes['start'];
      this.quizState = null;
      this.minigameGate = null;
      this.pfpReclaimPending = null;
      this.pfpReclaimOffered = false;

      window.dispatchEvent(new Event('clear-display'));

      this.outputFn('Game reset! Starting fresh. Your achievements and campaign wins are preserved.', 'text-green-400');
      this.outputFn('');
      this.displayCurrentNode();
    } catch (error) {
      console.error('Restart failed:', error);
      this.outputFn('Failed to restart game.', 'text-red-400');
    }
  }

  // ==========================================
  // GETTERS
  // ==========================================

  getCurrentNode(): GameNode | null {
    return this.currentNode;
  }

  getSave(): GameSave | null {
    return this.save;
  }

  getInventory(): string[] {
    return this.save?.inventory || [];
  }

  getLocation(): string {
    return this.save?.location || 'HUB';
  }

  getInventoryItems(): Array<{ name: string; soulbound?: boolean }> {
    return this.buildInventoryItems();
  }

  setOwnedNFTs(nfts: OwnedNFT[]): void {
    this.ownedNFTs = nfts;
  }

  isSocialNode(): boolean {
    return this.currentNode?.social !== false;
  }

  setPlayerName(name: string): void {
    if (this.save) {
      this.save.name = name;
      this.save.game_state.player_name = name;
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === 'string' && error) return error;
    if (error && typeof error === 'object' && 'message' in error) {
      const msg = (error as any).message;
      if (typeof msg === 'string' && msg) return msg;
    }
    return 'An unexpected error occurred';
  }

  private isAuthError(msg: string): boolean {
    const lower = msg.toLowerCase();
    return (
      lower.includes('session expired') ||
      lower.includes('authentication required') ||
      lower.includes('reconnect your wallet') ||
      lower.includes('not authenticated') ||
      lower.includes('wallet not connected')
    );
  }

}
