export type ShopCategory = "reaction_gifts" | "elite_gifts" | "status_boosts";

export interface ShopItem {
  id: string;
  nameKey: string;
  icon: string;
  cost: number;
  category: ShopCategory;
  durationHours?: number; // For status boosts
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: "heart", nameKey: "shopHeart", icon: "❤️", cost: 5, category: "reaction_gifts" },
  { id: "fire", nameKey: "shopFire", icon: "🔥", cost: 50, category: "reaction_gifts" },
  { id: "rocket", nameKey: "shopRocket", icon: "🚀", cost: 500, category: "reaction_gifts" },
  { id: "rose", nameKey: "shopRose", icon: "🌹", cost: 10, category: "reaction_gifts" },
  { id: "diamond", nameKey: "shopDiamond", icon: "💎", cost: 100, category: "reaction_gifts" },
  { id: "crown", nameKey: "shopCrown", icon: "👑", cost: 250, category: "elite_gifts" },
  { id: "trophy", nameKey: "shopTrophy", icon: "🏆", cost: 500, category: "elite_gifts" },
  { id: "star", nameKey: "shopStar", icon: "⭐", cost: 200, category: "elite_gifts" },
  { id: "ghost_24h", nameKey: "shopGhost24h", icon: "👻", cost: 99, category: "status_boosts", durationHours: 24 },
];

export function getShopItems(): ShopItem[] {
  return [...SHOP_ITEMS];
}
