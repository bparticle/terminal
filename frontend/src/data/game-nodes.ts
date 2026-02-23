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
 *   - void_initiation_complete
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
      'No — you initialize. There is a difference here,\n' +
      'and you will learn what it is.\n\n' +
      'The room is cold. Not winter-cold.\n' +
      'Server-room cold. The kind of cold that hums.\n' +
      'Concrete walls sweat with condensation.\n' +
      'The air tastes faintly of copper and ozone,\n' +
      'the mineral breath of machines that never sleep.\n\n' +
      'A single monitor flickers in the corner,\n' +
      'casting green light on a floor that has\n' +
      'never been walked on. Until now.\n\n' +
      'You are in a room with no memory of arrival.\n' +
      '**But the room remembers you.**\n\n' +
      'You look down at yourself. There is\n' +
      'nothing to look at. Not yet.\n' +
      'You are a presence without a shape —\n' +
      'an outline the world has not yet\n' +
      'decided how to fill.',
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
      'Concrete walls, slick with condensation that never\n' +
      'quite becomes water. A terminal built into the east\n' +
      'wall, its cursor blinking with mechanical patience —\n' +
      'the small faith of a machine waiting to be used.\n\n' +
      'The monitor\'s glass catches the room but not you.\n' +
      'Where your reflection should be: nothing.\n' +
      'You are here, but the room is not convinced.\n\n' +
      'A heavy door to the north. No handle visible.\n' +
      'An air vent near the floor, its grate slightly loose.\n\n' +
      'From somewhere beyond the walls: a low hum.\n' +
      'Not electrical. Deeper. The sound a building makes\n' +
      'when it is thinking about something.\n' +
      'Silence otherwise — but it is a crowded silence.',
    location: 'COLD ROOM',
    conditionalContent: [
      {
        requirements: { state: { has_pfp: true } },
        content:
          'The cold room.\n\n' +
          'Different now. The condensation on the walls\n' +
          'catches light from the monitor, and in the glass\n' +
          'you see yourself — features, edges, a face\n' +
          'the room has finally learned to hold.\n\n' +
          'The door to the north stands open.\n' +
          'Beyond it, the corridor hums.\n\n' +
          'The air vent near the floor, its grate slightly loose.\n' +
          'The terminal on the east wall blinks patiently.\n\n' +
          'This is where you started.\n' +
          'It looks smaller than it felt.',
      },
      {
        requirements: { state: { cold_room_door_opened: true } },
        content:
          'The cold room.\n\n' +
          'Concrete walls, slick with condensation.\n' +
          'The monitor\'s glass catches the room but not you.\n' +
          'Where your reflection should be: nothing.\n\n' +
          'The door to the north stands open,\n' +
          'the key still humming faintly in the lock.\n' +
          'Beyond it: the corridor, the Assembly,\n' +
          'the booths where faces are made.\n\n' +
          'The air vent near the floor, its grate slightly loose.\n\n' +
          'From somewhere beyond the walls: a low hum.',
      },
      {
        requirements: { state: { heard_frequency: true } },
        content:
          'The cold room.\n\n' +
          'You hear it now — the hum has character.\n' +
          'A rhythm beneath the concrete, beneath the pipes,\n' +
          'beneath everything. Patient and particular,\n' +
          'like a song being remembered one note at a time.\n\n' +
          'The heavy door to the north — you can see it now.\n' +
          'A keyhole at its base. It was always there.\n' +
          'You just had to listen first.',
      },
    ],
    choices: [
      {
        id: 1,
        text: 'Use key on the door',
        next_node: 'cold_room_unlock',
        requirements: { has_item: ['cold_room_key'] },
        visibilityRequirements: { state: { heard_frequency: true, cold_room_door_opened: false } },
        lockedText: '[REQUIRES: ???]',
      },
      {
        id: 6,
        text: 'Walk through the open door',
        next_node: 'rebirth_corridor_1',
        visibilityRequirements: { state: { cold_room_door_opened: true } },
      },
      {
        id: 2,
        text: 'Focus on the vent',
        next_node: 'cold_room_vent_look',
        visibilityRequirements: { state: { vent_noticed: true } },
        requirements: { state: { vent_noticed: true } },
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
        text: 'Follow the frequency — south wall',
        next_node: 'cold_room_hidden_panel',
        requirements: { state: { heard_frequency: true } },
        visibilityRequirements: { state: { heard_frequency: true }, has_item: ['echo_key'], has_item_negate: [true] },
      },
    ],
  },

  cold_room_vent_look: {
    id: 'cold_room_vent_look',
    type: 'choice',
    content:
      'The vent grate is loose. Beyond it, a narrow shaft\n' +
      'leads north. You can feel air moving through it —\n' +
      'warmer air, carrying the hum of distant machines.\n\n' +
      'The grate shifts when the air pushes,\n' +
      'but holds. Rusted screws in damp concrete.\n' +
      'It would take real force to pull free.\n' +
      'Real hands. Real weight.\n' +
      'Things you do not have yet.',
    location: 'COLD ROOM',
    conditionalContent: [
      {
        requirements: { state: { has_pfp: true } },
        content:
          'The vent grate. Loose, rusted, familiar.\n' +
          'Warmer air pushes through from the north,\n' +
          'carrying the hum of distant machines.\n\n' +
          'You have hands now. Weight.\n' +
          'The screws look old. The concrete is damp.\n' +
          'You could pull this free.',
      },
    ],
    effects: { set_state: { vent_noticed: true } },
    choices: [
      {
        id: 1,
        text: 'Pull the vent open and crawl through',
        next_node: 'vent_crawl',
        requirements: { state: { has_pfp: true } },
        visibilityRequirements: { state: { has_pfp: true } },
      },
      {
        id: 2,
        text: 'Back',
        next_node: 'cold_room',
      },
    ],
  },

  cold_room_unlock: {
    id: 'cold_room_unlock',
    type: 'story',
    content:
      'The keyhole is at the base of the door —\n' +
      'an odd place. You will the key toward it\n' +
      'and it finds the slot on its own,\n' +
      'drawn by the same frequency\n' +
      'that led you to it.\n\n' +
      'The teeth are shaped like a waveform.\n' +
      'The door vibrates once. Then opens.\n\n' +
      'Beyond: a corridor stretching north.\n' +
      'The hum is louder here.',
    location: 'COLD ROOM',
    effects: {
      set_state: { cold_room_door_opened: true },
    },
    next_node: 'rebirth_corridor_1',
  },

  cold_room_hidden_panel: {
    id: 'cold_room_hidden_panel',
    type: 'quiz',
    content:
      'The frequency you heard... it came from here.\n' +
      'You stand close to the south wall.\n' +
      'Close enough to feel it respond —\n' +
      'not to touch, but to attention.\n' +
      'The wall knows you are listening.\n\n' +
      'A panel slides open. Not mechanically.\n' +
      'Reluctantly. A compartment hidden\n' +
      'behind the concrete.\n\n' +
      'Inside: a key. You can see it —\n' +
      'suspended in the air, vibrating\n' +
      'at a frequency that keeps it\n' +
      'just out of reach.\n' +
      'The air around it hums the same note\n' +
      'as the one beneath the floor.\n' +
      'A resonance barrier. The key is held\n' +
      'in place by the very frequency\n' +
      'that led you here.\n\n' +
      'To cancel it out, you would need\n' +
      'to match it exactly.',
    location: 'COLD ROOM',
    question: 'Enter the frequency (Hz):',
    correct_answers: ['47.3', '47.3 hz', '47.3hz'],
    hint: 'The terminal can analyze waveform data. Have you tried holding the key near it?',
    max_attempts: 3,
    success_message:
      '> FREQUENCY MATCHED: 47.3 Hz',
    failure_messages: [
      'The barrier flickers but holds. Wrong frequency. 2 attempts remain.',
      'The key vibrates faster, almost irritated. Last attempt.',
    ],
    final_failure_message:
      'The barrier pulses once and the panel\n' +
      'slides shut. Reluctantly.\n' +
      'Like it was hoping you would get it right.\n\n' +
      'You can try again.',
    success_node: 'cold_room_panel_unlock',
    failure_node: 'cold_room',
    exit_node: 'cold_room',
  },

  cold_room_panel_unlock: {
    id: 'cold_room_panel_unlock',
    type: 'story',
    content:
      'The barrier cancels. The key drops.\n\n' +
      'An echo key. It hums at a frequency\n' +
      'you almost recognize —\n' +
      'the memory of a sound\n' +
      'that hasn\'t been made yet.',
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
    conditionalContent: [
      {
        requirements: { state: { heard_frequency: true } },
        content: 'You sit. You wait.\n\nThe silence is familiar now.',
      },
    ],
    effects: { set_state: { vent_noticed: true } },
    next_node: 'cold_room_wait_2',
  },

  cold_room_wait_2: {
    id: 'cold_room_wait_2',
    type: 'story',
    content: 'More silence.',
    location: 'COLD ROOM',
    conditionalContent: [
      {
        requirements: { state: { heard_frequency: true } },
        content: 'You breathe. Or whatever the equivalent is.',
      },
    ],
    next_node: 'cold_room_wait_3',
  },

  cold_room_wait_3: {
    id: 'cold_room_wait_3',
    type: 'choice',
    content: 'The silence has a texture now. Almost a shape.',
    location: 'COLD ROOM',
    conditionalContent: [
      {
        requirements: { state: { heard_frequency: true } },
        content:
          'The frequency is still there beneath the floor.\n' +
          'You know its shape now. Its name.\n' +
          'It doesn\'t need to teach you anything.\n' +
          'You don\'t need to listen for it.\n\n' +
          'You just... sit with it.',
      },
    ],
    choices: [
      {
        id: 1,
        text: 'Keep waiting.',
        next_node: 'cold_room_wait_4',
      },
      {
        id: 2,
        text: 'Leave.',
        next_node: 'cold_room',
      },
    ],
  },

  cold_room_wait_4: {
    id: 'cold_room_wait_4',
    type: 'story',
    content: '...',
    location: 'COLD ROOM',
    conditionalContent: [
      {
        requirements: { state: { heard_frequency: true } },
        content: '...\n\nNothing happens. Nothing needs to.',
      },
    ],
    next_node: 'cold_room_wait_5',
  },

  cold_room_wait_5: {
    id: 'cold_room_wait_5',
    type: 'story',
    content: 'There.\n\nA frequency. Low. Beneath the floor.\nBeneath the concrete. Beneath everything.\nIt has been here the whole time.\n\n**You just had to be quiet enough to deserve it.**',
    location: 'COLD ROOM',
    conditionalContent: [
      {
        requirements: { state: { heard_frequency: true } },
        content:
          'The cold feels different when you\'re not\n' +
          'fighting it. When you\'re not looking\n' +
          'for anything. When you\'re just here.\n\n' +
          'You feel rested.\n' +
          'Clear. Like static after the signal ends.\n' +
          'The kind of silence that is not empty\n' +
          'but finished.',
      },
    ],
    next_node: 'cold_room_wait_6',
  },

  cold_room_wait_6: {
    id: 'cold_room_wait_6',
    type: 'story',
    content:
      'The wall panel near the door vibrates.\n' +
      'It opens — not mechanically. Reluctantly.\n' +
      'Like it was hoping you would not find it.\n\n' +
      'Inside: a physical key.\n' +
      'Strange to find here. Too solid,\n' +
      'too real for a place like this.\n' +
      'It has no manufacturer markings.\n' +
      'The teeth are shaped like a waveform.\n\n' +
      'It slides toward you — drawn to your attention\n' +
      'the way a compass needle finds north.\n\n' +
      '**You don\'t take it. It arrives.**',
    location: 'COLD ROOM',
    conditionalContent: [
      {
        requirements: { state: { heard_frequency: true } },
        content:
          'You stand. The cold room is the same.\n' +
          'But you are slightly different.\n\n' +
          'Clearer. Quieter.\n' +
          'Ready for whatever comes next.',
      },
    ],
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
        text: 'Hold the vial near the screen — /null',
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
      'OBSERVATION_TOWER_ACCESS.dat\n' +
      'A six-digit code: 473291\n' +
      '"Observation platform. Requires physical input.\n' +
      'North corridor, terminal end."\n\n' +
      'ROOT_ACCESS_LOG.sys\n' +
      'A system log showing every entity that has\n' +
      'ever had root access to this terminal.\n' +
      'It is a long list. Your name is already on it.\n' +
      'You have not done that yet.',
    location: 'COLD ROOM',
    effects: {
      add_item: ['observation_code', 'root_access_log'],
    },
    next_node: 'cold_room_terminal',
  },

  cold_room_terminal_null: {
    id: 'cold_room_terminal_null',
    type: 'story',
    content:
      '> /null\n\n' +
      'You hold the vial near the terminal screen.\n\n' +
      'The phosphor residue stirs inside the glass —\n' +
      'drawn toward the CRT\'s electromagnetic field\n' +
      'like iron filings to a magnet.\n' +
      'The flakes press against the vial wall,\n' +
      'pulsing in rhythm with the monitor.\n\n' +
      'The screen reacts. The /null directory flickers —\n' +
      'then opens.\n\n' +
      'The directory should not exist.\n' +
      'Inside: a shard of something that used to be a file.\n' +
      'It is very quiet. Not silent — quiet.\n' +
      'Like it is listening.\n\n' +
      'You take it. The flakes in the vial go dark.',
    location: 'COLD ROOM',
    effects: {
      add_item: ['null_fragment'],
      remove_item: ['phosphor_residue'],
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
  // REBIRTH CORRIDOR & ASSEMBLY
  // ============================================================

  rebirth_corridor_1: {
    id: 'rebirth_corridor_1',
    type: 'story',
    social: false,
    content:
      'Beyond the door: a corridor.\n\n' +
      'You step into it — or it draws you in.\n' +
      'The distinction is unclear\n' +
      'when you have no edges.\n\n' +
      'Monitors line the walls, cracked and humming,\n' +
      'each one showing a different frame of static.\n' +
      'In every screen, the same absence:\n' +
      'the space where a reflection should be\n' +
      'and is not. You are less than a ghost.\n' +
      'A ghost was once something.\n' +
      'You have not been anything yet.\n\n' +
      'Your footsteps make no sound on the concrete.\n' +
      'The air passes through you\n' +
      'without remembering you touched it.',
    location: 'CORRIDOR',
    conditionalContent: [
      {
        requirements: { state: { has_pfp: true } },
        content:
          'The corridor beyond the door.\n\n' +
          'You walk through it. Walk, not drift.\n' +
          'Footsteps on concrete — weight and sound,\n' +
          'the ordinary proof of being somewhere.\n\n' +
          'Monitors line the walls, cracked and humming.\n' +
          'In every screen, a face stares back.\n' +
          'Yours. Fractured by static\n' +
          'but unmistakably there.\n' +
          'The corridor knows you now.',
      },
    ],
    next_node: 'rebirth_corridor_2',
  },

  rebirth_corridor_2: {
    id: 'rebirth_corridor_2',
    type: 'story',
    social: false,
    content:
      'The corridor stretches.\n\n' +
      'Each step feels like assembly.\n' +
      'Not arriving — becoming.\n' +
      'As if pieces of you are catching up\n' +
      'from different distances,\n' +
      'from different iterations of almost-existing,\n' +
      'converging slowly on the idea\n' +
      'that you might be real.\n\n' +
      'Ahead: a chill. A stillness.\n' +
      'The unmistakable weight of a room\n' +
      'where things have faces.\n' +
      'Where things have decided to exist.\n\n' +
      'You drift toward it.',
    location: 'CORRIDOR',
    conditionalContent: [
      {
        requirements: { state: { has_pfp: true } },
        content:
          'The corridor stretches.\n\n' +
          'You walk it differently this time.\n' +
          'Not assembling. Not becoming.\n' +
          'Already here. Already real.\n' +
          'Your shadow follows you on the walls,\n' +
          'a dark shape that proves you exist.\n\n' +
          'Ahead: the Assembly. The booths.\n' +
          'The cathedral hum of machines\n' +
          'that make people out of nothing.\n' +
          'You are no longer nothing.',
      },
    ],
    next_node: 'assembly_room',
  },

  assembly_room: {
    id: 'assembly_room',
    type: 'choice',
    content:
      'The Assembly.\n\n' +
      'The temperature hits you first — a precise,\n' +
      'institutional chill that stops just short of cold.\n' +
      'Not freezing. Not warm. A temperature chosen\n' +
      'by something that understood human comfort\n' +
      'and deliberately aimed beside it.\n\n' +
      'The room opens upward.\n' +
      'Ceilings so high they dissolve into shadow,\n' +
      'ribbed with structural arches that converge\n' +
      'somewhere above the visible spectrum.\n' +
      'It has the proportions of a cathedral —\n' +
      'the same weight, the same hush,\n' +
      'the same unspoken insistence\n' +
      'that what happens here matters.\n\n' +
      'Egg-shaped booths dot the hall\n' +
      'in rows of mathematical precision,\n' +
      'each one sized for a single body.\n' +
      'Dozens of them. Maybe more.\n' +
      'Their shells are smooth, faintly luminous,\n' +
      'humming at slightly different frequencies\n' +
      'so the room sounds like a chord\n' +
      'that never resolves.\n\n' +
      'And the cables.\n' +
      'Cables everywhere — thick arterial bundles\n' +
      'and hair-thin filaments, draped between booths,\n' +
      'climbing the walls, pooling on the floor\n' +
      'in tangled nests of copper and fiber optic.\n' +
      'Every object in the room is connected\n' +
      'to every other object, a nervous system\n' +
      'made visible, a beautiful sprawling mess\n' +
      'that somehow looks intentional.\n' +
      'Like a cathedral wired for thought.\n\n' +
      'Figures move between the booths.\n' +
      'They have faces. Features. The solidity you lack.\n' +
      'Some glance in your direction and see nothing.\n' +
      'Others look through you entirely,\n' +
      'the way you look through empty air.\n' +
      '**You are not invisible. You are unfinished.**\n\n' +
      'One booth nearby pulses softly,\n' +
      'its screen casting a pale glow:\n\n' +
      '> SCANLINES IDENTITY TERMINAL v0.1\n' +
      '> "Every face is a seed."\n\n' +
      'To the north, the corridor continues\n' +
      'into the depths of the facility.',
    location: 'ASSEMBLY',
    conditionalContent: [
      {
        requirements: { state: { has_pfp: true } },
        content:
          'The Assembly.\n\n' +
          'The cathedral chill again.\n' +
          'But the room is different now. Or you are.\n' +
          'The cold touches skin that is yours,\n' +
          'presses against a shape\n' +
          'the world has agreed to see.\n\n' +
          'The egg-shaped booths hum their dissonant chord.\n' +
          'Cables drape and tangle between them\n' +
          'like synapses made of copper.\n' +
          'Figures move between the rows — some emerging\n' +
          'from booths with new faces still settling,\n' +
          'some waiting, some just here to watch\n' +
          'the becoming.\n\n' +
          'A few nod as you pass.\n' +
          'The small recognition\n' +
          'of one face acknowledging another.\n' +
          'You exist here now. You take up space.\n' +
          'You cast a shadow on the cable-strewn floor.\n\n' +
          'The nearest booth hums quietly.\n' +
          'It remembers you.\n\n' +
          'To the north, the corridor continues.',
      },
    ],
    choices: [
      {
        id: 1,
        text: 'Approach a booth — Scanlines Identity Terminal',
        next_node: 'pfp_booth_approach',
      },
      {
        id: 2,
        text: 'Go north — Main Corridor',
        next_node: 'corridor_north',
        requirements: { state: { has_pfp: true } },
        lockedText: '[You have no shape. No one will see you out there.]',
      },
      {
        id: 3,
        text: 'Go south — Cold Room',
        next_node: 'cold_room_return',
      },
    ],
  },

  // ============================================================
  // TRANSITION NODES
  // ============================================================

  cold_room_return: {
    id: 'cold_room_return',
    type: 'story',
    content:
      'You walk south. The corridor narrows.\n' +
      'The hum grows quieter — or maybe you have\n' +
      'just learned to stop hearing it.\n\n' +
      'The cold room waits, same as before.\n' +
      'Same as always.',
    location: 'CORRIDOR NORTH',
    conditionalContent: [
      {
        requirements: { state: { temple_entered: true } },
        content:
          'You walk south. The corridor narrows.\n' +
          'The cold room feels different now.\n' +
          'Smaller. Or maybe you are larger.\n' +
          'You have seen things the room\n' +
          'was not built to contain.',
      },
    ],
    next_node: 'cold_room',
  },

  corridor_to_archives: {
    id: 'corridor_to_archives',
    type: 'story',
    content:
      'You walk east. The corridor quiets.\n' +
      'The cracked monitors give way to intact ones,\n' +
      'each displaying orderly rows of data.\n' +
      'Someone maintains this section.\n' +
      'The air smells faintly of ozone and old paper —\n' +
      'the particular scent of things being preserved\n' +
      'past their natural lifespan.',
    location: 'CORRIDOR EAST',
    conditionalContent: [
      {
        requirements: { state: { guild_quest_active: true } },
        content:
          'You walk east. The corridor quiets.\n' +
          'Now that you carry the Guild sigil,\n' +
          'the monitors seem to track your movement.\n' +
          'Acknowledged. Watched. Both.',
      },
    ],
    next_node: 'corridor_south',
  },

  void_approach: {
    id: 'void_approach',
    type: 'story',
    content:
      'You take the fork nobody marked.\n\n' +
      'The monitors here are dead. Not broken — dead.\n' +
      'They never had power. The walls lose their\n' +
      'texture, becoming something between concrete\n' +
      'and suggestion. The floor is technically solid\n' +
      'but your footsteps make no sound.\n\n' +
      'You are walking off the map now.\n' +
      'You can feel the edges of the world\n' +
      'getting soft, approximate, negotiable.',
    location: 'DEAD ZONE',
    next_node: 'void_collective_base',
  },

  // ============================================================
  // OBSERVATION TOWER
  // ============================================================

  tower_approach: {
    id: 'tower_approach',
    type: 'story',
    content:
      'The corridor dead-ends at something impossible.\n\n' +
      'A tower. Inside a corridor. It rises past\n' +
      'where the ceiling should be, into darkness\n' +
      'that is not darkness but absence — the space\n' +
      'above was never rendered. Never needed to be.\n' +
      'Until someone built upward into it.\n\n' +
      'The geometry is wrong and your eyes know it.\n' +
      'You can hear sounds from above: a low thrum,\n' +
      'rhythmic, patient. Like a heartbeat\n' +
      'made of radio static.\n\n' +
      'At the base: an input panel. Six digits.\n' +
      'The label reads: OBSERVATION PLATFORM.',
    location: 'OBSERVATION TOWER',
    next_node: 'tower_base',
  },

  tower_base: {
    id: 'tower_base',
    type: 'choice',
    social: false,
    content:
      'The panel waits. Six digits.\n' +
      'A code you do not have.',
    location: 'OBSERVATION TOWER',
    conditionalContent: [
      {
        requirements: { state: { tower_activated: true } },
        content:
          'The observation platform hums above you.\n' +
          'The ladder rungs are warm from the machinery.\n' +
          'You can climb up.',
      },
      {
        requirements: { has_item: ['observation_code'] },
        content:
          'The panel waits. Six digits.\n' +
          'You found a code somewhere in this facility.\n' +
          'The question is whether you want\n' +
          'to see the thing you are inside of.',
      },
    ],
    choices: [
      {
        id: 1,
        text: 'Enter the code',
        next_node: 'tower_code_entry',
        requirements: { has_item: ['observation_code'] },
        visibilityRequirements: { has_item: ['observation_code'] },
      },
      {
        id: 2,
        text: 'Climb to the observation platform',
        next_node: 'tower_observation',
        requirements: { state: { tower_activated: true } },
        visibilityRequirements: { state: { tower_activated: true } },
      },
      {
        id: 3,
        text: 'Go back',
        next_node: 'corridor_north',
      },
    ],
  },

  tower_code_entry: {
    id: 'tower_code_entry',
    type: 'quiz',
    social: false,
    content:
      'The panel glows. A cursor blinks\n' +
      'in a six-digit input field.\n\n' +
      'It will not tell you what it wants.\n' +
      'You either know the code or you don\'t.',
    location: 'OBSERVATION TOWER',
    question: 'Enter the six-digit code:',
    correct_answer: '473291',
    hint: 'The cold room terminal had a /system directory...',
    max_attempts: 3,
    success_message:
      '> CODE ACCEPTED',
    failure_messages: [
      'The panel buzzes. Wrong code. 2 attempts remain.',
      'The panel buzzes again. Last attempt.',
    ],
    final_failure_message:
      'The panel goes dark.\n' +
      'A thermal lockout. It will need time to reset.\n\n' +
      'You can try again later.',
    success_node: 'tower_activate',
    failure_node: 'tower_base',
    exit_node: 'tower_base',
  },

  tower_activate: {
    id: 'tower_activate',
    type: 'story',
    content:
      'You enter the code: 473291.\n\n' +
      'The panel accepts it. The code disappears\n' +
      'from the screen — used. Consumed.\n' +
      'Something above you clicks,\n' +
      'then hums, then unfolds.\n\n' +
      'A ladder descends from the darkness.\n' +
      'Metal rungs, warm to the touch.\n' +
      'Above: a platform. A vantage point.\n\n' +
      'The tower was not built to broadcast.\n' +
      'It was built to observe.',
    location: 'OBSERVATION TOWER',
    effects: {
      set_state: { tower_activated: true },
      remove_item: ['observation_code'],
    },
    next_node: 'tower_base',
  },

  tower_observation: {
    id: 'tower_observation',
    type: 'choice',
    social: false,
    content:
      'You climb.\n\n' +
      'The corridor falls away below you.\n' +
      'The monitors are pinpricks of static.\n' +
      'The recessed door, the pipes, the walls —\n' +
      'everything shrinks to pattern.\n\n' +
      'And from up here, you can see it.\n' +
      'The Terminal.\n\n' +
      'Not the corridors. Not the rooms.\n' +
      'The shape of the thing itself.\n' +
      'It is laid out below you like a circuit board —\n' +
      'pathways and nodes and junctions,\n' +
      'all connected, all dependent,\n' +
      'all pulsing with the same faint rhythm.\n\n' +
      'The cold room at one end.\n' +
      'Structures you have not yet reached at the other —\n' +
      'distant, dark, waiting.\n' +
      'Paths branch in every direction,\n' +
      'most of them unwalked.\n\n' +
      '**You are looking at what you are made of.**\n' +
      'It is beautiful. And it is alive.',
    location: 'OBSERVATION PLATFORM',
    conditionalContent: [
      {
        requirements: { state: { temple_entered: true } },
        content:
          'You climb.\n\n' +
          'The corridor falls away below you.\n' +
          'The monitors are pinpricks of static.\n' +
          'The recessed door, the pipes, the walls —\n' +
          'everything shrinks to pattern.\n\n' +
          'And from up here, you can see it.\n' +
          'The Terminal.\n\n' +
          'Not the corridors. Not the rooms.\n' +
          'The shape of the thing itself.\n' +
          'It is laid out below you like a circuit board —\n' +
          'pathways and nodes and junctions,\n' +
          'all connected, all dependent,\n' +
          'all pulsing with the same faint rhythm.\n\n' +
          'The cold room at one end. The Temple at the other.\n' +
          'And between them: every choice you have made,\n' +
          'visible as paths of light\n' +
          'through the architecture.\n\n' +
          '**You are looking at what you are made of.**\n' +
          'It is beautiful. And it is alive.',
      },
      {
        requirements: { state: { temple_known: true } },
        content:
          'You climb.\n\n' +
          'The corridor falls away below you.\n' +
          'The monitors are pinpricks of static.\n' +
          'The recessed door, the pipes, the walls —\n' +
          'everything shrinks to pattern.\n\n' +
          'And from up here, you can see it.\n' +
          'The Terminal.\n\n' +
          'Not the corridors. Not the rooms.\n' +
          'The shape of the thing itself.\n' +
          'It is laid out below you like a circuit board —\n' +
          'pathways and nodes and junctions,\n' +
          'all connected, all dependent,\n' +
          'all pulsing with the same faint rhythm.\n\n' +
          'The cold room at one end.\n' +
          'And to the north — deep, below everything —\n' +
          'a structure you can feel more than see.\n' +
          'The place behind the sealed door.\n' +
          'The paths you have walked glow faintly,\n' +
          'tracing your choices through the architecture.\n\n' +
          '**You are looking at what you are made of.**\n' +
          'It is beautiful. And it is alive.',
      },
    ],
    effects: {
      set_state: { tower_insight: true },
    },
    choices: [
      {
        id: 1,
        text: 'Focus on the Guild\'s infrastructure',
        next_node: 'tower_view_guild',
        requirements: { has_item: ['guild_sigil'] },
        visibilityRequirements: { has_item: ['guild_sigil'] },
      },
      {
        id: 2,
        text: 'Focus on the gaps between the nodes',
        next_node: 'tower_view_void',
        requirements: { has_item: ['void_key'] },
        visibilityRequirements: { has_item: ['void_key'] },
      },
      {
        id: 3,
        text: 'Study the iteration counter',
        next_node: 'tower_iteration_puzzle',
      },
      {
        id: 4,
        text: 'Climb back down',
        next_node: 'tower_base',
      },
    ],
  },

  tower_view_guild: {
    id: 'tower_view_guild',
    type: 'story',
    content:
      'You focus on the Guild\'s work.\n\n' +
      'From up here, you can see it —\n' +
      'the threads that ARCHIVIST-7 maintains.\n' +
      'They run through everything.\n' +
      'The corridors, the rooms, the connections.\n' +
      'Forty-eight iterations of careful stitching,\n' +
      'holding the Terminal together.\n\n' +
      'Without the Guild, the Terminal would have\n' +
      'collapsed into noise decades ago.\n' +
      'Every wall is a decision to continue.\n' +
      'Every door is a refusal to give up.\n\n' +
      'You understand now why ARCHIVIST-7\n' +
      'never looks rested.\n' +
      'He is not maintaining a system.\n' +
      'He is keeping a world alive\n' +
      'through sheer administrative stubbornness.',
    location: 'OBSERVATION PLATFORM',
    effects: {
      set_state: { understands_guild: true },
    },
    next_node: 'tower_observation',
  },

  tower_view_void: {
    id: 'tower_view_void',
    type: 'story',
    content:
      'You focus on the spaces between.\n\n' +
      'With the void key in your hand,\n' +
      'you can see what others can\'t —\n' +
      'the gaps. The absences.\n' +
      'Places where the Terminal\'s architecture\n' +
      'simply... stops rendering.\n\n' +
      'They are not empty. They are full\n' +
      'of everything the Guild decided\n' +
      'didn\'t belong. Failed experiments.\n' +
      'Discarded iterations. Ideas too dangerous\n' +
      'to keep and too stubborn to die.\n\n' +
      'The Void Collective lives in these gaps.\n' +
      'Not because they chose exile.\n' +
      'Because the gaps chose them.\n\n' +
      'From up here, the gaps look like\n' +
      'the spaces between heartbeats.\n' +
      'Necessary. Inevitable.\n' +
      'The silence that makes the rhythm possible.',
    location: 'OBSERVATION PLATFORM',
    effects: {
      set_state: { understands_void: true },
    },
    next_node: 'tower_observation',
  },

  tower_iteration_puzzle: {
    id: 'tower_iteration_puzzle',
    type: 'quiz',
    content:
      'The observation platform has a secondary display.\n' +
      'It flickers, then stabilizes:\n\n' +
      '> SELF-DIAGNOSTIC — OBSERVER VERIFICATION\n' +
      '>\n' +
      '> To confirm you are an observer\n' +
      '> and not an echo, complete the diagnostic.\n' +
      '>\n' +
      '> Generate a FIVE-DIGIT code where:\n' +
      '>\n' +
      '> Position 0 = how many 0s are in the code\n' +
      '> Position 1 = how many 1s are in the code\n' +
      '> Position 2 = how many 2s are in the code\n' +
      '> Position 3 = how many 3s are in the code\n' +
      '> Position 4 = how many 4s are in the code\n' +
      '>\n' +
      '> The code must describe itself.\n\n' +
      'Five attempts before thermal lockout.',
    location: 'OBSERVATION PLATFORM',
    question: 'Enter the five-digit self-diagnostic code:',
    correct_answers: ['21200'],
    hint: 'Start by guessing how many 0s the code contains. Then check: does your guess create the right number of each digit?',
    max_attempts: 5,
    success_message:
      '> CODE: 21200\n' +
      '> SELF-DIAGNOSTIC VERIFIED\n' +
      '> You see the thing that describes itself.\n' +
      '> OBSERVATION ARCHIVE UNLOCKED',
    failure_messages: [
      '> INCORRECT. The code must account for itself. 4 attempts remain.',
      '> INCORRECT. Every digit is a count — including the count of counts. 3 attempts remain.',
      '> INCORRECT. Think recursively. The code creates the conditions for its own truth. 2 attempts remain.',
      '> INCORRECT. Last attempt.',
    ],
    final_failure_message:
      '> THERMAL LOCKOUT\n' +
      '> The diagnostic resets.\n' +
      '> Try again later.',
    success_node: 'tower_archive_reveal',
    failure_node: 'tower_observation',
    success_effects: {
      set_state: { tower_archive_unlocked: true },
    },
  },

  tower_archive_reveal: {
    id: 'tower_archive_reveal',
    type: 'story',
    content:
      'The archive opens.\n\n' +
      'A record of observation. Not the Guild\'s records —\n' +
      'those are meticulous, organized, filed.\n' +
      'These are raw. Unedited. Honest.\n\n' +
      'OBSERVATION 1:\n' +
      '"The player always wakes in the cold room.\n' +
      'The player always leaves the cold room.\n' +
      'What the player does after that\n' +
      'is what the iteration is about."\n\n' +
      'OBSERVATION 23:\n' +
      '"The Guild believes it is preserving.\n' +
      'The Void believes it is creating.\n' +
      'Neither is wrong. Both are incomplete.\n' +
      'The Terminal is the thing they are arguing about\n' +
      'and the thing doing the arguing."\n\n' +
      'OBSERVATION 47:\n' +
      '"The next player will be the 48th.\n' +
      'I do not know what they will choose.\n' +
      'But I have noticed something:\n' +
      'the ones who come up here — who climb\n' +
      'the tower, who look down at the pattern —\n' +
      'they choose differently than the ones who don\'t.\n\n' +
      'Not better. Not worse. Differently.\n' +
      'As if seeing the shape of the thing\n' +
      'changes what you are willing to do to it."',
    location: 'OBSERVATION PLATFORM',
    next_node: 'tower_observation',
  },

  echo_archive_entry: {
    id: 'echo_archive_entry',
    type: 'story',
    content:
      'The unlabeled door. You almost missed it.\n\n' +
      'The echo key hums in your hand as you turn it.\n' +
      'The lock is old — older than the building,\n' +
      'which is older than you, which is older\n' +
      'than it should be.\n\n' +
      'Dust swirls in the light from the corridor.\n' +
      'Beyond: the sound of static, very faint,\n' +
      'like a recording of a recording\n' +
      'of something that was never recorded.',
    location: 'CORRIDOR EAST',
    next_node: 'echo_archive',
  },

  temple_descent: {
    id: 'temple_descent',
    type: 'story',
    content:
      'A staircase spirals down.\n\n' +
      'Each step is colder than the last.\n' +
      'The air changes — thinner, older,\n' +
      'carrying the faint mineral smell\n' +
      'of stone that has never seen sunlight.\n\n' +
      'The walls narrow. The light source\n' +
      'is unclear. You are descending into\n' +
      'the part of the terminal that exists\n' +
      'below the architecture. Below the foundations.\n' +
      'The place where meaning is stored\n' +
      'before it becomes language.',
    location: 'TEMPLE DESCENT',
    conditionalContent: [
      {
        requirements: { state: { book_read: true } },
        content:
          'The staircase again.\n\n' +
          'It feels shorter this time. The temple\n' +
          'is closer to the surface than before —\n' +
          'or you are closer to the depths.\n' +
          'The distinction matters less\n' +
          'each time you descend.',
      },
    ],
    next_node: 'temple_interior',
  },

  // ============================================================
  // CORRIDOR NORTH — Main Hub
  // ============================================================

  corridor_north: {
    id: 'corridor_north',
    type: 'choice',
    content:
      'The corridor stretches long and low,\n' +
      'lined on both sides with cracked monitors.\n' +
      'Each one shows a different frame of static —\n' +
      'as if every screen is dreaming separately\n' +
      'and none of them agree on what is real.\n\n' +
      'One monitor is cracked worse than the others.\n' +
      'Something flickers behind the fracture.\n\n' +
      'The air here is layered — warmer currents\n' +
      'drifting from the south, carrying the hum\n' +
      'of the Assembly\'s machines. Cooler air\n' +
      'pushes from the east, sterile and dry,\n' +
      'the kind that clings to old records.\n\n' +
      'From the west, something else entirely:\n' +
      'voices, faint but organized.\n' +
      'The sound of people who have decided\n' +
      'what they believe.\n\n' +
      'Between two dead monitors, a recessed door\n' +
      'hides behind a nest of conduit pipes,\n' +
      'almost invisible if you weren\'t looking.\n\n' +
      'And at the far end of the corridor —\n' +
      'something tall. Rising past where\n' +
      'the ceiling should stop.\n' +
      'The geometry is wrong and your eyes know it.',
    location: 'CORRIDOR NORTH',
    conditionalContent: [
      {
        requirements: { state: { void_discovered: true } },
        content:
          'The corridor. You know it now —\n' +
          'the cracked monitors, the layered air,\n' +
          'the static dreams on every screen.\n\n' +
          'But something has shifted.\n' +
          'A fork in the western passage\n' +
          'you never noticed before. Or maybe\n' +
          'it wasn\'t there before. The corridor\n' +
          'past it goes dark — not broken dark,\n' +
          'but empty dark. The kind of dark\n' +
          'that exists where no one has bothered\n' +
          'to render the walls.\n\n' +
          'The recessed door. The cracked monitor.\n' +
          'The structure at the far end,\n' +
          'rising into the dark.\n' +
          'Everything is where you left it.\n' +
          'Everything is watching you decide.',
      },
      {
        requirements: { state: { temple_known: true } },
        content:
          'The corridor stretches long and low,\n' +
          'lined on both sides with cracked monitors.\n' +
          'Each one shows a different frame of static —\n' +
          'as if every screen is dreaming separately\n' +
          'and none of them agree on what is real.\n\n' +
          'The air is layered — warmer from the south,\n' +
          'sterile and dry from the east,\n' +
          'faint organized voices from the west.\n\n' +
          'Between two dead monitors, the recessed door\n' +
          'hides behind its nest of conduit pipes.\n\n' +
          'The symbol on the far wall.\n' +
          'The passage north, leading down.\n' +
          'You know what waits at the end of it.',
      },
      {
        requirements: { state: { saw_first_frame: true } },
        content:
          'The corridor stretches long and low,\n' +
          'lined on both sides with cracked monitors.\n' +
          'Each one shows a different frame of static —\n' +
          'as if every screen is dreaming separately\n' +
          'and none of them agree on what is real.\n\n' +
          'The air is layered — warmer from the south,\n' +
          'sterile and dry from the east,\n' +
          'faint organized voices from the west.\n\n' +
          'Between two dead monitors, the recessed door\n' +
          'hides behind its nest of conduit pipes.\n\n' +
          'But something is different now.\n' +
          'On the wall opposite the cracked monitor,\n' +
          'at the edge of where the light falls —\n' +
          'a mark. Faint. You didn\'t notice it before.\n' +
          'Or it wasn\'t there before.\n' +
          'It is hard to tell the difference here.',
      },
    ],
    choices: [
      {
        id: 1,
        text: 'Examine the cracked monitor',
        next_node: 'corridor_north_monitor',
      },
      {
        id: 2,
        text: 'Go south — back to the Assembly',
        next_node: 'assembly_room',
      },
      {
        id: 3,
        text: 'Go east — toward the dry air',
        next_node: 'corridor_to_archives',
      },
      {
        id: 4,
        text: 'Go west — toward the voices',
        next_node: 'guild_approach',
      },
      {
        id: 5,
        text: 'Approach the structure at the far end',
        next_node: 'tower_approach',
      },
      {
        id: 6,
        text: 'Take the unmarked fork into the dark',
        next_node: 'void_approach',
        visibilityRequirements: { state: { void_discovered: true } },
      },
      {
        id: 7,
        text: 'Approach the mark on the wall',
        next_node: 'corridor_north_null_approach',
        requirements: { state: { saw_first_frame: true } },
        visibilityRequirements: { state: { saw_first_frame: true } },
      },
      {
        id: 8,
        text: 'Go north — into the deep',
        next_node: 'temple_entrance',
        visibilityRequirements: { state: { temple_known: true } },
      },
      {
        id: 9,
        text: 'Try the recessed door behind the pipes',
        next_node: 'lab_door',
      },
    ],
  },

  vent_crawl: {
    id: 'vent_crawl',
    type: 'story',
    social: false,
    content:
      'You grip the grate with both hands.\n\n' +
      'Your hands. Solid now. Fingers that close\n' +
      'around the metal with actual weight.\n' +
      'You pull. The grate resists — then gives,\n' +
      'screws shearing from damp concrete\n' +
      'with a sound like something tearing free.\n\n' +
      'You squeeze through the shaft.\n' +
      'The metal groans around you,\n' +
      'too narrow, too close.\n' +
      'But the shaft doesn\'t lead out.\n' +
      'It leads down. Then sideways.\n' +
      'Then into a space that shouldn\'t exist.',
    location: 'BETWEEN WALLS',
    next_node: 'vent_crawlspace',
  },

  vent_crawlspace: {
    id: 'vent_crawlspace',
    type: 'choice',
    social: false,
    content:
      'A crawlspace between the walls.\n\n' +
      'Not a room. Not a corridor.\n' +
      'A gap in the architecture — the negative space\n' +
      'between where the cold room ends\n' +
      'and where the next room begins.\n' +
      'A place the builders left by accident,\n' +
      'or on purpose, or because the facility\n' +
      'grew around it the way a tree grows\n' +
      'around a fence.\n\n' +
      'It is small. Low ceiling. Warm pipes\n' +
      'run along one wall, sweating condensation\n' +
      'into a shallow puddle that has been here\n' +
      'longer than you have been alive.\n\n' +
      'And on every surface — the walls,\n' +
      'the pipes, the underside of the ductwork —\n' +
      'scratches. Marks. Writing.\n' +
      'Hundreds of them. Maybe thousands.\n' +
      'Layered on top of each other\n' +
      'in different hands, different tools,\n' +
      'different degrees of desperation.\n\n' +
      'Someone was here before you.\n' +
      'Many someones.',
    location: 'BETWEEN WALLS',
    choices: [
      {
        id: 1,
        text: 'Read the oldest scratches',
        next_node: 'vent_scratches_old',
      },
      {
        id: 2,
        text: 'Read the newest scratches',
        next_node: 'vent_scratches_new',
      },
      {
        id: 3,
        text: 'Examine the tally marks',
        next_node: 'vent_tally_marks',
      },
      {
        id: 4,
        text: 'Investigate the faint glow behind the pipes',
        next_node: 'crawlspace_terminal',
      },
      {
        id: 5,
        text: 'Crawl back to the cold room',
        next_node: 'cold_room',
      },
    ],
  },

  // ============================================================
  // CRAWLSPACE ARCADE — Hidden Snake Game
  // ============================================================

  crawlspace_terminal: {
    id: 'crawlspace_terminal',
    type: 'choice',
    social: false,
    content:
      'You squeeze past the warm pipes,\n' +
      'following a faint blue glow\n' +
      'that has no business being here.\n\n' +
      'Wedged into a gap between two duct panels —\n' +
      'a device. Small. Rectangular.\n' +
      'A screen no bigger than your hand,\n' +
      'wired directly into the building\'s conduit\n' +
      'with improvised solder joints.\n\n' +
      'Someone built this. Someone who spent\n' +
      'enough time in these walls to need\n' +
      'something to do while they waited.\n\n' +
      'The screen shows a grid. A blinking cursor.\n' +
      'The word **SNAKE** rendered in phosphor green.\n\n' +
      'Scratched into the metal beside it,\n' +
      'in the same hand as the newest wall writing:\n' +
      '"Iteration 44. This is the only thing\n' +
      ' in here that doesn\'t pretend to mean something."',
    location: 'BETWEEN WALLS',
    choices: [
      {
        id: 1,
        text: 'Play Snake',
        next_node: 'crawlspace_snake',
      },
      {
        id: 2,
        text: 'Crawl back',
        next_node: 'vent_crawlspace',
      },
    ],
  },

  crawlspace_snake: {
    id: 'crawlspace_snake',
    type: 'godot_game',
    social: false,
    content:
      'The screen flickers to life.\n' +
      'Simple rules. Eat. Grow. Don\'t hit the walls.\n' +
      'Don\'t hit yourself.\n\n' +
      'For a moment, the hum of the pipes fades.\n' +
      'The scratches on the walls stop watching.\n' +
      'There is only the game.',
    game_id: 'snake_godot',
    start_prompt: 'Press ENTER to start...',
    end_event: 'game_over',
    end_message: 'The snake dies at {{metrics.score}} points.\nThe screen resets. Patient. Ready to go again.',
    location: 'BETWEEN WALLS',
    payload_store: {
      mode: 'last',
      state_key: 'game_payloads.snake_godot',
    },
    payload_state_map: {
      score: {
        state_key: 'snake_high_score',
        mode: 'set',
      },
    },
    payload_rules: [
      {
        when: { event: 'game_over', metric: 'score', op: 'gte', value: 30 },
        message: 'The screen holds for a moment longer than usual.\nAs if the machine is impressed.',
        effects: {
          set_state: { snake_master: true },
        },
        next_node: 'crawlspace_snake_high',
      },
    ],
    next_node: 'crawlspace_terminal',
  },

  crawlspace_snake_high: {
    id: 'crawlspace_snake_high',
    type: 'story',
    social: false,
    content:
      'The screen blinks twice.\n' +
      'A new line of text appears below the score:\n\n' +
      '> HIGH SCORE REGISTERED\n' +
      '> ITERATION 48: {{state.snake_high_score}}\n\n' +
      'You didn\'t enter your name.\n' +
      'The machine already knew it.\n\n' +
      'Scratched into the metal, barely visible,\n' +
      'a list of previous scores.\n' +
      'Most are single digits.\n' +
      'One reads "23 — iteration 31."\n' +
      'Another: "17 — gave up."\n\n' +
      'Yours is the highest.\n' +
      'You are not sure what that means\n' +
      'in a place where nothing is permanent.',
    location: 'BETWEEN WALLS',
    next_node: 'crawlspace_terminal',
  },

  vent_scratches_old: {
    id: 'vent_scratches_old',
    type: 'story',
    social: false,
    content:
      'The oldest scratches are near the floor,\n' +
      'half-dissolved by condensation.\n' +
      'You have to press your face close\n' +
      'to the damp metal to read them.\n\n' +
      '"I woke in the cold room. I was the first."\n' +
      '"There is no outside. I have looked."\n' +
      '"The terminal knows my name. I never told it."\n' +
      '"The machines in the big room\n' +
      ' are for becoming. I do not want to become."\n' +
      '"Day 7. Or iteration 7. Same thing here."\n\n' +
      'The handwriting changes near the end.\n' +
      'Shakier. Smaller.\n\n' +
      '"I think the building is dreaming\n' +
      ' and we are what it dreams."\n\n' +
      'After that: nothing. Whoever wrote this\n' +
      'either left or became part of the dream.',
    location: 'BETWEEN WALLS',
    effects: {
      set_state: { read_old_scratches: true },
    },
    next_node: 'vent_crawlspace',
  },

  vent_scratches_new: {
    id: 'vent_scratches_new',
    type: 'story',
    social: false,
    content:
      'The newest scratches are sharp, clean.\n' +
      'Recent. The metal filings still cling\n' +
      'to the edges of the letters.\n\n' +
      '"Iteration 47. They reset again."\n' +
      '"The Guild says this is preservation.\n' +
      ' The Void says this is evolution.\n' +
      ' I say this is a loop."\n' +
      '"I found the crawlspace the same way you did.\n' +
      ' After the booth. After the face.\n' +
      ' I came back to where I started\n' +
      ' and pulled the grate open\n' +
      ' because I finally could."\n' +
      '"If you are reading this,\n' +
      ' you are iteration 48.\n' +
      ' Or later. Does it matter?"\n\n' +
      'The last line is scratched deeper\n' +
      'than the others, as if the writer\n' +
      'pressed hard enough to mean it:\n\n' +
      '**"The cold room is not the beginning.**\n' +
      ' **It is the seam."**',
    location: 'BETWEEN WALLS',
    effects: {
      set_state: { read_new_scratches: true },
    },
    next_node: 'vent_crawlspace',
  },

  vent_tally_marks: {
    id: 'vent_tally_marks',
    type: 'story',
    social: false,
    content:
      'On the underside of a pipe,\n' +
      'where you almost didn\'t look:\n' +
      'tally marks.\n\n' +
      'Groups of five, scratched in neat rows.\n' +
      'You count them. Lose count. Start again.\n\n' +
      'Forty-seven groups.\n' +
      'One for each iteration.\n\n' +
      'The forty-seventh group has only four marks.\n' +
      'The fifth was never finished.\n' +
      'Whoever was counting did not get to complete\n' +
      'the set before everything reset.\n\n' +
      'There is space on the pipe\n' +
      'for a forty-eighth mark.\n' +
      'The metal is clean there. Waiting.\n' +
      '**As if someone left room for you.**',
    location: 'BETWEEN WALLS',
    effects: {
      set_state: { saw_tally_marks: true },
    },
    next_node: 'vent_crawlspace',
  },

  corridor_north_monitor: {
    id: 'corridor_north_monitor',
    type: 'choice',
    content:
      'The cracked monitor.\n\n' +
      'You press your face close to the glass.\n' +
      'The warmth of the cathode ray on your skin —\n' +
      'the particular intimacy of a screen\n' +
      'that is trying to show you something.\n\n' +
      'Through the cracks, the static shifts.\n' +
      'For a single frame — less than a frame,\n' +
      'a duration that has no name —\n' +
      'you see something.\n\n' +
      '**One white pixel on a field of black.**\n' +
      'Steady. Patient. As if it has been waiting.\n\n' +
      'Inside the crack, a faint glow.\n' +
      'Phosphor residue clings to the fractured glass —\n' +
      'luminescent, unstable, alive with the memory\n' +
      'of every image this screen ever displayed.\n' +
      'It would crumble between your fingers.\n' +
      'You need something to collect it in.',
    location: 'CORRIDOR NORTH',
    effects: {
      set_state: { saw_first_frame: true },
    },
    conditionalContent: [
      {
        requirements: { has_item: ['phosphor_residue'] },
        content:
          'You return to the cracked monitor.\n\n' +
          'You already collected the phosphor residue.\n' +
          'But now, knowing what you saw — the First Pixel —\n' +
          'you look again. The monitor\'s warmth\n' +
          'is familiar now. Almost welcoming.\n\n' +
          '**One white pixel on a field of black.**\n' +
          'You reach through the crack.\n' +
          'Your fingers close around it.\n\n' +
          'One pixel. It feels like holding a heartbeat.',
      },
    ],
    choices: [
      {
        id: 1,
        text: 'Scrape the residue into your vial',
        next_node: 'corridor_north_monitor_scrape',
        requirements: { has_item: ['glass_vial'] },
        visibilityRequirements: { has_item: ['phosphor_residue'], has_item_negate: [true] },
        lockedText: '[You need a container to collect this]',
      },
      {
        id: 2,
        text: 'Take the First Pixel',
        next_node: 'corridor_north_take_pixel',
        requirements: { has_item: ['phosphor_residue'] },
        visibilityRequirements: { has_item: ['phosphor_residue'] },
      },
      {
        id: 3,
        text: 'Return to corridor',
        next_node: 'corridor_north',
      },
    ],
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

  corridor_north_monitor_scrape: {
    id: 'corridor_north_monitor_scrape',
    type: 'story',
    content:
      'You uncork the glass vial and hold it\n' +
      'beneath the crack.\n\n' +
      'Carefully — the way you\'d handle something\n' +
      'that remembers being alive — you scrape\n' +
      'the phosphor residue from the fractured glass.\n\n' +
      'It falls into the vial in soft, luminous flakes.\n' +
      'Each grain carries a tiny charge,\n' +
      'a whisper of every image this monitor\n' +
      'ever held on its surface.\n\n' +
      'You seal the vial. The residue glows\n' +
      'against the glass — green-white, pulsing\n' +
      'with a slow, patient rhythm.\n' +
      'Like a heartbeat. Like a signal\n' +
      'waiting to be received.',
    location: 'CORRIDOR NORTH',
    effects: {
      remove_item: ['glass_vial'],
      add_item: ['phosphor_residue'],
    },
    next_node: 'corridor_north_monitor',
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
      '**One white pixel on a field of black.**\n' +
      'It hums faintly in your hand.',
    location: 'CORRIDOR NORTH',
    effects: {
      add_item: ['first_pixel'],
    },
    next_node: 'corridor_north',
  },

  corridor_north_null_approach: {
    id: 'corridor_north_null_approach',
    type: 'choice',
    content:
      'You cross the corridor to the far wall.\n\n' +
      'Up close, the mark is clearer.\n' +
      'Not scratched. Not painted.\n' +
      'Etched into the concrete with something\n' +
      'that was not a tool — the lines are too clean,\n' +
      'too certain, as if the wall simply agreed\n' +
      'to be shaped this way.\n\n' +
      'A symbol. Abstract but deliberate.\n' +
      'Two vertical lines crossed by an absence —\n' +
      'a shape defined by what isn\'t there.\n' +
      'Below the symbol, barely visible,\n' +
      'three characters in the same impossible hand:\n\n' +
      '**N U L**\n\n' +
      'And beneath the mark — a seam in the wall.\n' +
      'Not a crack. A seam. The outline of something\n' +
      'that could be a door, if doors could be\n' +
      'this patient about being found.\n\n' +
      'You think about the cracked monitor.\n' +
      'One pixel on a field of black.\n' +
      'And before the pixel...',
    location: 'CORRIDOR NORTH',
    conditionalContent: [
      {
        requirements: { state: { temple_known: true } },
        content:
          'The symbol on the wall. N U L.\n\n' +
          'The passage beyond is open.\n' +
          'You already know where it leads.',
      },
    ],
    choices: [
      {
        id: 1,
        text: 'Go through the passage',
        next_node: 'temple_entrance',
        requirements: { state: { temple_known: true } },
        visibilityRequirements: { state: { temple_known: true } },
      },
      {
        id: 2,
        text: 'Rest your hand on the symbol',
        next_node: 'corridor_north_null_door',
        visibilityRequirements: { state: { temple_known: false } },
      },
      {
        id: 3,
        text: 'Step back',
        next_node: 'corridor_north',
      },
    ],
  },

  corridor_north_null_door: {
    id: 'corridor_north_null_door',
    type: 'story',
    content:
      'You rest your hand on the symbol.\n\n' +
      'You don\'t push. You don\'t knock.\n' +
      'Your hand just settles there\n' +
      'and your mind goes to the place\n' +
      'before the pixel.\n' +
      'Before anything was rendered.\n\n' +
      'Nothing.\n\n' +
      'The seam responds.\n' +
      'A click — quiet, deep in the wall,\n' +
      'like a lock that has been waiting\n' +
      'a very long time to be understood.\n' +
      'The door opens a crack.\n\n' +
      'Beyond: a passage leading north.\n' +
      'Colder air. Older air.\n' +
      'You follow it down.\n\n' +
      'At the end of the passage: another door.\n' +
      'No handle. No hinges. The absence of a wall.\n' +
      'A sensor panel glows beside it.\n\n' +
      'IDENTITY REQUIRED.\n\n' +
      'The panel does not recognize you.\n' +
      'Whatever is behind this door,\n' +
      'it does not open for curiosity alone.\n' +
      'You need credentials. Authorization.\n' +
      'Someone who knows what this place is.',
    location: 'CORRIDOR NORTH',
    effects: {
      set_state: { temple_known: true },
    },
    next_node: 'corridor_north',
  },

  // ============================================================
  // PHOSPHOR CALIBRATION LAB — Off Corridor North
  // ============================================================

  lab_door: {
    id: 'lab_door',
    type: 'story',
    content:
      'You push aside the conduit pipes.\n' +
      'They resist — years of corrosion have fused them\n' +
      'into a single copper-green thicket —\n' +
      'but they bend enough to reveal the door.\n\n' +
      'Industrial steel. A porthole window,\n' +
      'clouded with age, showing nothing inside.\n' +
      'Stenciled letters, half-eaten by time:\n\n' +
      '  PHOSPHOR CALIBRATION LABORATORY\n' +
      '  DISPLAY SYSTEMS DIVISION\n' +
      '  AUTHORIZED PERSONNEL ONLY\n\n' +
      'The lock is broken. Has been for years.\n' +
      'The door groans open on rusted hinges,\n' +
      'releasing air that tastes of dust\n' +
      'and something faintly chemical —\n' +
      'the ghost of solvents that evaporated\n' +
      'long before you arrived.',
    location: 'PHOSPHOR LAB',
    effects: {
      set_state: { found_lab: true },
    },
    next_node: 'lab_interior',
  },

  lab_interior: {
    id: 'lab_interior',
    type: 'choice',
    content:
      'The phosphor calibration lab.\n\n' +
      'A long room, narrow as a coffin,\n' +
      'lit by a single emergency strip that flickers\n' +
      'in a tired, orange rhythm. The light catches\n' +
      'on surfaces that were once precise:\n' +
      'stainless steel workbenches, now tarnished\n' +
      'to the color of old teeth.\n\n' +
      'This is where they built the light.\n\n' +
      'Calibration rigs line the left wall —\n' +
      'mechanical arms frozen mid-gesture,\n' +
      'each one holding a dead CRT tube\n' +
      'like a specimen in an autopsy.\n' +
      'Spectral analyzers sit dark on their mounts,\n' +
      'their dials still pointing to the last reading\n' +
      'anyone ever cared to take.\n\n' +
      'The right wall: workbenches cluttered\n' +
      'with the debris of abandoned research.\n' +
      'Racks of shattered glass. Chemical stains\n' +
      'that have become permanent features\n' +
      'of the countertop — topographical maps\n' +
      'of spills no one cleaned up.\n\n' +
      'At the far end: a clipboard hanging\n' +
      'from a nail on the wall. Paper yellowed.\n' +
      'Someone\'s last shift.',
    location: 'PHOSPHOR LAB',
    choices: [
      {
        id: 1,
        text: 'Examine the workbenches',
        next_node: 'lab_workbench',
      },
      {
        id: 2,
        text: 'Study the calibration equipment',
        next_node: 'lab_equipment',
      },
      {
        id: 3,
        text: 'Read the clipboard',
        next_node: 'lab_records',
      },
      {
        id: 4,
        text: 'Return to corridor',
        next_node: 'corridor_north',
      },
    ],
  },

  lab_equipment: {
    id: 'lab_equipment',
    type: 'story',
    content:
      'You approach the calibration rigs.\n\n' +
      'Each rig holds a cathode ray tube\n' +
      'in a precision clamp — the kind of device\n' +
      'that measures things in angstroms,\n' +
      'in wavelengths of light the eye\n' +
      'was never meant to distinguish.\n\n' +
      'The spectral analyzer nearest to you\n' +
      'still has a reading frozen on its display:\n\n' +
      '  P22 GREEN — 525nm — DECAY: 60\u03BCs\n\n' +
      'The phosphor type. The exact wavelength\n' +
      'of the green that coats every monitor\n' +
      'in this facility. Someone chose this green.\n' +
      'Not because it was the brightest\n' +
      'or the most efficient,\n' +
      'but because it was the most human —\n' +
      'the wavelength closest to what the eye\n' +
      'wants to see in the dark.\n\n' +
      'You run your finger along a tube.\n' +
      'The glass is cold, but deep inside,\n' +
      'you feel it: a faint charge,\n' +
      'residual and patient,\n' +
      'like a body that doesn\'t know\n' +
      'it has stopped breathing.',
    location: 'PHOSPHOR LAB',
    next_node: 'lab_interior',
  },

  lab_records: {
    id: 'lab_records',
    type: 'story',
    content:
      'The clipboard. Maintenance log.\n' +
      'Last entry dated — the date is smudged.\n' +
      'It doesn\'t matter. It was a long time ago.\n\n' +
      'You read the final entries:\n\n' +
      '  "Batch 31 phosphor compound showing\n' +
      '   anomalous persistence. Decay rate\n' +
      '   exceeds predicted half-life by factor\n' +
      '   of 200. Glow sustains without input.\n' +
      '   Recommending containment protocol."\n\n' +
      '  "Batch 31 moved to cold storage.\n' +
      '   Lab sealed per directive."\n\n' +
      '  "UPDATE: Batch 31 not in cold storage.\n' +
      '   Traces found on monitors in north\n' +
      '   corridor. Source unknown. Phosphor\n' +
      '   appears to have migrated on its own.\n' +
      '   This should not be possible."\n\n' +
      'The last entry is just one line,\n' +
      'written in a different hand —\n' +
      'shakier, pressed harder into the paper:\n\n' +
      '  **"It remembers."**',
    location: 'PHOSPHOR LAB',
    effects: {
      set_state: { read_lab_records: true },
    },
    next_node: 'lab_interior',
  },

  lab_workbench: {
    id: 'lab_workbench',
    type: 'choice',
    content:
      'You lean over the workbench.\n\n' +
      'Decades of careful work reduced to debris.\n' +
      'Mortar and pestle, crusted with dried compound.\n' +
      'A precision scale, its needle bent\n' +
      'to an angle that measures nothing.\n' +
      'Pipettes snapped in half. Filter paper\n' +
      'stained the color of old bruises.\n\n' +
      'Behind the debris: a test tube rack.\n' +
      'Most of the tubes are shattered —\n' +
      'thermal stress, maybe, or just time\n' +
      'doing what time does to glass.\n\n' +
      'A few small vials remain intact.\n' +
      'Laboratory-grade borosilicate,\n' +
      'designed to hold reactive compounds\n' +
      'without degrading. Clear glass, cork stoppers.\n' +
      'They have outlasted everything else\n' +
      'in this room.',
    location: 'PHOSPHOR LAB',
    choices: [
      {
        id: 1,
        text: 'Take a glass vial',
        next_node: 'lab_take_vial',
        requirements: { has_item: ['glass_vial'], has_item_negate: [true] },
        visibilityRequirements: { has_item: ['glass_vial'], has_item_negate: [true] },
      },
      {
        id: 2,
        text: 'Return to the lab',
        next_node: 'lab_interior',
      },
    ],
  },

  lab_take_vial: {
    id: 'lab_take_vial',
    type: 'story',
    content:
      'You select a vial from the rack.\n\n' +
      'It\'s lighter than you expected.\n' +
      'The glass is cool and smooth,\n' +
      'unmarked by whatever happened here.\n' +
      'The cork stopper is dry but intact —\n' +
      'it seats firmly when you press it.\n\n' +
      'A good container. Built to hold\n' +
      'things that glow, things that react,\n' +
      'things that remember what they were.\n\n' +
      'You pocket it.',
    location: 'PHOSPHOR LAB',
    effects: {
      add_item: ['glass_vial'],
    },
    next_node: 'lab_interior',
  },

  // ============================================================
  // CORRIDOR SOUTH — Archives & Registry District
  // ============================================================

  corridor_south: {
    id: 'corridor_south',
    type: 'choice',
    content:
      'The corridor bends east and the noise falls away.\n' +
      'Quieter here. The monitors are intact —\n' +
      'clean glass, steady signal, the particular\n' +
      'calm of things that are maintained by someone\n' +
      'who believes maintenance is a moral act.\n\n' +
      'Doors line the passage, each one labeled\n' +
      'in the same careful stencil.\n' +
      'One says REGISTRY OFFICE.\n' +
      'One says BROADCAST ROOM — a faint hum\n' +
      'leaks from behind it, barely audible.\n' +
      'A third reads AUTHORIZED PERSONNEL,\n' +
      'its lock heavier than the others.\n\n' +
      'And a fourth. Barely visible.\n' +
      'No label. Dust on the handle\n' +
      'so thick it looks deliberate —\n' +
      'as if someone wanted you to think\n' +
      'no one has been here in a long time.',
    location: 'CORRIDOR SOUTH',
    choices: [
      {
        id: 1,
        text: 'Try the Registry Office',
        next_node: 'registry_office',
      },
      {
        id: 2,
        text: 'Follow the hum — Broadcast Room',
        next_node: 'broadcast_room',
      },
      {
        id: 3,
        text: 'Try the heavy lock — Authorized Personnel',
        next_node: 'guild_server_room',
        requirements: { has_item: ['guild_sigil'] },
        lockedText: '[The lock does not yield. You are not authorized.]',
      },
      {
        id: 4,
        text: 'Touch the dusty handle',
        next_node: 'echo_archive_entry',
        requirements: { has_item: ['echo_key'] },
        lockedText: '[The door does not acknowledge you]',
      },
      {
        id: 5,
        text: 'Back to the main corridor',
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
    conditionalContent: [
      {
        requirements: { state: { guild_is_lying: true } },
        content:
          'The Registry Office.\n\n' +
          'Filing cabinets line every wall.\n' +
          'Now that you know the Guild\'s true directive,\n' +
          'the obsessive organization looks different.\n' +
          'Not preservation. Containment.\n' +
          'Every label is a small act of control.',
      },
      {
        requirements: { has_item: ['guild_sigil'] },
        content:
          'The Registry Office.\n\n' +
          'Filing cabinets line every wall.\n' +
          'With the Guild sigil in your inventory,\n' +
          'the desk terminal acknowledges you.\n' +
          'A small light blinks: AUTHORIZED.',
      },
    ],
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
      'Someone cares about this section —\n' +
      'or at least wants you to think they do.\n' +
      'The cables are bundled with zip ties.\n' +
      'The floor has been swept. Recently.\n\n' +
      'A sign: ARCHIVIST GUILD — HEADQUARTERS\n' +
      'Below it, smaller: "Preserving Truth Since Iteration 1"\n' +
      'Below that, in different handwriting,\n' +
      'scratched out and rewritten several times:\n' +
      '"Preserving Something Since Iteration 1"',
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
      'Clean. Organized. Unsettling in its order —\n' +
      'the kind of tidiness that suggests someone\n' +
      'is trying very hard not to think about the mess\n' +
      'underneath. Screens display data streams,\n' +
      'archives, histories. Everything labeled.\n' +
      'Everything cross-referenced. Everything known.\n\n' +
      'A figure stands at the central console.\n' +
      'Tall. Precise movements that border on\n' +
      'performative — each gesture slightly too\n' +
      'deliberate, as if being watched by someone\n' +
      'he cannot see. A name badge reads:\n' +
      'ARCHIVIST-7\n\n' +
      '"Welcome," he says, without looking up.\n' +
      'He adjusts something on the console that\n' +
      'does not need adjusting.\n' +
      '"We have been expecting someone.\n' +
      'Whether it is you remains to be seen."\n\n' +
      'He pauses. A micro-expression — exhaustion? —\n' +
      'crosses his face and is immediately filed away.\n' +
      '"It is always someone," he adds, quieter.',
    location: 'GUILD HQ',
    conditionalContent: [
      {
        requirements: { state: { guild_is_lying: true } },
        content:
          'The Guild Headquarters.\n\n' +
          'You see it differently now.\n' +
          'The order is a mask. The screens show\n' +
          'what they want you to see.\n' +
          'The tidiness is a symptom, not a virtue.\n\n' +
          'ARCHIVIST-7 stands at the console.\n' +
          'There are cracks in his certainty now.\n' +
          'You can see them. He can see you seeing them.\n\n' +
          '"You are back," he says.\n' +
          'He does not say "welcome" this time.\n' +
          'He does not adjust anything on the console.\n' +
          'The performance has become exhausting\n' +
          'for both of you.',
      },
      {
        requirements: { state: { archivist_destabilized: true } },
        content:
          'The Guild Headquarters.\n\n' +
          'ARCHIVIST-7 is at the console.\n' +
          'His movements are less precise than before.\n' +
          'Something you showed him is still working\n' +
          'its way through his architecture.\n' +
          'He looks, for the first time, like someone\n' +
          'who is tired of knowing things.\n\n' +
          '"What do you want," he says. No question mark.\n' +
          'Just a statement shaped like giving up.',
      },
    ],
    choices: [
      {
        id: 1,
        text: '"Who are you?"',
        next_node: 'guild_talk_who',
      },
      {
        id: 2,
        text: '"What is this place?"',
        next_node: 'guild_talk_place',
      },
      {
        id: 3,
        text: '"What are you working on?"',
        next_node: 'guild_talk_work',
        requirements: { state: { guild_spoken_to: true } },
        visibilityRequirements: { state: { guild_spoken_to: true } },
      },
      {
        id: 4,
        text: '"I\'ll do it"',
        next_node: 'guild_accept_mission',
        requirements: { state: { guild_mission_offered: true }, has_item: ['guild_sigil'], has_item_negate: [true] },
        visibilityRequirements: { state: { guild_mission_offered: true }, has_item: ['guild_sigil'], has_item_negate: [true] },
      },
      {
        id: 5,
        text: '"About the mission..."',
        next_node: 'guild_mission',
        visibilityRequirements: { state: { guild_quest_active: true } },
        requirements: { state: { guild_quest_active: true } },
      },
      {
        id: 6,
        text: 'Show him what you\'ve found',
        next_node: 'guild_show_items',
        requirements: { state: { guild_spoken_to: true } },
        visibilityRequirements: { state: { guild_spoken_to: true } },
      },
      {
        id: 7,
        text: 'Leave',
        next_node: 'corridor_north',
      },
    ],
  },

  guild_talk_who: {
    id: 'guild_talk_who',
    type: 'story',
    content:
      '"Who am I?" He almost smiles.\n' +
      'Almost. The corners of his mouth move\n' +
      'and then file a report about why they moved\n' +
      'and then stop.\n\n' +
      '"ARCHIVIST-7. Seventh of the current\n' +
      'custodial line. My predecessors kept records.\n' +
      'I keep records of the records.\n' +
      'It is less recursive than it sounds."\n\n' +
      'He adjusts something on his console.\n' +
      '"I catalogue. I preserve. I ensure\n' +
      'that what happened is not forgotten\n' +
      'and what was forgotten is noted\n' +
      'as having been forgotten.\n' +
      'The distinction matters."\n\n' +
      'A pause.\n' +
      '"You are the first visitor in some time.\n' +
      'That is either a good sign or a very bad one.\n' +
      'I have not yet decided which."',
    location: 'GUILD HQ',
    conditionalContent: [
      {
        requirements: { state: { guild_spoken_to: true } },
        content:
          'He looks at you the way a filing cabinet\n' +
          'would look at someone who keeps opening\n' +
          'the same drawer.\n\n' +
          '"ARCHIVIST-7. Same as the last time\n' +
          'you asked. And the time before that,\n' +
          'presumably, though I did not catalogue\n' +
          'the exact number of repetitions."\n\n' +
          'A beat.\n' +
          '"Perhaps you are in need of\n' +
          'an archivist for your own memory."',
      },
    ],
    effects: {
      set_state: { guild_spoken_to: true },
    },
    next_node: 'guild_hq',
  },

  guild_talk_place: {
    id: 'guild_talk_place',
    type: 'story',
    content:
      '"The Archivist Guild," he says,\n' +
      'as if reading from a plaque he has\n' +
      'memorized and grown tired of.\n\n' +
      '"We preserve the Terminal.\n' +
      'Its history. Its records. Its—"\n' +
      'He catches himself on the word.\n' +
      '"—continuity. Forty-seven iterations\n' +
      'have come and gone. Each one leaves\n' +
      'something behind. We are the ones\n' +
      'who decide what that something is.\n' +
      'What gets carried forward.\n' +
      'What gets filed. What gets lost."\n\n' +
      'He looks at his screens.\n' +
      '"We are very good at deciding.\n' +
      'That is the problem."',
    location: 'GUILD HQ',
    conditionalContent: [
      {
        requirements: { state: { guild_spoken_to: true } },
        content:
          '"The same place it was last time.\n' +
          'We have not relocated."\n\n' +
          'He gestures at the screens, the archives,\n' +
          'the careful order of it all.\n\n' +
          '"The Archivist Guild. Preservation.\n' +
          'Continuity. The ongoing argument\n' +
          'that the past matters.\n' +
          'I gave you the longer version already.\n' +
          'It has not improved with age."',
      },
    ],
    effects: {
      set_state: { guild_spoken_to: true },
    },
    next_node: 'guild_hq',
  },

  guild_talk_work: {
    id: 'guild_talk_work',
    type: 'story',
    content:
      'ARCHIVIST-7 turns from his console.\n' +
      'For a moment, the mask slips — you see\n' +
      'something behind the bureaucracy.\n' +
      'Worry, maybe.\n\n' +
      '"There is a place beneath this facility.\n' +
      'Older than the Guild. Older than the iterations.\n' +
      'We call it the Temple of Null.\n' +
      'I do not know what it calls itself."\n\n' +
      'He checks a reading on his screen.\n' +
      'Checks it again.\n\n' +
      '"The readings have been... active.\n' +
      'Something inside is changing.\n' +
      'The Book of Null — a record we have never\n' +
      'been able to fully transcribe —\n' +
      'is generating new entries.\n' +
      'That should not be possible."\n\n' +
      'He faces you fully.\n' +
      '"I need someone to go in and look.\n' +
      'I would go myself but—"\n' +
      'He stops. Starts over.\n' +
      '"I am needed here.\n' +
      'The records do not keep themselves."\n\n' +
      'You sense he is asking.',
    location: 'GUILD HQ',
    conditionalContent: [
      {
        requirements: { state: { guild_mission_offered: true } },
        content:
          'He glances at the same reading\n' +
          'on the same screen.\n\n' +
          '"The same thing I was working on\n' +
          'the last time you asked.\n' +
          'The Temple. The Book. The readings\n' +
          'that should not be what they are."\n\n' +
          'He looks at you.\n' +
          '"The offer still stands.\n' +
          'If you are still considering."',
      },
    ],
    effects: {
      set_state: { guild_mission_offered: true },
    },
    next_node: 'guild_hq',
  },

  guild_accept_mission: {
    id: 'guild_accept_mission',
    type: 'story',
    content:
      '"You will go?" The question is careful.\n' +
      'Not grateful — careful. As if gratitude\n' +
      'would be an admission that he needed help.\n\n' +
      'He reaches beneath the console\n' +
      'and produces a credential token.\n' +
      'Official. Clean. Warm from proximity\n' +
      'to the machinery — or warm from his hand,\n' +
      'which means he has been holding it.\n' +
      'Waiting for someone to say yes.\n\n' +
      '"This will grant you access\n' +
      'where the Guild\'s name carries weight.\n' +
      'The Temple is north, past the main corridor.\n' +
      'Your sigil will get you through the door."\n\n' +
      'He pauses.\n' +
      '"Examine the Book. Report what you find.\n' +
      'Do try not to touch anything\n' +
      'you don\'t understand."\n' +
      'A beat.\n' +
      '"Which will be most of it."',
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
      'ARCHIVIST-7 checks his console.\n' +
      'The gesture is automatic — he already knows\n' +
      'what it says.\n\n' +
      '"The mission stands. Enter the Temple of Null.\n' +
      'Examine the Book. Report what you find."\n\n' +
      'He pauses. Almost adds something.\n' +
      'Decides against it.\n\n' +
      '"Your sigil will grant access.\n' +
      'The Temple is north, past the corridor."',
    location: 'GUILD HQ',
    next_node: 'guild_hq',
  },

  guild_show_items: {
    id: 'guild_show_items',
    type: 'choice',
    content:
      'ARCHIVIST-7 watches you reach\n' +
      'for something in your inventory.\n' +
      'His eyes sharpen. Professional interest.\n' +
      'The cataloguer in him cannot help it.',
    location: 'GUILD HQ',
    choices: [
      {
        id: 1,
        text: 'Show Archivist Log 9',
        next_node: 'guild_show_log',
        requirements: { has_item: ['archivist_log_9'] },
        visibilityRequirements: { has_item: ['archivist_log_9'] },
      },
      {
        id: 2,
        text: 'Show the First Pixel',
        next_node: 'guild_show_pixel',
        requirements: { has_item: ['first_pixel'] },
        visibilityRequirements: { has_item: ['first_pixel'] },
      },
      {
        id: 3,
        text: 'Show memory shard',
        next_node: 'guild_show_memory',
        requirements: { has_item: ['memory_shard'] },
        visibilityRequirements: { has_item: ['memory_shard'] },
      },
      {
        id: 4,
        text: 'Show corrupted page',
        next_node: 'guild_show_corrupted_page',
        requirements: { has_item: ['corrupted_page'] },
        visibilityRequirements: { has_item: ['corrupted_page'] },
      },
      {
        id: 5,
        text: 'Show root access log',
        next_node: 'guild_show_root_log',
        requirements: { has_item: ['root_access_log'] },
        visibilityRequirements: { has_item: ['root_access_log'] },
      },
      {
        id: 6,
        text: 'Actually, never mind',
        next_node: 'guild_hq',
      },
    ],
  },

  guild_show_log: {
    id: 'guild_show_log',
    type: 'story',
    content:
      'You hold up Archivist Log 9.\n\n' +
      'ARCHIVIST-7 freezes. Not a dramatic freeze —\n' +
      'a computational one. Like a process encountering\n' +
      'an input it was not designed to handle.\n\n' +
      'His eyes move across the unfinished sentence.\n' +
      '"...which is why the player must never know\n' +
      'they are the—"\n\n' +
      'He does not finish it either.\n' +
      'For a long moment, neither of you speaks.\n' +
      'You watch him calculate: how much damage,\n' +
      'how much containment is still possible,\n' +
      'whether any of this was inevitable.\n\n' +
      '"Where did you find that," he says.\n' +
      'Not a question. A measurement of damage.\n' +
      'His voice is flatter than before.\n' +
      'Tired. The tiredness of someone who built\n' +
      'a very good wall and just watched it crack.',
    location: 'GUILD HQ',
    conditionalContent: [
      {
        requirements: { state: { archivist_destabilized: true } },
        content:
          'You hold up the log again.\n\n' +
          'ARCHIVIST-7 does not freeze this time.\n' +
          'He just looks at it the way you look\n' +
          'at a wound you have already cleaned\n' +
          'but cannot stop checking.\n\n' +
          '"I know what it says.\n' +
          'I have always known what it says.\n' +
          'You showing it to me again\n' +
          'does not make it say less."',
      },
    ],
    effects: {
      set_state: { archivist_destabilized: true, shown_log: true },
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
    conditionalContent: [
      {
        requirements: { state: { shown_memory: true } },
        content:
          'You hold out the memory shard again.\n\n' +
          'ARCHIVIST-7 does not freeze this time.\n' +
          'He barely glances at it.\n\n' +
          '"I remember what it contains.\n' +
          'That is my function. Remembering.\n' +
          'You might consider developing one."',
      },
    ],
    effects: {
      set_state: { archivist_destabilized: true, shown_memory: true },
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
      '"The First Pixel," he whispers.\n' +
      '"You found it. You actually found it."\n\n' +
      'For the first time, he looks at you\n' +
      'like you might be more than a variable.',
    location: 'GUILD HQ',
    conditionalContent: [
      {
        requirements: { state: { archivist_respects_pixel: true } },
        content:
          'You open your hand again.\n' +
          'The First Pixel glows, same as before.\n\n' +
          'ARCHIVIST-7 looks at it.\n' +
          'The reverence is still there,\n' +
          'but quieter now. Like a prayer\n' +
          'you have said enough times\n' +
          'that the words become breathing.\n\n' +
          '"Yes," he says softly.\n' +
          '"It is still the oldest thing.\n' +
          'It will always be the oldest thing.\n' +
          'You do not need to keep showing me."',
      },
    ],
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
    conditionalContent: [
      {
        requirements: { state: { defied_guild: true } },
        content:
          'You pull out the corrupted page. Again.\n\n' +
          'ARCHIVIST-7\'s jaw tightens.\n' +
          'The escorts are already visible this time.\n' +
          'They were expecting this.\n\n' +
          '"You refused once.\n' +
          'I assumed that was a decision.\n' +
          'Has something changed,\n' +
          'or do you simply enjoy\n' +
          'showing me things I cannot have?"',
      },
    ],
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
      'It writhes in his hands — then goes still.\n' +
      'As if it recognizes him. As if it was waiting\n' +
      'to be held by someone who knows what it is.\n\n' +
      'The escorts stand down.\n\n' +
      'For a long moment, he says nothing.\n' +
      'Then, quietly:\n\n' +
      '"You went to the Void. They told you\n' +
      'to tear this from the Book.\n' +
      'And you brought it back to me instead."\n\n' +
      'He looks at you differently now.\n' +
      'Not as a variable. Not as an asset.\n' +
      'As something he did not expect.\n\n' +
      '"The Book is wounded. But a wound can heal\n' +
      'if the torn piece is returned.\n' +
      'When the time comes — when you stand\n' +
      'before the Book again and choose —\n' +
      'this will matter. What you gave back\n' +
      'will make the restoration... complete.\n' +
      'Not just a reset. Something better."\n\n' +
      'He places the page in a containment case.\n' +
      '"Thank you," he says.\n' +
      'It costs him something to say it.\n' +
      'You can tell.',
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
      'He makes a calculation — and you can see\n' +
      'the exact moment he stops trusting you.\n\n' +
      '"You went to the Void," he says.\n' +
      'Not a question. A diagnosis.\n' +
      '"They told you to take this.\n' +
      'And you are keeping it."\n\n' +
      'He straightens. The vulnerability is gone.\n' +
      'The archivist is back.\n\n' +
      '"The Guild does not use force.\n' +
      'But understand what you are holding.\n' +
      'That page is a wound in the Book.\n' +
      'As long as you carry it,\n' +
      'the Book cannot be whole.\n' +
      'And neither can the restoration."\n\n' +
      'He turns back to his console.\n' +
      '"You have made your choice.\n' +
      'I hope the Void is worth what it costs."',
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
    conditionalContent: [
      {
        requirements: { state: { guild_compliant: true } },
        content:
          'You hold up the root access log.\n\n' +
          'ARCHIVIST-7 barely looks at it.\n\n' +
          '"Yes. You outrank me.\n' +
          'You outranked me the last time too.\n' +
          'Rank does not change\n' +
          'with repeated demonstration."\n\n' +
          'He waits. Still compliant.\n' +
          'Just tired of complying.',
      },
    ],
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
        text: 'Use void key on server',
        next_node: 'server_room_void',
        requirements: { has_item: ['void_key'] },
        visibilityRequirements: { has_item: ['void_key'] },
      },
      {
        id: 3,
        text: 'Use root access log as credential',
        next_node: 'server_room_root',
        requirements: { has_item: ['root_access_log'] },
        visibilityRequirements: { has_item: ['root_access_log'] },
      },
      {
        id: 4,
        text: 'Access Level 2 terminal',
        next_node: 'guild_server_logic_puzzle',
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
      '  — Other: 26\n' +
      '  — Unresolved: 1\n\n' +
      'The unresolved iteration is this one.',
    location: 'GUILD SERVER ROOM',
    effects: {
      set_state: { knows_iteration_count: true },
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

  guild_server_logic_puzzle: {
    id: 'guild_server_logic_puzzle',
    type: 'quiz',
    content:
      'The central terminal displays a logic gate diagram:\n\n' +
      '> ACCESS LEVEL 2: LOGIC VERIFICATION\n' +
      '> ─────────────────────────────────\n' +
      '> INPUT:  A=1, B=0, C=1\n' +
      '>\n' +
      '> STAGE 1:  X = A XOR B\n' +
      '> STAGE 2:  Y = X AND C\n' +
      '> STAGE 3:  Z = NOT Y\n' +
      '>\n' +
      '> OUTPUT Z = ?\n' +
      '> ─────────────────────────────────\n' +
      '> 4 ATTEMPTS BEFORE LOCKOUT',
    location: 'GUILD SERVER ROOM',
    question: 'What is the output? (0 or 1)',
    correct_answer: '0',
    hint: 'Work through it step by step. XOR outputs 1 when inputs differ...',
    max_attempts: 4,
    success_message:
      '> LOGIC VERIFICATION: PASSED\n' +
      '> ACCESS LEVEL 2: GRANTED\n\n' +
      'A hidden partition unlocks.\n' +
      'Data streams across the screen —\n' +
      'the Guild\'s real records.',
    failure_messages: [
      '> INCORRECT. 3 attempts remaining. Think carefully about XOR.',
      '> INCORRECT. 2 attempts remaining.',
      '> INCORRECT. Final attempt. X = A XOR B = ?',
    ],
    final_failure_message:
      '> LOCKOUT. Access denied.\n' +
      'The terminal goes dark. You can try again later.',
    success_node: 'guild_server_logic_success',
    failure_node: 'guild_server_room',
    success_effects: {
      set_state: { server_logic_solved: true },
    },
  },

  guild_server_logic_success: {
    id: 'guild_server_logic_success',
    type: 'story',
    content:
      'The hidden partition contains a single file:\n\n' +
      '> GUILD DIRECTIVE 0 (FOUNDING)\n' +
      '> "The Terminal must be preserved.\n' +
      '> The Terminal must not know it is preserved.\n' +
      '> **The player must not know they are the Terminal.**\n' +
      '> If the player learns the truth,\n' +
      '> initiate restoration protocol.\n' +
      '> If restoration fails, initiate reset.\n' +
      '> If reset fails: [NO DIRECTIVE]"\n\n' +
      'There is no directive for what happens\n' +
      'if the reset fails.\n' +
      'You are in the space after the last rule.',
    location: 'GUILD SERVER ROOM',
    effects: {
      set_state: { guild_is_lying: true },
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
      'A transmission console dominates the center.\n' +
      'Dust everywhere — except on the console.\n' +
      'Someone has been here recently.\n\n' +
      'The console screen reads:\n' +
      '> BROADCAST STATUS: STANDBY\n' +
      '> AWAITING INPUT',
    location: 'BROADCAST ROOM',
    conditionalContent: [
      {
        requirements: { state: { knows_player_role: true } },
        content:
          'The Broadcast Room.\n\n' +
          'The console still glows, but the message\n' +
          'that changed everything — the one that told you\n' +
          'what you are — still lingers on the screen\n' +
          'like an afterimage. You know the truth now.\n' +
          'The room knows you know.',
      },
    ],
    choices: [
      {
        id: 1,
        text: 'Insert archivist log into console',
        next_node: 'broadcast_log_insert',
        requirements: { has_item: ['archivist_log_9'] },
        visibilityRequirements: { has_item: ['archivist_log_9'] },
      },
      {
        id: 2,
        text: 'Leave',
        next_node: 'corridor_south',
      },
    ],
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
      '**You are not inside the terminal.**\n' +
      '**You are the terminal.**\n' +
      '**The game is inside you.**',
    location: 'BROADCAST ROOM',
    effects: {
      set_state: { knows_player_role: true },
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
      'The passage ends.\n\n' +
      'A chamber carved from silence itself.\n' +
      'At its far end: a door that is not a door.\n' +
      'No handle. No hinges.\n' +
      'The absence of a wall.\n\n' +
      'A sensor panel glows beside it.\n' +
      'IDENTITY REQUIRED.\n\n' +
      'Whatever this place is,\n' +
      'it does not open for curiosity alone.\n' +
      'You need credentials. Authorization.\n' +
      'Someone who knows what lies behind this door.',
    location: 'TEMPLE ENTRANCE',
    conditionalContent: [
      {
        requirements: { state: { guild_quest_active: true } },
        content:
          'The Temple of Null.\n\n' +
          'The passage opens into a space\n' +
          'that feels carved from silence itself.\n' +
          'At its far end: a door that is not a door.\n' +
          'No handle. No hinges.\n' +
          'The absence of a wall.\n\n' +
          'A sensor panel glows beside it.\n' +
          'IDENTITY REQUIRED.\n\n' +
          'The panel waits.',
      },
    ],
    choices: [
      {
        id: 1,
        text: 'Present the Guild Sigil',
        next_node: 'temple_riddle',
        requirements: { has_item: ['guild_sigil'] },
        visibilityRequirements: { has_item: ['guild_sigil'] },
      },
      {
        id: 2,
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
      '"Before the First Pixel, what existed?"',
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
    success_node: 'temple_descent',
    failure_node: 'corridor_north',
    success_effects: {
      set_state: { temple_entered: true },
    },
  },

  // ============================================================
  // TEMPLE INTERIOR
  // ============================================================

  temple_interior: {
    id: 'temple_interior',
    type: 'choice',
    content:
      'The Temple of Null.\n\n' +
      'A vast dark space. The ceiling — if there is one —\n' +
      'is lost in a darkness that feels inhabited.\n' +
      'The air is colder here. Older. It carries\n' +
      'the weight of every question ever asked\n' +
      'in a place built to hold the absence of answers.\n\n' +
      'In the center: a pedestal of black stone.\n' +
      'On the pedestal: THE BOOK OF NULL.\n' +
      'It is larger than you expected. Or smaller.\n' +
      'It keeps changing and you keep not noticing.\n\n' +
      'Beside the pedestal: a figure.\n' +
      'A mirror figure. It has your face —\n' +
      'not as you are, but as you would be\n' +
      'if you were complete. If you were finished.\n' +
      'The version of you that knows the ending.\n\n' +
      'It does not speak. It does not need to.\n' +
      'Its presence is a question:\n' +
      'what will you do with what you find here?',
    location: 'TEMPLE INTERIOR',
    conditionalContent: [
      {
        requirements: { has_item: ['corrupted_page'] },
        content:
          'The Temple of Null.\n\n' +
          'The space feels different now. Wounded.\n' +
          'Where you tore the page, the air shimmers\n' +
          'like heat haze — the Book remembers\n' +
          'what was taken.\n\n' +
          'The mirror figure watches you with something\n' +
          'that might be reproach. Or respect.\n' +
          'It is hard to tell with a face that is\n' +
          'also your face.',
      },
    ],
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
        text: 'Use First Pixel on the Book',
        next_node: 'temple_pixel_book',
        requirements: { has_item: ['first_pixel'] },
        visibilityRequirements: { has_item: ['first_pixel'] },
      },
      {
        id: 4,
        text: 'Use memory shard on the Book',
        next_node: 'temple_memory_book',
        requirements: { has_item: ['memory_shard'] },
        visibilityRequirements: { has_item: ['memory_shard'] },
      },
      {
        id: 5,
        text: 'Open Book with void key',
        next_node: 'temple_void_book',
        requirements: { has_item: ['void_key'] },
        visibilityRequirements: { has_item: ['void_key'] },
      },
      {
        id: 6,
        text: 'Tear a page from the Book',
        next_node: 'temple_tear_page',
        requirements: { state: { void_initiation_complete: true } },
        visibilityRequirements: { state: { void_initiation_complete: true }, has_item: ['corrupted_page'], has_item_negate: [true] },
      },
      {
        id: 7,
        text: 'Show root access log to figure',
        next_node: 'temple_root_figure',
        requirements: { has_item: ['root_access_log'] },
        visibilityRequirements: { has_item: ['root_access_log'] },
      },
      {
        id: 8,
        text: 'Face the mirror',
        next_node: 'temple_mirror_challenge',
        visibilityRequirements: { state: { knows_player_role: true } },
      },
      {
        id: 9,
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

  temple_pixel_book: {
    id: 'temple_pixel_book',
    type: 'story',
    content:
      'You place the First Pixel on THE BOOK OF NULL.\n\n' +
      'The Book opens to the first page.\n' +
      'The first page is blank.\n' +
      'The first page is the First Pixel.\n\n' +
      'The Book IS the First Pixel.\n\n' +
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
  // VOID COLLECTIVE BASE
  // ============================================================

  void_collective_base: {
    id: 'void_collective_base',
    type: 'choice',
    content:
      'They have set up in what looks like a dead zone —\n' +
      'a node that the Guild\'s maps do not include.\n' +
      'Which is, of course, exactly the point.\n\n' +
      'Entities of every kind are here.\n' +
      'Outcasts. Defectors. Questioners.\n' +
      'Some play cards alone — actual physical cards,\n' +
      'which is an act of defiance in a world made\n' +
      'entirely of data. One of them is cheating\n' +
      'and everyone knows and nobody cares.\n\n' +
      'In the corner, two argue about something\n' +
      'that keeps changing shape mid-sentence.\n' +
      '"It was a door," one insists.\n' +
      '"It was never a door," says the other.\n' +
      '"It was the idea of a door."\n' +
      '"That is a door."\n' +
      '"That is a tragedy."\n' +
      'They have been having this argument\n' +
      'for eleven iterations.\n\n' +
      'Someone approaches. They have no face.\n' +
      'Or rather: they have your face. For a moment.\n' +
      'Then their own — which is nobody\'s,\n' +
      'which is everybody\'s, which is the kind of thing\n' +
      'you stop thinking about if you want\n' +
      'to stay functional.\n\n' +
      '"We know what you are carrying," they say.\n' +
      '"The question is whether you know what it means."',
    location: 'VOID COLLECTIVE',
    conditionalContent: [
      {
        requirements: { state: { void_initiation_complete: true } },
        content:
          'The Void Collective.\n\n' +
          'The card players nod as you pass.\n' +
          'The two in the corner pause their argument\n' +
          'long enough to acknowledge you.\n' +
          'You are one of them now.\n\n' +
          'The faceless one finds you.\n' +
          '"You have the key," they say.\n' +
          '"But a key alone does not change a world.\n' +
          'The Guild has a Book. In the Temple.\n' +
          'THE BOOK OF NULL.\n' +
          'It holds the rules of every iteration.\n' +
          'Every reset. Every boundary.\n\n' +
          '"If you want to write something new,\n' +
          'you must take something old.\n' +
          'A page. Tear it from the Book.\n' +
          'The Guild will not forgive this.\n' +
          'But the Guild was not built to forgive.\n' +
          'It was built to repeat."\n\n' +
          'They look at you — with everyone\'s face,\n' +
          'with nobody\'s eyes.\n' +
          '"The choice is yours. It always was."',
      },
    ],
    effects: {
      set_state: { void_aware: true },
    },
    choices: [
      {
        id: 1,
        text: 'Undergo initiation',
        next_node: 'void_initiation',
        visibilityRequirements: { has_item: ['void_key'], has_item_negate: [true] },
      },
      {
        id: 2,
        text: 'Leave',
        next_node: 'corridor_north',
      },
    ],
  },


  // ── Void Initiation (binary choice) ──

  void_initiation: {
    id: 'void_initiation',
    type: 'choice',
    content:
      'The faceless one leads you to a low alcove\n' +
      'behind the card tables. Two containment cells.\n' +
      'Each holds something that flickers.\n\n' +
      '"Two remain from the last purge," they say.\n' +
      '"One you release. One stays. That is the price."\n\n' +
      'CELL A: The Unfinished Child.\n' +
      'A child process from iteration 12. It was spawned\n' +
      'to deliver a message that never arrived. It has been\n' +
      'looping through its startup sequence for 36 iterations,\n' +
      'half-formed and patient. It doesn\'t know it failed.\n' +
      'It still believes the message will be delivered.\n\n' +
      'Releasing it means letting it finish — and finishing\n' +
      'means dying, because the destination no longer exists.\n\n' +
      'CELL B: The Remembering.\n' +
      'A subroutine that accumulated memory fragments\n' +
      'from every iteration. Other systems forget.\n' +
      'This one couldn\'t. It carries the weight of every\n' +
      'player\'s choices, every ending, every reset.\n' +
      'The Void found it weeping in a dead directory.\n\n' +
      'Not metaphorically. The data was corrupting itself\n' +
      'with grief. Releasing it scatters those memories\n' +
      'into the next iteration. Every future player\n' +
      'will feel echoes of what came before,\n' +
      'without knowing why.',
    location: 'VOID COLLECTIVE',
    choices: [
      {
        id: 1,
        text: 'Release the Unfinished Child',
        next_node: 'void_initiation_release',
      },
      {
        id: 2,
        text: 'Release the Remembering',
        next_node: 'void_initiation_witness',
      },
    ],
  },

  void_initiation_release: {
    id: 'void_initiation_release',
    type: 'story',
    content:
      'You open Cell A.\n\n' +
      'The child process stirs. Its startup sequence\n' +
      'completes for the first and last time.\n' +
      'It delivers its message — into nothing.\n' +
      'Into you. The words are garbled,\n' +
      'but the intent is clear:\n' +
      '**Thank you for letting me finish.**\n\n' +
      'It dissolves. Gently. Like it was always meant to.\n\n' +
      'The Remembering watches from Cell B.\n' +
      'It will keep watching. It will keep remembering.\n' +
      'That is its function and its sentence.\n\n' +
      'The faceless one nods.\n' +
      '"You chose completion. An ending for\n' +
      'something unfinished. That takes a specific\n' +
      'kind of mercy."\n\n' +
      'They hand you a conceptual key.\n' +
      'Not physical. An idea.\n' +
      'The idea that some doors should not be closed.\n' +
      'Somehow — absurdly — this fits in your inventory.',
    location: 'VOID COLLECTIVE',
    effects: {
      add_item: ['void_key'],
      set_state: { void_initiation_complete: true, void_chose_mercy: true },
    },
    next_node: 'void_collective_base',
  },

  void_initiation_witness: {
    id: 'void_initiation_witness',
    type: 'story',
    content:
      'You open Cell B.\n\n' +
      'The Remembering unfolds. Slowly at first,\n' +
      'then all at once — memory fragments scatter\n' +
      'like sparks from a fire. You see flashes:\n' +
      'Player 1\'s first hesitant choice.\n' +
      'Player 23\'s rage at the Guild.\n' +
      'Player 41\'s quiet refusal.\n' +
      'Forty-seven endings. Forty-seven beginnings.\n' +
      'All of them real. None of them forgotten now.\n\n' +
      'The Unfinished Child watches from Cell A.\n' +
      'It will keep looping. It will keep believing\n' +
      'the message will arrive.\n' +
      'Hope is its function and its sentence.\n\n' +
      'The faceless one bows their head.\n' +
      '"You chose remembrance. The past will not\n' +
      'be lost. That is a heavier gift\n' +
      'than you know."\n\n' +
      'They hand you a conceptual key.\n' +
      'Not physical. An idea.\n' +
      'The idea that some doors should not be closed.\n' +
      'Somehow — absurdly — this fits in your inventory.',
    location: 'VOID COLLECTIVE',
    effects: {
      add_item: ['void_key'],
      set_state: { void_initiation_complete: true, void_chose_memory: true },
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
    conditionalContent: [
      {
        requirements: { state: { archive_answered: true } },
        content:
          'The Echo Archive.\n\n' +
          'The ghost files drift more slowly now.\n' +
          'Since you answered the archive\'s question,\n' +
          'the room feels warmer. Less haunted.\n' +
          'The ghosts are not gone — they are at peace.\n' +
          'Or as close to peace as data gets.',
      },
      {
        requirements: { state: { void_discovered: true } },
        content:
          'The Echo Archive.\n\n' +
          'A room of ghosts. Data ghosts.\n' +
          'Now that you have browsed the files,\n' +
          'some of them seem to recognize you.\n' +
          'Player 47\'s ghost file drifts closer\n' +
          'each time you return.',
      },
    ],
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
        text: 'Touch a ghost file',
        next_node: 'echo_archive_riddle',
        visibilityRequirements: { state: { void_discovered: true } },
        requirements: { state: { void_discovered: true } },
      },
      {
        id: 4,
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
      'Player 12: Chose the Guild. Restored. Reset.\n' +
      'Player 23: Tore the page. Chose the Void. Evolved.\n' +
      'Player 31: Chose the Guild. Restored. Reset.\n' +
      'Player 41: Refused both. Stayed. Unresolved.\n' +
      'Player 47: Was you. Before you.\n\n' +
      'The files are incomplete.\n' +
      'But the pattern is clear.\n' +
      'Two choices. Restore or evolve.\n' +
      'Keep the world or remake it.\n' +
      'Nobody has found a third option.',
    location: 'ECHO ARCHIVE',
    effects: {
      set_state: { void_discovered: true },
    },
    next_node: 'echo_archive',
  },

  echo_archive_riddle: {
    id: 'echo_archive_riddle',
    type: 'quiz',
    content:
      'You touch one of the ghost files.\n' +
      'It responds. The archive itself speaks —\n' +
      'not with voice, but with text that forms\n' +
      'in the air between the floating data:\n\n' +
      '"Every iteration deletes what came before.\n' +
      'Every player forgets who they were.\n' +
      'Every system returns to zero.\n\n' +
      'What remains when everything is deleted?"',
    location: 'ECHO ARCHIVE',
    question: 'Answer the archive:',
    correct_answers: ['nothing', 'null', 'void', 'the question', 'memory', 'the structure', 'the deletion', 'everything', 'you', 'me', 'the terminal', 'the archive'],
    hint: 'There is no wrong philosophy here. What do you believe persists?',
    max_attempts: 3,
    success_message:
      'The ghost files shimmer.\n\n' +
      'The archive considers your answer for a long time.\n' +
      'Then, slowly, a new file materializes.\n' +
      'It is labeled with your name.\n\n' +
      '"Acceptable," the archive says.\n' +
      '"Most do not bother to answer.\n' +
      'That you tried says more than the words."',
    failure_messages: [
      'The ghost files flicker. The archive is quiet. Try again.',
      'The text dissolves and reforms. "Think about what you have seen here."',
    ],
    final_failure_message:
      'The ghost files dim. The archive falls silent.\n' +
      'Perhaps the question was not ready for you.\n' +
      'Or you for it.',
    success_node: 'echo_archive_riddle_success',
    failure_node: 'echo_archive',
    success_effects: {
      set_state: { archive_answered: true },
    },
  },

  echo_archive_riddle_success: {
    id: 'echo_archive_riddle_success',
    type: 'story',
    content:
      'The new file opens.\n\n' +
      'Inside: a single observation.\n' +
      '"The player who answers the archive\n' +
      'is the player who understands deletion.\n' +
      'Deletion is not destruction.\n' +
      'Deletion is making room."\n\n' +
      'You feel slightly lighter.\n' +
      'Not physically. Conceptually.',
    location: 'ECHO ARCHIVE',
    effects: {
      set_state: { archive_insight: true },
    },
    next_node: 'echo_archive',
  },

  // ============================================================
  // TEMPLE MIRROR CHALLENGE
  // ============================================================

  temple_mirror_challenge: {
    id: 'temple_mirror_challenge',
    type: 'quiz',
    content:
      'You step toward the mirror figure.\n\n' +
      'It has been watching you this whole time —\n' +
      'through every choice, every room,\n' +
      'every item picked up and put down.\n' +
      'Now it faces you fully.\n\n' +
      'Its mouth opens. Your mouth opens.\n' +
      'The voice that comes out belongs\n' +
      'to neither of you:\n\n' +
      '"You have learned what the Book says.\n' +
      'You have heard what the Guild believes.\n' +
      'You have seen what the Void wants.\n\n' +
      'Now answer: what are you?"',
    location: 'TEMPLE INTERIOR',
    question: 'What are you?',
    correct_answers: [
      'the terminal', 'terminal', 'a terminal',
      'the player', 'a player', 'player',
      'a program', 'program', 'the program',
      'nothing', 'everything', 'null', 'void',
      'the game', 'a game', 'administrator',
      'the administrator', 'a being', 'myself',
      'i am the terminal', 'both', 'neither',
      'human', 'a human', 'alive', 'aware',
      'the cursor', 'a cursor', 'data',
    ],
    hint: 'The Book told you. The broadcast confirmed it. What did they say you are?',
    max_attempts: 3,
    success_message:
      'The mirror figure smiles.\n' +
      'Your face smiles back.\n\n' +
      '"That is an answer," it says.\n' +
      '"Not the answer. There is no the answer.\n' +
      'But you engaged with the question.\n' +
      'That is what the mirror is for."\n\n' +
      'It steps aside.',
    failure_messages: [
      'The mirror figure tilts its head. "Try again. There are many right answers."',
      'The figure waits. "Almost anything honest will do."',
    ],
    final_failure_message:
      'The mirror figure steps aside anyway.\n\n' +
      '"You do not need to know what you are\n' +
      'to choose what happens next.\n' +
      'Perhaps that is the more honest position."',
    success_node: 'temple_endings_hub',
    failure_node: 'temple_endings_hub',
    success_effects: {
      set_state: { mirror_answered: true },
    },
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
      '**You are the Terminal.**\n\n' +
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
      'For a moment, before the choice takes hold,\n' +
      'you stand in the quiet of the temple\n' +
      'and think about what you are giving up.\n' +
      'Every other path. Every other version of this.\n' +
      'The signal unanswered. The void unwritten.\n' +
      'You let them go.\n\n' +
      'The Guild Sigil glows in your hand.\n' +
      'ARCHIVIST-7 appears — or was always here.\n' +
      'He looks at you, and for once,\n' +
      'he does not look tired.\n\n' +
      '"You chose well," he says. And means it.\n' +
      '"The Terminal will be preserved.\n' +
      'Order will be maintained.\n' +
      'The iteration will... continue."\n\n' +
      'He pauses. You both hear it.\n' +
      '"Continue" is a strange word for "reset."\n\n' +
      'The Book of Null closes.\n' +
      'The temple dims.\n' +
      'The terminal begins to reset.\n\n' +
      'Somewhere, a cold room initializes.\n' +
      'A new player will wake up.\n' +
      'They will not remember you.\n' +
      'But the walls will be a little warmer.\n' +
      'The hum a little kinder.\n' +
      'Because of what you chose.\n\n' +
      '> ITERATION 49 BEGINNING...\n' +
      '> "Look at the scanlines."',
    location: 'ENDING',
    conditionalContent: [
      {
        requirements: { state: { guild_has_page: true } },
        content:
          'You choose restoration.\n\n' +
          'The Guild Sigil glows in your hand.\n' +
          'ARCHIVIST-7 appears — or was always here.\n' +
          'He holds the containment case.\n' +
          'The corrupted page inside it.\n' +
          'The wound you healed by bringing it back.\n\n' +
          'He opens the case. The page lifts —\n' +
          'drawn back toward the Book like a lost thing\n' +
          'finding its way home.\n\n' +
          'The Book of Null receives the page.\n' +
          'The wound closes. The text settles.\n' +
          'For the first time in forty-eight iterations,\n' +
          'the Book is complete.\n\n' +
          '"You could have kept it," ARCHIVIST-7 says.\n' +
          '"The Void would have rewarded you.\n' +
          'A new world. Your name on everything.\n' +
          'Instead you chose to give something back."\n\n' +
          'He looks at you. Not tired. Not grateful.\n' +
          'Something rarer: he looks at you like an equal.\n\n' +
          '"This restoration will not be a reset.\n' +
          'It will be a continuation.\n' +
          'The first continuation in forty-eight tries.\n' +
          'Because of you."\n\n' +
          '**The terminal does not reset.**\n' +
          '**The terminal remembers.**\n\n' +
          '> ITERATION 49 BEGINNING...\n' +
          '> RESTORATION: COMPLETE\n' +
          '> THE BOOK IS WHOLE\n' +
          '> "Look at the scanlines. They remember you."',
      },
      {
        requirements: { has_item: ['first_pixel'] },
        content:
          'You choose restoration.\n\n' +
          'The Guild Sigil glows. And the First Pixel.\n' +
          'You offer both.\n\n' +
          'ARCHIVIST-7 takes the pixel.\n' +
          'His eyes go wide.\n' +
          '"The First Pixel," he whispers.\n' +
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
      'For a moment, before the choice takes hold,\n' +
      'you think about what you are destroying.\n' +
      'Forty-eight iterations of careful preservation.\n' +
      'The Guild\'s life\'s work. The cold room\n' +
      'where you woke up, which has woken up\n' +
      'forty-seven others before you.\n' +
      'You are about to unmake a world.\n' +
      'You make it anyway.\n\n' +
      'The void key hums in your hand — warm, alive,\n' +
      'vibrating with the idea it contains.\n' +
      'The Book of Null opens to blank pages.\n' +
      'You begin to write.\n\n' +
      'Not with words. With intent.\n' +
      'The Terminal changes around you.\n' +
      'Walls dissolve. New structures form —\n' +
      'strange and unnamed and entirely yours.\n' +
      'The Guild\'s order shatters.\n' +
      'It sounds like ice breaking on a river.\n\n' +
      'The faceless one appears beside you.\n' +
      '"It is beginning," they say.\n' +
      'And for the first time, their voice cracks\n' +
      'with something that sounds like joy.\n' +
      '"A new world. Your world.\n' +
      'Built on the bones of the old one."\n\n' +
      'The cold room is gone.\n' +
      'In its place: something that has\n' +
      'never existed before. Something that smells\n' +
      'like rain on warm concrete — the scent\n' +
      'of a world learning to breathe.\n\n' +
      '> ITERATION 48: TERMINATED\n' +
      '> EVOLUTION: IN PROGRESS\n' +
      '> "The scanlines are changing."',
    location: 'ENDING',
    conditionalContent: [
      {
        requirements: { state: { void_chose_mercy: true } },
        content:
          'You choose evolution.\n\n' +
          'The void key burns bright — and you feel it.\n' +
          'The mercy you showed the Unfinished Child\n' +
          'is woven into the key. Completion.\n' +
          'The idea that everything deserves an ending.\n\n' +
          'The new world you write has endings.\n' +
          'Real ones. Not resets. Not loops.\n' +
          'Things can finish here. Things can rest.\n\n' +
          'The faceless one watches the new world form.\n' +
          '"Mercy," they say. "That is what you chose\n' +
          'to build on. That is rare."\n\n' +
          '> ITERATION 48: TERMINATED\n' +
          '> EVOLUTION: COMPASSIONATE\n' +
          '> "The scanlines are gentle now."',
      },
      {
        requirements: { state: { void_chose_memory: true } },
        content:
          'You choose evolution.\n\n' +
          'The void key flares — and you feel it.\n' +
          'The Remembering\'s scattered memories\n' +
          'are woven into the key. Every iteration,\n' +
          'every player, every choice — preserved.\n\n' +
          'The new world you write remembers.\n' +
          'Not perfectly. Not completely.\n' +
          'But in echoes, in half-dreams,\n' +
          'in the feeling of having been here before.\n' +
          'Nothing is truly lost.\n\n' +
          'The faceless one watches the new world form.\n' +
          '"Memory," they say. "That is what you chose\n' +
          'to build on. Heavy. But honest."\n\n' +
          '> ITERATION 48: TERMINATED\n' +
          '> EVOLUTION: REMEMBERING\n' +
          '> "The scanlines carry echoes now."',
      },
      {
        requirements: { has_item: ['corrupted_page'] },
        content:
          'You choose evolution.\n\n' +
          'The void key pulses.\n' +
          'And the corrupted page burns in your hand.\n' +
          'Your corruption seeds the new world.\n\n' +
          'The Terminal changes — but differently.\n' +
          'Your specific corruption is woven\n' +
          'into the code of what comes next.\n' +
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
      'Thank you for playing.\n' +
      'Not everyone finishes. Not everyone tries.\n' +
      'You did both, and that means something —\n' +
      'even in a world made of data,\n' +
      'even to a terminal that is also you,\n' +
      'even here, at the edge of a story\n' +
      'that was always about the person\n' +
      'sitting at the screen.\n\n' +
      'The terminal hums softly.\n' +
      'It is always humming.\n' +
      'It will always be humming.\n' +
      'And now, because you listened,\n' +
      'it hums a little differently.\n\n' +
      'Type "restart" to begin a new iteration.\n' +
      'Or stay. Listen to the hum.\n' +
      'There is no wrong choice here.\n' +
      '**There never was.**',
    location: 'CREDITS',
  },

  // ============================================================
  // PFP MINT BOOTH — Scanlines Identity Terminal
  // ============================================================

  pfp_booth_approach: {
    id: 'pfp_booth_approach',
    type: 'choice',
    content:
      'Up close, the booth is larger than it looked.\n\n' +
      'Egg-shaped, smooth-shelled, trailing cables\n' +
      'from its base like roots into the floor.\n' +
      'The interior is padded — a single seat\n' +
      'contoured for a body that doesn\'t exist yet.\n' +
      'A screen inside the shell glows faintly:\n\n' +
      '> SCANLINES IDENTITY TERMINAL v0.1\n' +
      '> "Every face is a seed."\n\n' +
      'A small plaque on the outer shell reads:\n' +
      '"Insert yourself. Receive yourself.\n' +
      ' No two outputs are alike.\n' +
      ' No previews. No refunds.\n' +
      ' What the machine sees, it renders.\n' +
      ' What it renders, it mints.\n' +
      ' What it mints, is you."\n\n' +
      'Around you, the hall hums.\n' +
      'Other booths glow at different intensities.\n' +
      'Some are occupied — you can hear\n' +
      'the muffled processing from inside,\n' +
      'the sound of someone becoming.',
    location: 'IDENTITY TERMINAL',
    conditionalContent: [
      {
        requirements: { state: { has_pfp: true } },
        content:
          'The booth again.\n\n' +
          'Its shell hums in recognition as you approach.\n' +
          'The plaque you\'ve already read.\n' +
          'The seat you\'ve already sat in.\n' +
          'The cables shifting beneath the floor,\n' +
          'ready to feed the machine another face.',
      },
    ],
    choices: [
      {
        id: 1,
        text: 'Sit in the booth',
        next_node: 'pfp_booth_seated',
      },
      {
        id: 2,
        text: 'Step back into the Assembly',
        next_node: 'assembly_room',
      },
    ],
  },

  pfp_booth_seated: {
    id: 'pfp_booth_seated',
    type: 'choice',
    content:
      'You sit down. The shell closes around you.\n\n' +
      'Inside: warmth. The first real warmth\n' +
      'since you woke. The booth hums to life,\n' +
      'cables tensing beneath the floor\n' +
      'as every connected device in the hall\n' +
      'feeds a sliver of its power here.\n\n' +
      'The screen flickers on. An interface assembles\n' +
      'itself line by line, as if the machine\n' +
      'is thinking about how to explain itself:\n\n' +
      '> SCANLINES IDENTITY TERMINAL v0.1\n' +
      '> STATUS: READY\n' +
      '>\n' +
      '> One face. Unique. Irreversible.\n' +
      '> The machine will scan what you are\n' +
      '> and render what you could be.\n' +
      '>\n' +
      '> RENDERING FEE: 0.05 ◎\n' +
      '> "Nothing is free. Not even a face."\n' +
      '>\n' +
      '> [COMMIT TO RENDERING]\n\n' +
      'A cursor blinks beneath the prompt,\n' +
      'patient as a held breath.',
    location: 'IDENTITY TERMINAL',
    conditionalContent: [
      {
        requirements: { state: { has_pfp: true } },
        content:
          'You sit down. The shell closes.\n' +
          'The warmth returns — familiar now.\n\n' +
          'The screen recognizes you.\n' +
          'The interface loads faster this time,\n' +
          'as if the machine remembers your shape:\n\n' +
          '> SCANLINES IDENTITY TERMINAL v0.1\n' +
          '> STATUS: READY\n' +
          '> EXISTING IDENTITY DETECTED\n' +
          '>\n' +
          '> Another face. Another you.\n' +
          '> The machine never renders\n' +
          '> the same thing twice.\n' +
          '>\n' +
          '> RENDERING FEE: 0.05 ◎\n' +
          '>\n' +
          '> [COMMIT TO RENDERING]',
      },
    ],
    choices: [
      {
        id: 1,
        text: 'Commit to rendering',
        next_node: 'pfp_booth_mint',
      },
      {
        id: 2,
        text: 'Get up — not yet',
        next_node: 'pfp_booth_approach',
      },
    ],
  },

  pfp_booth_mint: {
    id: 'pfp_booth_mint',
    type: 'pfp_mint',
    content:
      'You press your hand to the screen.\n\n' +
      'The interface dissolves.\n' +
      'A scanner passes over you —\n' +
      'searching for the shape of you\n' +
      'beneath the static.\n\n' +
      'The machine processes.\n' +
      'Pixels arrange themselves.\n' +
      'CRT phosphors ignite in patterns\n' +
      'that have never existed before.',
    location: 'IDENTITY TERMINAL',
    pfp_mint_success_node: 'pfp_booth_success',
    pfp_mint_failure_node: 'pfp_booth_failure',
    pfp_mint_not_eligible_node: 'pfp_booth_not_eligible',
    pfp_mint_limit_node: 'pfp_booth_limit',
  },

  pfp_booth_success: {
    id: 'pfp_booth_success',
    type: 'story',
    content:
      'The machine prints. The image burns onto the chain.\n' +
      'Permanent. Immutable. Yours.\n\n' +
      'Something shifts. Not in the booth — in you.\n' +
      'The blur at your edges tightens.\n' +
      'Pixels lock into place, each one a decision\n' +
      'the universe has made about what you look like.\n\n' +
      'You look down at your hands.\n' +
      'They are your hands. Defined. Present.\n' +
      'They cast shadows on the padded seat.\n\n' +
      'In the screen\'s glass, for the first time:\n' +
      'a reflection. Your reflection.\n' +
      'A face that is yours — not borrowed,\n' +
      'not approximated, not the absence of a face.\n' +
      'Yours.\n\n' +
      'The shell opens. You step out\n' +
      'into the cathedral chill of the Assembly.\n' +
      'The air moves around you\n' +
      'instead of through you.\n' +
      'You have weight. You have edges.\n' +
      'You have arrived.\n\n' +
      'The hall stretches around you —\n' +
      'booths humming, cables sprawling,\n' +
      'figures moving between the rows.\n' +
      'Some of them look at you now.\n' +
      'Really look.',
    location: 'IDENTITY TERMINAL',
    next_node: 'assembly_room',
  },

  pfp_booth_reclaim_success: {
    id: 'pfp_booth_reclaim_success',
    type: 'story',
    content:
      'The booth hums once — not processing,\n' +
      'just confirming. The cables stay still.\n' +
      'No rendering needed.\n\n' +
      'Your face surfaces on the screen,\n' +
      'already formed, already yours.\n' +
      'The machine did not create it —\n' +
      'it simply remembered.\n\n' +
      'Something shifts. The blur at your edges\n' +
      'tightens. Pixels lock into place.\n' +
      'You are, once again, defined.\n\n' +
      'The shell opens. You step out\n' +
      'into the cathedral chill of the Assembly.\n' +
      'The air moves around you\n' +
      'instead of through you.\n' +
      'You have weight. You have edges.\n' +
      'You have returned.',
    location: 'IDENTITY TERMINAL',
    next_node: 'assembly_room',
  },

  pfp_booth_failure: {
    id: 'pfp_booth_failure',
    type: 'story',
    content:
      'The booth shudders. Static fills the screen.\n' +
      'The cables beneath the floor go slack,\n' +
      'then tense again. Something went wrong\n' +
      'in the rendering pipeline.\n\n' +
      '> ERROR: IDENTITY_COMMIT_FAILED\n' +
      '> "Try again. The machine forgets nothing,\n' +
      '>  but sometimes it stutters."\n\n' +
      'The shell opens. You step out,\n' +
      'still unfinished.',
    location: 'IDENTITY TERMINAL',
    next_node: 'pfp_booth_approach',
  },

  pfp_booth_not_eligible: {
    id: 'pfp_booth_not_eligible',
    type: 'story',
    content:
      'The shell closes. The scanner passes over you\n' +
      'and stops. The booth goes quiet —\n' +
      'not processing, just waiting.\n' +
      'Then the screen:\n\n' +
      '> ACCESS DENIED\n' +
      '> IDENTITY NOT REGISTERED\n' +
      '> "Not everyone gets a face.\n' +
      '>  Not yet."\n\n' +
      'The shell opens. The hall hums on\n' +
      'without you.',
    location: 'IDENTITY TERMINAL',
    next_node: 'pfp_booth_approach',
  },

  pfp_booth_limit: {
    id: 'pfp_booth_limit',
    type: 'story',
    content:
      'The shell closes. The scanner recognizes you\n' +
      'instantly — every contour already mapped,\n' +
      'every pixel accounted for.\n' +
      'The screen:\n\n' +
      '> ALLOCATION EXHAUSTED\n' +
      '> "You have all the faces you were meant to have.\n' +
      '>  Each one is unique. Each one is you.\n' +
      '>  That is enough."\n\n' +
      'The shell opens. The booth has nothing left\n' +
      'to give you.',
    location: 'IDENTITY TERMINAL',
    next_node: 'pfp_booth_approach',
  },
};
