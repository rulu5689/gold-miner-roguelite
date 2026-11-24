/** Shapes mirror the backend schemas (app/schemas). Field names stay snake_case like the API. */

export interface Mineral {
  id: string;
  name: string;
  category: "gold" | "gem" | "chest" | "rock" | "explosive";
  shape: "circle" | "diamond" | "chest" | "barrel";
  radius: number;
  weight: number;
  value: number;
  value_max: number | null;
  color: string;
  spawn_weight: number;
  min_level: number;
  explosion_radius: number | null;
}

export interface FieldItem {
  id: number;
  mineral_id: string;
  x: number;
  y: number;
  radius: number;
  weight: number;
  value: number;
}

export interface RunState {
  run_id: string;
  seed: number;
  level: number;
  money: number;
  target: number;
  time_limit: number;
  status: "playing" | "game_over";
  items: FieldItem[];
}

export interface LevelResult {
  passed: boolean;
  money: number;
  target: number;
  run: RunState;
}
