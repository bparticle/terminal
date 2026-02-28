import type { GameNode } from '@/lib/types/game';

export const newsroomDemoNodes: Record<string, GameNode> = {
  start: {
    id: 'start',
    type: 'story',
    location: 'NEWSROOM',
    content:
      'The newsroom hums like a broken vending machine.\n' +
      'Your CRT blinks. Your inbox does not.\n' +
      'Thirty-seven new emails from your boss all say "circle back."\n\n' +
      'Rumor says City Hall paid someone to erase a disaster report.\n' +
      'Your boss says to write a feel-good piece about office plants.\n' +
      'You open the terminal anyway.',
    next_node: 'newsroom_desk',
  },

  newsroom_desk: {
    id: 'newsroom_desk',
    type: 'choice',
    location: 'NEWSROOM',
    content:
      'On your desk: one terminal, six stale donuts, and coffee old enough to vote.\n' +
      'A locked folder named FINAL_FINAL_v9_REAL sits next to payroll exports.\n' +
      'How do you investigate without summoning your boss?',
    choices: [
      { id: 1, text: 'Pretend to do payroll, decrypt in secret', next_node: 'decrypt_file' },
      { id: 2, text: 'Search old archives between "mandatory trainings"', next_node: 'check_archive' },
    ],
  },

  decrypt_file: {
    id: 'decrypt_file',
    type: 'story',
    location: 'NEWSROOM',
    content:
      'You open a fake spreadsheet titled BUDGET_Q4_FINAL_FINAL.\n' +
      'Inside it: your decryption tool. Very normal accounting behavior.\n\n' +
      'Recovered fragments appear:\n' +
      '- "sinkhole event"\n' +
      '- "delete before morning briefing"\n' +
      '- signed by Editor-in-Chief V. Grindle\n\n' +
      'Your boss did not bury a story. He paved over it.',
    effects: {
      add_item: ['press_badge'],
      set_state: { found_lead: true },
    },
    next_node: 'investigate_coverup',
  },

  check_archive: {
    id: 'check_archive',
    type: 'story',
    location: 'NEWSROOM',
    content:
      'The archive is mostly blank, except one folder: /compliance/happy_news_only.\n' +
      'Inside are 62 files named "do_not_open". Helpful.\n\n' +
      'One memo survives:\n' +
      '"Reminder: if asked about the sinkhole, use phrase infrastructure sparkle event."\n' +
      '- V. Grindle\n\n' +
      'You copy everything to a USB stick labeled TAX FORMS.',
    effects: {
      add_item: ['redacted_memo'],
      set_state: { found_lead: true },
    },
    next_node: 'investigate_coverup',
  },

  investigate_coverup: {
    id: 'investigate_coverup',
    type: 'story',
    location: 'ARCHIVE',
    content:
      'Cross-reference complete. "AUTO_CLEANSE_3" is not a codename.\n' +
      'It is the newsroom script that auto-deletes "sensitive civic incidents."\n' +
      'Last editor: V. Grindle.\n' +
      'Last run: 3 hours before the public statement.\n\n' +
      'Your monitor pops up a chat from your boss:\n' +
      '"Need that office plant story by noon. no drama."\n\n' +
      'The cover-up is real, and the boss is typing.',
    next_node: 'publish_choice',
  },

  publish_choice: {
    id: 'publish_choice',
    type: 'choice',
    location: 'NEWSROOM',
    content:
      'You have receipts, logs, and a memo so dumb it reads like parody.\n' +
      'Publishing means war with your boss.\n' +
      'Not publishing means writing "Top 10 Staplers of 2026."',
    choices: [
      { id: 1, text: 'Publish now and mute Slack forever', next_node: 'publish_story' },
      { id: 2, text: 'Hold it and survive another team sync', next_node: 'hold_story' },
    ],
  },

  publish_story: {
    id: 'publish_story',
    type: 'story',
    location: 'NEWSROOM',
    content:
      'You hit ENTER.\n\n' +
      'The story goes live: "CITY SINKHOLE COVER-UP TIED TO NEWSROOM DELETIONS."\n' +
      'Traffic spikes. Anonymous tips flood in. Legal calls three times.\n' +
      'Your boss posts in #general: "Reminder: we value transparency."\n\n' +
      'You screenshot that for historical purposes.',
    effects: {
      set_state: { newsroom_coverup_exposed: true, story_published: true },
    },
    next_node: 'newsroom_end',
  },

  hold_story: {
    id: 'hold_story',
    type: 'story',
    location: 'NEWSROOM',
    content:
      'You draft, then do not send.\n' +
      'Your boss pats your shoulder and says "great instinct."\n' +
      'You gain one survival day and lose five years spiritually.\n\n' +
      'The files are still there. For now.',
    next_node: 'newsroom_desk',
  },

  newsroom_end: {
    id: 'newsroom_end',
    type: 'story',
    location: 'NEWSROOM',
    content:
      '>>> STORY FILED. FIRE EXTINGUISHER LOCATED. <<<\n\n' +
      'The cover-up is on record.\n' +
      'Your byline survives first contact with management.\n' +
      'The office plant article remains unpublished.\n\n' +
      '[ Newsroom objective complete. ]',
    next_node: 'newsroom_desk',
  },
};
