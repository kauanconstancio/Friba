import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw,
  Search,
  Play,
  Pause,
  Ban,
  Target,
  Check,
  Bot,
  ChevronDown,
} from "lucide-react";
import type { PokemonData, PokemonRole } from "../../types";
import { POKEMON_ROSTER } from "../../data/pokemonData";
import { fetchUniteDbPokemons } from "../../services/uniteDbService";
import { getPokemonRoleStyle } from "../../utils/pokemonStyles";

interface DraftSimulatorProps {
  teamName: string;
}

// Sequência oficial de Draft Competitivo Pokémon Unite (3 bans por time + 5 picks)
const DRAFT_STEPS: {
  type: "ban" | "pick";
  team: "blue" | "orange";
  label: string;
  slotIndex: number;
}[] = [
  // FASE DE BANIMENTO COMPLETA: 3 BANS PARA CADA TIME (TOTAL 6 BANS)
  { type: "ban", team: "blue", label: "Ban 1 Azul", slotIndex: 0 },
  { type: "ban", team: "orange", label: "Ban 1 Laranja", slotIndex: 0 },
  { type: "ban", team: "blue", label: "Ban 2 Azul", slotIndex: 1 },
  { type: "ban", team: "orange", label: "Ban 2 Laranja", slotIndex: 1 },
  { type: "ban", team: "blue", label: "Ban 3 Azul", slotIndex: 2 },
  { type: "ban", team: "orange", label: "Ban 3 Laranja", slotIndex: 2 },

  // FASE DE ESCOLHA (PICKS): 5 PICKS POR TIME (SNAKE DRAFT 1-2-2-2-2-1)
  { type: "pick", team: "blue", label: "Pick 1 Azul", slotIndex: 0 },
  { type: "pick", team: "orange", label: "Pick 1 Laranja", slotIndex: 0 },
  { type: "pick", team: "orange", label: "Pick 2 Laranja", slotIndex: 1 },
  { type: "pick", team: "blue", label: "Pick 2 Azul", slotIndex: 1 },
  { type: "pick", team: "blue", label: "Pick 3 Azul", slotIndex: 2 },
  { type: "pick", team: "orange", label: "Pick 3 Laranja", slotIndex: 2 },
  { type: "pick", team: "orange", label: "Pick 4 Laranja", slotIndex: 3 },
  { type: "pick", team: "blue", label: "Pick 4 Azul", slotIndex: 3 },
  { type: "pick", team: "blue", label: "Pick 5 Azul", slotIndex: 4 },
  { type: "pick", team: "orange", label: "Pick 5 Laranja", slotIndex: 4 },
];

export const DraftSimulator: React.FC<DraftSimulatorProps> = ({ teamName }) => {
  const [draftMode, setDraftMode] = useState<"Default" | "All-Star">("Default");
  const [pokemons, setPokemons] = useState<PokemonData[]>(POKEMON_ROSTER);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [timer, setTimer] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [vsAi, setVsAi] = useState(false);
  const [search, setSearch] = useState("");
  const [battleTypeFilter, setBattleTypeFilter] = useState<string>("All");

  useEffect(() => {
    let isMounted = true;
    setIsLoadingApi(true);
    fetchUniteDbPokemons()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setPokemons(data);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingApi(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Bans: 3 slots por time
  const [blueBans, setBlueBans] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);
  const [orangeBans, setOrangeBans] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);

  // Picks: 5 slots por time
  const [bluePicks, setBluePicks] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [orangePicks, setOrangePicks] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);

  const isFinished = stepIndex >= DRAFT_STEPS.length;
  const currentStep = !isFinished ? DRAFT_STEPS[stepIndex] : null;

  // Lista de IDs já banidos ou escolhidos
  const pickedIds = [
    ...blueBans.filter(Boolean),
    ...orangeBans.filter(Boolean),
    ...bluePicks.filter(Boolean),
    ...orangePicks.filter(Boolean),
  ] as string[];

  // Relógio do timer
  useEffect(() => {
    if (!isTimerRunning || isFinished || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleAutoPickOnTimeout();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, timer, isFinished, stepIndex]);

  // Turno automático de IA se ativado
  useEffect(() => {
    if (vsAi && currentStep && currentStep.team === "orange" && !isFinished) {
      const t = setTimeout(() => {
        const available = pokemons.filter((p) => !pickedIds.includes(p.id));
        if (available.length > 0) {
          handleSelectPokemon(
            available[Math.floor(Math.random() * Math.min(5, available.length))]
              .id,
          );
        }
      }, 800);
      return () => clearTimeout(t);
    }
  }, [stepIndex, vsAi, isFinished, pokemons]);

  const handleAutoPickOnTimeout = () => {
    const available = pokemons.filter((p) => !pickedIds.includes(p.id));
    if (available.length > 0) {
      handleSelectPokemon(available[0].id);
    }
  };

  const handleSelectPokemon = (pokemonId: string) => {
    if (isFinished || !currentStep || pickedIds.includes(pokemonId)) return;

    if (currentStep.type === "ban") {
      if (currentStep.team === "blue") {
        const next = [...blueBans];
        next[currentStep.slotIndex] = pokemonId;
        setBlueBans(next);
      } else {
        const next = [...orangeBans];
        next[currentStep.slotIndex] = pokemonId;
        setOrangeBans(next);
      }
    } else {
      if (currentStep.team === "blue") {
        const next = [...bluePicks];
        next[currentStep.slotIndex] = pokemonId;
        setBluePicks(next);
      } else {
        const next = [...orangePicks];
        next[currentStep.slotIndex] = pokemonId;
        setOrangePicks(next);
      }
    }

    setStepIndex((prev) => prev + 1);
    setTimer(30);
  };

  const handleNoBan = () => {
    if (!currentStep || currentStep.type !== "ban") return;
    if (currentStep.team === "blue") {
      const next = [...blueBans];
      next[currentStep.slotIndex] = "NO_BAN";
      setBlueBans(next);
    } else {
      const next = [...orangeBans];
      next[currentStep.slotIndex] = "NO_BAN";
      setOrangeBans(next);
    }
    setStepIndex((prev) => prev + 1);
    setTimer(30);
  };

  const handleResetDraft = () => {
    setBlueBans([null, null, null]);
    setOrangeBans([null, null, null]);
    setBluePicks([null, null, null, null, null]);
    setOrangePicks([null, null, null, null, null]);
    setStepIndex(0);
    setTimer(30);
    setIsTimerRunning(false);
  };

  const getPokemon = (id: string | null) => {
    if (!id || id === "NO_BAN") return null;
    return pokemons.find((p) => p.id === id);
  };

  // Configuração estética de degradê e iluminação por Battle Type / Role unificada com a Prancheta
  const getRoleCardStyle = (role: PokemonRole) => {
    return getPokemonRoleStyle(role);
  };

  // Filtragem Otimizada de Pokémons com useMemo (evita recálculo a cada segundo do timer)
  const filteredPokemons = useMemo(() => {
    const s = search.toLowerCase();
    return pokemons.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(s) ||
        p.role.toLowerCase().includes(s);
      const matchesType =
        battleTypeFilter === "All" || p.role === battleTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [pokemons, search, battleTypeFilter]);

  return (
    <div className="unite-draft-container">
      {/* ========================================================================= */}
      {/* TOPO: MODO DRAFT, CONTROLE DE TIMER E SLOTS DE BAN */}
      {/* ========================================================================= */}
      <div className="draft-top-section">
        {/* BANS TIME AZUL (ESQUERDA) */}
        <div className="bans-group blue-bans">
          {blueBans.map((banId, idx) => {
            const poke = getPokemon(banId);
            const isCurrent =
              currentStep?.type === "ban" &&
              currentStep?.team === "blue" &&
              currentStep?.slotIndex === idx;

            return (
              <div
                key={idx}
                className={`ban-box ${isCurrent ? "active-slot" : ""} ${banId ? "filled" : ""}`}
                title={`Ban Azul #${idx + 1}`}
              >
                {poke ? (
                  <div className="banned-poke-wrapper">
                    <img
                      src={poke.sprite}
                      alt={poke.name}
                      className="banned-poke-img"
                    />
                    <Ban size={22} className="ban-overlay-icon" />
                  </div>
                ) : banId === "NO_BAN" ? (
                  <span className="no-ban-text">SKIP</span>
                ) : (
                  <Ban size={18} className="ban-empty-icon" />
                )}
              </div>
            );
          })}
        </div>

        {/* CENTRO: TOGGLE DE MODO + TIMER CLÁSSICO */}
        <div className="draft-center-header">
          <div className="mode-toggle-pills">
            <button
              className={`mode-pill ${draftMode === "Default" ? "active" : ""}`}
              onClick={() => setDraftMode("Default")}
            >
              Default
            </button>
          </div>

          {/* TIMER DE DRAFT */}
          <div className="timer-control-row">
            <button
              className={`start-timer-btn ${isTimerRunning ? "running" : ""}`}
              onClick={() => setIsTimerRunning(!isTimerRunning)}
            >
              {isTimerRunning ? (
                <>
                  <Pause size={14} /> Pausar Timer ({timer}s)
                </>
              ) : (
                <>
                  <Play size={14} /> Start timer ({timer}s)
                </>
              )}
            </button>

            {currentStep && (
              <div className={`turn-indicator-pill ${currentStep.team}`}>
                <span className="turn-label">
                  {currentStep.team === "blue"
                    ? `🔵 ${teamName || "Friba"}`
                    : "🔴 Adversário"}
                </span>
                <span className="turn-action">
                  {currentStep.type === "ban" ? "• BANINDO" : "• ESCOLHENDO"}
                </span>
              </div>
            )}

            {isFinished && (
              <div className="draft-finished-badge">
                <Check size={14} /> DRAFT CONCLUÍDO
              </div>
            )}
          </div>
        </div>

        {/* BANS TIME LARANJA (DIREITA) */}
        <div className="bans-group orange-bans">
          {orangeBans.map((banId, idx) => {
            const poke = getPokemon(banId);
            const isCurrent =
              currentStep?.type === "ban" &&
              currentStep?.team === "orange" &&
              currentStep?.slotIndex === idx;

            return (
              <div
                key={idx}
                className={`ban-box ${isCurrent ? "active-slot" : ""} ${banId ? "filled" : ""}`}
                title={`Ban Laranja #${idx + 1}`}
              >
                {poke ? (
                  <div className="banned-poke-wrapper">
                    <img
                      src={poke.sprite}
                      alt={poke.name}
                      className="banned-poke-img"
                    />
                    <Ban size={22} className="ban-overlay-icon" />
                  </div>
                ) : banId === "NO_BAN" ? (
                  <span className="no-ban-text">SKIP</span>
                ) : (
                  <Ban size={18} className="ban-empty-icon" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CORPO PRINCIPAL: 5 PICKS AZUL (ESQ) | GRADE POKÉMON (CENTRO) | 5 PICKS LARANJA (DIR) */}
      {/* ========================================================================= */}
      <div className="draft-main-layout">
        {/* COLUNA ESQUERDA: 5 PICKS TIME AZUL (FRIBA) */}
        <div className="team-picks-col blue-team-col">
          {bluePicks.map((pickId, idx) => {
            const poke = getPokemon(pickId);
            const isCurrent =
              currentStep?.type === "pick" &&
              currentStep?.team === "blue" &&
              currentStep?.slotIndex === idx;
            const pokeStyle = poke ? getRoleCardStyle(poke.role) : null;

            return (
              <div
                key={idx}
                className={`player-pick-slot blue-slot ${isCurrent ? "active-slot" : ""} ${poke ? "has-pokemon" : ""}`}
              >
                <span className="slot-order-num">#{idx + 1}</span>

                {/* Slot do Pokémon Escolhido ou Mira */}
                <div className="slot-pokemon-target">
                  {poke && pokeStyle ? (
                    <div
                      className="picked-poke-box"
                      style={{
                        background: pokeStyle.gradient,
                        borderColor: pokeStyle.borderColor,
                        boxShadow: `0 0 14px ${pokeStyle.glow}, inset 0 1px 1px rgba(255, 255, 255, 0.3)`,
                      }}
                    >
                      <img
                        src={poke.sprite}
                        alt={poke.name}
                        className="picked-poke-img"
                      />
                      <span className="picked-poke-name">{poke.name}</span>
                    </div>
                  ) : (
                    <div className="empty-target">
                      <Target size={22} className="target-crosshair" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* COLUNA CENTRAL: BARRA DE FERRAMENTAS + GRADE COMPLETA DE POKÉMONS */}
        <div className="draft-center-roster">
          {/* BARRA DE FERRAMENTAS */}
          <div className="roster-toolbar">
            <div className="search-input-wrap">
              <Search size={15} className="search-ico" />
              <input
                type="text"
                placeholder={
                  isLoadingApi
                    ? "Sincronizando com unite-db..."
                    : "Search Pokémon..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {isLoadingApi && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#60A5FA",
                    marginRight: "8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Syncing...
                </span>
              )}
            </div>

            <div className="filter-select-wrap">
              <select
                value={battleTypeFilter}
                onChange={(e) => setBattleTypeFilter(e.target.value)}
              >
                <option value="All">Filter by Battle Type</option>
                <option value="Attacker">Attacker (Atacante)</option>
                <option value="Speedster">Speedster (Velocista)</option>
                <option value="All-Rounder">All-Rounder (Equilibrado)</option>
                <option value="Defender">Defender (Defensor)</option>
                <option value="Supporter">Supporter (Suporte)</option>
              </select>
              <ChevronDown size={14} className="select-arrow" />
            </div>

            <button
              className="toolbar-btn reset-btn"
              onClick={handleResetDraft}
              title="Resetar Draft"
            >
              <RotateCcw size={15} />
            </button>

            <button
              className={`toolbar-btn ai-btn ${vsAi ? "active" : ""}`}
              onClick={() => setVsAi(!vsAi)}
              title="Alternar Modo IA para o time adversário"
            >
              <Bot size={15} /> {vsAi ? "IA Ativa" : "Manual"}
            </button>
          </div>

          {/* GRADE DE CARDS DOS POKÉMONS */}
          <div className="pokemons-cards-grid">
            {/* Card especial de "Sem Ban" / Ban Skip */}
            {currentStep?.type === "ban" && (
              <div
                className="pokemon-card no-ban-card"
                onClick={handleNoBan}
                title="Pular Banimento / Sem Ban"
              >
                <div className="no-ban-circle">
                  <Ban size={28} />
                </div>
                <div className="poke-card-footer">
                  <span>SEM BAN</span>
                </div>
              </div>
            )}

            {filteredPokemons.map((pokemon) => {
              const isSelected = pickedIds.includes(pokemon.id);
              const cardStyle = getRoleCardStyle(pokemon.role);

              return (
                <div
                  key={pokemon.id}
                  className={`pokemon-card ${isSelected ? "disabled" : ""}`}
                  style={{
                    background: cardStyle.gradient,
                    borderColor: cardStyle.borderColor,
                    ["--card-glow" as any]: cardStyle.glow,
                  }}
                  onClick={() => !isSelected && handleSelectPokemon(pokemon.id)}
                  title={`${pokemon.name} (${pokemon.role})`}
                >
                  <div className="poke-card-art-wrap">
                    <img
                      src={pokemon.sprite}
                      alt={pokemon.name}
                      className="poke-card-img"
                      loading="lazy"
                    />
                  </div>

                  <div className="poke-card-footer">
                    <span className="poke-card-name">
                      {pokemon.name.toUpperCase()}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="disabled-overlay">
                      <Check size={18} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CRÉDITOS DO RODAPÉ (ESTILO BEPIZU & UNITE-DB) */}
          <div className="draft-footer-credits">
            <span>
              Dados, nomes e retratos sincronizados via API oficial{" "}
              <a
                href="https://unite-db.com/"
                target="_blank"
                rel="noreferrer"
                className="unite-db-link"
              >
                unite-db.com
              </a>{" "}
              ({pokemons.length} Pokémons)
            </span>
          </div>
        </div>

        {/* COLUNA DIREITA: 5 PICKS TIME LARANJA (ADVERSÁRIO) */}
        <div className="team-picks-col orange-team-col">
          {orangePicks.map((pickId, idx) => {
            const poke = getPokemon(pickId);
            const isCurrent =
              currentStep?.type === "pick" &&
              currentStep?.team === "orange" &&
              currentStep?.slotIndex === idx;
            const pokeStyle = poke ? getRoleCardStyle(poke.role) : null;

            return (
              <div
                key={idx}
                className={`player-pick-slot orange-slot ${isCurrent ? "active-slot" : ""} ${poke ? "has-pokemon" : ""}`}
              >
                {/* Slot do Pokémon Escolhido ou Mira */}
                <div className="slot-pokemon-target">
                  {poke && pokeStyle ? (
                    <div
                      className="picked-poke-box"
                      style={{
                        background: pokeStyle.gradient,
                        borderColor: pokeStyle.borderColor,
                        boxShadow: `0 0 14px ${pokeStyle.glow}, inset 0 1px 1px rgba(255, 255, 255, 0.3)`,
                      }}
                    >
                      <img
                        src={poke.sprite}
                        alt={poke.name}
                        className="picked-poke-img"
                      />
                      <span className="picked-poke-name">{poke.name}</span>
                    </div>
                  ) : (
                    <div className="empty-target">
                      <Target size={22} className="target-crosshair" />
                    </div>
                  )}
                </div>

                <span className="slot-order-num">#{idx + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ESTILOS CSS FIÉIS AO DESIGN ORIGINAL DA UNITEDRAFT */}
      <style>{`
        .unite-draft-container {
          max-width: 1380px;
          margin: 0 auto;
          padding: 16px 20px 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* TOPO: BANS E CONTROLES */
        .draft-top-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          position: relative;
        }

        .bans-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ban-box {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(239, 68, 68, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .ban-box.active-slot {
          border-color: #EF4444;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
          animation: pulse-border 1.5s infinite;
        }

        @keyframes pulse-border {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .ban-empty-icon {
          color: #EF4444;
          opacity: 0.6;
        }

        .banned-poke-wrapper {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2);
        }

        .banned-poke-img {
          width: 38px;
          height: 38px;
          object-fit: contain;
          opacity: 0.55;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
        }

        .ban-overlay-icon {
          position: absolute;
          color: #EF4444;
          stroke-width: 2.8;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
        }

        .no-ban-text {
          font-size: 0.68rem;
          font-weight: 800;
          color: #64748B;
        }

        /* CENTRO DO TOPO */
        .draft-center-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .mode-toggle-pills {
          display: flex;
          background: #0d1526;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 3px;
        }

        .mode-pill {
          background: transparent;
          border: none;
          color: #94A3B8;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 6px 20px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mode-pill.active {
          background: #0B5FFF;
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(11, 95, 255, 0.4);
        }

        .timer-control-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .start-timer-btn {
          background: #111827;
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #FFFFFF;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 7px 18px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .start-timer-btn:hover {
          background: #1f2937;
          border-color: #0B5FFF;
        }

        .start-timer-btn.running {
          background: #0B5FFF;
          border-color: #38BDF8;
        }

        .turn-indicator-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .turn-indicator-pill.blue {
          background: rgba(11, 95, 255, 0.18);
          border: 1px solid rgba(11, 95, 255, 0.5);
          color: #60A5FA;
        }

        .turn-indicator-pill.orange {
          background: rgba(249, 115, 22, 0.18);
          border: 1px solid rgba(249, 115, 22, 0.5);
          color: #FB923C;
        }

        .draft-finished-badge {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.5);
          color: #34D399;
          font-size: 0.78rem;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ========================================================= */
        /* LAYOUT PRINCIPAL: 3 COLUNAS */
        /* ========================================================= */
        .draft-main-layout {
          display: grid;
          grid-template-columns: 200px 1fr 200px;
          gap: 18px;
          align-items: start;
        }

        @media (max-width: 1100px) {
          .draft-main-layout {
            grid-template-columns: 160px 1fr 160px;
          }
        }

        /* COLUNAS DE PICKS DOS TREINADORES */
        .team-picks-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .player-pick-slot {
          background: rgba(12, 18, 34, 0.6);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          display: flex;
          align-items: center;
          height: 58px;
          padding: 4px 8px;
          gap: 10px;
          position: relative;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.16);
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }

        .player-pick-slot.active-slot {
          border-color: #0B5FFF;
          box-shadow: 0 0 14px rgba(11, 95, 255, 0.55);
        }

        .player-pick-slot.orange-slot.active-slot {
          border-color: #F97316;
          box-shadow: 0 0 14px rgba(249, 115, 22, 0.55);
        }

        .slot-order-num {
          font-size: 0.85rem;
          font-weight: 800;
          color: #64748B;
          width: 26px;
          text-align: center;
          flex-shrink: 0;
          letter-spacing: 0.02em;
        }

        .player-pick-slot.active-slot .slot-order-num {
          color: #60A5FA;
          text-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
        }

        .player-pick-slot.orange-slot.active-slot .slot-order-num {
          color: #FB923C;
          text-shadow: 0 0 8px rgba(251, 146, 60, 0.6);
        }

        .slot-pokemon-target {
          flex: 1;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
        }

        .empty-target {
          width: 100%;
          height: 100%;
          border-radius: 8px;
          border: 1.5px dashed rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.02);
          transition: border-color 0.2s, background 0.2s;
        }

        .player-pick-slot.active-slot .empty-target {
          border-color: rgba(11, 95, 255, 0.5);
          background: rgba(11, 95, 255, 0.06);
        }

        .player-pick-slot.orange-slot.active-slot .empty-target {
          border-color: rgba(249, 115, 22, 0.5);
          background: rgba(249, 115, 22, 0.06);
        }

        .target-crosshair {
          color: #334155;
          transition: color 0.2s;
        }

        .player-pick-slot.active-slot .target-crosshair {
          color: #60A5FA;
        }

        .player-pick-slot.orange-slot.active-slot .target-crosshair {
          color: #FB923C;
        }

        .picked-poke-box {
          width: 100%;
          height: 100%;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.28), 0 4px 10px rgba(0, 0, 0, 0.35);
        }

        .picked-poke-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 48%;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 100%);
          pointer-events: none;
        }

        .picked-poke-img {
          width: 42px;
          height: 42px;
          object-fit: contain;
          filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.6));
          position: relative;
          z-index: 1;
        }

        .picked-poke-name {
          font-size: 0.76rem;
          font-weight: 800;
          font-style: italic;
          color: #FFFFFF;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          position: relative;
          z-index: 1;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        /* ========================================================= */
        /* COLUNA CENTRAL: BARRA DE BUSCA + GRADE DE POKÉMONS */
        /* ========================================================= */
        .draft-center-roster {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .roster-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .search-input-wrap {
          flex: 1;
          min-width: 220px;
          position: relative;
        }

        .search-ico {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748B;
        }

        .search-input-wrap input {
          width: 100%;
          background: rgba(12, 18, 34, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          padding: 8px 14px 8px 36px;
          color: #FFFFFF;
          font-size: 0.82rem;
          outline: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .search-input-wrap input:focus {
          border-color: #0B5FFF;
          box-shadow: 0 0 14px rgba(11, 95, 255, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.15);
        }

        .filter-select-wrap {
          position: relative;
          min-width: 180px;
        }

        .filter-select-wrap select {
          width: 100%;
          background: rgba(12, 18, 34, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          padding: 8px 32px 8px 14px;
          color: #CBD5E1;
          font-size: 0.82rem;
          outline: none;
          appearance: none;
          cursor: pointer;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
          transition: border-color 0.2s;
        }

        .filter-select-wrap select:focus {
          border-color: #0B5FFF;
        }

        .select-arrow {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748B;
          pointer-events: none;
        }

        .toolbar-btn {
          background: rgba(12, 18, 34, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94A3B8;
          border-radius: 9999px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.12);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .toolbar-btn:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        .toolbar-btn.ai-btn.active {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10B981;
          color: #34D399;
        }

        /* GRADE DE POKÉMONS ESTILO UNITE DRAFT */
        .pokemons-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(82px, 1fr));
          gap: 8px;
          max-height: 520px;
          overflow-y: auto;
          padding-right: 6px;
        }

        .pokemons-cards-grid::-webkit-scrollbar {
          width: 6px;
        }

        .pokemons-cards-grid::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.14);
          border-radius: 9999px;
        }

        /* CARD INDIVIDUAL DO POKÉMON (DEGRADÊ OFICIAL UNITE DRAFT) */
        .pokemon-card {
          aspect-ratio: 0.88;
          border-radius: 9px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 6px 4px 4px;
          position: relative;
          cursor: pointer;
          border: 1.5px solid rgba(255, 255, 255, 0.18);
          transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.18s ease, box-shadow 0.18s ease;
          overflow: hidden;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.38), inset 0 -1px 2px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.45);
        }

        .pokemon-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 44%;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 100%);
          border-radius: 8px 8px 0 0;
          pointer-events: none;
        }

        .pokemon-card:hover {
          transform: translateY(-3px) scale(1.05);
          border-color: rgba(255, 255, 255, 0.85) !important;
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.6), 0 0 16px var(--card-glow, rgba(255, 255, 255, 0.35)), 0 8px 24px rgba(0, 0, 0, 0.65);
          z-index: 5;
        }

        .pokemon-card.disabled {
          opacity: 0.25;
          filter: grayscale(85%);
          cursor: not-allowed;
          transform: none;
        }

        .poke-card-art-wrap {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
        }

        .poke-card-img {
          width: 62px;
          height: 62px;
          object-fit: contain;
          filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.65));
          transition: transform 0.18s ease;
        }

        .pokemon-card:hover .poke-card-img {
          transform: scale(1.08);
        }

        .poke-card-footer {
          width: 100%;
          background: rgba(10, 14, 26, 0.82);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border-radius: 5px;
          padding: 2.5px 3px;
          text-align: center;
          margin-top: 2px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.35);
          position: relative;
          z-index: 2;
        }

        .poke-card-name {
          font-size: 0.58rem;
          font-weight: 800;
          font-style: italic;
          color: #FFFFFF;
          letter-spacing: 0.04em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
        }

        .disabled-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
        }

        /* CARD SEM BAN */
        .no-ban-card {
          background: #090e1a;
          border: 1.5px dashed rgba(239, 68, 68, 0.6);
        }

        .no-ban-circle {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #EF4444;
        }

        /* CRÉDITOS DO RODAPÉ */
        .draft-footer-credits {
          text-align: center;
          font-size: 0.7rem;
          color: #64748B;
          margin-top: 8px;
        }

        .unite-db-link {
          color: #38BDF8;
          font-weight: 700;
          text-decoration: none;
        }

        .unite-db-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};
