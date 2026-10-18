import React, { useState } from 'react';
import type { PlayerGameHistoryItem, PokemonUsageStat, RadarMetrics } from '../../utils/playerStatsCalculator';
import { Trophy, Swords, Shield, Zap, Sparkles } from 'lucide-react';

/* =========================================================================
   1. GRÁFICO CIRCULAR DE WIN RATE (DONUT CHART)
   ========================================================================= */
interface WinRateDonutProps {
  wins: number;
  losses: number;
  draws?: number;
  winRate: number;
  totalGames: number;
}

export const WinRateDonut: React.FC<WinRateDonutProps> = ({
  wins,
  losses,
  draws = 0,
  winRate,
  totalGames,
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<'win' | 'loss' | 'draw' | null>(null);

  const radius = 64;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Se não houver jogos, renderiza círculo neutro
  if (totalGames === 0) {
    return (
      <div className="donut-wrapper">
        <svg viewBox="0 0 160 160" className="donut-svg">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          <text x="80" y="78" textAnchor="middle" className="donut-center-val">
            0%
          </text>
          <text x="80" y="96" textAnchor="middle" className="donut-center-sub">
            0 jogos
          </text>
        </svg>
        <div className="donut-legend">
          <span className="legend-item text-muted">Aguardando partidas</span>
        </div>
      </div>
    );
  }

  const winFrac = wins / totalGames;
  const lossFrac = losses / totalGames;
  const drawFrac = draws / totalGames;

  const winStroke = winFrac * circumference;
  const lossStroke = lossFrac * circumference;
  const drawStroke = drawFrac * circumference;

  const winOffset = 0;
  const lossOffset = -winStroke;
  const drawOffset = -(winStroke + lossStroke);

  return (
    <div className="donut-wrapper">
      <div className="donut-svg-container">
        <svg viewBox="0 0 170 170" className="donut-svg">
          <defs>
            <linearGradient id="winGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="lossGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>
            <linearGradient id="drawGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <filter id="glow-win" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10B981" floodOpacity="0.4" />
            </filter>
            <filter id="glow-loss" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#EF4444" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Track background */}
          <circle
            cx="85"
            cy="85"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />

          {/* Wins Segment */}
          {wins > 0 && (
            <circle
              cx="85"
              cy="85"
              r={radius}
              fill="transparent"
              stroke="url(#winGradient)"
              strokeWidth={hoveredSegment === 'win' ? strokeWidth + 3 : strokeWidth}
              strokeDasharray={`${winStroke} ${circumference}`}
              strokeDashoffset={winOffset}
              strokeLinecap="round"
              transform="rotate(-90 85 85)"
              filter={hoveredSegment === 'win' ? 'url(#glow-win)' : undefined}
              onMouseEnter={() => setHoveredSegment('win')}
              onMouseLeave={() => setHoveredSegment(null)}
              className="donut-segment transition-all"
              style={{ cursor: 'pointer' }}
            />
          )}

          {/* Losses Segment */}
          {losses > 0 && (
            <circle
              cx="85"
              cy="85"
              r={radius}
              fill="transparent"
              stroke="url(#lossGradient)"
              strokeWidth={hoveredSegment === 'loss' ? strokeWidth + 3 : strokeWidth}
              strokeDasharray={`${lossStroke} ${circumference}`}
              strokeDashoffset={lossOffset}
              strokeLinecap="round"
              transform="rotate(-90 85 85)"
              filter={hoveredSegment === 'loss' ? 'url(#glow-loss)' : undefined}
              onMouseEnter={() => setHoveredSegment('loss')}
              onMouseLeave={() => setHoveredSegment(null)}
              className="donut-segment transition-all"
              style={{ cursor: 'pointer' }}
            />
          )}

          {/* Draws Segment */}
          {draws > 0 && (
            <circle
              cx="85"
              cy="85"
              r={radius}
              fill="transparent"
              stroke="url(#drawGradient)"
              strokeWidth={hoveredSegment === 'draw' ? strokeWidth + 3 : strokeWidth}
              strokeDasharray={`${drawStroke} ${circumference}`}
              strokeDashoffset={drawOffset}
              strokeLinecap="round"
              transform="rotate(-90 85 85)"
              onMouseEnter={() => setHoveredSegment('draw')}
              onMouseLeave={() => setHoveredSegment(null)}
              className="donut-segment transition-all"
              style={{ cursor: 'pointer' }}
            />
          )}

          {/* Centro Dinâmico */}
          <text x="85" y="80" textAnchor="middle" className="donut-center-val">
            {hoveredSegment === 'win' ? `${Math.round(winFrac * 100)}%` : hoveredSegment === 'loss' ? `${Math.round(lossFrac * 100)}%` : `${winRate}%`}
          </text>
          <text x="85" y="98" textAnchor="middle" className="donut-center-sub">
            {hoveredSegment === 'win' ? `${wins} Vitórias` : hoveredSegment === 'loss' ? `${losses} Derrotas` : 'Taxa de Vitória'}
          </text>
        </svg>
      </div>

      <div className="donut-legend">
        <div 
          className={`legend-badge win-badge ${hoveredSegment === 'win' ? 'active' : ''}`}
          onMouseEnter={() => setHoveredSegment('win')}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <span className="legend-dot bg-emerald" />
          <span className="legend-name">Vitórias:</span>
          <span className="legend-val text-emerald">{wins}</span>
        </div>

        <div 
          className={`legend-badge loss-badge ${hoveredSegment === 'loss' ? 'active' : ''}`}
          onMouseEnter={() => setHoveredSegment('loss')}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <span className="legend-dot bg-rose" />
          <span className="legend-name">Derrotas:</span>
          <span className="legend-val text-rose">{losses}</span>
        </div>

        {draws > 0 && (
          <div 
            className={`legend-badge draw-badge ${hoveredSegment === 'draw' ? 'active' : ''}`}
            onMouseEnter={() => setHoveredSegment('draw')}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <span className="legend-dot bg-amber" />
            <span className="legend-name">Empates:</span>
            <span className="legend-val text-amber">{draws}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   2. GRÁFICO DE EVOLUÇÃO E DESEMPENHO DOS ÚLTIMOS JOGOS (TIMELINE / BARS)
   ========================================================================= */
interface TimelineChartProps {
  games: PlayerGameHistoryItem[];
  metricType: 'points' | 'kos' | 'damage';
}

export const PerformanceTimelineChart: React.FC<TimelineChartProps> = ({
  games,
  metricType,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<{
    game: PlayerGameHistoryItem;
    x: number;
    y: number;
  } | null>(null);

  // Exibir em ordem cronológica (mais antigos primeiro para a linha de evolução)
  const chronological = [...games].reverse();

  if (chronological.length === 0) {
    return (
      <div className="chart-empty-state">
        <p>Nenhuma partida para exibir na linha temporal.</p>
      </div>
    );
  }

  const getMetricValue = (g: PlayerGameHistoryItem) => {
    if (metricType === 'points') return g.points;
    if (metricType === 'kos') return g.kos;
    return g.damage;
  };

  const getMetricLabel = () => {
    if (metricType === 'points') return 'Pontos Anotados';
    if (metricType === 'kos') return 'KOs (Kills)';
    return 'Dano Causado';
  };

  const values = chronological.map(getMetricValue);
  const maxVal = Math.max(...values, metricType === 'kos' ? 10 : metricType === 'points' ? 150 : 50000);

  const chartWidth = 560;
  const chartHeight = 200;
  const paddingX = 40;
  const paddingBottom = 40;
  const paddingTop = 20;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const stepX = chronological.length > 1 ? innerWidth / (chronological.length - 1) : innerWidth / 2;

  const pointsCoordinates = chronological.map((g, i) => {
    const val = getMetricValue(g);
    const x = chronological.length > 1 ? paddingX + i * stepX : paddingX + innerWidth / 2;
    const y = paddingTop + innerHeight - (val / maxVal) * innerHeight;
    return { x, y, game: g, val };
  });

  // Linha suave SVG (Path)
  const linePath = pointsCoordinates.reduce((acc, curr, idx, arr) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[idx - 1];
    const cpx1 = prev.x + (curr.x - prev.x) / 2;
    const cpy1 = prev.y;
    const cpx2 = prev.x + (curr.x - prev.x) / 2;
    const cpy2 = curr.y;
    return `${acc} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
  }, '');

  // Área preenchida com gradiente
  const areaPath = chronological.length > 1
    ? `${linePath} L ${pointsCoordinates[pointsCoordinates.length - 1].x} ${paddingTop + innerHeight} L ${pointsCoordinates[0].x} ${paddingTop + innerHeight} Z`
    : '';

  return (
    <div className="timeline-chart-root">
      <div className="chart-header-row">
        <span className="chart-title-tag">
          Evolução dos Últimos {chronological.length} Jogos • {getMetricLabel()}
        </span>
        <div className="chart-quick-legend">
          <span className="legend-dot bg-emerald" /> Vitória
          <span className="legend-dot bg-rose ml-2" /> Derrota
        </div>
      </div>

      <div className="svg-responsive-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="timeline-svg">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EC4899" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="barWinGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="barLossGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#B91C1C" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Linhas de grade horizontais */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = paddingTop + innerHeight * (1 - pct);
            const labelVal = Math.round(maxVal * pct);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="chart-axis-label"
                >
                  {labelVal >= 1000 ? `${(labelVal / 1000).toFixed(0)}k` : labelVal}
                </text>
              </g>
            );
          })}

          {/* Barras de fundo por partida */}
          {pointsCoordinates.map((pt, idx) => {
            const barW = Math.max(14, Math.min(28, (innerWidth / pointsCoordinates.length) * 0.45));
            const barH = (pt.val / maxVal) * innerHeight;
            const barY = paddingTop + innerHeight - barH;
            const isWin = pt.game.isVictory;

            return (
              <rect
                key={`bar-${idx}`}
                x={pt.x - barW / 2}
                y={barY}
                width={barW}
                height={Math.max(4, barH)}
                rx={4}
                fill={isWin ? 'url(#barWinGradient)' : 'url(#barLossGradient)'}
                className="chart-bar-hover"
                onMouseEnter={() => setActiveTooltip({ game: pt.game, x: pt.x, y: pt.y })}
                onMouseLeave={() => setActiveTooltip(null)}
              />
            );
          })}

          {/* Área sombreada */}
          {areaPath && (
            <path d={areaPath} fill="url(#areaGradient)" pointerEvents="none" />
          )}

          {/* Linha de conexão suave */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#F43F5E"
              strokeWidth="2.5"
              strokeLinecap="round"
              pointerEvents="none"
            />
          )}

          {/* Pontos interativos */}
          {pointsCoordinates.map((pt, idx) => (
            <g
              key={`dot-${idx}`}
              className="chart-dot-group"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setActiveTooltip({ game: pt.game, x: pt.x, y: pt.y })}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r="7"
                fill="transparent"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={activeTooltip?.game === pt.game ? '6' : '4.5'}
                fill={pt.game.isVictory ? '#10B981' : '#EF4444'}
                stroke="#0F172A"
                strokeWidth="2"
                className="transition-all"
              />
              {pt.game.isMvp && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="9"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}

              {/* Rótulo de Eixo X (Adversário / Jogo) */}
              <text
                x={pt.x}
                y={chartHeight - 12}
                textAnchor="middle"
                className="chart-x-label"
              >
                {pt.game.opponentTag || `J${pt.game.gameNumber}`}
              </text>
            </g>
          ))}
        </svg>

        {/* Tooltip Dinâmico Flutuante */}
        {activeTooltip && (
          <div
            className="chart-floating-tooltip"
            style={{
              left: `${(activeTooltip.x / chartWidth) * 100}%`,
              top: `${Math.max(10, (activeTooltip.y / chartHeight) * 100 - 30)}%`,
            }}
          >
            <div className="tooltip-head">
              <span className={`tooltip-result-badge ${activeTooltip.game.isVictory ? 'win' : 'loss'}`}>
                {activeTooltip.game.isVictory ? 'VITÓRIA' : 'DERROTA'}
              </span>
              <span className="tooltip-score">
                {activeTooltip.game.scoreUs} x {activeTooltip.game.scoreThem}
              </span>
            </div>

            <div className="tooltip-body">
              <div className="tooltip-poke-row">
                <img
                  src={activeTooltip.game.pokemonSprite}
                  alt={activeTooltip.game.pokemonName}
                  className="tooltip-poke-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://d275t8dp8rxb42.cloudfront.net/pokemon/thumbnail/Pikachu.png';
                  }}
                />
                <div>
                  <div className="tooltip-poke-name">{activeTooltip.game.pokemonName}</div>
                  <div className="tooltip-vs">vs {activeTooltip.game.opponentTeam}</div>
                </div>
              </div>

              <div className="tooltip-stats-grid">
                <div className="tooltip-stat">
                  <span className="t-label">Pontos</span>
                  <span className="t-val text-yellow">{activeTooltip.game.points}</span>
                </div>
                <div className="tooltip-stat">
                  <span className="t-label">KOs</span>
                  <span className="t-val text-red">{activeTooltip.game.kos}</span>
                </div>
                <div className="tooltip-stat">
                  <span className="t-label">Assists</span>
                  <span className="t-val text-cyan">{activeTooltip.game.assists}</span>
                </div>
              </div>

              {activeTooltip.game.isMvp && (
                <div className="tooltip-mvp-tag">
                  <Sparkles size={11} color="#F59E0B" />
                  <span>MVP da Partida</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   3. GRÁFICO RADAR DE HABILIDADES / PERFORMANCE DO JOGADOR (PENTÁGONO)
   ========================================================================= */
interface RadarChartProps {
  radar: RadarMetrics;
  playerName: string;
}

export const PlayerRadarChart: React.FC<RadarChartProps> = ({ radar, playerName }) => {
  const size = 260;
  const center = size / 2;
  const maxRadius = 90;

  // 5 Eixos: KOs, Assists, Pontos, Dano, Win Rate
  const axes = [
    { label: 'KOs (Kills)', value: radar.kosScore, icon: Swords },
    { label: 'Assists', value: radar.assistsScore, icon: Zap },
    { label: 'Pontuação', value: radar.pointsScore, icon: Trophy },
    { label: 'Dano', value: radar.damageScore, icon: Shield },
    { label: 'Win Rate', value: radar.winRateScore, icon: Sparkles },
  ];

  const totalAxes = axes.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Coordenadas das teias / anéis concêntricos (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1];

  const getCoordinates = (radius: number, angleIndex: number) => {
    const angle = angleIndex * angleStep - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  // Coordenadas da área preenchida do jogador
  const playerPoints = axes.map((axis, i) => {
    const r = (Math.max(15, Math.min(100, axis.value)) / 100) * maxRadius;
    return getCoordinates(r, i);
  });

  const playerPolygonPath = playerPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="radar-card-root">
      <div className="radar-title-row">
        <span className="radar-title">Radar de Atributos</span>
        <span className="radar-sub">{playerName}</span>
      </div>

      <div className="radar-svg-wrapper">
        <svg viewBox={`0 0 ${size} ${size}`} className="radar-svg">
          <defs>
            <radialGradient id="radarAreaGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E11D48" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.1" />
            </radialGradient>
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#E11D48" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Anéis da grade poligonal */}
          {gridLevels.map((lvl, idx) => {
            const r = lvl * maxRadius;
            const pts = Array.from({ length: totalAxes }).map((_, i) => getCoordinates(r, i));
            const polyStr = pts.map(p => `${p.x},${p.y}`).join(' ');
            return (
              <polygon
                key={`grid-${idx}`}
                points={polyStr}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
              />
            );
          })}

          {/* Linhas de raio a partir do centro */}
          {axes.map((_, i) => {
            const tip = getCoordinates(maxRadius, i);
            return (
              <line
                key={`axis-line-${i}`}
                x1={center}
                y1={center}
                x2={tip.x}
                y2={tip.y}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1"
              />
            );
          })}

          {/* Polígono preenchido do jogador */}
          <polygon
            points={playerPolygonPath}
            fill="url(#radarAreaGradient)"
            stroke="#F43F5E"
            strokeWidth="2.5"
            filter="url(#radarGlow)"
            className="radar-polygon-anim"
          />

          {/* Vértices destacados */}
          {playerPoints.map((pt, i) => (
            <circle
              key={`vert-${i}`}
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill="#F43F5E"
              stroke="#FFF"
              strokeWidth="1.5"
            />
          ))}

          {/* Rótulos dos Eixos com porcentagem calculada */}
          {axes.map((axis, i) => {
            const labelCoord = getCoordinates(maxRadius + 24, i);
            return (
              <text
                key={`axis-lbl-${i}`}
                x={labelCoord.x}
                y={labelCoord.y + 4}
                textAnchor="middle"
                className="radar-axis-text"
              >
                {axis.label} ({axis.value}%)
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

/* =========================================================================
   4. DISTRIBUIÇÃO DE POKÉMON MAIS UTILIZADOS
   ========================================================================= */
interface PokemonUsageListProps {
  pokemonStats: PokemonUsageStat[];
  totalGames?: number;
}

export const PokemonUsageList: React.FC<PokemonUsageListProps> = ({
  pokemonStats,
  totalGames: _totalGames,
}) => {
  if (pokemonStats.length === 0) {
    return (
      <div className="poke-usage-empty">
        <p>Nenhum Pokémon registrado em partidas ainda.</p>
      </div>
    );
  }

  return (
    <div className="poke-usage-list">
      {pokemonStats.slice(0, 5).map((poke, index) => {
        const isMostUsed = index === 0;

        return (
          <div key={poke.pokemonId} className={`poke-usage-item ${isMostUsed ? 'featured' : ''}`}>
            <div className="poke-item-left">
              <div className="poke-item-rank">#{index + 1}</div>
              <div className="poke-thumb-wrap">
                <img
                  src={poke.pokemonSprite}
                  alt={poke.pokemonName}
                  className="poke-item-thumb"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://d275t8dp8rxb42.cloudfront.net/pokemon/thumbnail/Pikachu.png';
                  }}
                />
                {isMostUsed && (
                  <span className="most-used-crown" title="Pokémon Mais Escolhido">
                    <Trophy size={11} color="#F59E0B" />
                  </span>
                )}
              </div>

              <div className="poke-info-col">
                <div className="poke-name-row">
                  <span className="poke-name">{poke.pokemonName}</span>
                  <span className="poke-role-badge">{poke.role}</span>
                </div>
                <div className="poke-metrics-sub">
                  <span>{poke.picks} {poke.picks === 1 ? 'partida' : 'partidas'} ({poke.pickRate}% pick)</span>
                  <span className="dot-sep">•</span>
                  <span>{poke.avgKills} KOs médios</span>
                  <span className="dot-sep">•</span>
                  <span>{poke.avgPoints} pts médios</span>
                </div>
              </div>
            </div>

            <div className="poke-item-right">
              <div className="poke-winrate-box">
                <span className={`poke-wr-num ${poke.winRate >= 50 ? 'text-emerald' : 'text-rose'}`}>
                  {poke.winRate}% WR
                </span>
                <span className="poke-record-label">
                  {poke.wins}V - {poke.losses}D
                </span>
              </div>

              <div className="poke-progress-track">
                <div
                  className={`poke-progress-fill ${poke.winRate >= 50 ? 'bg-emerald' : 'bg-rose'}`}
                  style={{ width: `${Math.max(8, poke.winRate)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
