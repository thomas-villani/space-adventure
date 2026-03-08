export const ACHIEVEMENTS = [
  // Exploration
  { id: 'first_visit', name: 'First Steps', desc: 'Visit your first destination', icon: 0x00FF66, category: 'exploration' },
  { id: 'inner_planets', name: 'Inner Explorer', desc: 'Visit Mercury, Venus, Earth, and Mars', icon: 0xFF8844, category: 'exploration' },
  { id: 'outer_planets', name: 'Outer Explorer', desc: 'Visit Jupiter, Saturn, Uranus, and Neptune', icon: 0x4488FF, category: 'exploration' },
  { id: 'all_moons', name: 'Moon Walker', desc: 'Visit all 12 moons', icon: 0xCCCCCC, category: 'exploration' },
  { id: 'all_planets', name: 'Planet Master', desc: 'Visit all planets and dwarf planets', icon: 0xFFDD00, category: 'exploration' },
  { id: 'completionist', name: 'Completionist', desc: 'Visit every destination', icon: 0xFF00FF, category: 'exploration' },
  { id: 'voyager_found', name: 'Space Pioneer', desc: 'Find the Voyager spacecraft', icon: 0xDDCC88, category: 'exploration' },
  { id: 'wormhole_explorer', name: 'Wormhole Explorer', desc: 'Use the wormhole for the first time', icon: 0x9966FF, category: 'exploration' },

  // Quiz
  { id: 'first_quiz', name: 'Quiz Star', desc: 'Answer your first quiz correctly', icon: 0xFFD700, category: 'quiz' },
  { id: 'quiz_streak_3', name: 'Brain Power', desc: 'Get 3 correct quizzes in a row', icon: 0x00FFAA, category: 'quiz' },
  { id: 'quiz_streak_5', name: 'Space Genius', desc: 'Get 5 correct quizzes in a row', icon: 0xFF44FF, category: 'quiz' },

  // Score
  { id: 'score_50', name: 'Rising Star', desc: 'Reach a score of 50', icon: 0xFFAA00, category: 'score' },
  { id: 'score_100', name: 'Space Hero', desc: 'Reach a score of 100', icon: 0xFF6600, category: 'score' },
  { id: 'score_200', name: 'Galactic Legend', desc: 'Reach a score of 200', icon: 0xFF0044, category: 'score' },

  // Collectibles
  { id: 'first_crystal', name: 'Shiny!', desc: 'Collect your first space crystal', icon: 0x00FFFF, category: 'collectibles' },
  { id: 'crystals_25', name: 'Crystal Hunter', desc: 'Collect 25 space crystals', icon: 0xFF88FF, category: 'collectibles' },

  // Asteroid
  { id: 'sharpshooter', name: 'Sharpshooter', desc: 'Destroy 10 asteroids in one run', icon: 0x00FF00, category: 'asteroid' },
  { id: 'untouchable', name: 'Untouchable', desc: 'Complete asteroid run without getting hit', icon: 0xFFFFFF, category: 'asteroid' },
];

export const ACHIEVEMENT_MAP = {};
for (const a of ACHIEVEMENTS) {
  ACHIEVEMENT_MAP[a.id] = a;
}
