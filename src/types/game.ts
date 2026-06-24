export interface Block {
  id: number;
  char: string;
  column: number;
  y: number; // Row index or pixel position. Grid height is 15 rows.
  status: 'falling' | 'stacked';
}

export type GameSpeed = 1 | 2 | 3 | 4 | 5; // 1: Turtle, 2: Bicycle, 3: Car, 4: Airplane, 5: Rocket
export type GameDifficulty = '1kg' | '10kg' | '100kg';

export interface GameStats {
  score: number;
  speed: GameSpeed;
  difficulty: GameDifficulty;
  status: 'ready' | 'playing' | 'paused' | 'gameover';
}
