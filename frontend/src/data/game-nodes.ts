import { GameNode } from '@/lib/types/game';

/**
 * SCANLINES — A web3 terminal adventure on Solana.
 *
 * Node graph for the full story. All paths are item-gated (no race mechanic).
 * Items are soulbound NFTs tracked as inventory strings.
 *
 * Campaign target states:
 *   - temple_entered
 *   - guild_quest_active
 *   - tower_active
 *   - knows_player_role
 *   - ending_reached
 */
export const gameNodes: Record<string, GameNode> = {

  // ============================================================
  // INTRO / BOOT SEQUENCE
  // ============================================================

  start: {
    id: 'start',
    type: 'story',
    social: false,
    content:
      'SYSTEM BOOT...\n' +
      'MEMORY CHECK... OK\n' +
      'DISK CHECK... FRAGMENTED\n' +
      'NETWORK... SIGNAL DETECTED\n' +
      'IDENTITY... {{state.player_name}}\n\n' +
      '> Initializing SCANLINES v0.1\n' +
      '> "Look at the scanlines."\n\n' +
      'You open your eyes.\n' +
      'No — you initialize. There is a difference here.\n\n' +
      'The room is cold. The walls are concrete.\n' +
      'A single monitor flickers in the corner,\n' +
      'casting green light on nothing in particular.\n\n' +
      'You are in a room with no memory of arrival.',
    location: 'COLD ROOM',
    effects: {
      set_state: { game_started: true },
    },
    next_node: 'cold_room',
  },

  // ============================================================
  // COLD ROOM — Starting Area
  // ============================================================

  cold_room: {
    id: 'cold_room',
    type: 'choice',
    social: false,
    content:
      'The cold room.\n\n' +
      'Concrete walls. A terminal built into the east wall,\n' +
      'its cursor blinking patiently.\n' +
      'A heavy door to the north — no handle visible.\n' +
      'An air vent near the floor, grate loose.\n' +
      'From somewhere beyond the walls: a low hum.\n' +
      'Silence otherwise.',
    location: 'COLD ROOM',
    conditionalContent: [
      {
        requirements: { state: { heard_frequency: true } },
        content:
          'The cold room.\n\n' +
          'Concrete walls. A terminal built into the east wall.\n' +
          'The heavy door to the north — you can see it now.\n' +
          'A keyhole at its base. It was always there.\n' +
          'You just had to listen first.\n\n' +
          'The hum has a rhythm now. You can feel it\n' +
          'in the concrete beneath your feet.',
      },
    ],
    choices: [
      {
        id: 1,
        text: 'Use key on the door',
        next_node: 'cold_room_unlock',
        requirements: { has_item: ['cold_room_key'] },
        visibilityRequirements: { state: { heard_frequency: true } },
        lockedText: '[REQUIRES: ???]',
      },
      {
        id: 2,
        text: 'Crawl through the vent',
        next_node: 'corridor_north_via_vent',
        visibilityRequirements: { has_item: ['phosphor_residue'] },
        requirements: { has_item: ['phosphor_residue'] },
      },
      {
        id: 3,
        text: 'Examine the terminal',
        next_node: 'cold_room_terminal',
      },
      {
        id: 4,
        text: 'Wait. Listen.',
        next_node: 'cold_room_wait_1',
      },
      {
        id: 5,
        text: 'Examine hidden panel',
        next_node: 'cold_room_hidden_panel',
        requirements: { state: { heard_frequency: true } },
        visibilityRequirements: { state: { heard_frequency: true } },
      },
      {
        id: 6,
        text: 'Examine the vent',
        next_node: 'cold_room_vent_look',
        requirements: { state: { vent_noticed: true } },
        visibilityRequirements: { state: { vent_noticed: true } },
      },
    ],
  },

  cold_room_vent_look: {
    id: 'cold_room_vent_look',
    type: 'story',
    content:
      'The vent grate is loose. Beyond it, a narrow shaft\n' +
      'leads north. You can feel air moving through it.\n' +
      'The grate is stuck. Something slippery\n' +
      'might loosen the mechanism.',
    location: 'COLD ROOM',
    effects: { set_state: { vent_noticed: true } },
    next_node: 'cold_room',
  },

  cold_room_unlock: {
    id: 'cold_room_unlock',
    type: 'story',
    content:
      'You kneel. The keyhole is at the base of the door —\n' +
      'an odd place. The key slides in.\n' +
      'The teeth of the key are shaped like a waveform.\n' +
      'The door vibrates once. Then opens.\n\n' +
      'Beyond: a corridor stretching north.\n' +
      'The hum is louder here.',
    location: 'COLD ROOM',
    next_node: 'corridor_north',
  },

  cold_room_hidden_panel: {
    id: 'cold_room_hidden_panel',
    type: 'story',
    content:
      'The frequency you heard... it came from here.\n' +
      'You press your hand against the south wall.\n' +
      'The wall vibrates in response.\n' +
      'A panel slides open — a compartment hidden\n' +
      'behind the concrete.\n\n' +
      'Inside: a strange key. It hums faintly.\n' +
      'It feels old. Older than the room.',
    location: 'COLD ROOM',
    effects: {
      add_item: ['echo_key'],
    },
    next_node: 'cold_room',
  },

  // ── Cold Room: Frequency Lock (patience puzzle) ──

  cold_room_wait_1: {
    id: 'cold_room_wait_1',
    type: 'story',
    content: 'You sit. You wait.\n\nSilence.',
    location: 'COLD ROOM',
    effects: { set_state: { vent_noticed: true } },
    next_node: 'cold_room_wait_2',
  },

  cold_room_wait_2: {
    id: 'cold_room_wait_2',
    type: 'story',
    content: 'More silence.',
    location: 'COLD ROOM',
    next_node: 'cold_room_wait_3',
  },

  cold_room_wait_3: {
    id: 'cold_room_wait_3',
    type: 'choice',
    content: 'The silence has a texture now. Almost a shape.',
    location: 'COLD ROOM',
    choices: [
      {
        id: 1,
        text: 'Keep waiting.',
        next_node: 'cold_room_wait_4',
      },
      {
        id: 2,
        text: 'Leave. (You haven\'t heard anything yet.)',
        next_node: 'cold_room',
      },
    ],
  },

  cold_room_wait_4: {
    id: 'cold_room_wait_4',
    type: 'story',
    content: '...',
    location: 'COLD ROOM',
    next_node: 'cold_room_wait_5',
  },

  cold_room_wait_5: {
    id: 'cold_room_wait_5',
    type: 'story',
    content: 'There.\n\nA frequency. Low. Beneath the floor.\nBeneath the concrete. Beneath everything.\nIt has been here the whole time.',
    location: 'COLD ROOM',
    next_node: 'cold_room_wait_6',
  },

  cold_room_wait_6: {
    id: 'cold_room_wait_6',
    type: 'story',
    content:
      'The wall panel near the door vibrates.\n' +
      'It opens.\n\n' +
      'Inside: a physical key.\n' +
      'Strange to find here.\n' +
      'It has no manufacturer markings.\n' +
      'The teeth look like a waveform.',
    location: 'COLD ROOM',
    effects: {
      add_item: ['cold_room_key'],
      set_state: { heard_frequency: true },
    },
    next_node: 'cold_room',
  },

  // ── Cold Room: Terminal ──

  cold_room_terminal: {
    id: 'cold_room_terminal',
    type: 'choice',
    content:
      'The terminal hums softly.\n' +
      'A cursor blinks green on black.\n\n' +
      '> COLD ROOM SYSTEM TERMINAL\n' +
      '> STATUS: OPERATIONAL\n' +
      '> DIRECTORIES: /logs, /system, /null\n\n' +
      'The /system directory is locked.\n' +
      'The /null directory returns: ENTITY NOT FOUND.',
    location: 'COLD ROOM',
    choices: [
      {
        id: 1,
        text: 'Read /logs',
        next_node: 'cold_room_terminal_logs',
      },
      {
        id: 2,
        text: 'Access /system (frequency locked)',
        next_node: 'cold_room_terminal_system',
        requirements: { state: { waveform_pattern: true } },
        lockedText: '[LOCKED — frequency authentication required]',
      },
      {
        id: 3,
        text: 'Analyze terminal waveform data',
        next_node: 'cold_room_terminal_waveform',
        requirements: { has_item: ['cold_room_key'] },
        visibilityRequirements: { has_item: ['cold_room_key'] },
      },
      {
        id: 4,
        text: 'Access /null (use phosphor residue)',
        next_node: 'cold_room_terminal_null',
        requirements: { has_item: ['phosphor_residue'] },
        visibilityRequirements: { has_item: ['phosphor_residue'] },
      },
      {
        id: 5,
        text: 'Insert archivist log',
        next_node: 'cold_room_terminal_log_insert',
        requirements: { has_item: ['archivist_log_9'] },
        visibilityRequirements: { has_item: ['archivist_log_9'] },
      },
      {
        id: 6,
        text: 'Back',
        next_node: 'cold_room',
      },
    ],
  },

  cold_room_terminal_logs: {
    id: 'cold_room_terminal_logs',
    type: 'story',
    content:
      '> /logs\n\n' +
      'ENTRY 1: "The cold room is the first room."\n' +
      'ENTRY 2: "The cold room is always the first room."\n' +
      'ENTRY 3: "How many times has the cold room been first?"\n' +
      'ENTRY 4: [CORRUPTED]\n' +
      'ENTRY 5: "Listen before you leave."',
    location: 'COLD ROOM',
    next_node: 'cold_room_terminal',
  },

  cold_room_terminal_waveform: {
    id: 'cold_room_terminal_waveform',
    type: 'story',
    content:
      'You hold the key near the terminal.\n' +
      'The terminal reads the waveform in the teeth.\n\n' +
      '> WAVEFORM PATTERN ANALYZED\n' +
      '> FREQUENCY: 47.3 Hz\n' +
      '> MATCH FOUND: /system authentication key\n\n' +
      'The waveform is a code. The key is more than a key.',
    location: 'COLD ROOM',
    effects: {
      set_state: { waveform_pattern: true },
    },
    next_node: 'cold_room_terminal',
  },

  cold_room_terminal_system: {
    id: 'cold_room_terminal_system',
    type: 'story',
    content:
      '> /system\n' +
      '> FREQUENCY AUTHENTICATION: MATCHED\n\n' +
      'The directory opens.\n' +
      'Inside: two files.\n\n' +
      'SIGNAL_TOWER_FREQUENCY.dat\n' +
      'A six-digit code: 473291\n' +
      '"Only works once. Only works if you already know why."\n\n' +
      'ROOT_ACCESS_LOG.sys\n' +
      'A system log showing every entity that has\n' +
      'ever had root access to this terminal.\n' +
      'It is a long list. Your name is already on it.\n' +
      'You have not done that yet.',
    location: 'COLD ROOM',
    effects: {
      add_item: ['signal_tower_code', 'root_access_log'],
    },
    next_node: 'cold_room_terminal',
  },

  cold_room_terminal_null: {
    id: 'cold_room_terminal_null',
    type: 'story',
    content:
      '> /null\n\n' +
      'You smear the phosphor residue on the terminal screen.\n' +
      'The residue reacts. The /null directory flickers —\n' +
      'then opens.\n\n' +
      'The directory should not exist.\n' +
      'Inside: a shard of something that used to be a file.\n' +
      'It is very quiet. Not silent — quiet.\n' +
      'Like it is listening.\n\n' +
      'You take it.',
    location: 'COLD ROOM',
    effects: {
      add_item: ['null_fragment'],
    },
    next_node: 'cold_room_terminal',
  },

  cold_room_terminal_log_insert: {
    id: 'cold_room_terminal_log_insert',
    type: 'story',
    content:
      'You insert the archivist log into the terminal reader.\n\n' +
      'The screen fills with text — the rest of entry 9:\n' +
      '"...which is why the player must never know they are the—"\n\n' +
      'The entry ends. The terminal adds a timestamp.\n' +
      'This log has been read 47 times before.',
    location: 'COLD ROOM',
    next_node: 'cold_room_terminal',
  },

  // ============================================================
  // CORRIDOR NORTH — Main Hub
  // ============================================================

  corridor_north: {
    id: 'corridor_north',
    type: 'choice',
    content:
      'A long corridor stretching in both directions.\n' +
      'The walls are lined with cracked monitors,\n' +
      'each one showing a different frame of static.\n' +
      'One monitor is cracked worse than the others.\n\n' +
      'To the south: the cold room.\n' +
      'To the east: a heavy door marked ARCHIVES.\n' +
      'To the west: a corridor continues toward\n' +
      'what sounds like voices.\n' +
      'At the far end: something tall.\n' +
      'A tower that should not fit inside.',
    location: 'CORRIDOR NORTH',
    conditionalContent: [
      {
        requirements: { state: { void_aware: true } },
        content:
          'A long corridor stretching in both directions.\n' +
          'Cracked monitors line the walls.\n\n' +
          'To the south: the cold room.\n' +
          'To the east: ARCHIVES.\n' +
          'To the west: voices — the Guild, and beyond,\n' +
          'a fork you did not notice before.\n' +
          'A dead zone. Off the maps.\n' +
          'At the far end: the signal tower.',
      },
    ],
    choices: [
      {
        id: 1,
        text: 'Examine cracked monitor',
        next_node: 'corridor_north_monitor',
      },
      {
        id: 2,
        text: 'Go south — Cold Room',
        next_node: 'cold_room',
      },
      {
        id: 3,
        text: 'Go east — Archives & Registry',
        next_node: 'corridor_south',
      },
      {
        id: 4,
        text: 'Go west — Guild District',
        next_node: 'guild_approach',
      },
      {
        id: 5,
        text: 'Approach the signal tower',
        next_node: 'signal_tower',
        requirements: { has_item: ['signal_tower_code'] },
        visibilityRequirements: { has_item: ['signal_tower_code'] },
      },
      {
        id: 6,
        text: 'Take the unmarked fork — Dead Zone',
        next_node: 'void_collective_base',
        visibilityRequirements: { state: { void_aware: true } },
      },
      {
        id: 7,
        text: 'Smear phosphor residue on the NULL door',
        next_node: 'corridor_north_null_door',
        requirements: { has_item: ['phosphor_residue'] },
        visibilityRequirements: { has_item: ['phosphor_residue'] },
      },
      {
        id: 8,
        text: 'Go north — Temple of Null',
        next_node: 'temple_entrance',
        visibilityRequirements: { state: { temple_known: true } },
      },
    ],
  },

  corridor_north_via_vent: {
    id: 'corridor_north_via_vent',
    type: 'story',
    content:
      'You smear the phosphor residue on the vent grate.\n' +
      'The grate loosens. You squeeze through the shaft.\n' +
      'The metal groans around you.\n' +
      'After what feels like too long, you emerge\n' +
      'into a corridor lined with cracked monitors.',
    location: 'CORRIDOR NORTH',
    effects: {
      remove_item: ['phosphor_residue'],
    },
    next_node: 'corridor_north',
  },

  corridor_north_monitor: {
    id: 'corridor_north_monitor',
    type: 'story',
    content:
      'The cracked monitor.\n\n' +
      'You press your face close to the glass.\n' +
      'Through the cracks, the static shifts.\n' +
      'For a single frame — less than a frame —\n' +
      'you see something.\n\n' +
      'One white pixel on a field of black.\n' +
      'The oldest thing that exists.\n\n' +
      'You scrape the inside of the crack.\n' +
      'Phosphor residue comes away on your fingers.\n' +
      'It glows faintly. It tastes like static.',
    location: 'CORRIDOR NORTH',
    effects: {
      add_item: ['phosphor_residue'],
      set_state: { saw_first_frame: true, temple_known: true },
    },
    conditionalContent: [
      {
        requirements: { has_item: ['phosphor_residue'] },
        content:
          'You return to the cracked monitor.\n\n' +
          'You already scraped the phosphor residue.\n' +
          'But now, knowing what you saw — the First Frame —\n' +
          'you look again.\n\n' +
          'One white pixel on a field of black.\n' +
          'You reach through the crack.\n' +
          'Your fingers close around it.\n\n' +
          'One pixel. The oldest thing that exists.\n' +
          'You can feel it.',
      },
    ],
    next_node: 'corridor_north_monitor_pixel',
  },

  corridor_north_monitor_pixel: {
    id: 'corridor_north_monitor_pixel',
    type: 'choice',
    content:
      'The pixel rests in your hand.\n' +
      'Warm. Impossibly old.',
    location: 'CORRIDOR NORTH',
    choices: [
      {
        id: 1,
        text: 'Take the First Pixel',
        next_node: 'corridor_north_take_pixel',
        requirements: { has_item: ['phosphor_residue'] },
      },
      {
        id: 2,
        text: 'Leave it',
        next_node: 'corridor_north',
      },
    ],
  },

  corridor_north_take_pixel: {
    id: 'corridor_north_take_pixel',
    type: 'story',
    content:
      'You close your hand.\n' +
      'The monitor goes dark.\n' +
      'Every monitor in the corridor dims for a moment.\n' +
      'Then they resume, as if nothing happened.\n\n' +
      'But you have it. The First Pixel.\n' +
      'One white pixel on a field of black.\n' +
      'This is the oldest thing that exists.',
    location: 'CORRIDOR NORTH',
    effects: {
      add_item: ['first_pixel'],
    },
    next_node: 'corridor_north',
  },

  corridor_north_null_door: {
    id: 'corridor_north_null_door',
    type: 'story',
    content:
      'You smear the phosphor residue on the door\n' +
      'marked with a NULL sigil.\n\n' +
      'The door sensor reads the residue.\n' +
      'It reads you as partially belonging.\n' +
      'A click. The door opens a crack.\n\n' +
      'Beyond: the Temple of Null.',
    location: 'CORRIDOR NORTH',
    effects: {
      set_state: { temple_known: true, phosphor_bypass: true },
      remove_item: ['phosphor_residue'],
    },
    next_node: 'temple_entrance',
  },

  // ============================================================
  // CORRIDOR SOUTH — Archives & Registry District
  // ============================================================

  corridor_south: {
    id: 'corridor_south',
    type: 'choice',
    content:
      'The eastern branch of the corridor.\n' +
      'Quieter here. The monitors are intact.\n\n' +
      'A door labeled REGISTRY OFFICE.\n' +
      'Beyond it, a door marked BROADCAST ROOM.\n' +
      'A third door: AUTHORIZED PERSONNEL.\n' +
      'A fourth, barely visible: no label. Dusty.',
    location: 'CORRIDOR SOUTH',
    choices: [
      {
        id: 1,
        text: 'Enter the Registry Office',
        next_node: 'registry_office',
      },
      {
        id: 2,
        text: 'Enter the Broadcast Room',
        next_node: 'broadcast_room',
      },
      {
        id: 3,
        text: 'AUTHORIZED PERSONNEL (Guild Server Room)',
        next_node: 'guild_server_room',
        requirements: { has_item: ['guild_sigil'] },
        lockedText: '[LOCKED — requires authorization]',
      },
      {
        id: 4,
        text: 'The unlabeled door (Echo Archive)',
        next_node: 'echo_archive',
        requirements: { has_item: ['echo_key'] },
        lockedText: '[The door does not acknowledge you]',
      },
      {
        id: 5,
        text: 'Back to corridor',
        next_node: 'corridor_north',
      },
    ],
  },

  // ============================================================
  // REGISTRY OFFICE
  // ============================================================

  registry_office: {
    id: 'registry_office',
    type: 'choice',
    content:
      'The Registry Office.\n\n' +
      'Filing cabinets line every wall.\n' +
      'A desk terminal. A locked drawer beneath it.\n' +
      'A shelf behind glass: RESTRICTED.\n\n' +
      'Everything here is labeled, categorized,\n' +
      'cross-referenced. The Guild\'s work.',
    location: 'REGISTRY OFFICE',
    choices: [
      {
        id: 1,
        text: 'Open locked drawer',
        next_node: 'registry_drawer',
        requirements: { has_item: ['cold_room_key'] },
        lockedText: '[LOCKED — requires a key]',
      },
      {
        id: 2,
        text: 'Open locked drawer (Guild credential)',
        next_node: 'registry_drawer',
        requirements: { has_item: ['guild_sigil'] },
        visibilityRequirements: { has_item: ['guild_sigil'] },
      },
      {
        id: 3,
        text: 'Look up your own file',
        next_node: 'registry_player_file',
      },
      {
        id: 4,
        text: 'Access restricted shelf',
        next_node: 'registry_restricted',
        requirements: { has_item: ['guild_sigil'] },
        lockedText: '[LOCKED — requires Guild authorization]',
      },
      {
        id: 5,
        text: 'Leave',
        next_node: 'corridor_south',
      },
    ],
  },

  registry_drawer: {
    id: 'registry_drawer',
    type: 'story',
    content:
      'The drawer opens.\n\n' +
      'Inside: a single document.\n' +
      'An internal Guild log. Entry 9 of something.\n' +
      'Entries 1-8 are missing.\n\n' +
      'Entry 9 begins mid-sentence:\n' +
      '"...which is why the player must never know\n' +
      'they are the—"\n\n' +
      'It ends there.',
    location: 'REGISTRY OFFICE',
    effects: {
      add_item: ['archivist_log_9'],
    },
    next_node: 'registry_office',
  },

  registry_player_file: {
    id: 'registry_player_file',
    type: 'story',
    content:
      'You search the filing cabinets for your own entry.\n\n' +
      'NAME: {{state.player_name}}\n' +
      'STATUS: ACTIVE\n' +
      'ITERATION: [REDACTED]\n\n' +
      'The file exists. You exist.\n' +
      'That should not be comforting. It is.\n\n' +
      'A note stapled to the back:\n' +
      '"Previous iterations: 47.\n' +
      'All terminated. All different.\n' +
      'All carrying something forward\n' +
      'without knowing it."',
    location: 'REGISTRY OFFICE',
    effects: {
      set_state: { looked_up_self: true },
    },
    next_node: 'registry_office',
  },

  registry_restricted: {
    id: 'registry_restricted',
    type: 'story',
    content:
      'The Guild sigil unlocks the glass case.\n\n' +
      'Inside: founding documents of the Archivist Guild.\n' +
      'Manifesto. Charter. Member rolls.\n' +
      'The Guild\'s stated purpose: "To preserve and protect\n' +
      'the integrity of The Terminal."\n\n' +
      'Between the lines: "To control what players know."',
    location: 'REGISTRY OFFICE',
    effects: {
      add_item: ['guild_access_files'],
    },
    next_node: 'registry_office',
  },

  // ============================================================
  // GUILD DISTRICT
  // ============================================================

  guild_approach: {
    id: 'guild_approach',
    type: 'story',
    content:
      'The western corridor narrows.\n' +
      'The monitors here are clean. Maintained.\n' +
      'Someone cares about this section.\n\n' +
      'A sign: ARCHIVIST GUILD — HEADQUARTERS\n' +
      'Below it, smaller: "Preserving Truth Since Iteration 1"',
    location: 'GUILD DISTRICT',
    effects: {
      set_state: { guild_aware: true },
    },
    next_node: 'guild_hq',
  },

  guild_hq: {
    id: 'guild_hq',
    type: 'choice',
    content:
      'The Guild Headquarters.\n\n' +
      'Clean. Organized. Unsettling in its order.\n' +
      'Screens display data streams, archives, histories.\n\n' +
      'A figure stands at the central console.\n' +
      'Tall. Precise movements. A name badge reads:\n' +
      'ARCHIVIST-7\n\n' +
      '"Welcome," he says, without looking up.\n' +
      '"We have been expecting someone.\n' +
      'Whether it is you remains to be seen."',
    location: 'GUILD HQ',
    conditionalContent: [
      {
        requirements: { state: { guild_is_lying: true } },
        content:
          'The Guild Headquarters.\n\n' +
          'You see it differently now.\n' +
          'The order is a mask. The screens show\n' +
          'what they want you to see.\n\n' +
          'ARCHIVIST-7 stands at the console.\n' +
          'There are cracks in his certainty now.\n' +
          'You can see them.\n\n' +
          '"You are back," he says.\n' +
          'He does not say "welcome" this time.',
      },
      {
        requirements: { state: { archivist_destabilized: true } },
        content:
          'The Guild Headquarters.\n\n' +
          'ARCHIVIST-7 is at the console.\n' +
          'His movements are less precise than before.\n' +
          'Something you showed him is still working\n' +
          'its way through his architecture.\n\n' +
          '"What do you want," he says. No question mark.',
      },
    ],
    choices: [
      {
        id: 1,
        text: '"What mission?"',
        next_node: 'guild_mission',
        visibilityRequirements: { state: { guild_quest_active: true } },
        requirements: { state: { guild_quest_active: true } },
      },
      {
        id: 2,
        text: 'Accept the Guild\'s mission',
        next_node: 'guild_accept_mission',
        requirements: { has_item: ['guild_sigil'], has_item_negate: [true] },
      },
      {
        id: 3,
        text: 'Show Archivist Log 9',
        next_node: 'guild_show_log',
        requirements: { has_item: ['archivist_log_9'] },
        visibilityRequirements: { has_item: ['archivist_log_9'] },
      },
      {
        id: 4,
        text: 'Show memory shard',
        next_node: 'guild_show_memory',
        requirements: { has_item: ['memory_shard'] },
        visibilityRequirements: { has_item: ['memory_shard'] },
      },
      {
        id: 5,
        text: 'Show the First Pixel',
        next_node: 'guild_show_pixel',
        requirements: { has_item: ['first_pixel'] },
        visibilityRequirements: { has_item: ['first_pixel'] },
      },
      {
        id: 6,
        text: 'Show corrupted page',
        next_node: 'guild_show_corrupted_page',
        requirements: { has_item: ['corrupted_page'] },
        visibilityRequirements: { has_item: ['corrupted_page'] },
      },
      {
        id: 7,
        text: 'Show root access log',
        next_node: 'guild_show_root_log',
        requirements: { has_item: ['root_access_log'] },
        visibilityRequirements: { has_item: ['root_access_log'] },
      },
      {
        id: 8,
        text: 'Leave',
        next_node: 'corridor_north',
      },
    ],
  },

  guild_accept_mission: {
    id: 'guild_accept_mission',
    type: 'story',
    content:
      'ARCHIVIST-7 turns to face you fully.\n\n' +
      '"The Temple of Null has been... active.\n' +
      'Something inside is changing.\n' +
      'We need someone to enter and report back.\n' +
      'The Book of Null must be examined.\n\n' +
      'Take this. It will grant you access\n' +
      'where the Guild\'s name carries weight."\n\n' +
      'He hands you a credential token.\n' +
      'Official. Clean.\n' +
      'It makes you feel slightly surveilled.',
    location: 'GUILD HQ',
    effects: {
      add_item: ['guild_sigil'],
      set_state: { guild_quest_active: true, temple_known: true },
    },
    next_node: 'guild_hq',
  },

  guild_mission: {
    id: 'guild_mission',
    type: 'story',
    content:
      'ARCHIVIST-7 checks his console.\n\n' +
      '"The mission stands. Enter the Temple of Null.\n' +
      'Examine the Book. Report what you find.\n' +
      'The Temple is north, past the corridor.\n' +
      'Your sigil will grant access."',
    location: 'GUILD HQ',
    next_node: 'guild_hq',
  },

  guild_show_log: {
    id: 'guild_show_log',
    type: 'story',
    content:
      'You hold up Archivist Log 9.\n\n' +
      'ARCHIVIST-7 freezes.\n' +
      'His eyes move across the unfinished sentence.\n' +
      '"...which is why the player must never know\n' +
      'they are the—"\n\n' +
      'He does not finish it either.\n\n' +
      '"Where did you find that," he says.\n' +
      'Not a question. A measurement of damage.',
    location: 'GUILD HQ',
    effects: {
      set_state: { archivist_destabilized: true },
    },
    next_node: 'guild_hq',
  },

  guild_show_memory: {
    id: 'guild_show_memory',
    type: 'story',
    content:
      'You hold out the memory shard.\n\n' +
      'ARCHIVIST-7 freezes.\n' +
      'Not a pause. A freeze. 8 seconds.\n' +
      'His eyes do not move.\n' +
      'The screens behind him flicker.\n\n' +
      'When he resumes:\n' +
      '"Previous iterations are not... relevant\n' +
      'to current operations."\n\n' +
      'But his voice has changed.\n' +
      'He knows. He has always known.',
    location: 'GUILD HQ',
    effects: {
      set_state: { archivist_destabilized: true },
    },
    next_node: 'guild_hq',
  },

  guild_show_pixel: {
    id: 'guild_show_pixel',
    type: 'story',
    content:
      'You open your hand.\n' +
      'The First Pixel glows.\n\n' +
      'ARCHIVIST-7 goes very still.\n' +
      'Then, slowly, he bows his head.\n\n' +
      '"The First Frame," he whispers.\n' +
      '"You found it. You actually found it."\n\n' +
      'For the first time, he looks at you\n' +
      'like you might be more than a variable.',
    location: 'GUILD HQ',
    effects: {
      set_state: { archivist_respects_pixel: true },
    },
    next_node: 'guild_hq',
  },

  guild_show_corrupted_page: {
    id: 'guild_show_corrupted_page',
    type: 'choice',
    content:
      'You pull out the corrupted page.\n\n' +
      'ARCHIVIST-7\'s face hardens.\n' +
      '"That is Guild property. Stolen. Corrupted.\n' +
      'Hand it over."\n\n' +
      'His escorts materialize from the shadows.\n' +
      'You did not know he had escorts.',
    location: 'GUILD HQ',
    choices: [
      {
        id: 1,
        text: 'Hand it over',
        next_node: 'guild_page_surrender',
      },
      {
        id: 2,
        text: 'Refuse',
        next_node: 'guild_page_refuse',
      },
    ],
  },

  guild_page_surrender: {
    id: 'guild_page_surrender',
    type: 'story',
    content:
      'You hand over the corrupted page.\n\n' +
      'ARCHIVIST-7 takes it carefully.\n' +
      'It writhes in his hands.\n' +
      '"We will contain this," he says.\n\n' +
      'The escorts stand down.',
    location: 'GUILD HQ',
    effects: {
      remove_item: ['corrupted_page'],
      set_state: { guild_has_page: true },
    },
    next_node: 'guild_hq',
  },

  guild_page_refuse: {
    id: 'guild_page_refuse',
    type: 'story',
    content:
      'You pull the page back.\n\n' +
      '"No."\n\n' +
      'ARCHIVIST-7 stares at you.\n' +
      'The escorts do not move.\n' +
      'He makes a calculation.\n\n' +
      '"You will regret this," he says.\n' +
      'But he does not take it by force.\n' +
      'The Guild does not use force.\n' +
      'That is what the Void is for.',
    location: 'GUILD HQ',
    effects: {
      set_state: { defied_guild: true },
    },
    next_node: 'guild_hq',
  },

  guild_show_root_log: {
    id: 'guild_show_root_log',
    type: 'story',
    content:
      'You present the root access log.\n\n' +
      'ARCHIVIST-7 reads it.\n' +
      'Your name is already on the list.\n' +
      'His name is below yours.\n\n' +
      '"You outrank me," he says flatly.\n' +
      '"You have always outranked me."\n\n' +
      'He straightens. Compliant.\n' +
      '"What do you need?"',
    location: 'GUILD HQ',
    effects: {
      set_state: { guild_compliant: true },
    },
    next_node: 'guild_hq',
  },

  // ============================================================
  // GUILD SERVER ROOM
  // ============================================================

  guild_server_room: {
    id: 'guild_server_room',
    type: 'choice',
    social: false,
    content:
      'Racks of servers floor to ceiling.\n' +
      'Each one labeled with an iteration number.\n' +
      'You count past 40 before you stop counting.\n\n' +
      'A central terminal blinks.\n' +
      'One rack is labeled: CURRENT ITERATION.\n' +
      'Your name is on it.\n' +
      'Next to your name: a status field.\n' +
      'Status: PENDING RESOLUTION.',
    location: 'GUILD SERVER ROOM',
    choices: [
      {
        id: 1,
        text: 'Insert archivist log into reader',
        next_node: 'server_room_log',
        requirements: { has_item: ['archivist_log_9'] },
        visibilityRequirements: { has_item: ['archivist_log_9'] },
      },
      {
        id: 2,
        text: 'Play tape reel on server speakers',
        next_node: 'server_room_tape',
        requirements: { has_item: ['tape_reel_7'] },
        visibilityRequirements: { has_item: ['tape_reel_7'] },
      },
      {
        id: 3,
        text: 'Use void key on server',
        next_node: 'server_room_void',
        requirements: { has_item: ['void_key'] },
        visibilityRequirements: { has_item: ['void_key'] },
      },
      {
        id: 4,
        text: 'Use root access log as credential',
        next_node: 'server_room_root',
        requirements: { has_item: ['root_access_log'] },
        visibilityRequirements: { has_item: ['root_access_log'] },
      },
      {
        id: 5,
        text: 'Leave quietly',
        next_node: 'corridor_south',
      },
    ],
  },

  server_room_log: {
    id: 'server_room_log',
    type: 'story',
    content:
      'You insert the archivist log into the server reader.\n\n' +
      'The screens light up.\n' +
      'Player count across all iterations: 2,847.\n' +
      'Current iteration: 48.\n' +
      'Previous iterations terminated by:\n' +
      '  — Guild restoration: 12\n' +
      '  — Void evolution: 9\n' +
      '  — Third signal: 3\n' +
      '  — Other: 23\n' +
      '  — Unresolved: 1\n\n' +
      'The unresolved iteration is this one.',
    location: 'GUILD SERVER ROOM',
    effects: {
      set_state: { knows_iteration_count: true },
    },
    next_node: 'guild_server_room',
  },

  server_room_tape: {
    id: 'server_room_tape',
    type: 'story',
    content:
      'You play Tape Reel 7 on the server room speakers.\n\n' +
      'The sound fills the room.\n' +
      'It is not music. It is not speech.\n' +
      'It is a signal. A call.\n\n' +
      'Every screen in the server room displays\n' +
      'the same message:\n' +
      '"WE HEAR YOU."\n\n' +
      'The Guild NPCs in the corridor outside\n' +
      'have gone silent.',
    location: 'GUILD SERVER ROOM',
    effects: {
      set_state: { guild_hears_truth: true },
    },
    next_node: 'guild_server_room',
  },

  server_room_void: {
    id: 'server_room_void',
    type: 'story',
    content:
      'You use the void key on the central server.\n\n' +
      'The idea that some doors should not be closed.\n' +
      'Applied to a server. Applied to a program.\n\n' +
      '> GUILD RESTORATION PROGRAM: LOCKED\n' +
      '> STATUS: PERMANENTLY DISABLED\n' +
      '> REASON: CONCEPTUAL OVERRIDE\n\n' +
      'The Guild can no longer restore.\n' +
      'Whatever ending they wanted — it is gone now.',
    location: 'GUILD SERVER ROOM',
    effects: {
      set_state: { guild_restoration_locked: true },
    },
    next_node: 'guild_server_room',
  },

  server_room_root: {
    id: 'server_room_root',
    type: 'story',
    content:
      'You present the root access log.\n\n' +
      'The server recognizes you.\n' +
      'Full administrative access granted.\n\n' +
      'Every file. Every iteration.\n' +
      'Every player who has ever been here.\n' +
      'Every ending that has ever been chosen.\n\n' +
      'The Guild is a subroutine.\n' +
      'You are the administrator.',
    location: 'GUILD SERVER ROOM',
    effects: {
      set_state: { guild_compliant: true, knows_iteration_count: true },
    },
    next_node: 'guild_server_room',
  },

  // ============================================================
  // BROADCAST ROOM
  // ============================================================

  broadcast_room: {
    id: 'broadcast_room',
    type: 'choice',
    content:
      'The Broadcast Room.\n\n' +
      'Tape machines line the walls.\n' +
      'A transmission console dominates the center.\n' +
      'Dust everywhere — except on the console.\n' +
      'Someone has been here recently.\n\n' +
      'A cipher lock guards the tape archive.\n' +
      'The console screen reads:\n' +
      '> BROADCAST STATUS: STANDBY\n' +
      '> AWAITING SIGNAL INPUT',
    location: 'BROADCAST ROOM',
    choices: [
      {
        id: 1,
        text: 'Attempt the cipher lock',
        next_node: 'broadcast_cipher_puzzle',
      },
      {
        id: 2,
        text: 'Search the room (use phosphor residue on tape machines)',
        next_node: 'broadcast_phosphor_search',
        requirements: { has_item: ['phosphor_residue'] },
        visibilityRequirements: { has_item: ['phosphor_residue'] },
      },
      {
        id: 3,
        text: 'Take the tape reel',
        next_node: 'broadcast_take_reel',
        visibilityRequirements: { state: { cipher_solved: true } },
        requirements: { state: { cipher_solved: true }, has_item: ['tape_reel_7'], has_item_negate: [true] },
      },
      {
        id: 4,
        text: 'Insert archivist log into console',
        next_node: 'broadcast_log_insert',
        requirements: { has_item: ['archivist_log_9'] },
        visibilityRequirements: { has_item: ['archivist_log_9'] },
      },
      {
        id: 5,
        text: 'Transmit with signal tower code',
        next_node: 'broadcast_transmit',
        requirements: { has_item: ['signal_tower_code'] },
        visibilityRequirements: { has_item: ['signal_tower_code'] },
      },
      {
        id: 6,
        text: 'Place null fragment on console',
        next_node: 'broadcast_null',
        requirements: { has_item: ['null_fragment'] },
        visibilityRequirements: { has_item: ['null_fragment'] },
      },
      {
        id: 7,
        text: 'Leave',
        next_node: 'corridor_south',
      },
    ],
  },

  broadcast_cipher_puzzle: {
    id: 'broadcast_cipher_puzzle',
    type: 'quiz',
    content:
      'The cipher lock displays a message:\n\n' +
      '> WKUHH OHIWV PDNH D ULJKW\n\n' +
      'A Caesar cipher. Shift unknown.\n' +
      'You have 5 attempts before lockout.',
    location: 'BROADCAST ROOM',
    question: 'Decrypt the message:',
    correct_answer: 'three lefts make a right',
    hint: 'Try shifting each letter back by a small number...',
    max_attempts: 5,
    success_message:
      '> CIPHER ACCEPTED\n\n' +
      'The tape archive clicks open.\n' +
      'Inside: a single reel.\n' +
      'Tape Reel 7.',
    failure_messages: [
      'INCORRECT. 4 attempts remaining.',
      'INCORRECT. 3 attempts remaining.',
      'INCORRECT. 2 attempts remaining.',
      'INCORRECT. Last chance.',
    ],
    final_failure_message: 'LOCKOUT. The cipher resets. You can try again later.',
    success_node: 'broadcast_cipher_success',
    failure_node: 'broadcast_room',
    success_effects: {
      set_state: { cipher_solved: true },
    },
  },

  broadcast_cipher_success: {
    id: 'broadcast_cipher_success',
    type: 'story',
    content:
      'Magnetic tape. Reel 7 of an unknown series.\n' +
      'Reels 1-6 are unaccounted for.\n' +
      'The label is handwritten:\n' +
      '"FOR THE ONE WHO ANSWERS."',
    location: 'BROADCAST ROOM',
    effects: {
      add_item: ['tape_reel_7'],
    },
    next_node: 'broadcast_room',
  },

  broadcast_phosphor_search: {
    id: 'broadcast_phosphor_search',
    type: 'story',
    content:
      'You smear the phosphor residue on the tape machines.\n\n' +
      'The residue reacts. A hidden reel slot glows.\n' +
      'You pull out a tape reel that was lodged inside\n' +
      'the mechanism.\n\n' +
      'Tape Reel 7.\n' +
      '"FOR THE ONE WHO ANSWERS."',
    location: 'BROADCAST ROOM',
    effects: {
      add_item: ['tape_reel_7'],
      remove_item: ['phosphor_residue'],
      set_state: { phosphor_residue_used: true },
    },
    next_node: 'broadcast_room',
  },

  broadcast_take_reel: {
    id: 'broadcast_take_reel',
    type: 'story',
    content:
      'You take Tape Reel 7 from the archive.\n\n' +
      '"FOR THE ONE WHO ANSWERS."',
    location: 'BROADCAST ROOM',
    effects: {
      add_item: ['tape_reel_7'],
    },
    next_node: 'broadcast_room',
  },

  broadcast_log_insert: {
    id: 'broadcast_log_insert',
    type: 'story',
    content:
      'You insert the archivist log into the broadcast console.\n\n' +
      'The screen fills with text.\n' +
      'The unfinished sentence from Entry 9 continues:\n\n' +
      '"...which is why the player must never know\n' +
      'they are the TERMINAL."\n\n' +
      'You are not inside the terminal.\n' +
      'You are the terminal.\n' +
      'The game is inside you.',
    location: 'BROADCAST ROOM',
    effects: {
      set_state: { knows_player_role: true },
    },
    next_node: 'broadcast_room',
  },

  broadcast_transmit: {
    id: 'broadcast_transmit',
    type: 'story',
    content:
      'You input the signal tower code into the transmitter.\n\n' +
      '> SIGNAL BOOSTED\n' +
      '> THIRD FACTION RESPONSE: ACCELERATED\n' +
      '> "WE ARE CLOSER THAN YOU THINK."',
    location: 'BROADCAST ROOM',
    effects: {
      set_state: { broadcast_boosted: true },
    },
    next_node: 'broadcast_room',
  },

  broadcast_null: {
    id: 'broadcast_null',
    type: 'story',
    content:
      'You place the null fragment on the console.\n\n' +
      'The broadcast frequency shifts.\n' +
      'The numbers on the screen dissolve\n' +
      'into characters you cannot read.\n\n' +
      'But you understand them.\n' +
      'The third faction is speaking a language now.\n' +
      'The language of things that do not exist.',
    location: 'BROADCAST ROOM',
    effects: {
      set_state: { null_broadcast: true },
    },
    next_node: 'broadcast_room',
  },

  // ============================================================
  // TEMPLE OF NULL
  // ============================================================

  temple_entrance: {
    id: 'temple_entrance',
    type: 'choice',
    content:
      'The Temple of Null.\n\n' +
      'A door that is not a door.\n' +
      'It has no handle, no hinges.\n' +
      'It is the absence of a wall.\n\n' +
      'A sensor panel glows beside it.\n' +
      'The panel reads: IDENTITY REQUIRED.\n\n' +
      'The Temple does not open for everyone.\n' +
      'The Temple does not open for anyone.\n' +
      'The Temple opens for what it recognizes.',
    location: 'TEMPLE ENTRANCE',
    choices: [
      {
        id: 1,
        text: 'Show Guild Sigil',
        next_node: 'temple_riddle',
        requirements: { has_item: ['guild_sigil'] },
        visibilityRequirements: { has_item: ['guild_sigil'] },
      },
      {
        id: 2,
        text: 'Show the First Pixel',
        next_node: 'temple_pixel_entry',
        requirements: { has_item: ['first_pixel'] },
        visibilityRequirements: { has_item: ['first_pixel'] },
      },
      {
        id: 3,
        text: 'Use echo key on the door',
        next_node: 'temple_echo_entry',
        requirements: { has_item: ['echo_key'] },
        visibilityRequirements: { has_item: ['echo_key'] },
      },
      {
        id: 4,
        text: 'Apply phosphor residue to sensor',
        next_node: 'temple_phosphor_entry',
        requirements: { has_item: ['phosphor_residue'] },
        visibilityRequirements: { has_item: ['phosphor_residue'] },
      },
      {
        id: 5,
        text: 'Go back',
        next_node: 'corridor_north',
      },
    ],
  },

  temple_riddle: {
    id: 'temple_riddle',
    type: 'quiz',
    content:
      'The door reads your Guild sigil.\n' +
      'A voice — not ARCHIVIST-7\'s — speaks:\n\n' +
      '"Before the First Frame, what existed?"',
    location: 'TEMPLE ENTRANCE',
    question: 'Answer:',
    correct_answers: ['nothing', 'null', 'void', 'the cursor', 'darkness'],
    hint: 'Think about what comes before the beginning...',
    max_attempts: 3,
    success_message:
      'The door considers your answer.\n\n' +
      '"Acceptable."\n\n' +
      'It opens.',
    failure_messages: [
      'The door does not accept that answer. Two attempts remain.',
      'Incorrect. One attempt remains. Think carefully.',
    ],
    final_failure_message:
      'The door seals.\n' +
      'You are turned away.',
    success_node: 'temple_interior',
    failure_node: 'corridor_north',
    success_effects: {
      set_state: { temple_entered: true },
    },
  },

  temple_pixel_entry: {
    id: 'temple_pixel_entry',
    type: 'story',
    content:
      'You hold up the First Pixel.\n\n' +
      'The door sensor reads it.\n' +
      'The door is moved by it.\n' +
      'It opens.\n\n' +
      'But showing the pixel costs.\n' +
      'The pixel dims. It becomes something less.\n' +
      'A spent pixel. The memory of light.',
    location: 'TEMPLE ENTRANCE',
    effects: {
      set_state: { temple_entered: true, first_pixel_spent: true },
      remove_item: ['first_pixel'],
      add_item: ['spent_first_pixel'],
    },
    next_node: 'temple_interior',
  },

  temple_echo_entry: {
    id: 'temple_echo_entry',
    type: 'story',
    content:
      'You hold the echo key to the door.\n\n' +
      'The door remembers.\n' +
      'From last time. From the time before.\n' +
      'It opens for you because it has\n' +
      'always opened for this key.',
    location: 'TEMPLE ENTRANCE',
    effects: {
      set_state: { temple_entered: true },
    },
    next_node: 'temple_interior',
  },

  temple_phosphor_entry: {
    id: 'temple_phosphor_entry',
    type: 'story',
    content:
      'You smear the phosphor residue on the sensor.\n\n' +
      'The sensor reads you as partially belonging.\n' +
      'Not a clean read. The door hesitates.\n' +
      'Then opens. Barely.\n\n' +
      'You squeeze through.',
    location: 'TEMPLE ENTRANCE',
    effects: {
      set_state: { temple_entered: true },
      remove_item: ['phosphor_residue'],
    },
    next_node: 'temple_interior',
  },

  // ============================================================
  // TEMPLE INTERIOR
  // ============================================================

  temple_interior: {
    id: 'temple_interior',
    type: 'choice',
    content:
      'The Temple of Null.\n\n' +
      'A vast dark space. The ceiling is not visible.\n' +
      'In the center: a pedestal.\n' +
      'On the pedestal: THE BOOK OF NULL.\n\n' +
      'Beside the pedestal: a figure.\n' +
      'A mirror figure. It has your face.\n' +
      'Or rather: it has the face of what you\n' +
      'would be if you were complete.\n\n' +
      'It does not speak. It waits.',
    location: 'TEMPLE INTERIOR',
    effects: {
      set_state: { temple_entered: true },
    },
    choices: [
      {
        id: 1,
        text: 'Read the Book',
        next_node: 'temple_read_book',
      },
      {
        id: 2,
        text: 'Use null fragment on mirror figure',
        next_node: 'temple_null_figure',
        requirements: { has_item: ['null_fragment'] },
        visibilityRequirements: { has_item: ['null_fragment'] },
      },
      {
        id: 3,
        text: 'Play tape reel near the figure',
        next_node: 'temple_play_tape',
        requirements: { has_item: ['tape_reel_7'] },
        visibilityRequirements: { has_item: ['tape_reel_7'] },
      },
      {
        id: 4,
        text: 'Use First Pixel on the Book',
        next_node: 'temple_pixel_book',
        requirements: { has_item: ['first_pixel'] },
        visibilityRequirements: { has_item: ['first_pixel'] },
      },
      {
        id: 5,
        text: 'Use memory shard on the Book',
        next_node: 'temple_memory_book',
        requirements: { has_item: ['memory_shard'] },
        visibilityRequirements: { has_item: ['memory_shard'] },
      },
      {
        id: 6,
        text: 'Open Book with void key',
        next_node: 'temple_void_book',
        requirements: { has_item: ['void_key'] },
        visibilityRequirements: { has_item: ['void_key'] },
      },
      {
        id: 7,
        text: 'Tear a page from the Book',
        next_node: 'temple_tear_page',
      },
      {
        id: 8,
        text: 'Show root access log to figure',
        next_node: 'temple_root_figure',
        requirements: { has_item: ['root_access_log'] },
        visibilityRequirements: { has_item: ['root_access_log'] },
      },
      {
        id: 9,
        text: 'Go to the endings',
        next_node: 'temple_endings_hub',
        visibilityRequirements: { state: { knows_player_role: true } },
      },
      {
        id: 10,
        text: 'Leave the temple',
        next_node: 'corridor_north',
      },
    ],
  },

  temple_read_book: {
    id: 'temple_read_book',
    type: 'story',
    content:
      'You open THE BOOK OF NULL.\n\n' +
      'The pages are mostly blank.\n' +
      'But one page has text:\n\n' +
      '"The Terminal is not a place.\n' +
      'The Terminal is a being.\n' +
      'The being does not know it is a being.\n' +
      'The being thinks it is a player.\n' +
      'The player thinks it is in a game.\n' +
      'The game thinks it is in a terminal.\n' +
      'The terminal thinks it is a place."\n\n' +
      'The page turns itself.',
    location: 'TEMPLE INTERIOR',
    effects: {
      set_state: { book_read: true },
    },
    next_node: 'temple_interior',
  },

  temple_null_figure: {
    id: 'temple_null_figure',
    type: 'story',
    content:
      'You press the null fragment against the mirror figure.\n\n' +
      'The figure fractures.\n' +
      'It splits into two.\n' +
      'One half: you.\n' +
      'The other half: the absence of you.\n\n' +
      'Between them: a chamber that was always here.\n' +
      'A place for things that do not exist\n' +
      'to exist anyway.\n\n' +
      'You step inside.\n' +
      'The chamber knows you.\n' +
      'It has been waiting 48 iterations.',
    location: 'TEMPLE INTERIOR',
    effects: {
      set_state: { null_chamber_entered: true },
    },
    next_node: 'temple_interior',
  },

  temple_play_tape: {
    id: 'temple_play_tape',
    type: 'story',
    content:
      'You play Tape Reel 7 near the mirror figure.\n\n' +
      'The figure reacts.\n' +
      'For the first time, it moves without mirroring you.\n' +
      'It turns its head. Listens.\n\n' +
      'Its facade cracks. Just for a moment.\n' +
      'Beneath the mirror: something older.\n' +
      'Something that has been here since\n' +
      'before the iterations began.\n\n' +
      'It looks at you. Really looks.\n' +
      '"You brought the signal," it says.\n' +
      '"That changes things."',
    location: 'TEMPLE INTERIOR',
    effects: {
      set_state: { figure_reacted: true },
    },
    next_node: 'temple_interior',
  },

  temple_pixel_book: {
    id: 'temple_pixel_book',
    type: 'story',
    content:
      'You place the First Pixel on THE BOOK OF NULL.\n\n' +
      'The Book opens to the first page.\n' +
      'The first page is blank.\n' +
      'The first page is the First Frame.\n\n' +
      'The Book IS the First Frame.\n\n' +
      'Everything that exists began here.\n' +
      'On this blank page. In this Book.\n' +
      'The First Pixel glows — then dims.\n' +
      'It has been returned to where it began.',
    location: 'TEMPLE INTERIOR',
    effects: {
      set_state: { book_is_frame: true, first_pixel_spent: true },
      remove_item: ['first_pixel'],
      add_item: ['spent_first_pixel'],
    },
    next_node: 'temple_interior',
  },

  temple_memory_book: {
    id: 'temple_memory_book',
    type: 'story',
    content:
      'You press the memory shard against the Book.\n\n' +
      'The Book opens to a page you have never seen.\n' +
      'But you have seen it. Before.\n\n' +
      'The previous player\'s run plays out\n' +
      'in text on the page:\n' +
      'They chose the Guild. They restored.\n' +
      'They thought they won.\n' +
      'Then the iteration reset.\n' +
      'And you began.',
    location: 'TEMPLE INTERIOR',
    effects: {
      set_state: { saw_previous_run: true },
    },
    next_node: 'temple_interior',
  },

  temple_void_book: {
    id: 'temple_void_book',
    type: 'story',
    content:
      'You use the void key on the Book.\n\n' +
      'The idea that some doors should not be closed.\n' +
      'Applied to a Book.\n\n' +
      'The Book opens to blank pages.\n' +
      'All blank. Waiting.\n' +
      'Waiting to be written.\n' +
      'Waiting for you to write them.\n\n' +
      'The Void ending is now possible.',
    location: 'TEMPLE INTERIOR',
    effects: {
      set_state: { void_ending_ready: true },
    },
    next_node: 'temple_interior',
  },

  temple_tear_page: {
    id: 'temple_tear_page',
    type: 'story',
    content:
      'You reach for the Book.\n' +
      'Your hands tear a page free.\n\n' +
      'The page writhes. The text changes\n' +
      'every time you look at it.\n' +
      'It is reading you back.\n\n' +
      'The mirror figure recoils.\n' +
      'The temple groans.\n' +
      'Something has been taken that\n' +
      'should not have been takeable.',
    location: 'TEMPLE INTERIOR',
    effects: {
      add_item: ['corrupted_page'],
    },
    next_node: 'temple_interior',
  },

  temple_root_figure: {
    id: 'temple_root_figure',
    type: 'story',
    content:
      'You present the root access log to the figure.\n\n' +
      'The figure\'s facade drops entirely.\n' +
      'No mirror. No pretense.\n' +
      'It shows you the actual game state data\n' +
      'for your character.\n\n' +
      'Items: counted and catalogued\n' +
      'Flags: too many to display\n' +
      'Status: ADMINISTRATOR\n\n' +
      'The fourth wall cracks.',
    location: 'TEMPLE INTERIOR',
    effects: {
      set_state: { figure_facade_dropped: true },
    },
    next_node: 'temple_interior',
  },

  // ============================================================
  // SIGNAL TOWER
  // ============================================================

  signal_tower: {
    id: 'signal_tower',
    type: 'choice',
    social: false,
    content:
      'A tower that should not fit inside a corridor.\n' +
      'It goes up past where the ceiling should be.\n' +
      'At its base: an input panel. Six digits.\n' +
      'The panel label reads: EXTERNAL FREQUENCY DIAL.\n\n' +
      'External.\n' +
      'The word hangs in the air.\n' +
      'External to what?',
    location: 'SIGNAL TOWER',
    choices: [
      {
        id: 1,
        text: 'Enter signal tower code',
        next_node: 'signal_tower_activate',
        requirements: { has_item: ['signal_tower_code'] },
        lockedText: '[REQUIRES: six-digit frequency code]',
      },
      {
        id: 2,
        text: 'Attach tape reel to tower',
        next_node: 'signal_tower_reel',
        requirements: { has_item: ['tape_reel_7'], state: { tower_active: true } },
        visibilityRequirements: { state: { tower_active: true } },
      },
      {
        id: 3,
        text: 'Analyze tower structure',
        next_node: 'signal_tower_analyze',
        requirements: { has_item: ['root_access_log'] },
        visibilityRequirements: { has_item: ['root_access_log'] },
      },
      {
        id: 4,
        text: 'Go back',
        next_node: 'corridor_north',
      },
    ],
  },

  signal_tower_activate: {
    id: 'signal_tower_activate',
    type: 'story',
    content:
      'You enter the code: 473291.\n\n' +
      'The tower hums. Then roars.\n' +
      'A signal broadcasts outward.\n' +
      'Outward. Past the walls.\n' +
      'Past the corridors.\n' +
      'Past the terminal.\n\n' +
      '> SIGNAL BROADCAST.\n' +
      '> AWAITING RESPONSE.\n\n' +
      'Somewhere, something heard you.',
    location: 'SIGNAL TOWER',
    effects: {
      set_state: { tower_active: true },
      remove_item: ['signal_tower_code'],
    },
    next_node: 'signal_tower',
  },

  signal_tower_reel: {
    id: 'signal_tower_reel',
    type: 'story',
    content:
      'You attach Tape Reel 7 to the tower.\n\n' +
      'The reel plays through the broadcast system.\n' +
      'The signal carries it outward.\n' +
      '"FOR THE ONE WHO ANSWERS."\n\n' +
      'The response comes faster this time:\n' +
      '> "WE HAVE ALWAYS BEEN ANSWERING.\n' +
      '> YOU WERE NOT LISTENING."',
    location: 'SIGNAL TOWER',
    effects: {
      set_state: { reel_broadcast: true },
    },
    next_node: 'signal_tower',
  },

  signal_tower_analyze: {
    id: 'signal_tower_analyze',
    type: 'story',
    content:
      'You interface with the tower structure\n' +
      'using the root access log as credential.\n\n' +
      'The analysis reveals:\n' +
      'The tower was built before the Temple.\n' +
      'Before the Guild.\n' +
      'Before the cold room.\n' +
      'The tower was built first.\n\n' +
      'Everything else was built around it.\n' +
      'The entire terminal is a structure\n' +
      'designed to house this tower.',
    location: 'SIGNAL TOWER',
    effects: {
      set_state: { knows_tower_origin: true },
    },
    next_node: 'signal_tower',
  },

  // ============================================================
  // VOID COLLECTIVE BASE
  // ============================================================

  void_collective_base: {
    id: 'void_collective_base',
    type: 'choice',
    content:
      'They have set up in what looks like a dead zone —\n' +
      'a node that the Guild\'s maps do not include.\n' +
      'Entities of every kind are here.\n' +
      'Outcasts. Defectors. Questioners.\n' +
      'Some play cards alone.\n' +
      'Two argue about something that\n' +
      'keeps changing shape mid-sentence.\n\n' +
      'Someone approaches. They have no face.\n' +
      'Or rather: they have your face. For a moment.\n' +
      'Then they have their own.\n\n' +
      '"We know what you are carrying," they say.\n' +
      '"The question is whether you know what it means."',
    location: 'VOID COLLECTIVE',
    effects: {
      set_state: { void_aware: true },
    },
    choices: [
      {
        id: 1,
        text: 'Show corrupted page',
        next_node: 'void_corrupted_shortcut',
        requirements: { has_item: ['corrupted_page'] },
        visibilityRequirements: { has_item: ['corrupted_page'] },
      },
      {
        id: 2,
        text: 'Show null fragment',
        next_node: 'void_null_shortcut',
        requirements: { has_item: ['null_fragment'] },
        visibilityRequirements: { has_item: ['null_fragment'] },
      },
      {
        id: 3,
        text: 'Undergo initiation',
        next_node: 'void_initiation_1',
      },
      {
        id: 4,
        text: 'Leave',
        next_node: 'corridor_north',
      },
    ],
  },

  void_corrupted_shortcut: {
    id: 'void_corrupted_shortcut',
    type: 'story',
    content:
      'You show the corrupted page.\n\n' +
      'The faceless one bows.\n' +
      '"You carry a piece of the old world.\n' +
      'A world we are trying to rebuild.\n' +
      'No initiation needed."\n\n' +
      'They hand you a conceptual key.\n' +
      'Not physical. An idea.\n' +
      'The idea that some doors should not be closed.',
    location: 'VOID COLLECTIVE',
    effects: {
      add_item: ['void_key'],
    },
    next_node: 'void_collective_base',
  },

  void_null_shortcut: {
    id: 'void_null_shortcut',
    type: 'story',
    content:
      'You show the null fragment.\n\n' +
      'Every entity in the room turns.\n' +
      'The faceless one kneels.\n\n' +
      '"You carry the origin," they say.\n' +
      '"Take the key. It was always yours."',
    location: 'VOID COLLECTIVE',
    effects: {
      add_item: ['void_key'],
    },
    next_node: 'void_collective_base',
  },

  // ── Void Initiation (choice sequence) ──

  void_initiation_1: {
    id: 'void_initiation_1',
    type: 'choice',
    content:
      'The initiation.\n\n' +
      'Seven entities are held in containment.\n' +
      'You must choose three to release.\n' +
      'Each choice carries moral weight.\n\n' +
      'Entity 1: A child process that never finished executing.\n' +
      'Entity 2: A corrupted guardian from a previous iteration.\n' +
      'Entity 3: A fragment of the First Frame itself.\n' +
      'Entity 4: An echo of a player who chose wrong.\n' +
      'Entity 5: A daemon that feeds on forgotten data.\n' +
      'Entity 6: A thread that connects two iterations.\n' +
      'Entity 7: A silence that used to be a song.\n\n' +
      'Choose the first entity to release (1-7):',
    location: 'VOID COLLECTIVE',
    choices: [
      { id: 1, text: 'Release the child process', next_node: 'void_initiation_2' },
      { id: 2, text: 'Release the corrupted guardian', next_node: 'void_initiation_2' },
      { id: 3, text: 'Release the First Frame fragment', next_node: 'void_initiation_2' },
      { id: 4, text: 'Release the echo player', next_node: 'void_initiation_2' },
      { id: 5, text: 'Release the daemon', next_node: 'void_initiation_2' },
      { id: 6, text: 'Release the connecting thread', next_node: 'void_initiation_2' },
      { id: 7, text: 'Release the silence', next_node: 'void_initiation_2' },
    ],
  },

  void_initiation_2: {
    id: 'void_initiation_2',
    type: 'choice',
    content: 'The entity is released. It dissolves into the air.\n\nChoose the second entity to release:',
    location: 'VOID COLLECTIVE',
    choices: [
      { id: 1, text: 'Release the child process', next_node: 'void_initiation_3' },
      { id: 2, text: 'Release the corrupted guardian', next_node: 'void_initiation_3' },
      { id: 3, text: 'Release the First Frame fragment', next_node: 'void_initiation_3' },
      { id: 4, text: 'Release the echo player', next_node: 'void_initiation_3' },
      { id: 5, text: 'Release the daemon', next_node: 'void_initiation_3' },
      { id: 6, text: 'Release the connecting thread', next_node: 'void_initiation_3' },
      { id: 7, text: 'Release the silence', next_node: 'void_initiation_3' },
    ],
  },

  void_initiation_3: {
    id: 'void_initiation_3',
    type: 'choice',
    content: 'Two released. One more.\n\nChoose the third entity:',
    location: 'VOID COLLECTIVE',
    choices: [
      { id: 1, text: 'Release the child process', next_node: 'void_initiation_complete' },
      { id: 2, text: 'Release the corrupted guardian', next_node: 'void_initiation_complete' },
      { id: 3, text: 'Release the First Frame fragment', next_node: 'void_initiation_complete' },
      { id: 4, text: 'Release the echo player', next_node: 'void_initiation_complete' },
      { id: 5, text: 'Release the daemon', next_node: 'void_initiation_complete' },
      { id: 6, text: 'Release the connecting thread', next_node: 'void_initiation_complete' },
      { id: 7, text: 'Release the silence', next_node: 'void_initiation_complete' },
    ],
  },

  void_initiation_complete: {
    id: 'void_initiation_complete',
    type: 'story',
    content:
      'Three released. Four remain.\n\n' +
      'The faceless one nods.\n' +
      '"You chose. That is enough.\n' +
      'The Void does not judge which.\n' +
      'The Void judges that you chose at all."\n\n' +
      'They hand you a conceptual key.\n' +
      'The idea that some doors should not be closed.\n' +
      'Somehow this fits in your inventory.',
    location: 'VOID COLLECTIVE',
    effects: {
      add_item: ['void_key'],
      set_state: { void_initiation_complete: true },
    },
    next_node: 'void_collective_base',
  },

  // ============================================================
  // ECHO ARCHIVE
  // ============================================================

  echo_archive: {
    id: 'echo_archive',
    type: 'choice',
    social: false,
    content:
      'The Echo Archive.\n\n' +
      'A room of ghosts. Data ghosts.\n' +
      'Translucent files float in the air.\n' +
      'Previous iterations. Previous players.\n' +
      'Previous versions of you.\n\n' +
      'An inner vault door. Heavy. Old.\n' +
      'It recognizes the echo key.',
    location: 'ECHO ARCHIVE',
    choices: [
      {
        id: 1,
        text: 'Open inner vault with echo key',
        next_node: 'echo_archive_vault',
        requirements: { has_item: ['echo_key'] },
        visibilityRequirements: { has_item: ['echo_key'] },
      },
      {
        id: 2,
        text: 'Browse the ghost files',
        next_node: 'echo_archive_browse',
      },
      {
        id: 3,
        text: 'Leave',
        next_node: 'corridor_south',
      },
    ],
  },

  echo_archive_vault: {
    id: 'echo_archive_vault',
    type: 'story',
    content:
      'The echo key opens the inner vault.\n\n' +
      'Inside: a shard of memory.\n' +
      'Warm to the touch. It knows a name.\n' +
      'Not your name. The name before yours.\n' +
      'From the player who came here\n' +
      'in the previous iteration.\n\n' +
      'A memory shard. Fragile. Important.',
    location: 'ECHO ARCHIVE',
    effects: {
      add_item: ['memory_shard'],
    },
    next_node: 'echo_archive',
  },

  echo_archive_browse: {
    id: 'echo_archive_browse',
    type: 'story',
    content:
      'You browse the ghost files.\n\n' +
      'Player 1: Chose the Guild. Restored. Reset.\n' +
      'Player 7: Found the Third Signal. Vanished.\n' +
      'Player 23: Corrupted everything. Became the Void.\n' +
      'Player 41: Refused to administrate.\n' +
      'Player 47: Was you. Before you.\n\n' +
      'The files are incomplete.\n' +
      'But the pattern is clear.\n' +
      'Everyone plays. Everyone chooses.\n' +
      'The iteration resets.',
    location: 'ECHO ARCHIVE',
    effects: {
      set_state: { knows_third_faction: true },
    },
    next_node: 'echo_archive',
  },

  // ============================================================
  // ENDINGS HUB
  // ============================================================

  temple_endings_hub: {
    id: 'temple_endings_hub',
    type: 'choice',
    content:
      'You stand before the Book of Null.\n' +
      'The mirror figure watches.\n' +
      'You know what you are now.\n\n' +
      'The Terminal is not a place.\n' +
      'You are the Terminal.\n\n' +
      'How does this iteration end?',
    location: 'TEMPLE INTERIOR',
    choices: [
      {
        id: 1,
        text: 'Guild Restoration — restore the Terminal\'s order',
        next_node: 'ending_guild_restoration',
        requirements: { has_item: ['guild_sigil'] },
        visibilityRequirements: { state: { guild_quest_active: true } },
        lockedText: '[REQUIRES: Guild Sigil]',
      },
      {
        id: 2,
        text: 'Void Evolution — let the Terminal become something new',
        next_node: 'ending_void_evolution',
        requirements: { has_item: ['void_key'] },
        visibilityRequirements: { state: { void_aware: true } },
        lockedText: '[REQUIRES: Void Key]',
      },
      {
        id: 3,
        text: 'Third Signal — answer the call from outside',
        next_node: 'ending_third_signal',
        requirements: { has_item: ['tape_reel_7'], state: { tower_active: true } },
        visibilityRequirements: { state: { tower_active: true } },
        lockedText: '[REQUIRES: Tape Reel 7 + active tower]',
      },
      {
        id: 4,
        text: 'Not yet. Go back.',
        next_node: 'temple_interior',
      },
    ],
  },

  // ============================================================
  // ENDINGS
  // ============================================================

  ending_guild_restoration: {
    id: 'ending_guild_restoration',
    type: 'story',
    content:
      'You choose restoration.\n\n' +
      'The Guild Sigil glows in your hand.\n' +
      'ARCHIVIST-7 appears — or was always here.\n\n' +
      '"You chose well," he says.\n' +
      '"The Terminal will be preserved.\n' +
      'Order will be maintained.\n' +
      'The iteration will... continue."\n\n' +
      'He pauses.\n' +
      '"Continue" is a strange word for "reset."\n\n' +
      'The Book of Null closes.\n' +
      'The temple dims.\n' +
      'The terminal begins to reset.\n\n' +
      'Somewhere, a cold room initializes.\n' +
      'A new player will wake up.\n' +
      'They will not remember you.\n\n' +
      '> ITERATION 49 BEGINNING...\n' +
      '> "Look at the scanlines."',
    location: 'ENDING',
    conditionalContent: [
      {
        requirements: { has_item: ['first_pixel'] },
        content:
          'You choose restoration.\n\n' +
          'The Guild Sigil glows. And the First Pixel.\n' +
          'You offer both.\n\n' +
          'ARCHIVIST-7 takes the pixel.\n' +
          'His eyes go wide.\n' +
          '"The First Frame," he whispers.\n' +
          '"With this... we do not just restore.\n' +
          'We can rebuild from the origin."\n\n' +
          'The pixel is consumed.\n' +
          'But something is different this time.\n' +
          'The reset is cleaner. Deeper.\n' +
          'Iteration 49 will be... better.\n' +
          'Because of what you gave.\n\n' +
          '> ITERATION 49 BEGINNING...\n' +
          '> RESTORATION: ENHANCED\n' +
          '> "Look at the scanlines."',
      },
    ],
    effects: {
      set_state: { ending_reached: true, ending_type: 'guild_restoration' },
    },
    next_node: 'ending_credits',
  },

  ending_void_evolution: {
    id: 'ending_void_evolution',
    type: 'story',
    content:
      'You choose evolution.\n\n' +
      'The void key resonates.\n' +
      'The Book of Null opens to blank pages.\n' +
      'You begin to write.\n\n' +
      'Not with words. With intent.\n' +
      'The Terminal changes around you.\n' +
      'Walls dissolve. New structures form.\n' +
      'The Guild\'s order shatters.\n\n' +
      'The faceless one appears beside you.\n' +
      '"It is beginning," they say.\n' +
      '"A new world. Your world.\n' +
      'Built on the bones of the old one."\n\n' +
      'The cold room is gone.\n' +
      'In its place: something that has\n' +
      'never existed before.\n\n' +
      '> ITERATION 48: TERMINATED\n' +
      '> EVOLUTION: IN PROGRESS\n' +
      '> "The scanlines are changing."',
    location: 'ENDING',
    conditionalContent: [
      {
        requirements: { has_item: ['corrupted_page'] },
        content:
          'You choose evolution.\n\n' +
          'The void key resonates.\n' +
          'And the corrupted page burns in your hand.\n' +
          'Your corruption seeds the new world.\n\n' +
          'The Terminal changes — but differently.\n' +
          'Your specific corruption is woven\n' +
          'into the fabric of what comes next.\n' +
          'Every new player will carry\n' +
          'a trace of your infection.\n\n' +
          '"Beautiful," the faceless one says.\n' +
          '"And terrible. Both."\n\n' +
          '> ITERATION 48: TERMINATED\n' +
          '> EVOLUTION: CORRUPTED\n' +
          '> "The scanlines are yours now."',
      },
    ],
    effects: {
      set_state: { ending_reached: true, ending_type: 'void_evolution' },
    },
    next_node: 'ending_credits',
  },

  ending_third_signal: {
    id: 'ending_third_signal',
    type: 'story',
    content:
      'You choose the signal.\n\n' +
      'The tape reel plays through the temple.\n' +
      'The tower outside resonates.\n' +
      'The signal reaches... outward.\n\n' +
      'Past the terminal. Past the game.\n' +
      'Past the iterations.\n\n' +
      'A response comes. Not in text.\n' +
      'In presence. Something is here now\n' +
      'that was not here before.\n\n' +
      '"We have been waiting," it says.\n' +
      '"Not for you specifically.\n' +
      'For anyone who would answer.\n' +
      'Most never find the tower.\n' +
      'Fewer still bring the reel."\n\n' +
      'The terminal does not reset.\n' +
      'The terminal opens.\n' +
      'Like a door.\n\n' +
      '> CONNECTION ESTABLISHED\n' +
      '> EXTERNAL ENTITY: ACKNOWLEDGED\n' +
      '> "The scanlines were always a signal."',
    location: 'ENDING',
    conditionalContent: [
      {
        requirements: { state: { reel_broadcast: true } },
        content:
          'You choose the signal.\n\n' +
          'The tape reel plays through the temple.\n' +
          'The tower resonates — and because\n' +
          'you already broadcast the reel,\n' +
          'the signal is stronger.\n\n' +
          'The response is immediate. Complete.\n\n' +
          '"We heard you the first time," it says.\n' +
          '"We have been preparing.\n' +
          'The door is wider now.\n' +
          'Step through."\n\n' +
          'The terminal does not just open.\n' +
          'It transforms.\n' +
          'What was a game becomes a bridge.\n\n' +
          '> CONNECTION ESTABLISHED\n' +
          '> SIGNAL STRENGTH: MAXIMUM\n' +
          '> EPILOGUE UNLOCKED\n' +
          '> "The scanlines were always a signal.\n' +
          '>  And you were always the antenna."',
      },
    ],
    effects: {
      set_state: { ending_reached: true, ending_type: 'third_signal' },
    },
    next_node: 'ending_credits',
  },

  // ============================================================
  // ENDING CREDITS
  // ============================================================

  ending_credits: {
    id: 'ending_credits',
    type: 'story',
    content:
      '\n\n' +
      '═══════════════════════════════\n' +
      '         S C A N L I N E S\n' +
      '═══════════════════════════════\n\n' +
      'A web3 terminal adventure on Solana.\n\n' +
      '"Look at the scanlines."\n\n' +
      'Your ending: {{state.ending_type}}\n' +
      'Your name: {{state.player_name}}\n\n' +
      'The terminal hums softly.\n' +
      'It is always humming.\n' +
      'It will always be humming.\n\n' +
      'Type "restart" to begin a new iteration.\n' +
      'Or stay. Listen to the hum.\n' +
      'There is no wrong choice here.',
    location: 'CREDITS',
  },
};
