export type FavoriteKind = "scenario" | "leetcode" | "quant";

export type FavoriteItem = {
  id: string;
  kind: FavoriteKind;
  title: string;
  href: string;
  subtitle?: string | null;
};
