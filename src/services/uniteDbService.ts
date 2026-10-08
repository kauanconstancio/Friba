import type { PokemonData, PokemonRole } from '../types';
import { POKEMON_ROSTER } from '../data/pokemonData';

export interface UniteDbPokemonItem {
  name: string;
  id: number;
  display_name?: string;
  tier?: string;
  tags?: {
    range?: string;
    difficulty?: string;
    role?: string;
  };
  damage_type?: string;
}

const UNITE_DB_API_URL = 'https://unite-db.com/pokemon.json';
const CACHE_KEY = 'friba_unite_db_pokemon_cache_v3';

export async function fetchUniteDbPokemons(): Promise<PokemonData[]> {
  try {
    const res = await fetch(UNITE_DB_API_URL);
    if (!res.ok) {
      throw new Error(`Falha na resposta da API unite-db: ${res.status}`);
    }

    const data: UniteDbPokemonItem[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return POKEMON_ROSTER;
    }

    const pokemons: PokemonData[] = data.map(item => {
      const rawName = item.name;
      const displayName = item.display_name || item.name;
      const role = item.tags?.role || 'All-Rounder';
      const damageType = item.damage_type === 'Special' ? 'Especial' : 'Físico';
      const thumbnailUrl = `https://d275t8dp8rxb42.cloudfront.net/pokemon/thumbnail/${encodeURIComponent(rawName)}.png`;
      const portraitUrl = `https://d275t8dp8rxb42.cloudfront.net/pokemon/portrait/${encodeURIComponent(rawName)}.png`;

      let badgeColor = '#9333EA'; // All-Rounder (Roxo)
      if (role === 'Attacker') badgeColor = '#F97316'; // Laranja
      else if (role === 'Speedster') badgeColor = '#0284C7'; // Azul
      else if (role === 'Defender') badgeColor = '#10B981'; // Verde
      else if (role === 'Supporter') badgeColor = '#EAB308'; // Amarelo

      const cleanId = rawName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

      return {
        id: cleanId,
        rawName,
        name: displayName,
        role: (role === 'Attacker' || role === 'Speedster' || role === 'Defender' || role === 'Supporter') 
          ? (role as PokemonRole) 
          : 'All-Rounder',
        damageType,
        sprite: thumbnailUrl,
        portrait: portraitUrl,
        thumbnail: thumbnailUrl,
        badgeColor,
        tier: (item.tier as any) || 'S',
        difficulty: item.tags?.difficulty || 'Intermediate',
        range: item.tags?.range || 'Melee'
      };
    });

    pokemons.sort((a, b) => a.name.localeCompare(b.name));

    // Salvar cache no localStorage
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(pokemons));
    } catch {}

    return pokemons;
  } catch (error) {
    console.warn('Usando dados locais sincronizados do unite-db devido a:', error);
    // Tentar ler do cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}

    return POKEMON_ROSTER;
  }
}
