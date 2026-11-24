import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import type { FieldArea } from "./levelGenerator";

export const GROUND_Y = 100;
export const HOOK_ORIGIN = { x: GAME_WIDTH / 2, y: 82 };
export const FIELD_AREA: FieldArea = { left: 30, top: 140, right: GAME_WIDTH - 30, bottom: GAME_HEIGHT - 20 };
