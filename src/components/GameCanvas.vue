<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import type { Block, GameSpeed, GameDifficulty } from '../types/game';
import { getRandomWord } from '../utils/words';
import { audio } from '../utils/audio';

const props = defineProps<{
  speed: GameSpeed;
  difficulty: GameDifficulty;
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
}>();

const emit = defineEmits<{
  (e: 'update-score', newScore: number): void;
  (e: 'game-over'): void;
}>();

const CONTAINER_HEIGHT = 352;
const BLOCK_HEIGHT = 32;
const COLS = 12;
const ROWS = 11; // 11 rows * 32px = 352px

const blocks = ref<Block[]>([]);
const stackedCounts = ref<number[]>(new Array(COLS).fill(0));
const hiddenInputRef = ref<HTMLInputElement | null>(null);
const isFocused = ref(false);

let nextBlockId = 1;
let lastTime = 0;
let timeSinceLastSpawn = 0;
let animationFrameId = 0;

// Speed definitions (pixels per second)
const SPEED_VALUES: Record<GameSpeed, number> = {
  1: 15,  // Turtle
  2: 28,  // Bicycle
  3: 48,  // Car
  4: 78,  // Airplane
  5: 120  // Rocket
};

// Spawn intervals (seconds)
const SPAWN_INTERVALS: Record<GameSpeed, number> = {
  1: 4.5,
  2: 3.5,
  3: 2.5,
  4: 1.6,
  5: 0.9
};

const getSpawnInterval = () => SPAWN_INTERVALS[props.speed];
const getSpeedPxSec = () => SPEED_VALUES[props.speed];

// Input handling
const focusInput = () => {
  if (hiddenInputRef.value) {
    hiddenInputRef.value.focus();
    isFocused.value = true;
  }
};

const handleBlur = () => {
  isFocused.value = false;
};

const handleInput = (e: Event) => {
  const inputEl = e.target as HTMLInputElement;
  const val = inputEl.value;
  if (!val) return;
  
  // Clean value (take the last character entered just in case, but usually it is just one character)
  const char = val.trim().slice(-1);
  if (char) {
    eliminateChar(char);
  }
  inputEl.value = '';
};

// Elimination logic
const eliminateChar = (char: string) => {
  // Find matches on screen
  const matches = blocks.value.filter(b => b.char === char);
  if (matches.length === 0) {
    audio.playError();
    return;
  }

  // Find the one closest to the bottom (max Y)
  matches.sort((a, b) => b.y - a.y);
  const target = matches[0];

  // Remove the block
  blocks.value = blocks.value.filter(b => b.id !== target.id);
  audio.playMatch();

  // Score points
  const points = target.status === 'falling' ? 10 * props.speed : 15 * props.speed;
  emit('update-score', props.score + points);

  // If it was stacked, adjust the ones above it
  if (target.status === 'stacked') {
    const col = target.column;
    const targetY = target.y;
    
    // Slide down all stacked blocks in the same column that were above it
    blocks.value.forEach(b => {
      if (b.column === col && b.status === 'stacked' && b.y < targetY) {
        b.y += BLOCK_HEIGHT;
      }
    });
    
    stackedCounts.value[col] = Math.max(0, stackedCounts.value[col] - 1);
  }
};

// Spawn a new block
const spawnBlock = () => {
  // Find non-full columns
  const availableCols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (stackedCounts.value[c] < ROWS) {
      availableCols.push(c);
    }
  }

  if (availableCols.length === 0) {
    return; // All columns full
  }

  // Pick a random available column
  const colIdx = Math.floor(Math.random() * availableCols.length);
  const column = availableCols[colIdx];

  // Generate word
  const char = getRandomWord(props.difficulty);

  const newBlock: Block = {
    id: nextBlockId++,
    char,
    column,
    y: -BLOCK_HEIGHT, // Start just off screen at the top
    status: 'falling'
  };

  blocks.value.push(newBlock);
};

// Main Game loop
const update = (timestamp: number) => {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000; // convert to seconds
  lastTime = timestamp;

  if (props.isPlaying && !props.isPaused) {
    // 1. Spawning
    timeSinceLastSpawn += dt;
    if (timeSinceLastSpawn >= getSpawnInterval()) {
      spawnBlock();
      timeSinceLastSpawn = 0;
    }

    // 2. Physics & Collisions
    const speed = getSpeedPxSec();
    
    for (let i = blocks.value.length - 1; i >= 0; i--) {
      const block = blocks.value[i];
      if (block.status === 'falling') {
        const col = block.column;
        const stackedCount = stackedCounts.value[col];
        
        // Target Y is the top of the stack in this column
        const targetY = CONTAINER_HEIGHT - (stackedCount + 1) * BLOCK_HEIGHT;
        
        block.y += speed * dt;
        
        // Check collision
        if (block.y >= targetY) {
          block.y = targetY;
          block.status = 'stacked';
          stackedCounts.value[col]++;
          
          // Check game over
          if (targetY <= 0) {
            emit('game-over');
            audio.playGameOver();
            cancelAnimationFrame(animationFrameId);
            return;
          }
        }
      }
    }
  }

  animationFrameId = requestAnimationFrame(update);
};

// Watchers to start/stop loop
watch(() => props.isPlaying, (playing) => {
  if (playing) {
    resetGame();
    lastTime = 0;
    timeSinceLastSpawn = 0;
    spawnBlock(); // Spawn first block immediately on start
    focusInput();
  }
});

const resetGame = () => {
  blocks.value = [];
  stackedCounts.value = new Array(COLS).fill(0);
  nextBlockId = 1;
};

onMounted(() => {
  animationFrameId = requestAnimationFrame(update);
  focusInput();
  
  // Register globally to capture clicks
  document.addEventListener('click', focusInput);
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  document.removeEventListener('click', focusInput);
});

// Expose methods for testing or app usage
defineExpose({
  focusInput,
  resetGame,
  eliminateChar
});
</script>

<template>
  <div class="game-container win95-inset" @click="focusInput">
    <!-- Grid Layout background to match retro look -->
    <div class="game-canvas">
      <!-- Falling / Stacked blocks -->
      <div
        v-for="block in blocks"
        :key="block.id"
        class="block win95-outset"
        :style="{
          left: (block.column * 34 + 1) + 'px',
          top: block.y + 'px',
          zIndex: block.status === 'falling' ? 10 : 5
        }"
      >
        {{ block.char }}
      </div>

      <!-- PAUSED overlay -->
      <div v-if="isPaused && isPlaying" class="overlay">
        <div class="overlay-dialog win95-outset">
          <div class="dialog-title title-bar">
            <span>提示</span>
          </div>
          <div class="dialog-content">
            <p>遊戲已暫停。</p>
            <p>按下「選項/暫停」或工具列以繼續。</p>
          </div>
        </div>
      </div>

      <!-- READY overlay -->
      <div v-if="!isPlaying" class="overlay">
        <div class="welcome-text">
          <p style="font-size: 16px; margin-bottom: 10px; font-weight: bold; color: #00ff00;">
            中文輸入法練習
          </p>
          <p style="margin-bottom: 20px; color: #cccccc;">
            請按「遊戲(G) -> 開始(S)」以進行練習
          </p>
          <p style="font-size: 11px; color: #888888;">
            (支援注音、倉頡、大易、無蝦米等系統輸入法)
          </p>
        </div>
      </div>
    </div>

    <!-- Hidden Input for capturing IME composition -->
    <input
      ref="hiddenInputRef"
      type="text"
      class="hidden-ime-input"
      @input="handleInput"
      @blur="handleBlur"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
    />
  </div>
</template>

<style scoped>
.game-container {
  width: 410px;
  height: 354px;
  background-color: #000000;
  position: relative;
  z-index: 1;
  overflow: hidden;
  cursor: default;
}

.game-canvas {
  width: 100%;
  height: 100%;
  position: relative;
}

/* Individual character block */
.block {
  position: absolute;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
  color: #000000;
  background-color: var(--win95-face);
  box-sizing: border-box;
}

/* Invisible text field for capturing keystrokes */
.hidden-ime-input {
  position: absolute;
  bottom: -40px; /* Put it off-screen but focused */
  left: 50%;
  width: 200px;
  height: 20px;
  opacity: 0;
  border: none;
  outline: none;
  pointer-events: none;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.overlay-dialog {
  width: 220px;
  background-color: var(--win95-face);
  padding: 3px;
}

.dialog-title {
  height: 18px;
  font-size: 11px;
}

.dialog-content {
  padding: 15px 10px;
  text-align: center;
  color: black;
  font-size: 12px;
  line-height: 1.5;
}

.welcome-text {
  text-align: center;
  padding: 20px;
}
</style>
