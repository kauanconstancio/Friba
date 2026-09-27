import type { PokemonRole } from '../types';

export interface PokemonRoleStyle {
  gradient: string;
  borderColor: string;
  glow: string;
  badgeBg: string;
}

/**
 * Padrão oficial e unificado de cores por Battle Type / Role:
 * - All-Rounder: Roxo
 * - Speedster: Azul
 * - Attacker: Laranja
 * - Supporter: Amarelo
 * - Defender: Verde
 */
export const POKEMON_ROLE_STYLES: Record<PokemonRole, PokemonRoleStyle> = {
  'All-Rounder': {
    gradient: 'radial-gradient(ellipse at 50% 30%, rgba(216, 180, 254, 0.45) 0%, transparent 80%), linear-gradient(175deg, #9333EA 0%, #4C1D95 100%)',
    borderColor: 'rgba(192, 132, 252, 0.45)',
    glow: 'rgba(168, 85, 247, 0.45)',
    badgeBg: '#9333EA',
  },
  'Speedster': {
    gradient: 'radial-gradient(ellipse at 50% 30%, rgba(125, 211, 252, 0.45) 0%, transparent 80%), linear-gradient(175deg, #0284C7 0%, #075985 100%)',
    borderColor: 'rgba(56, 189, 248, 0.45)',
    glow: 'rgba(14, 165, 233, 0.45)',
    badgeBg: '#0284C7',
  },
  'Attacker': {
    gradient: 'radial-gradient(ellipse at 50% 30%, rgba(254, 215, 170, 0.45) 0%, transparent 80%), linear-gradient(175deg, #EA580C 0%, #9A3412 100%)',
    borderColor: 'rgba(251, 146, 60, 0.45)',
    glow: 'rgba(249, 115, 22, 0.45)',
    badgeBg: '#EA580C',
  },
  'Supporter': {
    gradient: 'radial-gradient(ellipse at 50% 30%, rgba(254, 240, 138, 0.5) 0%, transparent 80%), linear-gradient(175deg, #EAB308 0%, #854D0E 100%)',
    borderColor: 'rgba(250, 204, 21, 0.45)',
    glow: 'rgba(234, 179, 8, 0.45)',
    badgeBg: '#EAB308',
  },
  'Defender': {
    gradient: 'radial-gradient(ellipse at 50% 30%, rgba(110, 231, 183, 0.45) 0%, transparent 80%), linear-gradient(175deg, #059669 0%, #064E3B 100%)',
    borderColor: 'rgba(52, 211, 153, 0.45)',
    glow: 'rgba(16, 185, 129, 0.45)',
    badgeBg: '#059669',
  },
};

export const DEFAULT_ROLE_STYLE: PokemonRoleStyle = {
  gradient: 'linear-gradient(175deg, #475569 0%, #1E293B 100%)',
  borderColor: 'rgba(148, 163, 184, 0.4)',
  glow: 'rgba(100, 116, 139, 0.3)',
  badgeBg: '#64748B',
};

export function getPokemonRoleStyle(role: PokemonRole): PokemonRoleStyle {
  return POKEMON_ROLE_STYLES[role] || DEFAULT_ROLE_STYLE;
}
