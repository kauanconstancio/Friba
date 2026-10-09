import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
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
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  X,
  Move,
  Users,
  Shield,
  Sparkles,
} from "lucide-react";
import type { TacticalElement, StrategyPlan, PokemonRole, TeamMember } from "../../types";
import { POKEMON_ROSTER } from "../../data/pokemonData";
import { fetchUniteDbPokemons } from "../../services/uniteDbService";
import { getPokemonRoleStyle } from "../../utils/pokemonStyles";

const THEIA_MAP = {
  id: "theia-sky-ruins",
  name: "Ruínas Celestes de Theia",
  subname: "Rayquaza",
  format: "5v5 Competitivo",
  image: "/maps/theia-sky-ruins.png",
  description:
    "Ruínas Celestes de Theia - Mapa oficial de torneios e ranqueadas com Rayquaza.",
};

interface TacticalMapProps {
  presets?: StrategyPlan[];
  onSaveStrategy?: (strategy: StrategyPlan) => void;
  members?: TeamMember[];
}

type ToolType =
  | "select"
  | "draw"
  | "arrow"
  | "line"
  | "text"
  | "eraser"
  | "pan";

const generateTacticalId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

const drawTacticalArrow = (
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  width: number = 4,
) => {
  const headLen = Math.max(14, width * 3.5);
  const angle = Math.atan2(toY - fromY, toX - fromX);

  // Sombra sutil
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 6;

  // Haste da seta
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Ponta da seta
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

export const TacticalMap: React.FC<TacticalMapProps> = ({
  presets: _presets = [],
  onSaveStrategy: _onSaveStrategy,
  members = [],
}) => {
  const [deckTab, setDeckTab] = useState<"members" | "pokemons">("members");
  const [pokemons, setPokemons] = useState(POKEMON_ROSTER);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("TODOS");
  const [teamToAdd] = useState<"blue" | "orange">("blue");

  // Ferramentas & Estilos
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [activeColor, setActiveColor] = useState<string>("#0B5FFF");
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [dragOverMap, setDragOverMap] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(100);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [isWheelZooming, setIsWheelZooming] = useState(false);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Elementos da prancheta
  const [elements, setElements] = useState<TacticalElement[]>([]);
  const [history, setHistory] = useState<TacticalElement[][]>([]);

  // Estados de Desenho e Referências do Viewport / Mapa
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<
    { x: number; y: number }[]
  >([]);
  const [dragStartPoint, setDragStartPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Dragging e Interação de Token existente no mapa (1 clique muda de time, 2 cliques exclui)
  const [draggedTokenId, setDraggedTokenId] = useState<string | null>(null);
  const tokenMouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const tokenDraggedRef = useRef<boolean>(false);
  const tokenClickTimerRef = useRef<{
    [key: string]: ReturnType<typeof setTimeout>;
  }>({});

  // Input de Texto no Mapa
  const [textModal, setTextModal] = useState<{
    open: boolean;
    x: number;
    y: number;
    text: string;
  }>({
    open: false,
    x: 0,
    y: 0,
    text: "",
  });


  // Resetar zoom e centralizar o mapa
  const handleResetZoom = () => {
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
  };

  // Sincronizar pokémons com a API do unite-db
  useEffect(() => {
    fetchUniteDbPokemons().then((data) => {
      if (data && data.length > 0) {
        setPokemons(data);
      }
    });
  }, []);

  // Atalhos de Teclado (Segurar Espaço para Modo Navegação Mão) e Soltura Global de Mouse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setDraggedTokenId(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  // Zoom Inteligente com Scroll do Mouse direcionado para a posição do cursor
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsWheelZooming(true);
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
      wheelTimeoutRef.current = setTimeout(() => {
        setIsWheelZooming(false);
      }, 150);

      // Determinar direção de zoom (+ ou -)
      const isZoomIn = e.deltaY < 0;
      // Passo de zoom consistente: 15% para rolagem tradicional de roda, 10% para suave
      const step = Math.abs(e.deltaY) >= 50 ? 15 : 10;

      setZoom((prevZoom) => {
        const nextZoom = isZoomIn
          ? Math.min(300, prevZoom + step)
          : Math.max(50, prevZoom - step);

        if (nextZoom === prevZoom) return prevZoom;

        if (nextZoom === 100) {
          setPanOffset({ x: 0, y: 0 });
          return nextZoom;
        }

        const rect = el.getBoundingClientRect();
        const mouseX = e.clientX - (rect.left + rect.width / 2);
        const mouseY = e.clientY - (rect.top + rect.height / 2);

        const ratio = nextZoom / prevZoom;
        setPanOffset((prevPan) => ({
          x: Math.round(mouseX - (mouseX - prevPan.x) * ratio),
          y: Math.round(mouseY - (mouseY - prevPan.y) * ratio),
        }));

        return nextZoom;
      });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
    };
  }, []);

  // Cores de degradê unificadas por classe para os cards do catálogo lateral
  const getRoleCardGradient = (role: PokemonRole) => {
    return getPokemonRoleStyle(role).gradient;
  };

  // Filtragem Otimizada com useMemo para evitar re-computações desnecessárias durante o desenho
  const filteredPokemons = useMemo(() => {
    const s = search.toLowerCase();
    return pokemons.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(s);
      if (roleFilter === "TODOS") return matchesSearch;
      if (roleFilter === "ATACANTE")
        return matchesSearch && p.role === "Attacker";
      if (roleFilter === "VELOZ")
        return matchesSearch && p.role === "Speedster";
      if (roleFilter === "VERSÁTIL")
        return matchesSearch && p.role === "All-Rounder";
      if (roleFilter === "DEFENSOR")
        return matchesSearch && p.role === "Defender";
      if (roleFilter === "SUPORTE")
        return matchesSearch && p.role === "Supporter";
      return matchesSearch;
    });
  }, [pokemons, search, roleFilter]);

  // Salvar estado no histórico para Desfazer (Undo)
  const pushHistory = useCallback(() => {
    setElements((currentElements) => {
      setHistory((prev) => [...prev.slice(-15), currentElements]);
      return currentElements;
    });
  }, []);

  const handleUndo = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setElements(prev);
      setHistory((old) => old.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (elements.length === 0) return;
    pushHistory();
    setElements([]);
  };

  // Adicionar Pokémon avulso ao mapa
  const handleAddPokemonToMap = (
    pokemon: (typeof pokemons)[0],
    x = 50,
    y = 50,
  ) => {
    pushHistory();
    const newElement: TacticalElement = {
      id: generateTacticalId("token"),
      type: "token",
      x,
      y,
      pokemonId: pokemon.id,
      pokemonName: pokemon.name,
      pokemonSprite: pokemon.sprite,
      team: teamToAdd,
    };
    setElements((prev) => [...prev, newElement]);
  };

  // Adicionar Atleta do Elenco ao Mapa
  const handleAddMemberToMap = (
    member: TeamMember,
    x = 48,
    y = 48,
    overridePokemon?: (typeof pokemons)[0]
  ) => {
    pushHistory();
    const preferredName = member.mainPokemon?.[0];
    const matchedPoke = overridePokemon || 
      (preferredName ? pokemons.find(p => p.name.toLowerCase() === preferredName.toLowerCase() || p.id.toLowerCase() === preferredName.toLowerCase()) : null) ||
      pokemons[0];

    const newElement: TacticalElement = {
      id: generateTacticalId(`token-member-${member.id}`),
      type: "token",
      x,
      y,
      pokemonId: matchedPoke?.id || "charizard",
      pokemonName: matchedPoke?.name || "Charizard",
      pokemonSprite: matchedPoke?.sprite || "https://unite.pokemon.com/images/pokemon/charizard/roster/roster-charizard.png",
      team: "blue",
      memberId: member.id,
      memberName: member.name,
      memberNickname: member.nickname,
      memberAvatar: member.avatar,
      memberLane: member.preferredLane,
      memberRole: member.gameRole || member.role
    };
    setElements((prev) => [...prev, newElement]);
  };

  // Auto-Escalar os 5 Titulares nas Rotas Oficiais de Theia
  const handleAutoDeployStarters = () => {
    const starters = members.filter(m => m.role === 'Jogador' && m.status === 'Titular');
    const lineupToDeploy = starters.length > 0 ? starters.slice(0, 5) : members.slice(0, 5);
    if (lineupToDeploy.length === 0) return;

    pushHistory();
    // Posições competitivas padrão no mapa Ruínas Celestes de Theia
    const defaultPositions = [
      { x: 22, y: 25, lane: 'Top' },     // Top Lane
      { x: 38, y: 50, lane: 'Jungle' },  // Jungle / Buff Central
      { x: 22, y: 75, lane: 'Bot' },     // Bot Lane Carregador
      { x: 30, y: 80, lane: 'Support' }, // Bot Lane Suporte
      { x: 45, y: 50, lane: 'Mid' }      // Mid / Entrada de Rayquaza
    ];

    const deployedTokens: TacticalElement[] = lineupToDeploy.map((member, idx) => {
      const pos = defaultPositions[idx] || { x: 30 + idx * 5, y: 50 };
      const preferredName = member.mainPokemon?.[0];
      const matchedPoke = (preferredName ? pokemons.find(p => p.name.toLowerCase() === preferredName.toLowerCase() || p.id.toLowerCase() === preferredName.toLowerCase()) : null) || pokemons[idx % pokemons.length];

      return {
        id: `token-member-${member.id}-${Date.now()}-${idx}`,
        type: "token",
        x: pos.x,
        y: pos.y,
        pokemonId: matchedPoke?.id || "charizard",
        pokemonName: matchedPoke?.name || "Charizard",
        pokemonSprite: matchedPoke?.sprite || "",
        team: "blue",
        memberId: member.id,
        memberName: member.name,
        memberNickname: member.nickname,
        memberAvatar: member.avatar,
        memberLane: member.preferredLane || pos.lane,
        memberRole: member.gameRole || member.role
      };
    });

    setElements(prev => [...prev, ...deployedTokens]);
  };

  // Drag and Drop de Jogador
  const handleDragStartFromMember = (
    e: React.DragEvent,
    member: TeamMember,
    overridePokemon?: (typeof pokemons)[0]
  ) => {
    const preferredName = member.mainPokemon?.[0];
    const matchedPoke = overridePokemon || 
      (preferredName ? pokemons.find(p => p.name.toLowerCase() === preferredName.toLowerCase() || p.id.toLowerCase() === preferredName.toLowerCase()) : null) ||
      pokemons[0];

    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        pokemon: matchedPoke,
        member,
        team: "blue"
      })
    );
  };

  // Drag and Drop de Pokémon a partir da barra lateral
  const handleDragStartFromSidebar = (
    e: React.DragEvent,
    pokemon: (typeof pokemons)[0],
  ) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        pokemon,
        team: teamToAdd,
      }),
    );
  };

  const handleDropOnMap = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverMap(false);
    const dataStr = e.dataTransfer.getData("application/json");
    if (!dataStr) return;

    try {
      const data = JSON.parse(dataStr);
      const { pokemon, member, team } = data;
      const mapRect = mapContainerRef.current?.getBoundingClientRect();
      if (!mapRect) return;

      const xPercent = Math.max(
        2,
        Math.min(95, ((e.clientX - mapRect.left) / mapRect.width) * 100),
      );
      const yPercent = Math.max(
        4,
        Math.min(94, ((e.clientY - mapRect.top) / mapRect.height) * 100),
      );

      pushHistory();
      const newElement: TacticalElement = {
        id: generateTacticalId("token"),
        type: "token",
        x: xPercent,
        y: yPercent,
        pokemonId: pokemon?.id,
        pokemonName: pokemon?.name,
        pokemonSprite: pokemon?.sprite,
        team: team || teamToAdd,
        memberId: member?.id,
        memberName: member?.name,
        memberNickname: member?.nickname,
        memberAvatar: member?.avatar,
        memberLane: member?.preferredLane,
        memberRole: member?.gameRole || member?.role
      };
      setElements((prev) => [...prev, newElement]);
    } catch {}
  };

  const handleDragOverMap = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragOverMap) {
      setDragOverMap(true);
    }
  };

  const handleDragLeaveMap = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setDragOverMap(false);
    }
  };

  // Window-level tracking para arrasto de tokens sem perdas de movimento fora da tela
  useEffect(() => {
    if (!draggedTokenId) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const mapRect = mapContainerRef.current?.getBoundingClientRect();
      if (!mapRect) return;

      if (tokenMouseDownPosRef.current) {
        const dist = Math.hypot(
          e.clientX - tokenMouseDownPosRef.current.x,
          e.clientY - tokenMouseDownPosRef.current.y,
        );
        if (dist > 3) {
          tokenDraggedRef.current = true;
        }
      }

      const xPercent = Math.max(
        2,
        Math.min(98, ((e.clientX - mapRect.left) / mapRect.width) * 100),
      );
      const yPercent = Math.max(
        3,
        Math.min(97, ((e.clientY - mapRect.top) / mapRect.height) * 100),
      );

      setElements((prev) =>
        prev.map((el) =>
          el.id === draggedTokenId ? { ...el, x: xPercent, y: yPercent } : el,
        ),
      );
    };

    const handleWindowMouseUp = () => {
      if (tokenDraggedRef.current) {
        pushHistory();
      }
      setDraggedTokenId(null);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [draggedTokenId, pushHistory]);

  // Mover Token existente no mapa
  const handleTokenMouseDown = (e: React.MouseEvent, elId: string) => {
    if (e.button === 1 || isSpacePressed || activeTool === "pan") {
      return;
    }

    if (activeTool === "eraser") {
      pushHistory();
      setElements((prev) => prev.filter((el) => el.id !== elId));
      return;
    }

    if (activeTool !== "select") return;
    e.stopPropagation();

    tokenMouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    tokenDraggedRef.current = false;

    const target = elements.find((el) => el.id === elId);
    if (!target) return;

    setDraggedTokenId(elId);
  };

  // Gerenciamento de Pokémon no mapa:
  // 1 clique: alterna equipe (Time Azul <-> Time Laranja)
  // 2 cliques: exclui o Pokémon do mapa
  const handleTokenClick = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();

    // Se o usuário arrastou o token pelo mapa, não dispara clique
    if (tokenDraggedRef.current) {
      tokenDraggedRef.current = false;
      return;
    }

    // Se já havia um clique aguardando dentro da janela de 240ms -> 2º CLIQUE (EXCLUIR)
    if (tokenClickTimerRef.current[elId]) {
      clearTimeout(tokenClickTimerRef.current[elId]);
      delete tokenClickTimerRef.current[elId];

      pushHistory();
      setElements((prev) => prev.filter((el) => el.id !== elId));
      return;
    }

    // 1º Clique: aguarda 240ms para checar se haverá um segundo clique de exclusão
    tokenClickTimerRef.current[elId] = setTimeout(() => {
      delete tokenClickTimerRef.current[elId];

      pushHistory();
      setElements((prev) =>
        prev.map((el) => {
          if (el.id === elId) {
            return {
              ...el,
              team: el.team === "blue" ? "orange" : "blue",
            };
          }
          return el;
        }),
      );
    }, 240);
  };

  const handleTokenDoubleClick = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    if (tokenClickTimerRef.current[elId]) {
      clearTimeout(tokenClickTimerRef.current[elId]);
      delete tokenClickTimerRef.current[elId];
    }
    pushHistory();
    setElements((prev) => prev.filter((el) => el.id !== elId));
  };

  const removeElement = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    pushHistory();
    setElements((prev) => prev.filter((el) => el.id !== elId));
  };

  // Render do Canvas de Desenho (Pincel, Setas, Linhas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Desenhar elementos permanentes
    elements.forEach((el) => {
      const elColor = el.color || "#0B5FFF";
      const wWidth = el.width || 4;

      // Traço livre
      if (el.type === "draw" && el.points && el.points.length > 1) {
        ctx.strokeStyle = elColor;
        ctx.lineWidth = wWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo((el.points[0].x / 100) * w, (el.points[0].y / 100) * h);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo((el.points[i].x / 100) * w, (el.points[i].y / 100) * h);
        }
        ctx.stroke();
      }

      // Seta tática
      if (el.type === "arrow" && el.toX !== undefined && el.toY !== undefined) {
        drawTacticalArrow(
          ctx,
          (el.x / 100) * w,
          (el.y / 100) * h,
          (el.toX / 100) * w,
          (el.toY / 100) * h,
          elColor,
          wWidth,
        );
      }

      // Linha reta
      if (el.type === "line" && el.toX !== undefined && el.toY !== undefined) {
        ctx.strokeStyle = elColor;
        ctx.lineWidth = wWidth;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo((el.x / 100) * w, (el.y / 100) * h);
        ctx.lineTo((el.toX / 100) * w, (el.toY / 100) * h);
        ctx.stroke();
      }
    });

    // Traço temporário durante desenho ativo
    if (isDrawing && activeTool === "draw" && currentStroke.length > 1) {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(
        (currentStroke[0].x / 100) * w,
        (currentStroke[0].y / 100) * h,
      );
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(
          (currentStroke[i].x / 100) * w,
          (currentStroke[i].y / 100) * h,
        );
      }
      ctx.stroke();
    }

    // Seta ou linha temporária durante o clique e arraste
    if (
      isDrawing &&
      (activeTool === "arrow" || activeTool === "line") &&
      dragStartPoint &&
      currentStroke.length > 0
    ) {
      const current = currentStroke[currentStroke.length - 1];
      if (activeTool === "arrow") {
        drawTacticalArrow(
          ctx,
          (dragStartPoint.x / 100) * w,
          (dragStartPoint.y / 100) * h,
          (current.x / 100) * w,
          (current.y / 100) * h,
          activeColor,
          strokeWidth,
        );
      } else {
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo((dragStartPoint.x / 100) * w, (dragStartPoint.y / 100) * h);
        ctx.lineTo((current.x / 100) * w, (current.y / 100) * h);
        ctx.stroke();
      }
    }
  }, [
    elements,
    isDrawing,
    currentStroke,
    activeTool,
    activeColor,
    strokeWidth,
    dragStartPoint,
  ]);



  // Iniciar Pan pelo Viewport
  const handleViewportMouseDown = (e: React.MouseEvent) => {
    if (
      e.button === 1 ||
      isSpacePressed ||
      activeTool === "pan" ||
      e.target === viewportRef.current
    ) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      });
    }
  };

  // Eventos de Mouse no Canvas / Mapa
  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isSpacePressed || activeTool === "pan") {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      });
      return;
    }

    const mapRect = mapContainerRef.current?.getBoundingClientRect();
    if (!mapRect) return;

    const xPercent = ((e.clientX - mapRect.left) / mapRect.width) * 100;
    const yPercent = ((e.clientY - mapRect.top) / mapRect.height) * 100;

    if (activeTool === "text") {
      setTextModal({
        open: true,
        x: xPercent,
        y: yPercent,
        text: "",
      });
      return;
    }

    if (activeTool === "eraser") {
      const target = elements.find((el) => {
        if (el.type === "token") {
          return Math.hypot(el.x - xPercent, el.y - yPercent) < 4;
        }
        if (el.type === "text") {
          return Math.hypot(el.x - xPercent, el.y - yPercent) < 5;
        }
        if (el.type === "draw" && el.points) {
          return el.points.some(
            (p) => Math.hypot(p.x - xPercent, p.y - yPercent) < 3.5,
          );
        }
        if (el.type === "arrow" || el.type === "line") {
          return (
            Math.hypot(el.x - xPercent, el.y - yPercent) < 4 ||
            (el.toX !== undefined &&
              el.toY !== undefined &&
              Math.hypot(el.toX - xPercent, el.toY - yPercent) < 4)
          );
        }
        return false;
      });

      if (target) {
        pushHistory();
        setElements((prev) => prev.filter((el) => el.id !== target.id));
      }
      return;
    }

    if (
      activeTool === "draw" ||
      activeTool === "arrow" ||
      activeTool === "line"
    ) {
      setIsDrawing(true);
      setDragStartPoint({ x: xPercent, y: yPercent });
      setCurrentStroke([{ x: xPercent, y: yPercent }]);
    }
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const mapRect = mapContainerRef.current?.getBoundingClientRect();
    if (!mapRect) return;

    // Se estiver arrastando um Token existente
    if (draggedTokenId && activeTool === "select") {
      if (tokenMouseDownPosRef.current) {
        const dist = Math.hypot(
          e.clientX - tokenMouseDownPosRef.current.x,
          e.clientY - tokenMouseDownPosRef.current.y,
        );
        if (dist > 3) {
          tokenDraggedRef.current = true;
        }
      }

      const xPercent = Math.max(
        2,
        Math.min(95, ((e.clientX - mapRect.left) / mapRect.width) * 100),
      );
      const yPercent = Math.max(
        4,
        Math.min(94, ((e.clientY - mapRect.top) / mapRect.height) * 100),
      );

      setElements((prev) =>
        prev.map((el) => {
          if (el.id === draggedTokenId) {
            return { ...el, x: xPercent, y: yPercent };
          }
          return el;
        }),
      );
      return;
    }

    // Se estiver desenhando
    if (
      isDrawing &&
      (activeTool === "draw" || activeTool === "arrow" || activeTool === "line")
    ) {
      const xPercent = ((e.clientX - mapRect.left) / mapRect.width) * 100;
      const yPercent = ((e.clientY - mapRect.top) / mapRect.height) * 100;

      if (activeTool === "arrow" || activeTool === "line") {
        if (dragStartPoint) {
          setCurrentStroke([dragStartPoint, { x: xPercent, y: yPercent }]);
        }
      } else if (activeTool === "draw") {
        setCurrentStroke((prev) => {
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
    if (isPanning) {
      setIsPanning(false);
    }

    if (draggedTokenId) {
      if (tokenDraggedRef.current) {
        pushHistory();
      }
      setDraggedTokenId(null);
    }

    if (!isDrawing) return;

    if (activeTool === "draw" && currentStroke.length > 1) {
      pushHistory();
      setElements((prev) => [
        ...prev,
        {
          id: `draw-${Date.now()}`,
          type: "draw",
          x: currentStroke[0].x,
          y: currentStroke[0].y,
          points: currentStroke,
          color: activeColor,
          width: strokeWidth,
        },
      ]);
    } else if (
      activeTool === "arrow" &&
      dragStartPoint &&
      currentStroke.length > 0
    ) {
      const end = currentStroke[currentStroke.length - 1];
      // Ignorar cliques acidentais sem movimento
      if (Math.hypot(end.x - dragStartPoint.x, end.y - dragStartPoint.y) > 2) {
        pushHistory();
        setElements((prev) => [
          ...prev,
          {
            id: `arrow-${Date.now()}`,
            type: "arrow",
            x: dragStartPoint.x,
            y: dragStartPoint.y,
            toX: end.x,
            toY: end.y,
            color: activeColor,
            width: strokeWidth,
          },
        ]);
      }
    } else if (
      activeTool === "line" &&
      dragStartPoint &&
      currentStroke.length > 0
    ) {
      const end = currentStroke[currentStroke.length - 1];
      if (Math.hypot(end.x - dragStartPoint.x, end.y - dragStartPoint.y) > 2) {
        pushHistory();
        setElements((prev) => [
          ...prev,
          {
            id: `line-${Date.now()}`,
            type: "line",
            x: dragStartPoint.x,
            y: dragStartPoint.y,
            toX: end.x,
            toY: end.y,
            color: activeColor,
            width: strokeWidth,
          },
        ]);
      }
    }

    setIsDrawing(false);
    setCurrentStroke([]);
    setDragStartPoint(null);
  };

  // Confirmar adição de texto no mapa
  const handleConfirmText = () => {
    if (!textModal.text.trim()) {
      setTextModal({ open: false, x: 0, y: 0, text: "" });
      return;
    }

    pushHistory();
    setElements((prev) => [
      ...prev,
      {
        id: `text-${Date.now()}`,
        type: "text",
        x: textModal.x,
        y: textModal.y,
        label: textModal.text,
        color: activeColor,
      },
    ]);

    setTextModal({ open: false, x: 0, y: 0, text: "" });
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

        {/* Ações Rápidas: Desfazer, Limpar e Exportar */}
        <div className="tactical-top-actions">
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
              className={`tool-icon-btn ${activeTool === "select" ? "active select-mode" : ""}`}
              onClick={() => setActiveTool("select")}
              title="Selecionar e Mover Pokémon / Elementos"
            >
              <MousePointer size={18} />
            </button>

            <button
              className={`tool-icon-btn ${activeTool === "draw" ? "active" : ""}`}
              onClick={() => setActiveTool("draw")}
              title="Pincel / Desenho Livre"
            >
              <Pencil size={18} />
            </button>

            <button
              className={`tool-icon-btn ${activeTool === "arrow" ? "active" : ""}`}
              onClick={() => setActiveTool("arrow")}
              title="Seta Tática de Rotação ou Foco"
            >
              <ArrowUpRight size={19} />
            </button>

            <button
              className={`tool-icon-btn ${activeTool === "line" ? "active" : ""}`}
              onClick={() => setActiveTool("line")}
              title="Linha Reta de Conexão"
            >
              <Minus size={18} />
            </button>

            <button
              className={`tool-icon-btn ${activeTool === "text" ? "active" : ""}`}
              onClick={() => setActiveTool("text")}
              title="Adicionar Texto / Anotação no Mapa"
            >
              <Type size={18} />
            </button>

            <button
              className={`tool-icon-btn ${activeTool === "eraser" ? "active eraser-mode" : ""}`}
              onClick={() => setActiveTool("eraser")}
              title="Borracha: Clique em um Pokémon ou traço para apagar"
            >
              <Eraser size={18} />
            </button>

            <button
              className={`tool-icon-btn ${activeTool === "pan" ? "active pan-mode" : ""}`}
              onClick={() => setActiveTool("pan")}
              title="Mão / Navegação (Clique e arraste para mover o mapa, ou segure Espaço)"
            >
              <Hand size={18} />
            </button>
          </div>

          {/* Seletor de Cores Táticas */}
          <div className="tools-color-palette">
            <div className="palette-label">COR</div>
            {[
              { color: "#0B5FFF", label: "Azul Friba" },
              { color: "#D61F26", label: "Vermelho Friba" },
              { color: "#F59E0B", label: "Dourado / Objetivo" },
              { color: "#10B981", label: "Verde / Seguro" },
              { color: "#FFFFFF", label: "Branco / Neutro" },
              { color: "#8B5CF6", label: "Roxo / Especial" },
            ].map((c) => (
              <button
                key={c.color}
                className={`color-dot-btn ${activeColor === c.color ? "active" : ""}`}
                style={{ backgroundColor: c.color }}
                onClick={() => setActiveColor(c.color)}
                title={c.label}
              />
            ))}
          </div>

          {/* Seletor de Espessura para Ferramentas de Desenho (Estilo Dragounite) */}
          {(activeTool === "draw" ||
            activeTool === "arrow" ||
            activeTool === "line") && (
            <div className="tools-stroke-section">
              <div className="palette-label">ESPESSURA</div>
              <div className="stroke-preview-box">
                <span
                  className="stroke-preview-dot"
                  style={{
                    width: `${strokeWidth * 3}px`,
                    height: `${strokeWidth * 3}px`,
                    backgroundColor: activeColor,
                    boxShadow: `0 0 8px ${activeColor}`,
                  }}
                />
                <span className="stroke-preview-val">{strokeWidth}px</span>
              </div>
              <div className="stroke-preset-pills">
                {[2, 4, 6, 8].map((w) => (
                  <button
                    key={w}
                    type="button"
                    className={`stroke-pill-btn ${strokeWidth === w ? "active" : ""}`}
                    onClick={() => setStrokeWidth(w)}
                    title={`Espessura ${w}px`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ÁREA CENTRAL: O MAPA INTERATIVO + CANVAS */}
        <div
          ref={viewportRef}
          className={`tactical-center-viewport ${isPanning ? "panning" : ""} ${isSpacePressed || activeTool === "pan" ? "pan-active" : ""}`}
          onMouseDown={handleViewportMouseDown}
          onMouseMove={handleMapMouseMove}
          onMouseUp={handleMapMouseUp}
        >
          {/* HUD Badge de Zoom e Navegação Superior (Inspirado no Dragounite) */}
          {zoom > 100 && (
            <div className="map-hud-zoom-badge">
              <span className="hud-zoom-val">{zoom}%</span>
              <span className="hud-zoom-sep">·</span>
              <span className="hud-zoom-hint">
                {activeTool === "pan"
                  ? "Arraste para mover o mapa"
                  : "Ctrl + Scroll para zoom"}
              </span>
            </div>
          )}

          <div
            className="map-scalable-wrapper"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`,
              transition:
                isPanning || isWheelZooming
                  ? "none"
                  : "transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              ref={mapContainerRef}
              className={`map-interactive-stage ${activeTool} ${isPanning ? "panning" : ""} ${dragOverMap ? "drag-over" : ""}`}
              onMouseDown={handleMapMouseDown}
              onMouseMove={handleMapMouseMove}
              onMouseUp={handleMapMouseUp}
              onDragOver={handleDragOverMap}
              onDragLeave={handleDragLeaveMap}
              onDrop={handleDropOnMap}
            >
              {/* Imagem Real de Fundo de Alta Definição (1.2MB Oficial Lossless) */}
              <img
                src={THEIA_MAP.image}
                alt={THEIA_MAP.name}
                className="map-background-render"
                draggable={false}
              />

              {/* Overlay Interativo de Drop Zone com Feedback Visual */}
              {dragOverMap && (
                <div className="map-drop-target-overlay">
                  <div className="drop-target-badge">
                    SOLTE AQUI PARA POSICIONAR NO MAPA
                  </div>
                </div>
              )}

              {/* Canvas HTML5 de Alta Precisão (1280x591) para Linhas, Pincel e Setas */}
              <canvas
                ref={canvasRef}
                width={1280}
                height={591}
                className="map-drawing-canvas"
              />

              {/* Camada de Textos Adicionados com compensação de escala */}
              {elements
                .filter((el) => el.type === "text")
                .map((el) => (
                  <div
                    key={el.id}
                    className="map-tactical-label"
                    style={
                      {
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        color: el.color || "#FFFFFF",
                        borderColor: el.color || "#FFFFFF",
                        "--label-scale": `${100 / zoom}`,
                      } as React.CSSProperties
                    }
                    onClick={(e) => {
                      if (activeTool === "eraser") removeElement(e, el.id);
                    }}
                  >
                    <span>{el.label}</span>
                    {activeTool === "eraser" && (
                      <X size={12} className="remove-badge-ico" />
                    )}
                  </div>
                ))}

              {/* Camada de Tokens de Pokémon com escala adaptativa ao zoom */}
              {elements
                .filter((el) => el.type === "token")
                .map((el) => {
                  const isBlue = el.team === "blue";
                  const isDragging = draggedTokenId === el.id;
                  const hasMember = Boolean(el.memberNickname || el.memberName);
                  return (
                    <div
                      key={el.id}
                      className={`map-pokemon-token ${isBlue ? "team-blue" : "team-orange"} ${isDragging ? "is-dragging" : ""} ${hasMember ? "has-linked-member" : ""}`}
                      style={
                        {
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          "--token-scale": `${100 / zoom}`,
                        } as React.CSSProperties
                      }
                      onMouseDown={(e) => handleTokenMouseDown(e, el.id)}
                      onClick={(e) => handleTokenClick(e, el.id)}
                      onDoubleClick={(e) => handleTokenDoubleClick(e, el.id)}
                      title={
                        hasMember
                          ? `${el.memberName} (@${el.memberNickname}) · ${el.pokemonName} (${el.memberLane || "Rota Livre"}) · ${isBlue ? "Time Azul" : "Time Laranja"}`
                          : `${el.pokemonName} (${isBlue ? "Time Azul" : "Time Laranja"}) · 1 clique: mudar time · 2 cliques: excluir`
                      }
                    >
                      <div className="token-avatar-ring">
                        <img
                          src={el.pokemonSprite}
                          alt={el.pokemonName}
                          className="token-sprite-img"
                          draggable={false}
                        />

                        {/* Badge de Atleta Vinculado sobreposto */}
                        {hasMember && (
                          <div className="token-member-avatar-badge">
                            {el.memberAvatar ? (
                              <img
                                src={el.memberAvatar}
                                alt={el.memberNickname || el.memberName}
                                className="token-member-badge-img"
                              />
                            ) : (
                              <span>
                                {(el.memberNickname || el.memberName || "J").slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Plaquinha com Nickname e Rota */}
                      {hasMember && (
                        <div className="token-member-nametag">
                          <span className="token-member-name-text">
                            @{el.memberNickname || el.memberName}
                          </span>
                          {el.memberLane && (
                            <span className="token-member-lane-tag">
                              {el.memberLane}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Banner Flutuante de Ajuda exibido quando não há elementos */}
              {elements.length === 0 && !dragOverMap && (
                <div className="map-bottom-hint-banner">
                  <span>
                    ARRASTE OU CLIQUE EM UM JOGADOR OU POKÉMON ABAIXO PARA ADICIONAR AO MAPA
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BARRA LATERAL DIREITA: CONTROLES VERTICAIS DE ZOOM & NAVEGAÇÃO */}
        <div className="tactical-right-zoom-dock">
          <div className="zoom-dock-group">
            {/* Botão Zoom In */}
            <button
              className="zoom-dock-btn"
              onClick={() => setZoom((prev) => Math.min(300, prev + 15))}
              title="Aumentar Zoom (+15%)"
            >
              <ZoomIn size={18} />
            </button>

            {/* Display de Zoom Atual (clicável para resetar) */}
            <button
              className="zoom-dock-value"
              onClick={handleResetZoom}
              title="Clique para resetar para 100% e centralizar"
            >
              <span className="zoom-dock-number">{zoom}</span>
              <span className="zoom-dock-unit">%</span>
            </button>

            {/* Botão Zoom Out */}
            <button
              className="zoom-dock-btn"
              onClick={() => setZoom((prev) => Math.max(50, prev - 15))}
              title="Diminuir Zoom (-15%)"
            >
              <ZoomOut size={18} />
            </button>

            {/* Resetar / Ajustar à Tela */}
            <button
              className="zoom-dock-btn reset"
              onClick={handleResetZoom}
              title="Ajustar e Centralizar Mapa (100%)"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          <div className="zoom-dock-divider" />

          {/* Presets Rápidos Verticais */}
          <div className="zoom-dock-presets">
            <span className="dock-section-label">ZOOM</span>
            {[200, 150, 100, 75, 50].map((level) => (
              <button
                key={level}
                className={`zoom-preset-vertical-btn ${zoom === level ? "active" : ""}`}
                onClick={() => {
                  setZoom(level);
                  if (level === 100) setPanOffset({ x: 0, y: 0 });
                }}
                title={`Definir zoom em ${level}%`}
              >
                {level}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO INFERIOR: DECK DE ELENCO FRIBA & CATÁLOGO DE POKÉMON */}
      {/* ========================================================================= */}
      <div className="tactical-bottom-pokemon-deck">
        <div className="deck-mode-tabs-bar">
          <div className="deck-mode-pills">
            <button
              className={`deck-mode-tab-btn ${deckTab === "members" ? "active" : ""}`}
              onClick={() => setDeckTab("members")}
            >
              <Users size={15} />
              <span>ELENCO FRIBA</span>
              <span className="deck-mode-count">{members.length}</span>
            </button>
            <button
              className={`deck-mode-tab-btn ${deckTab === "pokemons" ? "active" : ""}`}
              onClick={() => setDeckTab("pokemons")}
            >
              <Shield size={15} />
              <span>CATÁLOGO UNITE-DB</span>
              <span className="deck-mode-count">{pokemons.length}</span>
            </button>
          </div>

          {deckTab === "members" && (
            <div className="deck-members-quick-actions">
              <button
                className="deck-auto-deploy-btn"
                onClick={handleAutoDeployStarters}
                title="Posiciona automaticamente os 5 titulares nas rotas oficiais de Theia Sky Ruins (Top, Selva, Bot e Mid)"
              >
                <Sparkles size={14} />
                <span>Auto-Escalar 5 Titulares</span>
              </button>
            </div>
          )}
        </div>

        {/* MODO 1: ELENCO FRIBA VINCULADO */}
        {deckTab === "members" ? (
          <div className="deck-members-container">
            {members.length === 0 ? (
              <div className="deck-empty-members">
                <Users size={28} className="text-secondary opacity-60" />
                <span>Nenhum atleta cadastrado na equipe ainda. Cadastre membros na aba "Equipe".</span>
              </div>
            ) : (
              <div className="deck-members-grid">
                {members.map((member) => {
                  const preferredName = member.mainPokemon?.[0];
                  const matchedPoke =
                    (preferredName
                      ? pokemons.find(
                          (p) =>
                            p.name.toLowerCase() === preferredName.toLowerCase() ||
                            p.id.toLowerCase() === preferredName.toLowerCase()
                        )
                      : null) || pokemons[0];

                  return (
                    <div
                      key={member.id}
                      className="deck-member-card"
                      draggable
                      onDragStart={(e) => handleDragStartFromMember(e, member, matchedPoke)}
                      onClick={() =>
                        handleAddMemberToMap(
                          member,
                          45 + (Math.random() * 10 - 5),
                          45 + (Math.random() * 10 - 5),
                          matchedPoke
                        )
                      }
                      title={`${member.name} (@${member.nickname}) · Pokémon: ${matchedPoke?.name || "Padrão"} · Arraste ou clique para adicionar à prancheta`}
                    >
                      <div className="member-card-top">
                        <div className="member-card-avatar">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} />
                          ) : (
                            <span className="member-avatar-initials">
                              {member.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="member-card-info">
                          <span className="member-card-fullname" title={member.name}>
                            {member.name}
                          </span>
                          <span className="member-card-nickname">
                            @{member.nickname}
                          </span>
                        </div>
                      </div>

                      <div className="member-card-badges">
                        <span className={`member-role-badge ${member.status === "Titular" ? "titular" : "reserva"}`}>
                          {member.status || "Titular"}
                        </span>
                        {member.preferredLane && (
                          <span className="member-lane-badge">
                            {member.preferredLane}
                          </span>
                        )}
                      </div>

                      <div className="member-card-pokemon-preview">
                        <img
                          src={matchedPoke?.sprite || "https://unite.pokemon.com/images/pokemon/charizard/roster/roster-charizard.png"}
                          alt={matchedPoke?.name}
                          className="member-poke-sprite"
                        />
                        <span className="member-poke-name">
                          {matchedPoke?.name || "Charizard"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* MODO 2: CATÁLOGO DE POKÉMON COMPLETO */
          <>
            <div className="deck-header-bar">
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
                  <button
                    className="deck-clear-search"
                    onClick={() => setSearch("")}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Pílulas de Filtro de Battle Type */}
              <div className="deck-role-pills">
                {[
                  "TODOS",
                  "ATACANTE",
                  "VELOZ",
                  "VERSÁTIL",
                  "DEFENSOR",
                  "SUPORTE",
                ].map((role) => (
                  <button
                    key={role}
                    className={`deck-role-pill ${roleFilter === role ? "active" : ""}`}
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
                    onClick={() =>
                      handleAddPokemonToMap(
                        pokemon,
                        45 + Math.random() * 10,
                        45 + Math.random() * 10,
                      )
                    }
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
          </>
        )}
      </div>

      {/* MODAL SIMPLES PARA DIGITAR TEXTO NO MAPA */}
      {textModal.open && (
        <div
          className="text-prompt-overlay"
          onClick={() => setTextModal({ open: false, x: 0, y: 0, text: "" })}
        >
          <div
            className="text-prompt-modal glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <Type size={16} /> Adicionar Anotação Tática
            </div>
            <input
              type="text"
              autoFocus
              placeholder="Ex: Focar Rayquaza, Gank 8:50, Defender Tier 2..."
              value={textModal.text}
              onChange={(e) =>
                setTextModal((prev) => ({ ...prev, text: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleConfirmText()}
            />
            <div className="modal-actions">
              <button
                className="btn-secondary btn-sm"
                onClick={() =>
                  setTextModal({ open: false, x: 0, y: 0, text: "" })
                }
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

        /* PALCO PRINCIPAL SUPERIOR: TOOLBAR ESQUERDA + MAPA EXPANDIDO + ZOOM DOCK DIREITA */
        .tactical-top-stage-layout {
          display: grid;
          grid-template-columns: 56px 1fr 56px;
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

        .tool-icon-btn.active.pan-mode {
          background: #10B981;
          border-color: #34D399;
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.6);
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
          background: radial-gradient(circle at 50% 50%, #0d1527 0%, #050811 100%);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 560px;
          position: relative;
          user-select: none;
        }

        .tactical-center-viewport.pan-active {
          cursor: grab;
        }

        .tactical-center-viewport.panning,
        .tactical-center-viewport.panning * {
          cursor: grabbing !important;
        }

        /* BARRA LATERAL DIREITA: CONTROLES VERTICAIS DE ZOOM ESTILO APPLE GLASS */
        .tactical-right-zoom-dock {
          background: rgba(10, 16, 32, 0.68);
          backdrop-filter: blur(28px) saturate(190%);
          -webkit-backdrop-filter: blur(28px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 20px;
          padding: 12px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          box-shadow: 
            0 20px 48px rgba(0, 0, 0, 0.5),
            inset 0 1px 1.5px rgba(255, 255, 255, 0.22);
        }

        .zoom-dock-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 100%;
        }

        .zoom-dock-btn {
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
          transition: all 0.15s ease;
        }

        .zoom-dock-btn:hover {
          color: #FFFFFF;
          background: rgba(11, 95, 255, 0.25);
          border-color: #38BDF8;
          transform: scale(1.06);
        }

        .zoom-dock-btn.reset:hover {
          background: rgba(16, 185, 129, 0.25);
          border-color: #34D399;
          color: #34D399;
        }

        .zoom-dock-value {
          background: rgba(11, 95, 255, 0.12);
          border: 1px solid rgba(11, 95, 255, 0.35);
          border-radius: 10px;
          padding: 6px 4px;
          width: 42px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .zoom-dock-value:hover {
          background: rgba(11, 95, 255, 0.25);
          border-color: #38BDF8;
          transform: scale(1.05);
        }

        .zoom-dock-number {
          font-size: 0.76rem;
          font-weight: 900;
          font-family: monospace;
          color: #38BDF8;
          line-height: 1;
        }

        .zoom-dock-unit {
          font-size: 0.58rem;
          font-weight: 700;
          color: #94A3B8;
          line-height: 1;
          margin-top: 2px;
        }

        .zoom-dock-divider {
          width: 32px;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        .zoom-dock-presets {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          width: 100%;
        }

        .dock-section-label {
          font-size: 0.58rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #64748B;
          margin-bottom: 2px;
        }

        .zoom-preset-vertical-btn {
          width: 42px;
          height: 26px;
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94A3B8;
          font-size: 0.68rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .zoom-preset-vertical-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
        }

        .zoom-preset-vertical-btn.active {
          background: #0B5FFF;
          border-color: #38BDF8;
          color: #FFFFFF;
          box-shadow: 0 0 10px rgba(11, 95, 255, 0.55);
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
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .map-interactive-stage.drag-over {
          box-shadow: 0 0 0 3px #F59E0B, 0 0 35px rgba(245, 158, 11, 0.5) !important;
        }

        .map-drop-target-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(245, 158, 11, 0.1);
          pointer-events: none;
          z-index: 45;
        }

        .drop-target-badge {
          background: rgba(10, 15, 29, 0.94);
          border: 2px dashed #F59E0B;
          border-radius: 9999px;
          padding: 9px 24px;
          color: #F59E0B;
          font-size: 0.82rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
          animation: pulseGlow 1.5s infinite alternate ease-in-out;
        }

        @keyframes pulseGlow {
          0% { transform: scale(0.97); box-shadow: 0 0 12px rgba(245, 158, 11, 0.3); }
          100% { transform: scale(1.03); box-shadow: 0 0 24px rgba(245, 158, 11, 0.7); }
        }

        /* HUD ZOOM SUPERIOR ESQUERDO */
        .map-hud-zoom-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(10, 16, 32, 0.78);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 8px;
          padding: 5px 12px;
          font-size: 0.68rem;
          font-weight: 800;
          color: #94A3B8;
          letter-spacing: 0.05em;
          pointer-events: none;
          z-index: 35;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
        }

        .hud-zoom-val {
          color: #38BDF8;
          font-family: monospace;
          font-weight: 900;
        }

        .hud-zoom-sep {
          opacity: 0.5;
        }

        .hud-zoom-hint {
          color: #E2E8F0;
        }

        /* CONTROLE DE ESPESSURA DE TRAÇO */
        .tools-stroke-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          width: 100%;
        }

        .stroke-preview-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 24px;
        }

        .stroke-preview-dot {
          border-radius: 50%;
          display: inline-block;
          transition: all 0.15s ease;
        }

        .stroke-preview-val {
          font-size: 0.65rem;
          font-weight: 800;
          font-family: monospace;
          color: #94A3B8;
        }

        .stroke-preset-pills {
          display: flex;
          gap: 3px;
          width: 100%;
          justify-content: center;
        }

        .stroke-pill-btn {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94A3B8;
          font-size: 0.62rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: all 0.12s;
        }

        .stroke-pill-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
        }

        .stroke-pill-btn.active {
          background: #0B5FFF;
          border-color: #38BDF8;
          color: #FFFFFF;
          box-shadow: 0 0 8px rgba(11, 95, 255, 0.6);
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

        /* TOKENS DE POKÉMON NO MAPA COM ESCALA ADAPTATIVA */
        .map-pokemon-token {
          position: absolute;
          transform: translate(-50%, -60%) scale(var(--token-scale, 1));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          z-index: 25;
          transition: transform 0.12s ease;
          user-select: none;
        }

        .map-pokemon-token:hover {
          transform: translate(-50%, -50%) scale(calc(var(--token-scale, 1) * 1.15));
          z-index: 35;
        }

        .map-pokemon-token.is-dragging {
          cursor: grabbing;
          transform: translate(-50%, -50%) scale(calc(var(--token-scale, 1) * 1.22));
          z-index: 45;
        }

        .token-avatar-ring {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: rgba(10, 15, 29, 0.94);
          border: 2px solid #0B5FFF;
          background: #0B5FFF;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 0 10px rgba(11, 95, 255, 0.8), inset 0 0 4px rgba(0, 0, 0, 0.6);
          transition: all 0.15s ease;
        }

        .map-pokemon-token.team-orange .token-avatar-ring {
          border-color: #F97316;
          background: #F97316;
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.8), inset 0 0 4px rgba(0, 0, 0, 0.6);
        }

        .token-sprite-img {
          width: 35px;
          height: 35px;
          object-fit: contain;
          filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.6));
          pointer-events: none;
        }

        /* TEXTOS ADICIONADOS COM ESCALA ADAPTATIVA */
        .map-tactical-label {
          position: absolute;
          transform: translate(-50%, -50%) scale(var(--label-scale, 1));
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

        /* ESTILOS: ATLETA VINCULADO AO TOKEN TÁTICO NO MAPA */
        .token-member-avatar-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #0B5FFF;
          border: 1.5px solid #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);
          z-index: 3;
        }

        .token-member-badge-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .token-member-avatar-badge span {
          font-size: 0.5rem;
          font-weight: 900;
          color: #FFFFFF;
          line-height: 1;
        }

        .token-member-nametag {
          position: absolute;
          bottom: -18px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(10, 15, 26, 0.92);
          border: 1px solid rgba(56, 189, 248, 0.35);
          backdrop-filter: blur(4px);
          padding: 1px 5px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
          pointer-events: none;
        }

        .token-member-name-text {
          font-size: 0.55rem;
          font-weight: 800;
          color: #38BDF8;
          letter-spacing: 0.02em;
        }

        .token-member-lane-tag {
          font-size: 0.48rem;
          font-weight: 700;
          color: #F8FAFC;
          background: rgba(255, 255, 255, 0.12);
          padding: 0 3px;
          border-radius: 2px;
          text-transform: uppercase;
        }

        /* ESTILOS: BARRA DE ABAS DO DECK INFERIOR (ELENCO VS POKÉMONS) */
        .deck-mode-tabs-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-wrap: wrap;
        }

        .deck-mode-pills {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .deck-mode-tab-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.72rem;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94A3B8;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .deck-mode-tab-btn:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .deck-mode-tab-btn.active {
          background: linear-gradient(135deg, rgba(11, 95, 255, 0.9) 0%, rgba(0, 71, 214, 0.95) 100%);
          border-color: rgba(56, 189, 248, 0.5);
          color: #FFFFFF;
          box-shadow: 0 2px 10px rgba(11, 95, 255, 0.4);
        }

        .deck-mode-count {
          background: rgba(0, 0, 0, 0.35);
          padding: 1px 6px;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 800;
        }

        .deck-members-quick-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .deck-auto-deploy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 8px;
          background: linear-gradient(135deg, #0B5FFF 0%, #0284C7 100%);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
          font-size: 0.72rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(11, 95, 255, 0.35);
          transition: all 0.18s ease;
        }

        .deck-auto-deploy-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(11, 95, 255, 0.55);
          border-color: #38BDF8;
        }

        /* GRADE DE ATLETAS DO ELENCO */
        .deck-members-container {
          width: 100%;
          padding: 4px 0 8px;
        }

        .deck-empty-members {
          padding: 30px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: #94A3B8;
          font-size: 0.8rem;
        }

        .deck-members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 10px;
        }

        .deck-member-card {
          background: rgba(13, 21, 38, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          border-radius: 10px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: grab;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        }

        .deck-member-card:hover {
          transform: translateY(-3px);
          border-color: #38BDF8;
          box-shadow: 0 8px 20px rgba(11, 95, 255, 0.25);
          background: rgba(18, 30, 56, 0.9);
        }

        .member-card-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .member-card-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0B5FFF 0%, #1D4ED8 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .member-card-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .member-avatar-initials {
          font-size: 0.65rem;
          font-weight: 800;
          color: #FFFFFF;
        }

        .member-card-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .member-card-fullname {
          font-size: 0.75rem;
          font-weight: 800;
          color: #F8FAFC;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .member-card-nickname {
          font-size: 0.65rem;
          font-weight: 700;
          color: #38BDF8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .member-card-badges {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }

        .member-role-badge {
          font-size: 0.58rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .member-role-badge.titular {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #34D399;
        }

        .member-role-badge.reserva {
          background: rgba(245, 158, 11, 0.2);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: #FBBF24;
        }

        .member-lane-badge {
          font-size: 0.58rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94A3B8;
          text-transform: uppercase;
        }

        .member-card-pokemon-preview {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          padding: 4px 6px;
        }

        .member-poke-sprite {
          width: 22px;
          height: 22px;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
        }

        .member-poke-name {
          font-size: 0.65rem;
          font-weight: 700;
          color: #CBD5E1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
};
