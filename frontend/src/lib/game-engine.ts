import { GameNode, GameSave } from './types/game';
import { gameNodes } from '@/data/game-nodes';
import { loadGame, startNewGame, saveGame } from './game-api';
import { fetchOwnedNFTs, OwnedNFT } from './nft-helius';

type OutputFn = (text: string, className?: string) => void;
type LocationChangeFn = (location: string) => void;
type InventoryChangeFn = (items: Array<{ name: string }>) => void;
type MiniGameStartFn = (gameId: string) => void;

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
  private minigameGate: MinigameGate | null = null;
  private quizState: {
    nodeId: string;
    attempts: number;
  } | null = null;

  constructor(
    private outputFn: OutputFn,
    private locationChangeFn?: LocationChangeFn,
    private inventoryChangeFn?: InventoryChangeFn,
    private miniGameStartFn?: MiniGameStartFn
  ) {}

  // ==========================================
  // LIFECYCLE
  // ==========================================

  async initialize(walletAddress: string): Promise<void> {
    this.walletAddress = walletAddress;

    // Try to load existing save
    try {
      const response = await loadGame(walletAddress);
      if (response) {
        this.save = response.save as unknown as GameSave;
        this.outputFn('Game loaded! Resuming your adventure...', 'text-green-400');
      } else {
        // No save found, create new game
        const newResponse = await startNewGame('start', 'Wanderer');
        this.save = newResponse.save as unknown as GameSave;
        this.save.game_state = { player_name: 'Wanderer' };
        this.outputFn('New game created! Welcome, Wanderer.', 'text-cyan-400');
      }
    } catch (error) {
      console.error('Failed to initialize game:', error);
      // Create a local-only save as fallback
      this.save = {
        wallet_address: walletAddress,
        current_node_id: 'start',
        location: 'HUB',
        game_state: { player_name: 'Wanderer' },
        inventory: [],
        name: 'Wanderer',
      };
      this.outputFn('Playing in offline mode.', 'text-yellow-400');
    }

    // Load current node
    this.currentNode = gameNodes[this.save.current_node_id] || gameNodes['start'];

    // Start auto-save timer (30 seconds)
    this.autoSaveTimer = setInterval(() => this.autoSave(), 30000);

    // Fetch owned NFTs in background
    this.fetchNFTs(walletAddress);

    // Display current node
    this.outputFn('');
    this.displayCurrentNode();
  }

  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.autoSave();
  }

  private async fetchNFTs(walletAddress: string): Promise<void> {
    try {
      this.ownedNFTs = await fetchOwnedNFTs(walletAddress);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
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
      default:
        break;
    }

    // Render content
    const content = this.renderTemplate(node.content);
    const lines = content.split('\n');
    for (const line of lines) {
      this.outputFn(line, 'text-white');
    }

    // Show choices
    if (node.choices && node.choices.length > 0) {
      this.outputFn('');
      const visibleChoices = node.choices.filter((c) =>
        this.checkRequirements(c.requirements)
      );

      if (visibleChoices.length > 0) {
        for (const choice of visibleChoices) {
          this.outputFn(`[${choice.id}] ${choice.text}`, 'text-cyan-400');
        }
      } else {
        this.outputFn('There are no available options. Type "look" to re-examine or go back.', 'text-gray-400');
      }
    } else if (node.next_node) {
      this.outputFn('');
      this.outputFn('Press ENTER to continue...', 'text-gray-400');
    }

    // Update location
    if (node.location) {
      this.save.location = node.location;
      this.locationChangeFn?.(node.location);
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
        this.inventoryChangeFn?.(this.save.inventory.map((n) => ({ name: n })));
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

    // Handle quiz mode
    if (this.quizState) {
      await this.handleQuizAnswer(trimmed);
      return;
    }

    // Check for numbered choice
    const choiceNum = parseInt(trimmed);
    if (!isNaN(choiceNum) && this.currentNode.choices) {
      const choice = this.currentNode.choices.find((c) => c.id === choiceNum);
      if (choice && this.checkRequirements(choice.requirements)) {
        await this.moveToNode(choice.next_node);
        return;
      } else if (choice) {
        this.outputFn('You don\'t meet the requirements for that choice.', 'text-red-400');
        return;
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

    // Quiz mode
    if (this.quizState) return true;

    // Numbered choice
    const choiceNum = parseInt(trimmed);
    if (!isNaN(choiceNum) && this.currentNode?.choices) {
      return this.currentNode.choices.some((c) => c.id === choiceNum);
    }

    // Enter for linear progression
    if (trimmed === '' && this.currentNode?.next_node) return true;

    return false;
  }

  private async handleQuizAnswer(answer: string): Promise<void> {
    if (!this.quizState || !this.save) return;

    const node = gameNodes[this.quizState.nodeId];
    if (!node) return;

    const correctAnswer = String(node.correct_answer || '').toLowerCase().trim();
    const userAnswer = answer.toLowerCase().trim();

    if (!userAnswer) {
      // Allow exit from quiz
      if (node.exit_node) {
        this.quizState = null;
        await this.moveToNode(node.exit_node);
        return;
      }
      this.outputFn('Type your answer or a command:', 'text-gray-400');
      return;
    }

    this.quizState.attempts++;

    // Update quiz state in game_state
    const quizKey = `quiz_${node.id}`;
    this.save.game_state[quizKey] = {
      attempts: this.quizState.attempts,
      completed: false,
    };

    if (userAnswer === correctAnswer) {
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

  checkRequirements(requirements?: any): boolean {
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

  private applyEffects(effects: {
    add_item?: string[];
    remove_item?: string[];
    set_state?: Record<string, any>;
  }): void {
    if (!this.save) return;

    if (effects.add_item) {
      for (const item of effects.add_item) {
        if (!this.save.inventory.includes(item)) {
          this.save.inventory.push(item);
          this.outputFn(`[Item obtained: ${item}]`, 'text-yellow-400');
        }
      }
      this.inventoryChangeFn?.(this.save.inventory.map((name) => ({ name })));
    }

    if (effects.remove_item) {
      for (const item of effects.remove_item) {
        const index = this.save.inventory.indexOf(item);
        if (index > -1) {
          this.save.inventory.splice(index, 1);
          this.outputFn(`[Item removed: ${item}]`, 'text-gray-400');
        }
      }
      this.inventoryChangeFn?.(this.save.inventory.map((name) => ({ name })));
    }

    if (effects.set_state) {
      this.save.game_state = {
        ...this.save.game_state,
        ...effects.set_state,
      };
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
    let value: any = this.save?.game_state;
    for (const key of keys) {
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
      await saveGame({
        current_node_id: this.save.current_node_id,
        location: this.save.location,
        game_state: this.save.game_state,
        inventory: this.save.inventory,
        name: this.save.name || 'Wanderer',
      });
    } catch (error) {
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
      // Reset local state
      this.save = {
        wallet_address: this.walletAddress,
        current_node_id: 'start',
        location: 'HUB',
        game_state: { player_name: this.save?.name || 'Wanderer' },
        inventory: [],
        name: this.save?.name || 'Wanderer',
      };

      await this.autoSave();
      this.currentNode = gameNodes['start'];
      this.quizState = null;
      this.minigameGate = null;
      this.outputFn('Game restarted!', 'text-green-400');
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

  setOwnedNFTs(nfts: OwnedNFT[]): void {
    this.ownedNFTs = nfts;
  }

  setPlayerName(name: string): void {
    if (this.save) {
      this.save.name = name;
      this.save.game_state.player_name = name;
    }
  }
}
