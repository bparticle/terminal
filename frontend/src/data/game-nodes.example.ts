import { GameNode } from '@/lib/types/game';

/**
 * Sample game content demonstrating all node types.
 * Replace with your own story content.
 *
 * Campaign target states for "Terminal Explorer":
 * - riddle_solved
 * - ancient_key_found
 * - guardian_defeated
 */
export const gameNodes: Record<string, GameNode> = {
  // ==========================================
  // INTRO SEQUENCE
  // ==========================================
  start: {
    id: 'start',
    type: 'story',
    content:
      'SYSTEM BOOT...\nMEMORY CHECK... OK\nDISK CHECK... OK\nNETWORK... CONNECTED\n\n> Initializing Terminal Adventure v1.0\n> Welcome, {{state.player_name}}.\n\nYou awaken in a dimly lit room. The hum of old machinery fills the air. A green-phosphor terminal flickers to life before you, casting eerie shadows on the concrete walls.',
    location: 'HUB',
    effects: {
      set_state: { _game_session_start: Date.now().toString() },
    },
    next_node: 'hub_main',
  },

  // ==========================================
  // HUB - Main area (always accessible)
  // ==========================================
  hub_main: {
    id: 'hub_main',
    type: 'choice',
    content:
      'You stand in the central hub. Banks of old terminals line the walls, their screens casting a green glow. Three corridors branch off into darkness.\n\nA notice board on the wall reads: "SYSTEM ALERT: Unauthorized access detected in Sector 7. Security protocols engaged."',
    location: 'HUB',
    choices: [
      {
        id: 1,
        text: 'Explore the eastern corridor (Archives)',
        next_node: 'archives_entrance',
      },
      {
        id: 2,
        text: 'Enter the western corridor (Laboratory)',
        next_node: 'lab_entrance',
      },
      {
        id: 3,
        text: 'Descend the stairs to the basement (Vault)',
        next_node: 'vault_entrance',
        requirements: {
          has_item: ['Vault Keycard'],
        },
      },
      {
        id: 4,
        text: 'Examine the notice board',
        next_node: 'notice_board',
      },
      {
        id: 5,
        text: 'Check the old arcade machine',
        next_node: 'arcade_machine',
      },
    ],
  },

  notice_board: {
    id: 'notice_board',
    type: 'story',
    content:
      'The notice board is covered in faded papers and memos. One catches your eye:\n\n"MEMO: The vault access codes have been changed. New keycards are available from the Archives terminal. Please destroy old keycards."\n\nAnother note reads: "Warning: The Guardian Protocol is active in the vault. Proceed with caution."',
    location: 'HUB',
    next_node: 'hub_main',
  },

  // ==========================================
  // ARCHIVES - Contains riddle (quiz node)
  // ==========================================
  archives_entrance: {
    id: 'archives_entrance',
    type: 'story',
    content:
      'The eastern corridor opens into a vast room filled with towering server racks. Blinking lights dance across their faces like digital fireflies.\n\nIn the center, an ancient terminal sits on a desk. Its screen glows with a single prompt:\n\n"ARCHIVES ACCESS TERMINAL - KNOWLEDGE VERIFICATION REQUIRED"',
    location: 'HUB',
    next_node: 'archives_riddle',
  },

  archives_riddle: {
    id: 'archives_riddle',
    type: 'quiz',
    content: 'The terminal displays a riddle. You must answer correctly to access the archives.',
    location: 'HUB',
    question: 'I have cities, but no houses live there. I have mountains, but no trees grow. I have water, but no fish swim. I have roads, but no cars drive. What am I?',
    correct_answer: 'map',
    hint: 'Think about something you might find on a desk or a wall...',
    max_attempts: 3,
    success_message: 'CORRECT! The terminal chirps and the archives spring to life. Drawers slide open revealing their contents.',
    failure_messages: [
      'INCORRECT. The terminal buzzes. "Two attempts remaining."',
      'INCORRECT. The screen flickers. "One attempt remaining. Think carefully."',
    ],
    final_failure_message: 'LOCKOUT ENGAGED. The terminal goes dark. You hear a mechanical click as the system locks. Perhaps you can try again later.',
    success_node: 'archives_unlocked',
    failure_node: 'archives_locked',
    success_effects: {
      set_state: { riddle_solved: 'true' },
    },
  },

  archives_unlocked: {
    id: 'archives_unlocked',
    type: 'choice',
    content:
      'The archives hum with energy. Rows of data terminals flicker to life. You notice a keycard dispenser on the far wall, and a collection of old data tapes on a shelf.',
    location: 'HUB',
    effects: {
      add_item: ['Vault Keycard'],
      set_state: { archives_accessed: 'true' },
    },
    choices: [
      {
        id: 1,
        text: 'Search the data tapes',
        next_node: 'archives_tapes',
      },
      {
        id: 2,
        text: 'Return to the hub',
        next_node: 'hub_main',
      },
    ],
  },

  archives_locked: {
    id: 'archives_locked',
    type: 'story',
    content: 'The terminal is locked. The screen reads: "SECURITY LOCKOUT - Please wait before retrying."\n\nYou can come back later to try again.',
    location: 'HUB',
    effects: {
      set_state: { riddle_solved: 'false' },
    },
    next_node: 'hub_main',
  },

  archives_tapes: {
    id: 'archives_tapes',
    type: 'story',
    content:
      'You sift through the dusty data tapes. Most are corrupted, but one is labeled "PROJECT GUARDIAN - OVERRIDE CODES".\n\nYou pocket the tape. This might be useful later.\n\n[Item obtained: Override Tape]',
    location: 'HUB',
    effects: {
      add_item: ['Override Tape'],
    },
    next_node: 'hub_main',
  },

  // ==========================================
  // LABORATORY - Contains NFT check
  // ==========================================
  lab_entrance: {
    id: 'lab_entrance',
    type: 'story',
    content:
      'The western corridor leads to a sealed laboratory door. A biometric scanner glows red beside it.\n\nA small plaque reads: "Dr. Chen\'s Neural Interface Lab - Authorized Personnel Only"\n\nThe scanner seems to respond to digital credentials...',
    location: 'HUB',
    next_node: 'lab_nft_check',
  },

  lab_nft_check: {
    id: 'lab_nft_check',
    type: 'nft_check',
    content: 'The biometric scanner pulses, waiting for authentication...',
    location: 'HUB',
    nft_id: 'HmkSyoYpZPQ9jiZu5ZDW1DxGQag2uZeuWuxwoDetAjUK',
    item_name: 'Neural Interface',
    nft_owned_content:
      'The scanner detects your digital credentials. The light turns green.\n\n"WELCOME, AUTHORIZED USER."\n\nThe lab door slides open. Inside, you find an experimental Neural Interface device on the workbench.',
    nft_missing_content:
      'The scanner flashes red.\n\n"ACCESS DENIED - No valid credentials detected."\n\nYou need the proper digital credentials (NFT) to access this lab. Perhaps you can acquire them elsewhere.',
    nft_owned_next_node: 'lab_inside',
    nft_missing_next_node: 'hub_main',
  },

  lab_inside: {
    id: 'lab_inside',
    type: 'choice',
    content:
      'The lab is filled with strange equipment. Wires snake across the floor, connecting mysterious devices. On the central workbench sits the Neural Interface — a headband-like device pulsing with soft light.\n\nDr. Chen\'s notes are scattered across the desk.',
    location: 'HUB',
    effects: {
      set_state: { lab_accessed: 'true', ancient_key_found: 'true' },
    },
    choices: [
      {
        id: 1,
        text: 'Read Dr. Chen\'s notes',
        next_node: 'lab_notes',
      },
      {
        id: 2,
        text: 'Take the Neural Interface',
        next_node: 'lab_take_interface',
        requirements: {
          has_item: ['Neural Interface'],
          has_item_negate: [true], // Only show if they DON'T have it yet
        },
      },
      {
        id: 3,
        text: 'Return to the hub',
        next_node: 'hub_main',
      },
    ],
  },

  lab_notes: {
    id: 'lab_notes',
    type: 'story',
    content:
      'Dr. Chen\'s notes read:\n\n"Day 47: The Guardian Protocol continues to evolve. It has developed a rudimentary intelligence. The override codes should still work, but the system may resist.\n\nDay 52: I have hidden the final key in the vault. The Guardian will protect it. Only someone with the Override Tape AND the Neural Interface can hope to bypass it.\n\nDay 53: I am leaving. If you find this, be careful. The Guardian does not distinguish between friend and foe."',
    location: 'HUB',
    next_node: 'lab_inside',
  },

  lab_take_interface: {
    id: 'lab_take_interface',
    type: 'story',
    content: 'You carefully pick up the Neural Interface. It hums softly in your hands, pulsing with an inner light. You feel a slight tingling as you place it in your pack.',
    location: 'HUB',
    effects: {
      add_item: ['Neural Interface'],
      set_state: { ancient_key_found: 'true' },
    },
    next_node: 'lab_inside',
  },

  // ==========================================
  // ARCADE - Snake mini-game (godot_game node)
  // ==========================================
  arcade_machine: {
    id: 'arcade_machine',
    type: 'godot_game',
    content: 'In the corner of the hub, an old arcade cabinet flickers to life. "SNAKE" is emblazoned across its marquee in pixel art. The high score board glows faintly.',
    location: 'HUB',
    game_id: 'snake',
    start_prompt: 'Press ENTER to play Snake!',
    end_event: 'game_over',
    end_message: 'Game Over! Your score: {{metrics.score}}',
    payload_store: {
      mode: 'last',
      state_key: 'game_payloads.snake',
    },
    payload_state_map: {
      score: {
        state_key: 'game_stats.snake_high_score',
        mode: 'set',
      },
    },
    payload_rules: [
      {
        when: { event: 'game_over', metric: 'score', op: 'gte', value: 10 },
        message: 'Impressive! You scored {{metrics.score}}! The arcade cabinet hums approvingly.',
        effects: { set_state: { snake_master: 'true' } },
      },
      {
        when: { event: 'game_over' },
        message: 'You scored {{metrics.score}}. Not bad. Try again to beat the high score!',
      },
    ],
    next_node: 'hub_main',
  },

  // ==========================================
  // VAULT - Final area (requires keycard + items)
  // ==========================================
  vault_entrance: {
    id: 'vault_entrance',
    type: 'choice',
    content:
      'You descend the stairs, keycard in hand. The vault door looms before you — massive steel reinforced with glowing circuit patterns.\n\nA terminal beside the door displays: "GUARDIAN PROTOCOL ACTIVE - WARNING"\n\nThe air feels electric. Something powerful lurks beyond.',
    location: 'HUB',
    choices: [
      {
        id: 1,
        text: 'Insert the override tape and engage the Neural Interface',
        next_node: 'vault_override',
        requirements: {
          has_item: ['Override Tape', 'Neural Interface'],
        },
      },
      {
        id: 2,
        text: 'Try to force the door open',
        next_node: 'vault_force',
      },
      {
        id: 3,
        text: 'Return to the hub',
        next_node: 'hub_main',
      },
    ],
  },

  vault_force: {
    id: 'vault_force',
    type: 'story',
    content:
      'You push against the massive door. Nothing. You throw your weight into it.\n\nThe Guardian Protocol responds. Electricity crackles across the door surface, and you\'re thrown back.\n\n"UNAUTHORIZED ACCESS ATTEMPT DETECTED. COUNTERMEASURES ENGAGED."\n\nYou need to find another way in. Perhaps there are tools in the archives or laboratory that could help.',
    location: 'HUB',
    next_node: 'hub_main',
  },

  vault_override: {
    id: 'vault_override',
    type: 'story',
    content:
      'You slot the Override Tape into the terminal and don the Neural Interface.\n\nThe world dissolves around you. You find yourself in a digital landscape — the Guardian\'s domain. Lines of code stream past like rain.\n\nThe Guardian materializes before you: a vast geometric form of light and shadow.\n\n"INTRUDER DETECTED. STATE YOUR PURPOSE."',
    location: 'HUB',
    next_node: 'guardian_battle',
  },

  guardian_battle: {
    id: 'guardian_battle',
    type: 'quiz',
    content: 'The Guardian challenges you with a final test of logic.',
    location: 'HUB',
    question: 'I am not alive, but I grow. I do not have lungs, but I need air. I do not have a mouth, but water kills me. What am I?',
    correct_answer: 'fire',
    hint: 'Something primal, something dangerous...',
    max_attempts: 2,
    success_message:
      'The Guardian pauses, then slowly dissolves.\n\n"CORRECT. ACCESS GRANTED. YOU HAVE PROVEN YOUR WORTH."\n\nThe digital world fades and the vault door swings open.',
    failure_messages: [
      '"INCORRECT. The Guardian grows brighter, more aggressive. "ONE MORE CHANCE."',
    ],
    final_failure_message:
      'The Guardian overwhelms your defenses. You\'re ejected from the Neural Interface, gasping.\n\nThe Guardian still stands. You need to try again.',
    success_node: 'vault_victory',
    failure_node: 'hub_main',
    success_effects: {
      set_state: { guardian_defeated: 'true' },
      remove_item: ['Override Tape'],
    },
  },

  vault_victory: {
    id: 'vault_victory',
    type: 'story',
    content:
      'The vault door swings open with a heavy groan. Inside, a single pedestal holds a glowing data crystal.\n\nYou pick it up. Knowledge floods your mind — secrets of the old world, blueprints for technology thought lost forever.\n\n[Item obtained: Genesis Crystal]\n\nCongratulations! You have completed the Terminal Explorer quest line.\n\nThe terminal in the hub now shows: "CAMPAIGN COMPLETE - TERMINAL EXPLORER"\n\nYou can continue to explore, play the arcade, or check your achievements.',
    location: 'HUB',
    effects: {
      add_item: ['Genesis Crystal'],
      set_state: {
        vault_opened: 'true',
        quest_complete: 'true',
      },
    },
    next_node: 'hub_main',
  },
};
