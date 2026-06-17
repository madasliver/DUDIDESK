import type { Item, Prefs, Tab } from "../types";

const PREF_KEY = "dudidesk_prefs";
const SC_KEY = "dudidesk_v7";

export const DEFAULT_TAB_ID = "home";

const DEFAULT_TABS: Tab[] = [{ id: DEFAULT_TAB_ID, name: "HOME" }];

const DEFAULT_PREFS: Prefs = {
  mode: "mid",
  size: "m",
  bg: "grid",
  title: "DUDI",
  opacity: 4,
  tabs: DEFAULT_TABS.map(t => ({ ...t })),
  activeTab: DEFAULT_TAB_ID,
  clockStyle: "default",
  clockX: -1,
  clockY: 12,
};

const DEFAULT_SHORTCUTS: Item[] = [
  { type: "link", name: "UNI",       url: "https://www.bht-berlin.de",   col: 0, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "BHT MAIL",  url: "https://mail.bht-berlin.de",  col: 1, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "STRATO",    url: "https://webmail.strato.de",   col: 2, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "YOUTUBE",   url: "https://youtube.com",         col: 3, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "FACEBOOK",  url: "https://facebook.com",        col: 4, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "FIGMA",     url: "https://figma.com",           col: 5, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "TELEGRAM",  url: "https://web.telegram.org",    col: 6, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "GEMINI",    url: "https://gemini.google.com",   col: 7, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "ASTA MAIL", url: "https://mail.asta-bht.de",    col: 8, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "AUTHENTIK", url: "https://authentik.io",        col: 9, row: 0, tabId: DEFAULT_TAB_ID },
];

export let prefs: Prefs = { ...DEFAULT_PREFS };

export function loadPrefs(): Prefs {
  try {
    const stored = localStorage.getItem(PREF_KEY);
    if (stored) prefs = { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch {
    /* keep defaults */
  }
  if (!prefs.tabs || !prefs.tabs.length) prefs.tabs = DEFAULT_TABS.map(t => ({ ...t }));
  if (!prefs.tabs.some(t => t.id === prefs.activeTab)) prefs.activeTab = prefs.tabs[0].id;
  return prefs;
}

export function savePrefs(): void {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}

/** Tab an item belongs to, defaulting older stored items to the HOME tab. */
export function tabOf(item: Item): string {
  return item.tabId || DEFAULT_TAB_ID;
}

export function loadShortcuts(): Item[] {
  try {
    const raw = localStorage.getItem(SC_KEY);
    if (raw) {
      const list = JSON.parse(raw) as Item[];
      return list.map(item => item.tabId ? item : { ...item, tabId: DEFAULT_TAB_ID });
    }
  } catch {
    /* fall through */
  }
  return [...DEFAULT_SHORTCUTS];
}

export function saveShortcuts(list: Item[]): void {
  localStorage.setItem(SC_KEY, JSON.stringify(list));
}

export function favicon(url: string): string {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).origin}&sz=64`;
  } catch {
    return "";
  }
}
