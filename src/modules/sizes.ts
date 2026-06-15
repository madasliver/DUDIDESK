import type { SizeId, SizePreset } from "../types";

export const SIZES: Record<SizeId, SizePreset> = {
  s:  { icon: "54px", img: "26px", label: "6px", search: "8px",  pad: "11px", word: "22px", sw: "460px", cell: "68px" },
  m:  { icon: "66px", img: "32px", label: "7px", search: "9px",  pad: "13px", word: "28px", sw: "540px", cell: "80px" },
  l:  { icon: "80px", img: "40px", label: "8px", search: "10px", pad: "15px", word: "34px", sw: "600px", cell: "96px" },
  xl: { icon: "96px", img: "50px", label: "9px", search: "11px", pad: "18px", word: "40px", sw: "660px", cell: "114px" },
};
