const PREFIX = 'space-adventure-';

export class StorageManager {
  // ── Generic helpers ──
  getJSON(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  setJSON(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch { /* storage full or blocked */ }
  }

  // ── High Scores ──
  getHighScores() {
    return this.getJSON('high-scores') || [];
  }

  isHighScore(score) {
    const scores = this.getHighScores();
    return scores.length < 5 || score > scores[scores.length - 1].score;
  }

  addHighScore(name, score) {
    const scores = this.getHighScores();
    scores.push({ name, score });
    scores.sort((a, b) => b.score - a.score);
    if (scores.length > 5) scores.length = 5;
    this.setJSON('high-scores', scores);
    return scores;
  }

  // ── Space Journal ──
  getJournal() {
    return this.getJSON('journal') || {};
  }

  addJournalEntry(id, data) {
    const journal = this.getJournal();
    journal[id] = {
      name: data.name,
      facts: data.facts.slice(0, 3),
      visitedAt: Date.now(),
    };
    this.setJSON('journal', journal);
  }

  clearJournal() {
    this.setJSON('journal', {});
  }

  // ── Achievements ──
  getAchievements() {
    return this.getJSON('achievements') || {};
  }

  unlockAchievement(id) {
    const achievements = this.getAchievements();
    if (achievements[id]) return false; // already unlocked
    achievements[id] = Date.now();
    this.setJSON('achievements', achievements);
    return true; // newly unlocked
  }

  isAchievementUnlocked(id) {
    return !!this.getAchievements()[id];
  }

  // ── Save/Load Game ──
  getSaves() {
    return this.getJSON('saves') || [];
  }

  saveGame(slot, gameState) {
    const saves = this.getSaves();
    // Remove existing save in this slot
    const idx = saves.findIndex(s => s.slot === slot);
    if (idx !== -1) saves.splice(idx, 1);
    saves.push({ slot, timestamp: Date.now(), ...gameState });
    saves.sort((a, b) => a.slot - b.slot);
    this.setJSON('saves', saves);
  }

  loadGame(slot) {
    const saves = this.getSaves();
    return saves.find(s => s.slot === slot) || null;
  }

  deleteSave(slot) {
    const saves = this.getSaves().filter(s => s.slot !== slot);
    this.setJSON('saves', saves);
  }
}
