/** Mineral definition as served by the backend (GET /config/minerals). */
export interface Mineral {
  id: string;
  name: string;
  shape: "circle" | "diamond" | "bag";
  radius: number;
  weight: number;
  value: number;
  /** When set, the actual value is random in [value, value_max]. */
  value_max: number | null;
  color: string;
  spawn_weight: number;
  min_level: number;
}

/** A concrete object placed in a level. */
export interface FieldItem {
  id: number;
  mineralId: string;
  x: number;
  y: number;
  radius: number;
  weight: number;
  value: number;
}
