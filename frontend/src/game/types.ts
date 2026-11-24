/** Shapes mirror the backend schemas (app/schemas). Field names stay snake_case like the API. */

export interface Mineral {
  id: string;
  name: string;
  category: "gold" | "gem" | "chest" | "rock" | "explosive";
  size: "small" | "medium" | "large" | "huge";
  shape: "circle" | "diamond" | "ruby" | "chest" | "barrel";
  radius: number;
  weight: number;
  value: number;
  value_max: number | null;
  color: string;
  spawn_weight: number;
  min_level: number;
  explosion_radius: number | null;
  crit_bonus: number;
}

export interface UpgradeEffects {
  reel_speed_mult: number;
  shoot_speed_mult: number;
  grab_radius: number;
  magnet_radius: number;
  capacity: number;
  max_lift_weight: number;
  strength: number;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  max_stacks: number;
  effects: UpgradeEffects;
}

export interface HookModifiers {
  reel_speed_mult: number;
  shoot_speed_mult: number;
  grab_radius: number;
  magnet_radius: number;
  capacity: number;
  max_lift_weight: number;
  strength: number;
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
  status: "playing" | "choosing_upgrade" | "game_over";
  items: FieldItem[];
  upgrades: Record<string, number>;
  hook: HookModifiers;
  crit_chance: number;
  upgrade_choices: Upgrade[];
}

export interface CollectResult {
  value: number;
  money: number;
  critical: boolean;
  crit_chance: number;
}

export interface LevelResult {
  passed: boolean;
  money: number;
  target: number;
  run: RunState;
}
