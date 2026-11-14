import { brand } from '@/theme/brand';

export const money = (amount: number) =>
  `${brand.currency} ${Math.round(amount).toLocaleString('en-US')}`;

export const daysBetween = (from: Date, to: Date) =>
  Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));
