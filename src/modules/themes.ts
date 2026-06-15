import type { Theme, ModeId, FolderColor } from "../types";

export const THEMES: Record<ModeId, Theme> = {
  dark:  { bg: "#0a0a0a", bg2: "#111111", fg: "#e8e4d0", fg2: "#a09880", fg3: "#303030", border: "#e8e4d0" },
  mid:   { bg: "#1a1a1a", bg2: "#222222", fg: "#e8e4d0", fg2: "#a09880", fg3: "#504840", border: "#e8e4d0" },
  light: { bg: "#f0ece0", bg2: "#e4dfd0", fg: "#1a1a1a", fg2: "#504840", fg3: "#a09880", border: "#1a1a1a" },
};

export const FOLDER_COLORS: FolderColor[] = [
  { id: "none",   color: "transparent", border: "var(--fg3)" },
  { id: "red",    color: "#7a1f1f",     border: "#c0392b" },
  { id: "orange", color: "#7a3f0f",     border: "#d4691a" },
  { id: "yellow", color: "#5a4a00",     border: "#c8a800" },
  { id: "green",  color: "#1a4a20",     border: "#2ecc71" },
  { id: "blue",   color: "#0f2a5a",     border: "#2980b9" },
  { id: "purple", color: "#3a1a5a",     border: "#8e44ad" },
];
