export type Avatar = {
  child?: boolean;
  skin: string;
  hair: string;
  shirt: string;
  style: number;
  body?: 'male' | 'female';
  skinTone?: string;
  parts?: Partial<Record<AvatarCategory, { id: string; color: string }>>;
};
export type AvatarCategory = 'hair' | 'top' | 'bottom' | 'shoes' | 'hat' | 'beard' | 'accessory' | 'cape';
export type Participation = {
  id: string;
  name: string;
  sponsorId?: string;
  contact?: string;
  relationship?: string;
  message: string;
  publicMessage: boolean;
  diaper?: string;
  gift?: string;
  seat: number | null;
  avatar: Avatar | null;
};
export const palette = {
  skin: ["#f6d0af", "#dcaa7a", "#ab7049", "#70432e"],
  hair: ["#372a29", "#815137", "#d9aa52", "#aa535e", "#ddd5cb"],
  shirt: ["#b56c81", "#597c65", "#637eac", "#d3a456", "#8d6eae"],
};
export const defaultAvatar: Avatar = {
  skin: palette.skin[0],
  hair: palette.hair[0],
  shirt: palette.shirt[0],
  style: 0,
};
export const SEAT_COUNT = 48;
