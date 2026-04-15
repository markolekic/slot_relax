export const SYMBOL_KEYS = [
  'mob_head',
  'samurai_head',
  'queen_head',
  'blondie_head',
  'king_head',
  'gent_head',
  'driver_head',
  'gamer_head',
] as const;

export type SymbolKey = (typeof SYMBOL_KEYS)[number];
