import { MISSIONS, MISSION_MAP } from '../data/missions.js';

export class MissionManager {
  constructor(game) {
    this.game = game;
    this.completed = new Set();
    this.available = [];          // up to 3 active mission objects
    this.orderedProgress = {};    // missionId → next required objective index

    // Pick initial missions
    this._pickMissions(3);
  }

  // Called when a destination is fully visited (facts + quiz done)
  onVisit(destId) {
    const justCompleted = [];

    for (const mission of this.available) {
      // Advance ordered missions
      if (mission.ordered) {
        const nextIdx = this.orderedProgress[mission.id] || 0;
        if (nextIdx < mission.objectives.length && mission.objectives[nextIdx] === destId) {
          this.orderedProgress[mission.id] = nextIdx + 1;
          // Auto-advance past already-visited objectives
          while (this.orderedProgress[mission.id] < mission.objectives.length &&
                 this.game.visited.has(mission.objectives[this.orderedProgress[mission.id]])) {
            this.orderedProgress[mission.id]++;
          }
        }
      }

      if (this._isComplete(mission)) {
        justCompleted.push(mission);
      }
    }

    for (const mission of justCompleted) {
      this._completeMission(mission);
    }
  }

  _isComplete(mission) {
    if (mission.ordered) {
      return (this.orderedProgress[mission.id] || 0) >= mission.objectives.length;
    }
    return mission.objectives.every(id => this.game.visited.has(id));
  }

  // Returns 0..1 progress fraction
  getProgress(mission) {
    if (mission.ordered) {
      return (this.orderedProgress[mission.id] || 0) / mission.objectives.length;
    }
    const done = mission.objectives.filter(id => this.game.visited.has(id)).length;
    return done / mission.objectives.length;
  }

  // Check if a specific objective in a mission is done
  isObjectiveDone(mission, objectiveId) {
    if (mission.ordered) {
      const idx = mission.objectives.indexOf(objectiveId);
      return idx < (this.orderedProgress[mission.id] || 0);
    }
    return this.game.visited.has(objectiveId);
  }

  _completeMission(mission) {
    this.completed.add(mission.id);
    this.available = this.available.filter(m => m.id !== mission.id);
    delete this.orderedProgress[mission.id];

    // Reward — slight delay so it doesn't clash with visit popups
    setTimeout(() => {
      this.game.addScore(mission.reward);
      this.game.ui.showScorePopup(mission.reward, `Mission: ${mission.name}`);
      this.game.playMelody([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.2]]);
      this.game.tts.speak(`Mission complete! ${mission.name}`);
    }, 800);

    // Fill back up to 3 available
    this._pickMissions(3 - this.available.length);
  }

  _pickMissions(count) {
    if (count <= 0) return;

    const pool = MISSIONS.filter(m =>
      !this.completed.has(m.id) &&
      !this.available.some(a => a.id === m.id) &&
      // Must have at least 1 unvisited objective
      m.objectives.some(id => !this.game.visited.has(id))
    );

    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const picked = pool.slice(0, count);
    for (const mission of picked) {
      this.available.push(mission);
      if (mission.ordered) {
        // Auto-advance past already-visited objectives
        let idx = 0;
        while (idx < mission.objectives.length && this.game.visited.has(mission.objectives[idx])) {
          idx++;
        }
        this.orderedProgress[mission.id] = idx;
      }
    }
  }

  // ── Save/Load ──
  getState() {
    return {
      completed: [...this.completed],
      available: this.available.map(m => m.id),
      orderedProgress: { ...this.orderedProgress },
    };
  }

  loadState(state) {
    if (!state) return;
    this.completed = new Set(state.completed || []);
    this.orderedProgress = state.orderedProgress || {};
    this.available = (state.available || [])
      .map(id => MISSION_MAP[id])
      .filter(Boolean);
    // Fill up to 3 if needed
    if (this.available.length < 3) {
      this._pickMissions(3 - this.available.length);
    }
  }
}
