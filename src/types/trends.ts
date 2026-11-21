export type TrendTab = 'hot' | 'cooling' | 'past';
export type TrendItem = {
  trendItemId: number;
  name: string;
  nameKo: string;
  description: string;
  category: string;
  badge: 'RISING' | 'STEADY' | 'FADING' | null;
  status: 'ACTIVE' | 'PAST';
  resolvedLanguage: string;
  machineTranslated: boolean;
  trendUpdatedOn: string | null;
};
export type TrendGroups = Record<TrendTab, TrendItem[]>;
