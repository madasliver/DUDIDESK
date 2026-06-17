// ── Shortcut & Folder types ──────────────────────────────────
export interface LinkItem {
  type: "link";
  name: string;
  url: string;
  col: number;
  row: number;
  tabId: string;
}

export interface FolderEntry {
  name: string;
  url: string;
}

export interface FolderItem {
  type: "folder";
  name: string;
  color: FolderColorId;
  col: number;
  row: number;
  tabId: string;
  items: FolderEntry[];
}

export type Item = LinkItem | FolderItem;

// ── Tabs ───────────────────────────────────────────────────
export interface Tab {
  id: string;
  name: string;
  color?: FolderColorId;
}

// ── Preferences ──────────────────────────────────────────────
export type ModeId = "dark" | "mid" | "light";
export type SizeId = "s" | "m" | "l" | "xl";
export type BgId = "grid" | "dots" | "plus" | "aliens";
export type ClockStyle = "default" | "analog";
export type FolderColorId =
  | "none" | "red" | "orange" | "yellow" | "green" | "blue" | "purple";

export interface Prefs {
  mode: ModeId;
  size: SizeId;
  bg: BgId;
  title: string;
  opacity: number; // 0-10
  tabs: Tab[];
  activeTab: string;
  clockStyle: ClockStyle;
  clockX: number;
  clockY: number;
}

// ── Theme & Size values ──────────────────────────────────────
export interface Theme {
  bg: string;
  bg2: string;
  fg: string;
  fg2: string;
  fg3: string;
  border: string;
}

export interface SizePreset {
  icon: string;
  img: string;
  label: string;
  search: string;
  pad: string;
  word: string;
  sw: string;
  cell: string;
}

export interface FolderColor {
  id: FolderColorId;
  color: string;
  border: string;
}

export interface CellPos {
  col: number;
  row: number;
}
