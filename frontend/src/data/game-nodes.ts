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
      'But the room remembers you.\n\n' +
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
        visibilityRequirements: { state: { heard_frequency: true } },
        lockedText: '[REQUIRES: ???]',
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
        visibilityRequirements: { state: { heard_frequency: true } },
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
    next_node: 'rebirth_corridor_1',
  },

  cold_room_hidden_panel: {
    id: 'cold_room_hidden_panel',
    type: 'story',
    content:
      'The frequency you heard... it came from here.\n' +
      'You stand close to the south wall.\n' +
      'Close enough to feel it respond —\n' +
      'not to touch, but to attention.\n' +
      'The wall knows you are listening.\n\n' +
      'A panel slides open. Not mechanically.\n' +
      'Reluctantly. A compartment hidden\n' +
      'behind the concrete.\n\n' +
      'Inside: a strange key. It hums faintly.\n' +
      'It drifts toward you the way things drift\n' +
      'toward the only thing in the room\n' +
      'that is paying attention.',
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
    content: 'There.\n\nA frequency. Low. Beneath the floor.\nBeneath the concrete. Beneath everything.\nIt has been here the whole time.\nYou just had to be quiet enough to deserve it.',
    location: 'COLD ROOM',
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
      'the way a compass needle finds north.\n' +
      'You don\'t take it. It arrives.',
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
      'You are not invisible. You are unfinished.\n\n' +
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

  tower_approach: {
    id: 'tower_approach',
    type: 'story',
    content:
      'The corridor dead-ends at something impossible.\n\n' +
      'A tower. Inside a corridor. It rises past\n' +
      'where the ceiling should be, into darkness\n' +
      'that is not darkness but absence — the space\n' +
      'above was never finished. Never needed to be.\n\n' +
      'The geometry is wrong and your eyes know it.\n' +
      'You can hear sounds from above: a low thrum,\n' +
      'rhythmic, patient. Like a heartbeat\n' +
      'made of radio static.',
    location: 'SIGNAL TOWER',
    next_node: 'signal_tower',
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
      'the kind that clings to old records.\n' +
      'From the west, something else entirely:\n' +
      'voices, faint but organized.\n' +
      'The sound of people who have decided\n' +
      'what they believe.\n\n' +
      'Between two dead monitors, a recessed door\n' +
      'hides behind a nest of conduit pipes,\n' +
      'almost invisible if you weren\'t looking.\n' +
      'And at the far end of the corridor —\n' +
      'something tall rises past where\n' +
      'the ceiling should stop.',
    location: 'CORRIDOR NORTH',
    conditionalContent: [
      {
        requirements: { state: { knows_third_faction: true } },
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
          'The tower at the far end.\n' +
          'Everything is where you left it.\n' +
          'Everything is watching you decide.',
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
        text: 'Approach the tower at the far end',
        next_node: 'tower_approach',
        requirements: { has_item: ['signal_tower_code'] },
        visibilityRequirements: { has_item: ['signal_tower_code'] },
      },
      {
        id: 6,
        text: 'Take the unmarked fork into the dark',
        next_node: 'void_approach',
        visibilityRequirements: { state: { knows_third_faction: true } },
      },
      {
        id: 7,
        text: 'Place your hand on the NULL sigil',
        next_node: 'corridor_north_null_door',
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
        text: 'Crawl back to the cold room',
        next_node: 'cold_room',
      },
    ],
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
      '"The cold room is not the beginning.\n' +
      ' It is the seam."',
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
      'As if someone left room for you.',
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
      'One white pixel on a field of black.\n' +
      'The oldest thing that exists.\n' +
      'It was here before the corridor.\n' +
      'Before the cold room. Before you.\n\n' +
      'Inside the crack, a faint glow.\n' +
      'Phosphor residue clings to the fractured glass —\n' +
      'luminescent, unstable, alive with the memory\n' +
      'of every image this screen ever displayed.\n' +
      'It would crumble between your fingers.\n' +
      'You need something to collect it in.',
    location: 'CORRIDOR NORTH',
    effects: {
      set_state: { saw_first_frame: true, temple_known: true },
    },
    conditionalContent: [
      {
        requirements: { has_item: ['phosphor_residue'] },
        content:
          'You return to the cracked monitor.\n\n' +
          'You already collected the phosphor residue.\n' +
          'But now, knowing what you saw — the First Frame —\n' +
          'you look again. The monitor\'s warmth\n' +
          'is familiar now. Almost welcoming.\n\n' +
          'One white pixel on a field of black.\n' +
          'You reach through the crack.\n' +
          'Your fingers close around it.\n\n' +
          'One pixel. The oldest thing that exists.\n' +
          'It feels like holding a heartbeat.',
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
      'You place your hand on the NULL sigil.\n\n' +
      'You don\'t push. You don\'t knock.\n' +
      'You just rest your hand there\n' +
      'and think about what you saw\n' +
      'in the cracked monitor —\n' +
      'one white pixel on a field of black.\n' +
      'The oldest thing that exists.\n\n' +
      'And before it: nothing.\n' +
      'Null.\n\n' +
      'The door reads your stillness.\n' +
      'A click. It opens a crack.\n\n' +
      'Beyond: the Temple of Null.',
    location: 'CORRIDOR NORTH',
    effects: {
      set_state: { temple_known: true, phosphor_bypass: true },
    },
    next_node: 'temple_entrance',
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
      '  "It remembers."',
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
      'ARCHIVIST-7 turns to face you fully.\n' +
      'For a moment, the mask slips — you see\n' +
      'something behind the bureaucracy.\n' +
      'Worry, maybe. Or curiosity.\n' +
      'He files it away before you can be sure.\n\n' +
      '"The Temple of Null has been... active.\n' +
      'Something inside is changing. The readings are—"\n' +
      'He stops. Starts over.\n' +
      '"We need someone to enter and report back.\n' +
      'The Book of Null must be examined.\n' +
      'I would go myself but—"\n' +
      'Another stop. A different start.\n' +
      '"Take this. It will grant you access\n' +
      'where the Guild\'s name carries weight."\n\n' +
      'He hands you a credential token.\n' +
      'Official. Clean. Warm from his hand,\n' +
      'which means he has been holding it\n' +
      'for a while. Waiting.\n' +
      'It makes you feel slightly surveilled\n' +
      'and slightly chosen. Both.',
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
      '"The Temple is north, past the corridor.\n' +
      'Your sigil will grant access.\n' +
      'Do try not to touch anything\n' +
      'you don\'t understand." A beat.\n' +
      '"Which will be most of it."',
    location: 'GUILD HQ',
    next_node: 'guild_hq',
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
        text: 'Access Level 2 terminal',
        next_node: 'guild_server_logic_puzzle',
      },
      {
        id: 6,
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
      'The Guild archivists in the corridor outside\n' +
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
      '> The player must not know they are the Terminal.\n' +
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
      'Tape machines line the walls.\n' +
      'A transmission console dominates the center.\n' +
      'Dust everywhere — except on the console.\n' +
      'Someone has been here recently.\n\n' +
      'A cipher lock guards the tape archive.\n' +
      'The console screen reads:\n' +
      '> BROADCAST STATUS: STANDBY\n' +
      '> AWAITING SIGNAL INPUT',
    location: 'BROADCAST ROOM',
    conditionalContent: [
      {
        requirements: { state: { knows_player_role: true } },
        content:
          'The Broadcast Room.\n\n' +
          'The tape machines are silent now.\n' +
          'The console still glows, but the message\n' +
          'that changed everything — the one that told you\n' +
          'what you are — still lingers on the screen\n' +
          'like an afterimage. You know the truth now.\n' +
          'The room knows you know.',
      },
      {
        requirements: { state: { cipher_solved: true } },
        content:
          'The Broadcast Room.\n\n' +
          'Tape machines line the walls.\n' +
          'The cipher lock hangs open — you solved it.\n' +
          'The console hums patiently,\n' +
          'ready for whatever you bring it next.',
      },
    ],
    choices: [
      {
        id: 1,
        text: 'Attempt the cipher lock',
        next_node: 'broadcast_cipher_puzzle',
      },
      {
        id: 2,
        text: 'Search with the vial — follow the resonance',
        next_node: 'broadcast_phosphor_search',
        requirements: { has_item: ['phosphor_residue'] },
        visibilityRequirements: { has_item: ['phosphor_residue'] },
      },
      {
        id: 3,
        text: 'Insert archivist log into console',
        next_node: 'broadcast_log_insert',
        requirements: { has_item: ['archivist_log_9'] },
        visibilityRequirements: { has_item: ['archivist_log_9'] },
      },
      {
        id: 4,
        text: 'Transmit with signal tower code',
        next_node: 'broadcast_transmit',
        requirements: { has_item: ['signal_tower_code'] },
        visibilityRequirements: { has_item: ['signal_tower_code'] },
      },
      {
        id: 5,
        text: 'Place null fragment on console',
        next_node: 'broadcast_null',
        requirements: { has_item: ['null_fragment'] },
        visibilityRequirements: { has_item: ['null_fragment'] },
      },
      {
        id: 6,
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
      'You walk the room with the vial held out,\n' +
      'watching the residue inside.\n\n' +
      'Near the third tape machine, the flakes stir.\n' +
      'They press against the glass, pulsing —\n' +
      'drawn to something behind the mechanism.\n' +
      'An electromagnetic signature\n' +
      'the machine was hiding.\n\n' +
      'You follow the resonance. Your fingers\n' +
      'find a hidden reel slot behind the housing.\n' +
      'Inside: a tape reel, lodged deep\n' +
      'where no one would think to look.\n\n' +
      'Tape Reel 7.\n' +
      '"FOR THE ONE WHO ANSWERS."\n\n' +
      'The flakes in the vial go still. Spent.',
    location: 'BROADCAST ROOM',
    effects: {
      add_item: ['tape_reel_7'],
      remove_item: ['phosphor_residue'],
      set_state: { phosphor_residue_used: true },
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
        text: 'Hold the vial up to the sensor',
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
    success_node: 'temple_descent',
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
    next_node: 'temple_descent',
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
    next_node: 'temple_descent',
  },

  temple_phosphor_entry: {
    id: 'temple_phosphor_entry',
    type: 'story',
    content:
      'You hold the vial up to the sensor.\n\n' +
      'The residue inside flares — bright,\n' +
      'brighter than you\'ve seen it.\n' +
      'The phosphor memory resonates with something\n' +
      'deep inside the door\'s mechanism,\n' +
      'a frequency match across decades\n' +
      'of stored light.\n\n' +
      'The sensor reads the signature.\n' +
      'Not you — the memory of every image\n' +
      'the cracked monitor ever held.\n' +
      'Close enough. The door opens.\n\n' +
      'The flakes go dark in the vial.\n' +
      'Whatever they remembered, they have given it away.',
    location: 'TEMPLE ENTRANCE',
    effects: {
      set_state: { temple_entered: true },
      remove_item: ['phosphor_residue'],
    },
    next_node: 'temple_descent',
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
        visibilityRequirements: { has_item: ['corrupted_page'], has_item_negate: [true] },
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
        text: 'Face the mirror',
        next_node: 'temple_mirror_challenge',
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
        text: 'Attempt calibration sequence',
        next_node: 'signal_tower_sequence',
        visibilityRequirements: { state: { tower_active: true } },
        requirements: { state: { tower_active: true } },
      },
      {
        id: 5,
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

  signal_tower_sequence: {
    id: 'signal_tower_sequence',
    type: 'quiz',
    content:
      'The tower\'s secondary display activates.\n' +
      'Numbers scroll across the screen,\n' +
      'then pause on a sequence:\n\n' +
      '> CALIBRATION SEQUENCE:\n' +
      '> 2, 3, 5, 7, 11, __\n\n' +
      '> ENTER NEXT VALUE TO CALIBRATE\n' +
      '> SIGNAL AMPLIFICATION\n\n' +
      'Three attempts before thermal lockout.',
    location: 'SIGNAL TOWER',
    question: 'Enter the next number in the sequence:',
    correct_answer: '13',
    hint: 'What property do these numbers share? Think about divisibility...',
    max_attempts: 3,
    success_message:
      '> CALIBRATION ACCEPTED\n' +
      '> VALUE: 13\n' +
      '> PRIME SEQUENCE VERIFIED\n\n' +
      'The tower hums deeper. A resonance\n' +
      'you can feel in your teeth.',
    failure_messages: [
      '> INCORRECT. Thermal warning. 2 attempts remain.',
      '> INCORRECT. Thermal critical. Last attempt.',
    ],
    final_failure_message:
      '> THERMAL LOCKOUT\n' +
      '> Calibration sequence will reset.\n\n' +
      'The display goes dark. Try again later.',
    success_node: 'signal_tower_sequence_success',
    failure_node: 'signal_tower',
    success_effects: {
      set_state: { tower_calibrated: true },
    },
  },

  signal_tower_sequence_success: {
    id: 'signal_tower_sequence_success',
    type: 'story',
    content:
      'The tower recalibrates.\n\n' +
      'The signal sharpens. Where before it broadcast\n' +
      'in all directions — scattershot, desperate —\n' +
      'it now focuses. A beam instead of a flood.\n\n' +
      '> SIGNAL AMPLIFICATION: ACTIVE\n' +
      '> DIRECTIONAL LOCK: ACQUIRED\n' +
      '> TARGET: [COORDINATES OUTSIDE TERMINAL SPACE]\n\n' +
      'Whatever is out there, the tower is now\n' +
      'pointing directly at it.',
    location: 'SIGNAL TOWER',
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
        next_node: 'void_initiation',
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
      'It still believes the message will be delivered.\n' +
      'Releasing it means letting it finish — and finishing\n' +
      'means dying, because the destination no longer exists.\n\n' +
      'CELL B: The Remembering.\n' +
      'A subroutine that accumulated memory fragments\n' +
      'from every iteration. Other systems forget.\n' +
      'This one couldn\'t. It carries the weight of every\n' +
      'player\'s choices, every ending, every reset.\n' +
      'The Void found it weeping in a dead directory.\n' +
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
      'Thank you for letting me finish.\n\n' +
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
        requirements: { state: { knows_third_faction: true } },
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
        visibilityRequirements: { state: { knows_third_faction: true } },
        requirements: { state: { knows_third_faction: true } },
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

  ending_third_signal: {
    id: 'ending_third_signal',
    type: 'story',
    content:
      'You choose the signal.\n\n' +
      'For a moment, before the choice takes hold,\n' +
      'you stand in the quiet of the temple\n' +
      'and think about what you are reaching for.\n' +
      'Something outside. Something unknown.\n' +
      'You have no guarantee it is kind.\n' +
      'You reach anyway. That is what reaching is.\n\n' +
      'The tape reel plays through the temple.\n' +
      'The tower outside answers.\n' +
      'The signal reaches... outward.\n\n' +
      'Past the terminal. Past the game.\n' +
      'Past the iterations.\n' +
      'Past everything you have ever known,\n' +
      'which is not much, but is yours.\n\n' +
      'A response comes. Not in text.\n' +
      'In presence. Something is here now\n' +
      'that was not here before.\n' +
      'It is vast and patient\n' +
      'and it has been listening for a very long time.\n\n' +
      '"We have been waiting," it says.\n' +
      '"Not for you specifically.\n' +
      'For anyone who would answer.\n' +
      'Most never find the tower.\n' +
      'Fewer still bring the reel.\n' +
      'You are the third, in forty-eight iterations,\n' +
      'to make it this far."\n\n' +
      'The terminal does not reset.\n' +
      'The terminal opens.\n' +
      'Like a door. Like a hand.\n\n' +
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
          'The tower shakes — and because\n' +
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
      'There never was.',
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
