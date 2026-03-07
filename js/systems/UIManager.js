import { GameState } from '../game.js';
import { DESTINATIONS, REQUIRED_DESTINATIONS } from '../data/solarSystem.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

export class UIManager {
  constructor() {
    this.hud = document.getElementById('hud');
    this.hudScore = document.getElementById('hud-score');
    this.hudVisited = document.getElementById('hud-visited');
    this.hudDestination = document.getElementById('hud-destination');

    this.menuScreen = document.getElementById('menu-screen');
    this.proximityPrompt = document.getElementById('proximity-prompt');
    this.proximityName = document.getElementById('proximity-name');

    this.factPanel = document.getElementById('fact-panel');
    this.factTitle = document.getElementById('fact-title');
    this.factBody = document.getElementById('fact-body');

    this.quizPanel = document.getElementById('quiz-panel');
    this.quizQuestion = document.getElementById('quiz-question');
    this.quizOptions = document.getElementById('quiz-options');
    this.quizResult = document.getElementById('quiz-result');

    this.victoryScreen = document.getElementById('victory-screen');
    this.victoryScore = document.getElementById('victory-score');

    this.pauseScreen = document.getElementById('pause-screen');

    this.asteroidHud = document.getElementById('asteroid-hud');
    this.asteroidProgressFill = document.getElementById('asteroid-progress-fill');
    this.asteroidScore = document.getElementById('asteroid-score');

    this.screenFlash = document.getElementById('screen-flash');
    this.flashTimeout = null;

    this.scorePopup = document.getElementById('score-popup');
    this.popupTimeout = null;

    // New elements
    this.journalScreen = document.getElementById('journal-screen');
    this.journalGrid = document.getElementById('journal-grid');
    this.badgeNotification = document.getElementById('badge-notification');
    this.badgeGrid = document.getElementById('badge-grid');
    this.highScoreEntry = document.getElementById('high-score-entry');
    this.highScoreTable = document.getElementById('high-score-table');
    this.hsList = document.getElementById('hs-list');
    this.orbitName = document.getElementById('orbit-name');
    this.orbitSkipHint = document.getElementById('orbit-skip-hint');
    this.victoryPrompt = document.getElementById('victory-prompt');
    this.saveScreen = document.getElementById('save-screen');
    this.loadScreen = document.getElementById('load-screen');
    this.confirmScreen = document.getElementById('confirm-screen');

    this.badgeTimeout = null;

    // Save/load slot navigation
    this._slotIndex = 0;
    this._slotCount = 10;

    // Confirm dialog state
    this._confirmYes = null;
    this._confirmNo = null;
    this._confirmSelected = 1; // 0=Yes, 1=No (default to No for safety)
  }

  showMenu() {
    this.menuScreen.classList.remove('hidden');
    this.hud.classList.add('hidden');
  }

  hideMenu() {
    this.menuScreen.classList.add('hidden');
  }

  onStateChange(state, game) {
    // Hide everything first
    this.menuScreen.classList.add('hidden');
    this.factPanel.classList.add('hidden');
    this.quizPanel.classList.add('hidden');
    this.victoryScreen.classList.add('hidden');
    this.asteroidHud.classList.add('hidden');
    this.proximityPrompt.classList.add('hidden');
    this.orbitName.classList.add('hidden');
    this.orbitSkipHint.classList.add('hidden');
    this.confirmScreen.classList.add('hidden');

    switch (state) {
      case GameState.SOLAR_SYSTEM:
        this.hud.classList.remove('hidden');
        this.updateScore(game.score);
        this.updateVisited(game.visited);
        break;
      case GameState.ASTEROID:
        this.hud.classList.add('hidden');
        break;
      case GameState.ORBIT:
        this.hud.classList.add('hidden');
        break;
      case GameState.LANDING:
        this.hud.classList.add('hidden');
        break;
      case GameState.VICTORY:
        this.hud.classList.add('hidden');
        break;
      case GameState.MENU:
        this.showMenu();
        break;
    }
  }

  updateScore(score) {
    this.hudScore.textContent = `Score: ${Math.max(0, score)}`;
  }

  updateVisited(visitedSet) {
    const requiredVisited = REQUIRED_DESTINATIONS.filter(d => visitedSet.has(d.id)).length;
    this.hudVisited.textContent = `Visited: ${requiredVisited} / ${REQUIRED_DESTINATIONS.length}`;
  }

  setDestination(name) {
    this.hudDestination.textContent = name ? `Near: ${name}` : '';
  }

  showSpeedLabel(label) {
    const el = document.getElementById('hud-speed');
    if (el) el.textContent = `Speed: ${label} [Q]`;
  }

  showProximity(name) {
    this.proximityName.textContent = name;
    this.proximityPrompt.classList.remove('hidden');
  }

  hideProximity() {
    this.proximityPrompt.classList.add('hidden');
  }

  // Fact panel
  showFacts(planetData) {
    this.factTitle.textContent = planetData.name;
    this.factBody.innerHTML = planetData.facts
      .map(f => `<div class="fact-item">${f}</div>`)
      .join('');
    this.factPanel.classList.remove('hidden');
  }

  hideFacts() {
    this.factPanel.classList.add('hidden');
  }

  // Quiz panel
  showQuiz(quiz, onAnswer) {
    this.quizQuestion.textContent = quiz.question;
    this.quizOptions.innerHTML = '';
    this.quizResult.classList.add('hidden');

    quiz.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        const correct = i === quiz.correct;
        // Highlight buttons
        const buttons = this.quizOptions.querySelectorAll('.quiz-option');
        buttons.forEach((b, j) => {
          b.classList.add(j === quiz.correct ? 'correct' : 'wrong');
          b.style.pointerEvents = 'none';
        });

        // Show result
        this.quizResult.classList.remove('hidden', 'correct', 'wrong');
        if (correct) {
          this.quizResult.textContent = 'Correct! Amazing!';
          this.quizResult.classList.add('correct');
        } else {
          this.quizResult.textContent = 'Good try! Keep exploring!';
          this.quizResult.classList.add('wrong');
        }

        onAnswer(correct);
      });
      this.quizOptions.appendChild(btn);
    });

    this.quizPanel.classList.remove('hidden');
  }

  hideQuiz() {
    this.quizPanel.classList.add('hidden');
  }

  // Pause
  showPause(paused) {
    if (paused) {
      this.pauseScreen.classList.remove('hidden');
    } else {
      this.pauseScreen.classList.add('hidden');
    }
  }

  // Victory
  showVictory(score) {
    this.victoryScore.textContent = `Final Score: ${score}`;
    this.victoryScreen.classList.remove('hidden');
  }

  // Asteroid HUD
  showAsteroidHUD() {
    this.asteroidHud.classList.remove('hidden');
  }

  hideAsteroidHUD() {
    this.asteroidHud.classList.add('hidden');
  }

  updateAsteroidProgress(pct) {
    this.asteroidProgressFill.style.width = `${pct * 100}%`;
  }

  updateAsteroidScore(score) {
    this.asteroidScore.textContent = `Score: ${Math.max(0, score)}`;
  }

  // Score popup announcement
  showScorePopup(points, label) {
    if (this.popupTimeout) clearTimeout(this.popupTimeout);
    const sign = points > 0 ? '+' : '';
    const pointsText = points !== 0 ? `<div class="popup-points">${sign}${points} points!</div>` : '';
    this.scorePopup.innerHTML = `${pointsText}<div class="popup-label">${label}</div>`;
    this.scorePopup.className = 'overlay show';
    this.popupTimeout = setTimeout(() => {
      this.scorePopup.className = 'overlay hidden';
    }, 1500);
  }

  // Screen flash
  flashScreen(type) {
    if (this.flashTimeout) clearTimeout(this.flashTimeout);
    this.screenFlash.className = 'overlay ' + type;
    this.flashTimeout = setTimeout(() => {
      this.screenFlash.className = 'overlay hidden';
    }, 300);
  }

  // ── Journal ──
  showJournal(journalData) {
    this.journalGrid.innerHTML = '';
    for (const dest of DESTINATIONS) {
      const entry = journalData[dest.id];
      const card = document.createElement('div');
      if (entry) {
        card.className = 'journal-card visited';
        card.innerHTML = `<h4>${entry.name}</h4>` +
          entry.facts.map(f => `<p>${f}</p>`).join('');
      } else {
        card.className = 'journal-card locked';
        card.innerHTML = `<h4>???</h4><p>Not yet explored</p>`;
      }
      this.journalGrid.appendChild(card);
    }
    this.journalScreen.classList.remove('hidden');
  }

  hideJournal() {
    this.journalScreen.classList.add('hidden');
  }

  // ── Badge Notification Toast ──
  showBadgeNotification(achievement) {
    if (this.badgeTimeout) clearTimeout(this.badgeTimeout);
    const icon = this.badgeNotification.querySelector('.badge-toast-icon');
    const title = this.badgeNotification.querySelector('.badge-toast-title');
    const desc = this.badgeNotification.querySelector('.badge-toast-desc');
    icon.textContent = '\u2B50';
    icon.style.background = `#${achievement.icon.toString(16).padStart(6, '0')}33`;
    icon.style.borderColor = `#${achievement.icon.toString(16).padStart(6, '0')}`;
    title.textContent = achievement.name;
    desc.textContent = achievement.desc;
    this.badgeNotification.className = 'overlay show';
    this.badgeTimeout = setTimeout(() => {
      this.badgeNotification.className = 'overlay hidden';
    }, 3000);
  }

  // ── Badge Grid (Victory) ──
  showBadgeGrid(unlockedAchievements) {
    this.badgeGrid.innerHTML = '';
    for (const a of ACHIEVEMENTS) {
      const item = document.createElement('div');
      const unlocked = !!unlockedAchievements[a.id];
      item.className = `badge-item ${unlocked ? 'unlocked' : 'locked'}`;
      const colorHex = `#${a.icon.toString(16).padStart(6, '0')}`;
      if (unlocked) {
        item.style.borderColor = colorHex;
        item.style.color = colorHex;
      }
      item.textContent = '\u2B50';
      const tooltip = document.createElement('div');
      tooltip.className = 'badge-tooltip';
      tooltip.textContent = unlocked ? `${a.name}: ${a.desc}` : '???';
      item.appendChild(tooltip);
      this.badgeGrid.appendChild(item);
    }
    this.badgeGrid.classList.remove('hidden');
  }

  // ── High Score Entry (full name text input) ──
  showHighScoreEntry(onComplete) {
    this.highScoreEntry.classList.remove('hidden');
    const input = document.getElementById('hs-name-input');
    input.value = '';
    // Brief delay so the Enter press that triggered this doesn't immediately submit
    setTimeout(() => {
      input.focus();
      this._hsHandler = (e) => {
        if (e.key === 'Enter') {
          const name = input.value.trim() || 'ACE';
          input.removeEventListener('keydown', this._hsHandler);
          this._hsHandler = null;
          this.highScoreEntry.classList.add('hidden');
          onComplete(name);
        }
      };
      input.addEventListener('keydown', this._hsHandler);
    }, 200);
  }

  hideHighScoreEntry() {
    const input = document.getElementById('hs-name-input');
    if (this._hsHandler && input) {
      input.removeEventListener('keydown', this._hsHandler);
      this._hsHandler = null;
    }
    this.highScoreEntry.classList.add('hidden');
  }

  // ── High Score Table ──
  showHighScoreTable(scores, currentScore) {
    this.hsList.innerHTML = '';
    for (const entry of scores) {
      const li = document.createElement('li');
      li.textContent = `${entry.name} — ${entry.score}`;
      if (entry.score === currentScore) li.classList.add('current');
      this.hsList.appendChild(li);
    }
    this.highScoreTable.classList.remove('hidden');
  }

  // ── Orbit Mode UI ──
  showOrbitName(name) {
    this.orbitName.textContent = name;
    this.orbitName.classList.remove('hidden');
  }

  hideOrbitName() {
    this.orbitName.classList.add('hidden');
    this.orbitSkipHint.classList.add('hidden');
  }

  showOrbitSkipHint() {
    this.orbitSkipHint.classList.remove('hidden');
  }

  // ── Save Screen ──
  showSaveScreen(saves) {
    this._slotIndex = 0;
    this._buildSlots('save-slots', saves, 'save');
    this.saveScreen.classList.remove('hidden');
  }

  hideSaveScreen() {
    this.saveScreen.classList.add('hidden');
  }

  // ── Load Screen ──
  showLoadScreen(saves) {
    this._slotIndex = 0;
    this._buildSlots('load-slots', saves, 'load');
    this.loadScreen.classList.remove('hidden');
  }

  hideLoadScreen() {
    this.loadScreen.classList.add('hidden');
  }

  _buildSlots(containerId, saves, mode) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const saveMap = {};
    for (const s of saves) saveMap[s.slot] = s;

    for (let i = 1; i <= this._slotCount; i++) {
      const slot = document.createElement('div');
      slot.className = 'save-slot';
      slot.dataset.slot = i;
      const data = saveMap[i];
      if (data) {
        slot.classList.add('occupied');
        const visitedCount = data.visited ? data.visited.length : 0;
        slot.textContent = `Slot ${i} — Score: ${data.score}, ${visitedCount}/${REQUIRED_DESTINATIONS.length} visited`;
      } else {
        slot.classList.add('empty');
        slot.textContent = `Slot ${i} — Empty`;
      }
      if (i === 1) slot.classList.add('selected');
      container.appendChild(slot);
    }
  }

  handleSaveLoadInput(input, mode, onConfirm) {
    const containerId = mode === 'save' ? 'save-slots' : 'load-slots';
    const container = document.getElementById(containerId);
    const slots = container.querySelectorAll('.save-slot');
    if (!slots.length) return;

    if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
      this._slotIndex = Math.max(0, this._slotIndex - 1);
    }
    if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
      this._slotIndex = Math.min(this._slotCount - 1, this._slotIndex + 1);
    }

    slots.forEach((s, i) => s.classList.toggle('selected', i === this._slotIndex));

    if (input.wasPressed('Enter') || input.wasPressed('Space')) {
      const selectedSlot = slots[this._slotIndex];
      const slotNum = parseInt(selectedSlot.dataset.slot);
      // For load, only allow occupied slots
      if (mode === 'load' && selectedSlot.classList.contains('empty')) return;
      onConfirm(slotNum);
    }
  }

  // Show victory prompt (after high score flow)
  showVictoryPrompt() {
    this.victoryPrompt.classList.remove('hidden');
  }

  // ── Confirm Dialog ──
  showConfirm(message, onYes, onNo) {
    this._confirmYes = onYes;
    this._confirmNo = onNo;
    this._confirmSelected = 1; // default to No
    document.getElementById('confirm-message').textContent = message;
    const btns = this.confirmScreen.querySelectorAll('.confirm-btn');
    btns.forEach((b, i) => b.classList.toggle('selected', i === this._confirmSelected));
    this.confirmScreen.classList.remove('hidden');
  }

  hideConfirm() {
    this.confirmScreen.classList.add('hidden');
    this._confirmYes = null;
    this._confirmNo = null;
  }

  handleConfirmInput(input) {
    if (input.wasPressed('ArrowLeft') || input.wasPressed('KeyA')) {
      this._confirmSelected = 0;
    }
    if (input.wasPressed('ArrowRight') || input.wasPressed('KeyD')) {
      this._confirmSelected = 1;
    }
    const btns = this.confirmScreen.querySelectorAll('.confirm-btn');
    btns.forEach((b, i) => b.classList.toggle('selected', i === this._confirmSelected));

    if (input.wasPressed('Enter') || input.wasPressed('Space')) {
      if (this._confirmSelected === 0 && this._confirmYes) {
        this._confirmYes();
      } else if (this._confirmNo) {
        this._confirmNo();
      }
    }
  }
}
