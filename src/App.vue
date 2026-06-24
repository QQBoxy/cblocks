<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { GameSpeed, GameDifficulty } from './types/game';
import GameCanvas from './components/GameCanvas.vue';
import { audio } from './utils/audio';

const score = ref(0);
const speed = ref<GameSpeed>(2); // Default to Bicycle (level 2)
const difficulty = ref<GameDifficulty>('10kg'); // Default to 10 KG (medium)

const isPlaying = ref(false);
const isPaused = ref(false);
const isGameOver = ref(false);
const soundEnabled = ref(true);

// Menus active state
const activeMenu = ref<string | null>(null);
const showAboutDialog = ref(false);

// Game actions
const startGame = () => {
  audio.playClick();
  score.value = 0;
  isPlaying.value = true;
  isPaused.value = false;
  isGameOver.value = false;
  activeMenu.value = null;
};

const togglePause = () => {
  audio.playClick();
  if (!isPlaying.value) return;
  isPaused.value = !isPaused.value;
  activeMenu.value = null;
  audio.playPause();
};

const stopGame = () => {
  audio.playClick();
  isPlaying.value = false;
  isPaused.value = false;
  isGameOver.value = false;
  score.value = 0;
  activeMenu.value = null;
};

const exitGame = () => {
  audio.playClick();
  stopGame();
  activeMenu.value = null;
};

const toggleSound = () => {
  audio.playClick();
  soundEnabled.value = !soundEnabled.value;
  audio.setEnabled(soundEnabled.value);
  activeMenu.value = null;
};

const changeSpeed = (newSpeed: GameSpeed) => {
  audio.playClick();
  speed.value = newSpeed;
};

const changeDifficulty = (newDiff: GameDifficulty) => {
  audio.playClick();
  difficulty.value = newDiff;
};

const handleGameOver = () => {
  isGameOver.value = true;
  isPlaying.value = false;
};

const handleUpdateScore = (newScore: number) => {
  score.value = newScore;
};

const clickMenu = (menu: string) => {
  audio.playClick();
  if (activeMenu.value === menu) {
    activeMenu.value = null;
  } else {
    activeMenu.value = menu;
  }
};

const closeMenus = () => {
  activeMenu.value = null;
};

// Keyboard shortcuts for retro menus (Alt + G, Alt + O, Alt + H)
const handleGlobalKey = (e: KeyboardEvent) => {
  if (e.altKey) {
    if (e.key === 'g' || e.key === 'G') {
      e.preventDefault();
      clickMenu('game');
    } else if (e.key === 'o' || e.key === 'O') {
      e.preventDefault();
      clickMenu('options');
    } else if (e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      clickMenu('help');
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKey);
});
</script>

<template>
  <div class="desktop" @click="closeMenus">
    <!-- Classic Win95 Window Container -->
    <div class="win95-window win95-outset">
      
      <!-- Title Bar -->
      <div class="title-bar" :class="{ inactive: isPaused && isPlaying }">
        <div class="title-bar-text">
          <!-- Building Icon -->
          <svg class="title-bar-icon" viewBox="0 0 16 16" width="16" height="16">
            <rect x="2" y="2" width="12" height="12" fill="#c0c0c0" stroke="#000000" stroke-width="1"/>
            <line x1="5" y1="5" x2="11" y2="5" stroke="#000000" stroke-width="1"/>
            <line x1="5" y1="8" x2="11" y2="8" stroke="#000000" stroke-width="1"/>
            <line x1="5" y1="11" x2="11" y2="11" stroke="#000000" stroke-width="1"/>
            <line x1="8" y1="2" x2="8" y2="14" stroke="#000000" stroke-width="1"/>
          </svg>
          <span>中文輸入法練習 - 輸入法</span>
        </div>
        <div class="title-bar-controls">
          <button class="win95-window-btn" aria-label="Minimize">
            <svg viewBox="0 0 8 2" width="8" height="2" style="fill: black; margin-top: 5px;">
              <rect width="8" height="2" />
            </svg>
          </button>
          <button class="win95-window-btn" aria-label="Maximize" disabled>
            <svg viewBox="0 0 9 9" width="9" height="9" style="fill: none; stroke: black; stroke-width: 1; margin-top: 1px;">
              <rect x="0.5" y="0.5" width="8" height="8" />
            </svg>
          </button>
          <button class="win95-window-btn win95-window-btn-close" aria-label="Close" @click="exitGame">
            <!-- Classic X Cross -->
            <svg viewBox="0 0 8 8" width="8" height="8" style="fill: black;">
              <path d="M0,0 L2,0 L4,2 L6,0 L8,0 L5,4 L8,8 L6,8 L4,6 L2,8 L0,8 L3,4 Z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Menu Bar -->
      <div class="menu-bar">
        <div class="menu-item" :class="{ active: activeMenu === 'game' }" @click.stop="clickMenu('game')">
          遊戲(<span class="shortcut-underline">G</span>)
          <!-- Dropdown -->
          <div v-if="activeMenu === 'game'" class="menu-dropdown">
            <div class="menu-dropdown-item" @click="startGame">
              <span>開始(<span class="shortcut-underline">S</span>)</span>
            </div>
            <div class="menu-dropdown-item" :class="{ disabled: !isPlaying }" @click="togglePause">
              <span>{{ isPaused ? '繼續(R)' : '暫停(P)' }}</span>
            </div>
            <div class="menu-dropdown-divider"></div>
            <div class="menu-dropdown-item" @click="exitGame">
              <span>結束(<span class="shortcut-underline">X</span>)</span>
            </div>
          </div>
        </div>

        <div class="menu-item" :class="{ active: activeMenu === 'options' }" @click.stop="clickMenu('options')">
          選項(<span class="shortcut-underline">O</span>)
          <!-- Dropdown -->
          <div v-if="activeMenu === 'options'" class="menu-dropdown">
            <div class="menu-dropdown-item" @click="toggleSound">
              <span>聲音(<span class="shortcut-underline">S</span>)</span>
              <span v-if="soundEnabled">✓</span>
            </div>
            <div class="menu-dropdown-divider"></div>
            <div class="menu-dropdown-item" @click="score = 0; closeMenus();">
              <span>清除高分紀錄(<span class="shortcut-underline">C</span>)</span>
            </div>
          </div>
        </div>

        <div class="menu-item" :class="{ active: activeMenu === 'help' }" @click.stop="clickMenu('help')">
          說明(<span class="shortcut-underline">H</span>)
          <!-- Dropdown -->
          <div v-if="activeMenu === 'help'" class="menu-dropdown">
            <div class="menu-dropdown-item" @click="showAboutDialog = true; closeMenus();">
              <span>關於中文輸入法練習(<span class="shortcut-underline">A</span>)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <!-- Stop Button -->
        <button class="toolbar-btn" style="width: 28px; height: 26px;" title="停止遊戲" @click="stopGame" :disabled="!isPlaying">
          <svg viewBox="0 0 20 20" width="18" height="18">
            <circle cx="10" cy="10" r="8" fill="red" stroke="white" stroke-width="1.5" />
            <text x="10" y="14.5" fill="white" font-size="10" font-weight="bold" text-anchor="middle" font-family="PMingLiU, sans-serif">停</text>
          </svg>
        </button>

        <div class="toolbar-separator"></div>

        <!-- Speed Selectors -->
        <div class="toolbar-group">
          <!-- Turtle (Speed 1) -->
          <button class="toolbar-btn" :class="{ active: speed === 1 }" title="速度：烏龜" @click="changeSpeed(1)">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <!-- Turtle SVG representation -->
              <path d="M3,10 Q6,6 10,7 M10,7 Q13,7 14,8 M12,8 Q11,11 7,11 M7,11 Q4,11 3,10" fill="green" stroke="black" stroke-width="1"/>
              <circle cx="6" cy="11" r="1.5" fill="black" />
              <circle cx="11" cy="11" r="1.5" fill="black" />
              <path d="M12,7.5 L14,7" stroke="black" stroke-width="1" />
            </svg>
          </button>
          
          <!-- Bicycle (Speed 2) -->
          <button class="toolbar-btn" :class="{ active: speed === 2 }" title="速度：單車" @click="changeSpeed(2)">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <!-- Bicycle SVG representation -->
              <circle cx="4" cy="11" r="2.5" fill="none" stroke="black" stroke-width="1.2" />
              <circle cx="12" cy="11" r="2.5" fill="none" stroke="black" stroke-width="1.2" />
              <line x1="4" y1="11" x2="8" y2="11" stroke="black" stroke-width="1" />
              <line x1="8" y1="11" x2="11" y2="7" stroke="black" stroke-width="1" />
              <line x1="12" y1="11" x2="10" y2="7" stroke="black" stroke-width="1" />
              <line x1="4" y1="11" x2="6" y2="7" stroke="black" stroke-width="1" />
              <line x1="6" y1="7" x2="10" y2="7" stroke="black" stroke-width="1" />
              <!-- handlebars -->
              <line x1="11" y1="7" x2="11" y2="5" stroke="black" stroke-width="1.5" />
              <line x1="10" y1="5" x2="12" y2="5" stroke="black" stroke-width="1.5" />
            </svg>
          </button>
          
          <!-- Car (Speed 3) -->
          <button class="toolbar-btn" :class="{ active: speed === 3 }" title="速度：汽車" @click="changeSpeed(3)">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <!-- Red Car representation -->
              <rect x="2" y="8" width="12" height="4" fill="red" stroke="black" stroke-width="1" />
              <path d="M5,8 L7,5 L11,5 L12,8 Z" fill="red" stroke="black" stroke-width="1" />
              <circle cx="5" cy="12" r="2" fill="grey" stroke="black" stroke-width="1" />
              <circle cx="11" cy="12" r="2" fill="grey" stroke="black" stroke-width="1" />
            </svg>
          </button>
          
          <!-- Airplane (Speed 4) -->
          <button class="toolbar-btn" :class="{ active: speed === 4 }" title="速度：飛機" @click="changeSpeed(4)">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <!-- Airplane representation -->
              <path d="M2,8 L14,8 L12,6 L10,6 L10,3 L8,3 L8,6 L4,6 Z" fill="silver" stroke="black" stroke-width="1" />
              <path d="M10,8 L10,12 L8,12 L8,8" fill="silver" stroke="black" stroke-width="1" />
            </svg>
          </button>
          
          <!-- Rocket (Speed 5) -->
          <button class="toolbar-btn" :class="{ active: speed === 5 }" title="速度：火箭" @click="changeSpeed(5)">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <!-- Yellow Rocket representation -->
              <path d="M8,2 C10,5 11,8 10,12 L6,12 C5,8 6,5 8,2 Z" fill="gold" stroke="black" stroke-width="1" />
              <path d="M6,10 L4,13 L6,12 Z M10,10 L12,13 L10,12 Z" fill="red" stroke="black" />
              <circle cx="8" cy="7" r="1.5" fill="lightblue" stroke="black" />
              <!-- thrust flame -->
              <path d="M7,12 L8,15 L9,12 Z" fill="orange" />
            </svg>
          </button>
        </div>

        <div class="toolbar-separator"></div>

        <!-- Difficulty Pools (Weights) -->
        <div class="toolbar-group">
          <!-- 1 KG -->
          <button class="toolbar-btn weight-btn" :class="{ active: difficulty === '1kg' }" title="字庫難度：1 KB" @click="changeDifficulty('1kg')">
            <svg viewBox="0 0 24 16" width="22" height="14">
              <!-- Weight outline -->
              <path d="M4,10 L4,5 L7,5 L7,2 L15,2 L15,5 L18,5 L18,10 Z" fill="blue" stroke="black" stroke-width="1"/>
              <text x="11" y="9" fill="white" font-size="6.5" font-weight="bold" font-family="Tahoma, sans-serif" text-anchor="middle">1 KG</text>
            </svg>
          </button>
          
          <!-- 10 KG -->
          <button class="toolbar-btn weight-btn" :class="{ active: difficulty === '10kg' }" title="字庫難度：10 KB" @click="changeDifficulty('10kg')">
            <svg viewBox="0 0 24 16" width="22" height="14">
              <path d="M3,11 L3,5 L6,5 L6,2 L16,2 L16,5 L19,5 L19,11 Z" fill="blue" stroke="black" stroke-width="1"/>
              <text x="11" y="9" fill="white" font-size="6.5" font-weight="bold" font-family="Tahoma, sans-serif" text-anchor="middle">10KG</text>
            </svg>
          </button>
          
          <!-- 100 KG -->
          <button class="toolbar-btn weight-btn" :class="{ active: difficulty === '100kg' }" title="字庫難度：100 KB" @click="changeDifficulty('100kg')">
            <svg viewBox="0 0 24 16" width="22" height="14">
              <path d="M2,12 L2,5 L5,5 L5,2 L17,2 L17,5 L20,5 L20,12 Z" fill="blue" stroke="black" stroke-width="1"/>
              <text x="11" y="9" fill="white" font-size="5" font-weight="bold" font-family="Tahoma, sans-serif" text-anchor="middle">100KG</text>
            </svg>
          </button>
        </div>

        <div class="toolbar-separator"></div>

        <!-- Help Button -->
        <button class="toolbar-btn" title="關於說明" @click="showAboutDialog = true">
          <span style="font-weight: bold; font-size: 13px; font-family: monospace;">?</span>
        </button>
      </div>

      <!-- Main Game Canvas Area -->
      <GameCanvas
        ref="gameCanvasRef"
        :speed="speed"
        :difficulty="difficulty"
        :isPlaying="isPlaying"
        :isPaused="isPaused"
        :score="score"
        @game-over="handleGameOver"
        @update-score="handleUpdateScore"
      />

      <!-- Status Bar -->
      <div class="status-bar">
        <div class="status-panel grow">
          <span>{{ isPlaying ? (isPaused ? '暫停' : '進行中') : (isGameOver ? '遊戲結束' : '就緒') }}</span>
        </div>
        <div class="status-panel progress-panel"></div>
        <div class="status-panel score-panel">
          <span>分數  {{ score }}</span>
        </div>
      </div>

    </div>

    <!-- About Dialog -->
    <div v-if="showAboutDialog" class="overlay">
      <div class="win95-window win95-outset about-dialog">
        <div class="title-bar">
          <span class="title-bar-text">關於 中文輸入法練習</span>
          <button class="win95-window-btn" @click="showAboutDialog = false">
            <svg viewBox="0 0 8 8" width="8" height="8" style="fill: black;">
              <path d="M0,0 L2,0 L4,2 L6,0 L8,0 L5,4 L8,8 L6,8 L4,6 L2,8 L0,8 L3,4 Z" />
            </svg>
          </button>
        </div>
        <div class="about-content">
          <div style="display: flex; gap: 15px; align-items: flex-start; margin-bottom: 15px;">
            <!-- Icon placeholder -->
            <svg viewBox="0 0 16 16" width="32" height="32" style="flex-shrink: 0;">
              <rect x="2" y="2" width="12" height="12" fill="#000080" />
              <rect x="4" y="4" width="8" height="8" fill="yellow" />
              <text x="8" y="11" fill="black" font-size="8" text-anchor="middle" font-weight="bold">中</text>
            </svg>
            <div>
              <h2 style="font-size: 13px; font-weight: bold; margin-bottom: 5px;">中文輸入法練習 Web 復刻版</h2>
              <p style="color: #444; margin-bottom: 8px;">版本 1.0 (Vue + TS)</p>
              <p style="line-height: 1.4;">這是 Windows 95 經典打字遊戲「中文輸入法練習」的網頁重製版，旨在保留原汁原味的 Windows 95/98 視覺介面與遊玩體驗。</p>
            </div>
          </div>
          <div class="win95-divider"></div>
          <div style="display: flex; justify-content: flex-end; margin-top: 15px;">
            <button class="win95-btn" @click="showAboutDialog = false" style="min-width: 60px;">確定</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Reset and global styles */
body {
  margin: 0;
  padding: 0;
  background-color: var(--win95-desktop);
}

.desktop {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

/* About Dialog Custom Styling */
.about-dialog {
  width: 320px;
}

.about-content {
  padding: 15px 12px;
  font-size: 12px;
  color: black;
}

.win95-divider {
  height: 1px;
  border-bottom: 1px solid var(--win95-highlight);
  background-color: var(--win95-shadow);
  margin: 10px 0;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

/* Custom styles for toolbar weights */
.weight-btn {
  width: 32px !important;
  height: 22px !important;
  padding: 0 !important;
}

.menu-item.active {
  color: white;
}

/* Dropdown styling updates */
.menu-dropdown {
  background-color: #c0c0c0 !important;
  color: black !important;
  box-shadow: 1px 1px 0px var(--win95-dark-shadow);
}

.menu-dropdown-item {
  background-color: #c0c0c0 !important;
  color: black !important;
}

.menu-dropdown-item:hover {
  background-color: var(--win95-blue-active) !important;
  color: white !important;
}
</style>
