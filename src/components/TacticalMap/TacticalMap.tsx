import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  MousePointer,
  Pencil, 
  ArrowUpRight, 
  Minus,
  Type,
  Eraser,
  Hand,
  RotateCcw, 
  Trash2, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Search,
  X,
  Move,
  Bookmark,
  Check
} from 'lucide-react';
import type { TacticalElement, StrategyPlan, PokemonRole } from '../../types';
import { POKEMON_ROSTER } from '../../data/pokemonData';
import { fetchUniteDbPokemons } from '../../services/uniteDbService';
import { getPokemonRoleStyle } from '../../utils/pokemonStyles';

const THEIA_MAP = {
  id: 'theia-sky-ruins',
  name: 'Ruínas Celestes de Theia',
  subname: 'Rayquaza',
  format: '5v5 Competitivo',
  image: '/maps/theia-sky-ruins.png',
  description: 'Ruínas Celestes de Theia - Mapa oficial de torneios e ranqueadas com Rayquaza.'
};

interface TacticalMapProps {
  presets?: StrategyPlan[];
  onSaveStrategy?: (strategy: StrategyPlan) => void;
}

type ToolType = 'select' | 'draw' | 'arrow' | 'line' | 'text' | 'eraser' | 'pan';

export const TacticalMap: React.FC<TacticalMapProps> = ({
  presets = [],
  onSaveStrategy
}) => {
  const [pokemons, setPokemons] = useState(POKEMON_ROSTER);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('TODOS');
  const [teamToAdd, setTeamToAdd] = useState<'blue' | 'orange'>('blue');
  
  // Ferramentas & Estilos
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeColor, setActiveColor] = useState<string>('#0B5FFF');
  const [zoom, setZoom] = useState<number>(100);
  
  // Elementos da prancheta
  const [elements, setElements] = useState<TacticalElement[]>([]);
  const [history, setHistory] = useState<TacticalElement[][]>([]);
  
  // Estados de Desenho
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);
  
  // Dragging de Token existente no mapa
  const [draggedTokenId, setDraggedTokenId] = useState<string | null>(null);

  // Input de Texto no Mapa
  const [textModal, setTextModal] = useState<{ open: boolean; x: number; y: number; text: string }>({
    open: false,
    x: 0,
    y: 0,
    text: ''
  });

  // Salvar Tática
  const [stratTitle, setStratTitle] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Sincronizar pokémons com a API do unite-db
  useEffect(() => {
    fetchUniteDbPokemons().then(data => {
      if (data && data.length > 0) {
        setPokemons(data);
      }
    });
  }, []);

  // Cores de degradê unificadas por classe para os cards do catálogo lateral
  const getRoleCardGradient = (role: PokemonRole) => {
    return getPokemonRoleStyle(role).gradient;
  };

  // Filtragem Otimizada com useMemo para evitar re-computações desnecessárias durante o desenho
  const filteredPokemons = useMemo(() => {
    const s = search.toLowerCase();
    return pokemons.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(s);
      if (roleFilter === 'TODOS') return matchesSearch;
      if (roleFilter === 'ATACANTE') return matchesSearch && p.role === 'Attacker';
      if (roleFilter === 'VELOZ') return matchesSearch && p.role === 'Speedster';
      if (roleFilter === 'VERSÁTIL') return matchesSearch && p.role === 'All-Rounder';
      if (roleFilter === 'DEFENSOR') return matchesSearch && p.role === 'Defender';
      if (roleFilter === 'SUPORTE') return matchesSearch && p.role === 'Supporter';
      return matchesSearch;
    });
  }, [pokemons, search, roleFilter]);

  // Salvar estado no histórico para Desfazer (Undo)
  const pushHistory = () => {
    setHistory(prev => [...prev.slice(-15), elements]);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setElements(prev);
      setHistory(old => old.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (elements.length === 0) return;
    pushHistory();
    setElements([]);
  };

  // Adicionar Pokémon ao mapa
  const handleAddPokemonToMap = (pokemon: typeof pokemons[0], x = 50, y = 50) => {
    pushHistory();
    const newElement: TacticalElement = {
      id: `token-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'token',
      x,
      y,
      pokemonId: pokemon.id,
      pokemonName: pokemon.name,
      pokemonSprite: pokemon.sprite,
      team: teamToAdd
    };
    setElements(prev => [...prev, newElement]);
  };

  // Drag and Drop de Pokémon a partir da barra lateral
  const handleDragStartFromSidebar = (e: React.DragEvent, pokemon: typeof pokemons[0]) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      pokemon,
      team: teamToAdd
    }));
  };

  const handleDropOnMap = (e: React.DragEvent) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;

    try {
      const { pokemon, team } = JSON.parse(dataStr);
      const mapRect = mapContainerRef.current?.getBoundingClientRect();
      if (!mapRect) return;

      const xPercent = Math.max(2, Math.min(95, ((e.clientX - mapRect.left) / (mapRect.width)) * 100));
      const yPercent = Math.max(4, Math.min(94, ((e.clientY - mapRect.top) / (mapRect.height)) * 100));

      pushHistory();
      const newElement: TacticalElement = {
        id: `token-${Date.now()}`,
        type: 'token',
        x: xPercent,
        y: yPercent,
        pokemonId: pokemon.id,
        pokemonName: pokemon.name,
        pokemonSprite: pokemon.sprite,
        team: team || teamToAdd
      };
      setElements(prev => [...prev, newElement]);
    } catch (_) {}
  };

  const handleDragOverMap = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Mover Token existente no mapa
  const handleTokenMouseDown = (e: React.MouseEvent, elId: string) => {
    if (activeTool === 'eraser') {
      pushHistory();
      setElements(prev => prev.filter(el => el.id !== elId));
      return;
    }

    if (activeTool !== 'select') return;
    e.stopPropagation();

    const target = elements.find(el => el.id === elId);
    if (!target) return;

    const mapRect = mapContainerRef.current?.getBoundingClientRect();
    if (!mapRect) return;

    setDraggedTokenId(elId);
  };

  const toggleTokenTeam = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    pushHistory();
    setElements(prev => prev.map(el => {
      if (el.id === elId) {
        return {
          ...el,
          team: el.team === 'blue' ? 'orange' : 'blue'
        };
      }
      return el;
    }));
  };

  const removeElement = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    pushHistory();
    setElements(prev => prev.filter(el => el.id !== elId));
  };

  // Render do Canvas de Desenho (Pincel, Setas, Linhas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Desenhar elementos permanentes
    elements.forEach(el => {
      const elColor = el.color || '#0B5FFF';
      
      // Traço livre
      if (el.type === 'draw' && el.points && el.points.length > 1) {
        ctx.strokeStyle = elColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo((el.points[0].x / 100) * w, (el.points[0].y / 100) * h);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo((el.points[i].x / 100) * w, (el.points[i].y / 100) * h);
        }
        ctx.stroke();
      }

      // Seta tática
      if (el.type === 'arrow' && el.toX !== undefined && el.toY !== undefined) {
        drawTacticalArrow(
          ctx, 
          (el.x / 100) * w, 
          (el.y / 100) * h, 
          (el.toX / 100) * w, 
          (el.toY / 100) * h, 
          elColor
        );
      }

      // Linha reta
      if (el.type === 'line' && el.toX !== undefined && el.toY !== undefined) {
        ctx.strokeStyle = elColor;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo((el.x / 100) * w, (el.y / 100) * h);
        ctx.lineTo((el.toX / 100) * w, (el.toY / 100) * h);
        ctx.stroke();
      }
    });

    // Traço temporário durante desenho ativo
    if (isDrawing && activeTool === 'draw' && currentStroke.length > 1) {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo((currentStroke[0].x / 100) * w, (currentStroke[0].y / 100) * h);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo((currentStroke[i].x / 100) * w, (currentStroke[i].y / 100) * h);
      }
      ctx.stroke();
    }

    // Seta ou linha temporária durante o clique e arraste
    if (isDrawing && (activeTool === 'arrow' || activeTool === 'line') && dragStartPoint && currentStroke.length > 0) {
      const current = currentStroke[currentStroke.length - 1];
      if (activeTool === 'arrow') {
        drawTacticalArrow(
          ctx, 
          (dragStartPoint.x / 100) * w, 
          (dragStartPoint.y / 100) * h, 
          (current.x / 100) * w, 
          (current.y / 100) * h, 
          activeColor
        );
      } else {
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo((dragStartPoint.x / 100) * w, (dragStartPoint.y / 100) * h);
        ctx.lineTo((current.x / 100) * w, (current.y / 100) * h);
        ctx.stroke();
      }
    }
  }, [elements, isDrawing, currentStroke, activeTool, activeColor, dragStartPoint]);

  // Função para desenhar seta com ponta perfeita e contorno
  const drawTacticalArrow = (
    ctx: CanvasRenderingContext2D, 
    fromX: number, 
    fromY: number, 
    toX: number, 
    toY: number, 
    color: string
  ) => {
    const headLen = 16;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Sombra sutil
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;

    // Haste da seta
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Ponta da seta
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLen * Math.cos(angle - Math.PI / 6), 
      toY - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLen * Math.cos(angle + Math.PI / 6), 
      toY - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Eventos de Mouse no Canvas / Mapa
  const handleMapMouseDown = (e: React.MouseEvent) => {
    const mapRect = mapContainerRef.current?.getBoundingClientRect();
    if (!mapRect) return;

    const xPercent = ((e.clientX - mapRect.left) / mapRect.width) * 100;
    const yPercent = ((e.clientY - mapRect.top) / mapRect.height) * 100;

    if (activeTool === 'text') {
      setTextModal({
        open: true,
        x: xPercent,
        y: yPercent,
        text: ''
      });
      return;
    }

    if (activeTool === 'draw' || activeTool === 'arrow' || activeTool === 'line') {
      setIsDrawing(true);
      setDragStartPoint({ x: xPercent, y: yPercent });
      setCurrentStroke([{ x: xPercent, y: yPercent }]);
    }
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
    const mapRect = mapContainerRef.current?.getBoundingClientRect();
    if (!mapRect) return;

    // Se estiver arrastando um Token existente
    if (draggedTokenId && activeTool === 'select') {
      const xPercent = Math.max(2, Math.min(95, ((e.clientX - mapRect.left) / mapRect.width) * 100));
      const yPercent = Math.max(4, Math.min(94, ((e.clientY - mapRect.top) / mapRect.height) * 100));

      setElements(prev => prev.map(el => {
        if (el.id === draggedTokenId) {
          return { ...el, x: xPercent, y: yPercent };
        }
        return el;
      }));
      return;
    }

    // Se estiver desenhando
    if (isDrawing && (activeTool === 'draw' || activeTool === 'arrow' || activeTool === 'line')) {
      const xPercent = ((e.clientX - mapRect.left) / mapRect.width) * 100;
      const yPercent = ((e.clientY - mapRect.top) / mapRect.height) * 100;

      if (activeTool === 'arrow' || activeTool === 'line') {
        if (dragStartPoint) {
          setCurrentStroke([dragStartPoint, { x: xPercent, y: yPercent }]);
        }
      } else if (activeTool === 'draw') {
        setCurrentStroke(prev => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const dist = Math.hypot(last.x - xPercent, last.y - yPercent);
            if (dist < 0.45) return prev;
          }
          return [...prev, { x: xPercent, y: yPercent }];
        });
      }
    }
  };

  const handleMapMouseUp = () => {
    if (draggedTokenId) {
      pushHistory();
      setDraggedTokenId(null);
    }

    if (!isDrawing) return;

    if (activeTool === 'draw' && currentStroke.length > 1) {
      pushHistory();
      setElements(prev => [...prev, {
        id: `draw-${Date.now()}`,
        type: 'draw',
        x: currentStroke[0].x,
        y: currentStroke[0].y,
        points: currentStroke,
        color: activeColor
      }]);
    } else if (activeTool === 'arrow' && dragStartPoint && currentStroke.length > 0) {
      const end = currentStroke[currentStroke.length - 1];
      // Ignorar cliques acidentais sem movimento
      if (Math.hypot(end.x - dragStartPoint.x, end.y - dragStartPoint.y) > 2) {
        pushHistory();
        setElements(prev => [...prev, {
          id: `arrow-${Date.now()}`,
          type: 'arrow',
          x: dragStartPoint.x,
          y: dragStartPoint.y,
          toX: end.x,
          toY: end.y,
          color: activeColor
        }]);
      }
    } else if (activeTool === 'line' && dragStartPoint && currentStroke.length > 0) {
      const end = currentStroke[currentStroke.length - 1];
      if (Math.hypot(end.x - dragStartPoint.x, end.y - dragStartPoint.y) > 2) {
        pushHistory();
        setElements(prev => [...prev, {
          id: `line-${Date.now()}`,
          type: 'line',
          x: dragStartPoint.x,
          y: dragStartPoint.y,
          toX: end.x,
          toY: end.y,
          color: activeColor
        }]);
      }
    }

    setIsDrawing(false);
    setCurrentStroke([]);
    setDragStartPoint(null);
  };

  // Confirmar adição de texto no mapa
  const handleConfirmText = () => {
    if (!textModal.text.trim()) {
      setTextModal({ open: false, x: 0, y: 0, text: '' });
      return;
    }

    pushHistory();
    setElements(prev => [...prev, {
      id: `text-${Date.now()}`,
      type: 'text',
      x: textModal.x,
      y: textModal.y,
      label: textModal.text,
      color: activeColor
    }]);

    setTextModal({ open: false, x: 0, y: 0, text: '' });
  };

  // Exportar prancheta montada como PNG em alta resolução
  const handleExportBoard = () => {
    const mapImg = new Image();
    mapImg.crossOrigin = 'anonymous';
    mapImg.src = THEIA_MAP.image;

    mapImg.onload = () => {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1920;
      exportCanvas.height = 1080;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      // Desenhar mapa de fundo com alta fidelidade
      ctx.drawImage(mapImg, 0, 0, 1920, 1080);

      // Camada de elementos vetoriais (desenhos, setas, linhas)
      elements.forEach(el => {
        const elColor = el.color || '#0B5FFF';
        if (el.type === 'draw' && el.points && el.points.length > 1) {
          ctx.strokeStyle = elColor;
          ctx.lineWidth = 8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo((el.points[0].x / 100) * 1920, (el.points[0].y / 100) * 1080);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo((el.points[i].x / 100) * 1920, (el.points[i].y / 100) * 1080);
          }
          ctx.stroke();
        } else if (el.type === 'arrow' && el.toX !== undefined && el.toY !== undefined) {
          drawTacticalArrow(
            ctx, 
            (el.x / 100) * 1920, 
            (el.y / 100) * 1080, 
            (el.toX / 100) * 1920, 
            (el.toY / 100) * 1080, 
            elColor
          );
        } else if (el.type === 'line' && el.toX !== undefined && el.toY !== undefined) {
          ctx.strokeStyle = elColor;
          ctx.lineWidth = 7;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo((el.x / 100) * 1920, (el.y / 100) * 1080);
          ctx.lineTo((el.toX / 100) * 1920, (el.toY / 100) * 1080);
          ctx.stroke();
        } else if (el.type === 'text' && el.label) {
          ctx.font = 'bold 24px Outfit, sans-serif';
          ctx.fillStyle = elColor;
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = 8;
          ctx.fillText(el.label, (el.x / 100) * 1920, (el.y / 100) * 1080);
        }
      });

      // Renderizar tokens de Pokémon posicionados no mapa
      const tokenElements = elements.filter(el => el.type === 'token');
      const tokenPromises = tokenElements.map(el => {
        return new Promise<void>((resolve) => {
          if (!el.pokemonSprite) return resolve();
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const cx = (el.x / 100) * 1920;
            const cy = (el.y / 100) * 1080;
            const radius = 28;

            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
            ctx.fillStyle = el.team === 'blue' ? '#0B5FFF' : '#F97316';
            ctx.shadowColor = el.team === 'blue' ? 'rgba(11, 95, 255, 0.8)' : 'rgba(249, 115, 22, 0.8)';
            ctx.shadowBlur = 12;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.clip();
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
            ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
            ctx.restore();

            ctx.save();
            ctx.font = 'bold 15px Outfit, sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = 6;
            ctx.fillText(el.pokemonName || '', cx, cy + radius + 18);
            ctx.restore();

            resolve();
          };
          img.onerror = () => resolve();
          img.src = el.pokemonSprite;
        });
      });

      Promise.all(tokenPromises).then(() => {
        const link = document.createElement('a');
        link.download = `prancheta-friba-theia-${Date.now()}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
      });
    };
  };

  // Salvar estratégia personalizada
  const handleSaveCurrentStrategy = () => {
    const title = stratTitle.trim() || `Tática: ${THEIA_MAP.name} #${presets.length + 1}`;
    if (onSaveStrategy) {
      onSaveStrategy({
        id: `strat-${Date.now()}`,
        title,
        phaseTime: 'Geral',
        description: `Estratégia salva no mapa ${THEIA_MAP.name}`,
        elements: [...elements]
      });
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      setStratTitle('');
    }
  };

  return (
    <div className="tactical-board-page">
      {/* ========================================================================= */}
      {/* BARRA SUPERIOR: INDICADOR DO MAPA THEIA + ZOOM + AÇÕES */}
      {/* ========================================================================= */}
      <div className="tactical-header-bar">
        {/* Indicador Exclusivo: Theia Sky Ruins */}
        <div className="current-map-badge">
          <Move size={15} className="map-badge-icon" />
          <span className="map-badge-prefix">MAPA:</span>
          <span className="map-badge-name">THEIA SKY RUINS · RAYQUAZA</span>
          <span className="map-badge-tag">5v5 COMPETITIVO</span>
        </div>

        {/* Controles de Zoom & Ações Rápidas */}
        <div className="tactical-top-actions">
          {/* Zoom */}
          <div className="zoom-controls-group">
            <button 
              className="zoom-btn" 
              onClick={() => setZoom(prev => Math.max(70, prev - 10))}
              title="Diminuir Zoom"
            >
              <ZoomOut size={14} />
            </button>
            <span 
              className="zoom-display" 
              onClick={() => setZoom(100)} 
              title="Clique para resetar para 100%"
            >
              {zoom}%
            </span>
            <button 
              className="zoom-btn" 
              onClick={() => setZoom(prev => Math.min(150, prev + 10))}
              title="Aumentar Zoom"
            >
              <ZoomIn size={14} />
            </button>
            <button 
              className="zoom-btn" 
              onClick={() => setZoom(100)}
              title="Ajustar à Tela"
            >
              <Maximize2 size={13} />
            </button>
          </div>

          {/* Desfazer & Limpar */}
          <button 
            className="action-btn-pill undo" 
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Desfazer última alteração"
          >
            <RotateCcw size={13} /> DESFAZER
          </button>

          <button 
            className="action-btn-pill clear" 
            onClick={handleClear}
            title="Limpar todos os elementos do mapa"
          >
            <Trash2 size={13} /> LIMPAR
          </button>

          <button 
            className="action-btn-pill export" 
            onClick={handleExportBoard}
            title="Exportar imagem PNG da prancheta"
          >
            <Download size={13} /> EXPORTAR PNG
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PALCO PRINCIPAL SUPERIOR: TOOLBAR ESQUERDA + MAPA EXPANDIDO */}
      {/* ========================================================================= */}
      <div className="tactical-top-stage-layout">
        {/* BARRA LATERAL ESQUERDA: FERRAMENTAS DE DESENHO */}
        <div className="tactical-left-tools">
          <div className="tools-button-group">
            <button 
              className={`tool-icon-btn ${activeTool === 'select' ? 'active select-mode' : ''}`}
              onClick={() => setActiveTool('select')}
              title="Selecionar e Mover Pokémon / Elementos"
            >
              <MousePointer size={18} />
            </button>

            <button 
              className={`tool-icon-btn ${activeTool === 'draw' ? 'active' : ''}`}
              onClick={() => setActiveTool('draw')}
              title="Pincel / Desenho Livre"
            >
              <Pencil size={18} />
            </button>

            <button 
              className={`tool-icon-btn ${activeTool === 'arrow' ? 'active' : ''}`}
              onClick={() => setActiveTool('arrow')}
              title="Seta Tática de Rotação ou Foco"
            >
              <ArrowUpRight size={19} />
            </button>

            <button 
              className={`tool-icon-btn ${activeTool === 'line' ? 'active' : ''}`}
              onClick={() => setActiveTool('line')}
              title="Linha Reta de Conexão"
            >
              <Minus size={18} />
            </button>

            <button 
              className={`tool-icon-btn ${activeTool === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTool('text')}
              title="Adicionar Texto / Anotação no Mapa"
            >
              <Type size={18} />
            </button>

            <button 
              className={`tool-icon-btn ${activeTool === 'eraser' ? 'active eraser-mode' : ''}`}
              onClick={() => setActiveTool('eraser')}
              title="Borracha: Clique em um Pokémon ou traço para apagar"
            >
              <Eraser size={18} />
            </button>

            <button 
              className={`tool-icon-btn ${activeTool === 'pan' ? 'active' : ''}`}
              onClick={() => setActiveTool('pan')}
              title="Mão / Navegação"
            >
              <Hand size={18} />
            </button>
          </div>

          {/* Seletor de Cores Táticas */}
          <div className="tools-color-palette">
            <div className="palette-label">COR</div>
            {[
              { color: '#0B5FFF', label: 'Azul Friba' },
              { color: '#D61F26', label: 'Vermelho Friba' },
              { color: '#F59E0B', label: 'Dourado / Objetivo' },
              { color: '#10B981', label: 'Verde / Seguro' },
              { color: '#FFFFFF', label: 'Branco / Neutro' },
              { color: '#8B5CF6', label: 'Roxo / Especial' }
            ].map((c) => (
              <button
                key={c.color}
                className={`color-dot-btn ${activeColor === c.color ? 'active' : ''}`}
                style={{ backgroundColor: c.color }}
                onClick={() => setActiveColor(c.color)}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* ÁREA CENTRAL: O MAPA INTERATIVO + CANVAS */}
        <div className="tactical-center-viewport">
          <div 
            className="map-scalable-wrapper"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <div 
              ref={mapContainerRef}
              className={`map-interactive-stage ${activeTool}`}
              onMouseDown={handleMapMouseDown}
              onMouseMove={handleMapMouseMove}
              onMouseUp={handleMapMouseUp}
              onDragOver={handleDragOverMap}
              onDrop={handleDropOnMap}
            >
              {/* Imagem Real de Fundo de Alta Definição (1.2MB Oficial Lossless) */}
              <img 
                src={THEIA_MAP.image} 
                alt={THEIA_MAP.name} 
                className="map-background-render"
                draggable={false}
              />

              {/* Canvas HTML5 de Alta Precisão (1280x591) para Linhas, Pincel e Setas */}
              <canvas 
                ref={canvasRef}
                width={1280}
                height={591}
                className="map-drawing-canvas"
              />

              {/* Camada de Textos Adicionados */}
              {elements.filter(el => el.type === 'text').map(el => (
                <div 
                  key={el.id}
                  className="map-tactical-label"
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    color: el.color || '#FFFFFF',
                    borderColor: el.color || '#FFFFFF'
                  }}
                  onClick={(e) => {
                    if (activeTool === 'eraser') removeElement(e, el.id);
                  }}
                >
                  <span>{el.label}</span>
                  {activeTool === 'eraser' && <X size={12} className="remove-badge-ico" />}
                </div>
              ))}

              {/* Camada de Tokens de Pokémon */}
              {elements.filter(el => el.type === 'token').map(el => {
                const isBlue = el.team === 'blue';
                return (
                  <div
                    key={el.id}
                    className={`map-pokemon-token ${isBlue ? 'team-blue' : 'team-orange'}`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`
                    }}
                    onMouseDown={(e) => handleTokenMouseDown(e, el.id)}
                    title={`${el.pokemonName} (${isBlue ? 'Time Azul' : 'Time Laranja'}) - Clique duas vezes para alternar time`}
                    onDoubleClick={(e) => toggleTokenTeam(e, el.id)}
                  >
                    <div className="token-avatar-ring">
                      <img 
                        src={el.pokemonSprite} 
                        alt={el.pokemonName} 
                        className="token-sprite-img" 
                        draggable={false}
                      />
                    </div>

                    <div className="token-name-tag">
                      {el.pokemonName}
                    </div>

                    {/* Botões de Ação Rápida no Hover */}
                    <div className="token-quick-actions">
                      <button 
                        className="toggle-team-btn" 
                        onClick={(e) => toggleTokenTeam(e, el.id)}
                        title="Alternar Time Azul / Laranja"
                      >
                        {isBlue ? 'AZUL' : 'LARANJA'}
                      </button>
                      <button 
                        className="del-token-btn" 
                        onClick={(e) => removeElement(e, el.id)}
                        title="Remover do Mapa"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Banner Flutuante de Ajuda */}
              <div className="map-bottom-hint-banner">
                <span>ARRASTE OU CLIQUE EM UM POKÉMON ABAIXO PARA ADICIONAR AO MAPA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO INFERIOR: CATÁLOGO DE POKÉMON ABAIXO DO MAPA */}
      {/* ========================================================================= */}
      <div className="tactical-bottom-pokemon-deck">
        <div className="deck-header-bar">
          {/* Seletor de Equipe para Novos Pokémon */}
          <div className="deck-team-selector">
            <span className="deck-label">ADICIONAR PARA:</span>
            <div className="deck-team-pills">
              <button 
                className={`deck-team-btn blue ${teamToAdd === 'blue' ? 'active' : ''}`}
                onClick={() => setTeamToAdd('blue')}
              >
                🔵 Time Azul (Friba)
              </button>
              <button 
                className={`deck-team-btn orange ${teamToAdd === 'orange' ? 'active' : ''}`}
                onClick={() => setTeamToAdd('orange')}
              >
                🔴 Time Laranja (Inimigo)
              </button>
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="deck-search-box">
            <Search size={14} className="deck-search-icon" />
            <input 
              type="text"
              placeholder="Buscar Pokémon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="deck-clear-search" onClick={() => setSearch('')}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Pílulas de Filtro de Battle Type */}
          <div className="deck-role-pills">
            {['TODOS', 'ATACANTE', 'VELOZ', 'VERSÁTIL', 'DEFENSOR', 'SUPORTE'].map(role => (
              <button 
                key={role}
                className={`deck-role-pill ${roleFilter === role ? 'active' : ''}`}
                onClick={() => setRoleFilter(role)}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Contador de Pokémon */}
          <div className="deck-count-badge">
            <span>{filteredPokemons.length} POKÉMONS</span>
          </div>

          {/* Linha de Salvar Tática */}
          <div className="deck-save-box">
            <div className="save-input-row">
              <input 
                type="text" 
                placeholder="Nome da tática..."
                value={stratTitle}
                onChange={(e) => setStratTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCurrentStrategy()}
              />
              <button 
                className="save-strat-btn"
                onClick={handleSaveCurrentStrategy}
                title="Salvar Estratégia"
              >
                <Bookmark size={14} />
              </button>
            </div>
            {showSaveSuccess && (
              <div className="save-feedback">
                <Check size={12} /> Salva!
              </div>
            )}
          </div>
        </div>

        {/* Grade de Cards com os Pokémon do Unite-DB */}
        <div className="deck-pokemon-grid">
          {filteredPokemons.map((pokemon) => {
            const bgGradient = getRoleCardGradient(pokemon.role);

            return (
              <div 
                key={pokemon.id}
                className="deck-poke-card"
                style={{ background: bgGradient }}
                draggable
                onDragStart={(e) => handleDragStartFromSidebar(e, pokemon)}
                onClick={() => handleAddPokemonToMap(pokemon, 45 + Math.random() * 10, 45 + Math.random() * 10)}
                title={`${pokemon.name} (${pokemon.role}) - Clique ou arraste para o mapa`}
              >
                <div className="deck-card-art">
                  <img 
                    src={pokemon.sprite} 
                    alt={pokemon.name} 
                    className="deck-card-img"
                    loading="lazy"
                  />
                </div>
                <div className="deck-card-footer">
                  <span>{pokemon.name.toUpperCase()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL SIMPLES PARA DIGITAR TEXTO NO MAPA */}
      {textModal.open && (
        <div className="text-prompt-overlay" onClick={() => setTextModal({ open: false, x: 0, y: 0, text: '' })}>
          <div className="text-prompt-modal glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <Type size={16} /> Adicionar Anotação Tática
            </div>
            <input 
              type="text"
              autoFocus
              placeholder="Ex: Focar Rayquaza, Gank 8:50, Defender Tier 2..."
              value={textModal.text}
              onChange={(e) => setTextModal(prev => ({ ...prev, text: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmText()}
            />
            <div className="modal-actions">
              <button 
                className="btn-secondary btn-sm" 
                onClick={() => setTextModal({ open: false, x: 0, y: 0, text: '' })}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary btn-sm" 
                onClick={handleConfirmText}
              >
                Inserir no Mapa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESTILOS CSS DA PRANCHETA TÁTICA */}
      <style>{`
        .tactical-board-page {
          max-width: 1440px;
          margin: 0 auto;
          padding: 12px 16px 28px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          user-select: none;
        }

        /* HEADER SUPERIOR */
        .tactical-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(10, 15, 29, 0.85);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 8px 14px;
          position: relative;
          z-index: 50;
        }

        /* BADGE DO MAPA FIXO (THEIA SKY RUINS) */
        .current-map-badge {
          display: flex;
          align-items: center;
          gap: 9px;
          background: rgba(13, 21, 38, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 8px;
          padding: 8px 16px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
        }

        .map-badge-icon {
          color: #60A5FA;
        }

        .map-btn-prefix {
          font-size: 0.72rem;
          color: #94A3B8;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .map-btn-name {
          font-size: 0.84rem;
          font-weight: 900;
          color: #FFFFFF;
          letter-spacing: 0.04em;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
        }

        .map-badge-tag {
          font-size: 0.64rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #93C5FD;
          background: rgba(11, 95, 255, 0.25);
          border: 1px solid rgba(11, 95, 255, 0.45);
          padding: 2px 7px;
          border-radius: 4px;
        }

        /* CONTROLES DO TOPO DIREITO */
        .tactical-top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .zoom-controls-group {
          display: flex;
          align-items: center;
          background: #0d1526;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 2px 4px;
        }

        .zoom-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          padding: 6px;
          display: flex;
          align-items: center;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.15s;
        }

        .zoom-btn:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.08);
        }

        .zoom-display {
          font-size: 0.76rem;
          font-weight: 800;
          font-family: monospace;
          color: #E2E8F0;
          padding: 0 8px;
          cursor: pointer;
        }

        .action-btn-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 0.74rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s;
        }

        .action-btn-pill.undo {
          background: #0f172a;
          color: #CBD5E1;
        }

        .action-btn-pill.undo:hover:not(:disabled) {
          background: #1e293b;
          color: #FFFFFF;
        }

        .action-btn-pill.undo:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .action-btn-pill.clear {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #F87171;
        }

        .action-btn-pill.clear:hover {
          background: rgba(239, 68, 68, 0.25);
          border-color: #EF4444;
          color: #FFFFFF;
        }

        .action-btn-pill.export {
          background: rgba(11, 95, 255, 0.15);
          border-color: rgba(11, 95, 255, 0.4);
          color: #60A5FA;
        }

        .action-btn-pill.export:hover {
          background: #0B5FFF;
          color: #FFFFFF;
        }

        /* PALCO PRINCIPAL SUPERIOR: TOOLBAR ESQUERDA + MAPA EXPANDIDO */
        .tactical-top-stage-layout {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 12px;
          align-items: stretch;
        }

        /* TOOLBAR ESQUERDA ESTILO APPLE GLASS */
        .tactical-left-tools {
          background: rgba(10, 16, 32, 0.68);
          backdrop-filter: blur(28px) saturate(190%);
          -webkit-backdrop-filter: blur(28px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 20px;
          padding: 12px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          box-shadow: 
            0 20px 48px rgba(0, 0, 0, 0.5),
            inset 0 1px 1.5px rgba(255, 255, 255, 0.22);
        }

        .tools-button-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          align-items: center;
        }

        .tool-icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .tool-icon-btn:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.1);
        }

        .tool-icon-btn.active {
          color: #FFFFFF;
          background: #0B5FFF;
          border-color: #38BDF8;
          box-shadow: 0 0 12px rgba(11, 95, 255, 0.6);
        }

        .tool-icon-btn.active.select-mode {
          background: #EF4444;
          border-color: #F87171;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
        }

        .tool-icon-btn.active.eraser-mode {
          background: #DC2626;
          border-color: #FCA5A5;
        }

        .tools-color-palette {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .palette-label {
          font-size: 0.62rem;
          font-weight: 800;
          color: #64748B;
        }

        .color-dot-btn {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.15s;
        }

        .color-dot-btn:hover {
          transform: scale(1.2);
        }

        .color-dot-btn.active {
          border-color: #FFFFFF;
          box-shadow: 0 0 8px currentColor;
          transform: scale(1.15);
        }

        /* VIEWPORT CENTRAL COM MAPA */
        .tactical-center-viewport {
          background: #050811;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 560px;
          position: relative;
        }

        .map-scalable-wrapper {
          transform-origin: center center;
          transition: transform 0.15s ease-out;
        }

        .map-interactive-stage {
          width: 1100px;
          height: 508px;
          aspect-ratio: 1280 / 591;
          position: relative;
          background: #020617;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 16px 45px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .map-interactive-stage.select { cursor: default; }
        .map-interactive-stage.draw { cursor: crosshair; }
        .map-interactive-stage.arrow { cursor: crosshair; }
        .map-interactive-stage.line { cursor: crosshair; }
        .map-interactive-stage.text { cursor: text; }
        .map-interactive-stage.eraser { cursor: pointer; }
        .map-interactive-stage.pan { cursor: grab; }

        .map-background-render {
          width: 100%;
          height: 100%;
          object-fit: fill;
          position: absolute;
          inset: 0;
          pointer-events: none;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: high-quality;
        }

        .map-drawing-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10;
        }

        /* TOKENS DE POKÉMON NO MAPA */
        .map-pokemon-token {
          position: absolute;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: grab;
          z-index: 25;
          transition: transform 0.1s ease;
        }

        .map-pokemon-token:active {
          cursor: grabbing;
          transform: translate(-50%, -50%) scale(1.1);
          z-index: 40;
        }

        .token-avatar-ring {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(10, 15, 29, 0.9);
          border: 2.5px solid #0B5FFF;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 0 14px rgba(11, 95, 255, 0.7);
          transition: all 0.15s;
        }

        .map-pokemon-token.team-orange .token-avatar-ring {
          border-color: #F97316;
          box-shadow: 0 0 14px rgba(249, 115, 22, 0.7);
        }

        .token-sprite-img {
          width: 40px;
          height: 40px;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
        }

        .token-name-tag {
          font-size: 0.62rem;
          font-weight: 800;
          color: #FFFFFF;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(4px);
          border-radius: 4px;
          padding: 1px 5px;
          margin-top: 2px;
          white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.15);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        /* AÇÕES RÁPIDAS NO TOKEN (HOVER) */
        .token-quick-actions {
          position: absolute;
          top: -18px;
          display: none;
          align-items: center;
          gap: 4px;
        }

        .map-pokemon-token:hover .token-quick-actions {
          display: flex;
        }

        .toggle-team-btn {
          font-size: 0.55rem;
          font-weight: 800;
          color: #FFFFFF;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          padding: 1px 4px;
          cursor: pointer;
        }

        .del-token-btn {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #DC2626;
          border: none;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* TEXTOS ADICIONADOS */
        .map-tactical-label {
          position: absolute;
          transform: translate(-50%, -50%);
          background: rgba(10, 15, 29, 0.9);
          border: 1.5px solid #FFFFFF;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 0.74rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
          z-index: 20;
          cursor: pointer;
        }

        .remove-badge-ico {
          color: #EF4444;
        }

        /* BANNER DE DICA FLUTUANTE */
        .map-bottom-hint-banner {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(10, 15, 29, 0.8);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          padding: 5px 16px;
          font-size: 0.68rem;
          font-weight: 800;
          color: #94A3B8;
          letter-spacing: 0.05em;
          pointer-events: none;
          z-index: 30;
        }

        /* SEÇÃO INFERIOR: CATÁLOGO / DECK DE POKÉMON ABAIXO DO MAPA */
        .tactical-bottom-pokemon-deck {
          margin-top: 14px;
          background: rgba(10, 16, 32, 0.65);
          backdrop-filter: blur(28px) saturate(190%);
          -webkit-backdrop-filter: blur(28px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 14px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 
            0 20px 48px rgba(0, 0, 0, 0.45),
            inset 0 1px 1.5px rgba(255, 255, 255, 0.2);
        }

        .deck-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .deck-team-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .deck-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: #64748B;
          letter-spacing: 0.04em;
        }

        .deck-team-pills {
          display: flex;
          gap: 6px;
        }

        .deck-team-btn {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          padding: 5px 14px;
          font-size: 0.72rem;
          font-weight: 800;
          color: #94A3B8;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .deck-team-btn.blue.active {
          background: rgba(11, 95, 255, 0.3);
          border-color: #0B5FFF;
          color: #60A5FA;
          box-shadow: 0 0 12px rgba(11, 95, 255, 0.5);
        }

        .deck-team-btn.orange.active {
          background: rgba(249, 115, 22, 0.3);
          border-color: #F97316;
          color: #FB923C;
          box-shadow: 0 0 12px rgba(249, 115, 22, 0.5);
        }

        .deck-search-box {
          position: relative;
          width: 200px;
        }

        .deck-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748B;
        }

        .deck-search-box input {
          width: 100%;
          background: rgba(12, 18, 34, 0.65);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          padding: 6px 28px 6px 32px;
          font-size: 0.74rem;
          color: #FFFFFF;
          outline: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
          transition: border-color 0.2s;
        }

        .deck-search-box input:focus {
          border-color: #0B5FFF;
        }

        .deck-clear-search {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #64748B;
          cursor: pointer;
        }

        .deck-role-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .deck-role-pill {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          padding: 5px 12px;
          font-size: 0.68rem;
          font-weight: 800;
          color: #94A3B8;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .deck-role-pill:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .deck-role-pill.active {
          background: linear-gradient(135deg, rgba(11, 95, 255, 0.9) 0%, rgba(0, 71, 214, 0.95) 100%);
          border-color: rgba(255, 255, 255, 0.35);
          color: #FFFFFF;
          box-shadow: 0 2px 10px rgba(11, 95, 255, 0.45);
        }

        .deck-count-badge {
          font-size: 0.68rem;
          font-weight: 800;
          color: #64748B;
          letter-spacing: 0.03em;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 4px 10px;
          border-radius: 6px;
        }

        .deck-save-box {
          position: relative;
        }

        .save-input-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .save-input-row input {
          width: 150px;
          background: #0d1526;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 5px 8px;
          font-size: 0.72rem;
          color: #FFFFFF;
          outline: none;
        }

        .save-input-row input:focus {
          border-color: #0B5FFF;
        }

        .save-strat-btn {
          background: #0B5FFF;
          border: none;
          border-radius: 6px;
          color: #FFFFFF;
          padding: 6px 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }

        .save-strat-btn:hover {
          background: #1d6dff;
        }

        .save-feedback {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          font-size: 0.65rem;
          color: #34D399;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        /* GRADE DE POKÉMON ABAIXO DO MAPA (EXPANDE VERTICALMENTE SEM SCROLL INTERNO) */
        .deck-pokemon-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
          gap: 8px;
          max-height: none;
          height: auto;
          overflow: visible;
          padding: 6px 2px;
        }

        .deck-poke-card {
          height: 78px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 4px 3px 3px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          cursor: grab;
          transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
        }

        .deck-poke-card:hover {
          transform: translateY(-3px) scale(1.06);
          border-color: #FFFFFF;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.6);
          z-index: 5;
        }

        .deck-card-art {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .deck-card-img {
          width: 44px;
          height: 44px;
          object-fit: contain;
          filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.65));
        }

        .deck-card-footer {
          width: 100%;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          border-radius: 4px;
          padding: 2px 2px;
          text-align: center;
        }

        .deck-card-footer span {
          font-size: 0.52rem;
          font-weight: 800;
          color: #FFFFFF;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* MODAL DE TEXTO */
        .text-prompt-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .text-prompt-modal {
          width: 400px;
          background: #090e1a;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
        }

        .modal-head {
          font-size: 0.9rem;
          font-weight: 800;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .text-prompt-modal input {
          width: 100%;
          background: #0d1526;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.85rem;
          color: #FFFFFF;
          outline: none;
        }

        .text-prompt-modal input:focus {
          border-color: #0B5FFF;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};
