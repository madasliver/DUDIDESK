import type { Item, Tab } from "../types";

export interface UndoAction {
  type: "icon" | "tab";
  tab?: Tab;
  items: Item[];
}

const MAX_UNDO = 5;
const stack: UndoAction[] = [];
let onChange: (() => void) | null = null;

export function pushUndo(action: UndoAction): void {
  stack.push(action);
  if (stack.length > MAX_UNDO) stack.shift();
  onChange?.();
}

export function popUndo(): UndoAction | undefined {
  const action = stack.pop();
  onChange?.();
  return action;
}

export function hasUndo(): boolean {
  return stack.length > 0;
}

export function onUndoChange(cb: () => void): void {
  onChange = cb;
}
