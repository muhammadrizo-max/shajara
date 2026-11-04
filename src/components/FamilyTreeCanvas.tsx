import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { AuthUser, Person } from '../types';
import { PersonCard } from './PersonCard';
import { getChildren, findRootAncestorId } from '../utils/kinship';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move,
  Compass,
  X,
  UserCheck,
  FoldVertical,
  UnfoldVertical,
  Maximize2,
  Plus,
  Bot,
  UserPlus,
  Sparkles,
  Heart
} from 'lucide-react';
import { FamilyTreeLogo } from './FamilyTreeLogo';

interface FamilyTreeCanvasProps {
  people: Record<string, Person>;
  rootId: string;
  meId: string;
  activePerspectiveId?: string;
  currentUser?: AuthUser | null;
  isLoading?: boolean;
  searchQuery: string;
  selectedPersonId: string | null;
  onSelectPerson: (person: Person) => void;
  onEditPerson: (person: Person) => void;
  onAddChild: (parent: Person) => void;
  onAddParent?: (child: Person) => void;
  onOpenAddRelative?: (person: Person) => void;
  onSetTemporaryPerspective: (personId: string) => void;
  onClearTemporaryPerspective: () => void;
  onUnauthorizedEditAttempt: () => void;
  onOpenAddRoot?: () => void;
  onOpenLoginModal?: () => void;
  onOpenTelegramBotModal?: () => void;
}

// ─── Sky Canvas Component ─────────────────────────────────────────────────────
function getRealMoonPhase(): number {
  const knownNewMoon = new Date(Date.UTC(2026, 0, 18, 11, 52, 0));
  const diffDays = (Date.now() - knownNewMoon.getTime()) / 86400000;
  const synodicMonth = 29.53058770576;
  let phase = (diffDays % synodicMonth) / synodicMonth;
  if (phase < 0) phase += 1;
  return phase;
}

const SkyCanvas: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef<{
    stars: { x: number; y: number; r: number; alpha: number; speed: number; vx: number }[];
    clouds: { x: number; y: number; scale: number; speed: number; opacity: number }[];
    shooting: { x: number; y: number; len: number; speed: number; alpha: number }[];
    w: number; h: number;
  }>({ stars: [], clouds: [], shooting: [], w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const s = stateRef.current;

    function init() {
      s.w = canvas!.width = canvas!.offsetWidth;
      s.h = canvas!.height = canvas!.offsetHeight;
      const count = Math.floor((s.w * s.h) / 2500);
      s.stars = Array.from({ length: count }, () => ({
        x: Math.random() * s.w, y: Math.random() * s.h * 0.85,
        r: Math.random() * 1.4 + 0.3, alpha: Math.random(),
        speed: Math.random() * 0.012 + 0.004,
        vx: Math.random() * 0.12 + 0.04,
      }));
      s.clouds = Array.from({ length: 6 }, () => ({
        x: Math.random() * s.w, y: Math.random() * s.h * 0.4,
        scale: Math.random() * 0.8 + 0.6, speed: Math.random() * 0.15 + 0.05,
        opacity: Math.random() * 0.35 + 0.25,
      }));
    }

    function drawMoon(dark: boolean) {
      const mx = s.w * 0.75, my = s.h * 0.2;
      const r = Math.min(s.w, s.h) * 0.045 + 14;
      const phase = getRealMoonPhase();
      const fullness = 1 - Math.abs(phase - 0.5) * 2;

      if (dark) {
        const gr = r * (2.2 + fullness * 2.0);
        const glow = ctx.createRadialGradient(mx, my, r * 0.8, mx, my, gr);
        glow.addColorStop(0, `rgba(215,230,255,${0.06 + fullness * 0.14})`);
        glow.addColorStop(0.5, `rgba(180,205,245,${(0.06 + fullness * 0.14) * 0.4})`);
        glow.addColorStop(1, 'rgba(150,180,220,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(mx, my, gr, 0, Math.PI * 2); ctx.fill();
      }

      ctx.save();
      ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = dark ? '#e2ebf8' : '#f0f4f8';
      ctx.fillRect(mx - r, my - r, r * 2, r * 2);
      ctx.fillStyle = dark ? 'rgba(170,185,205,0.25)' : 'rgba(180,190,200,0.15)';
      ctx.beginPath();
      ctx.arc(mx - r * 0.3, my - r * 0.2, r * 0.22, 0, Math.PI * 2);
      ctx.arc(mx + r * 0.2, my + r * 0.3, r * 0.18, 0, Math.PI * 2);
      ctx.arc(mx + r * 0.1, my - r * 0.4, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      const shadow = (phase - 0.5) * 2;
      ctx.fillStyle = dark ? '#0a1128' : '#7dd3fc';
      ctx.beginPath();
      if (phase < 0.5) {
        ctx.arc(mx, my, r, Math.PI * 0.5, Math.PI * 1.5, false);
        ctx.ellipse(mx, my, r * Math.abs(shadow), r, 0, Math.PI * 1.5, Math.PI * 0.5, phase > 0.25);
      } else {
        ctx.arc(mx, my, r, Math.PI * 0.5, Math.PI * 1.5, true);
        ctx.ellipse(mx, my, r * Math.abs(shadow), r, 0, Math.PI * 1.5, Math.PI * 0.5, phase < 0.75);
      }
      ctx.fill();
      ctx.restore();
    }

    function frame() {
      const dark = document.documentElement.classList.contains('dark');
      ctx.clearRect(0, 0, s.w, s.h);

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, s.h);
      if (dark) {
        sky.addColorStop(0, '#040814');
        sky.addColorStop(0.5, '#0a1128');
        sky.addColorStop(1, '#101c3d');
      } else {
        sky.addColorStop(0, '#38bdf8');
        sky.addColorStop(0.5, '#7dd3fc');
        sky.addColorStop(1, '#bae6fd');
      }
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, s.w, s.h);

      if (dark) {
        // Stars drifting slowly across the night sky (like clouds do in daylight)
        for (const star of s.stars) {
          star.alpha += star.speed;
          if (star.alpha > 1 || star.alpha < 0.2) star.speed = -star.speed;

          // Celestial drift
          star.x += star.vx;
          if (star.x > s.w + 10) {
            star.x = -10;
            star.y = Math.random() * s.h * 0.85;
          }

          ctx.fillStyle = `rgba(255,255,255,${Math.max(0, star.alpha)})`;
          ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill();
        }
        // Shooting stars
        if (Math.random() < 0.012) {
          s.shooting.push({ x: Math.random() * s.w, y: Math.random() * s.h * 0.4, len: Math.random() * 80 + 40, speed: Math.random() * 8 + 4, alpha: 1 });
        }
        for (let i = s.shooting.length - 1; i >= 0; i--) {
          const ss = s.shooting[i];
          ss.x -= ss.speed; ss.y += ss.speed * 0.5; ss.alpha -= 0.02;
          if (ss.alpha <= 0) { s.shooting.splice(i, 1); continue; }
          ctx.strokeStyle = `rgba(255,255,255,${ss.alpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(ss.x, ss.y); ctx.lineTo(ss.x + ss.len, ss.y - ss.len * 0.5); ctx.stroke();
        }
      } else {
        // Sun
        const sx = s.w * 0.8, sy = s.h * 0.2, sr = Math.min(s.w, s.h) * 0.05 + 10;
        const sunGlow = ctx.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 3.5);
        sunGlow.addColorStop(0, 'rgba(253,224,71,0.6)');
        sunGlow.addColorStop(0.4, 'rgba(251,146,60,0.2)');
        sunGlow.addColorStop(1, 'rgba(251,146,60,0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath(); ctx.arc(sx, sy, sr * 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a'; ctx.shadowColor = '#fde047'; ctx.shadowBlur = 25; ctx.fill(); ctx.shadowBlur = 0;
        // Clouds
        for (const cloud of s.clouds) {
          cloud.x += cloud.speed;
          if (cloud.x - 150 > s.w) cloud.x = -150;
          ctx.fillStyle = `rgba(255,255,255,${cloud.opacity})`;
          ctx.beginPath();
          const cx = cloud.x, cy = cloud.y, sc = cloud.scale;
          ctx.arc(cx, cy, 30 * sc, 0, Math.PI * 2);
          ctx.arc(cx + 25 * sc, cy - 15 * sc, 35 * sc, 0, Math.PI * 2);
          ctx.arc(cx + 60 * sc, cy, 25 * sc, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (dark) drawMoon(dark);
      animRef.current = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => { init(); });
    ro.observe(canvas);
    init();
    animRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────

interface CardBox {
  id: string;
  cx: number;
  cy: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

interface KinshipLine {
  id: string;
  type: 'parent-child' | 'couple';
  pathD: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  midX?: number;
  midY?: number;
}

function generateStretchyKinshipPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  isBotanical: boolean,
  cardRects: Array<{ id: string; left: number; right: number; top: number; bottom: number }>,
  parentId: string,
  childId: string
): string {
  const dy = endY - startY;

  // Vertical direction: in botanical mode child is above parent (dy < 0), in classic child is below (dy > 0)
  const isUpward = dy < 0;
  const absDy = Math.abs(dy);
  const curveDist = Math.max(35, absDy * 0.45);

  let cy1 = startY + (isUpward ? -curveDist : curveDist);
  let cy2 = endY - (isUpward ? -curveDist : curveDist);
  let cx1 = startX;
  let cx2 = endX;

  // Obstacle avoidance: if any other card sits between start and end
  const minY = Math.min(startY, endY);
  const maxY = Math.max(startY, endY);
  const midX = (startX + endX) / 2;

  for (const rect of cardRects) {
    if (rect.id === parentId || rect.id === childId) continue;
    // Check if obstacle's vertical bounds intersect the span between parent and child
    if (rect.bottom > minY + 15 && rect.top < maxY - 15) {
      // Check if line passes horizontally through or near the obstacle card
      const margin = 20;
      if (midX >= rect.left - margin && midX <= rect.right + margin) {
        // Curve around the obstacle gracefully!
        const cardCenter = (rect.left + rect.right) / 2;
        const deflectDirection = midX < cardCenter ? -1 : 1;
        const deflectDist = 85;
        cx1 += deflectDist * deflectDirection;
        cx2 += deflectDist * deflectDirection;
        break;
      }
    }
  }

  return `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
}

export const FamilyTreeCanvas: React.FC<FamilyTreeCanvasProps> = ({
  people,
  rootId,
  meId,
  activePerspectiveId,
  currentUser,
  isLoading,
  searchQuery,
  selectedPersonId,
  onSelectPerson,
  onEditPerson,
  onAddChild,
  onAddParent,
  onOpenAddRelative,
  onSetTemporaryPerspective,
  onClearTemporaryPerspective,
  onUnauthorizedEditAttempt,
  onOpenAddRoot,
  onOpenLoginModal,
  onOpenTelegramBotModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const treeContentRef = useRef<HTMLDivElement>(null);

  // Default Zoom: 60% (0.60) — foydalanuvchi talabi bo'yicha aniq 60%
  const [zoom, setZoom] = useState<number>(0.60);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 80, y: 50 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [showLifelines, setShowLifelines] = useState<boolean>(true);
  const [kinshipLines, setKinshipLines] = useState<KinshipLine[]>([]);

  // Daraxt yo'nalishi: 'botanical' (ildizlar pastda, avlodlar tepaga qarab o'sadi) yoki 'classic' (ota-bobolar tepada)
  const [treeOrientation, setTreeOrientation] = useState<'botanical' | 'classic'>(() => {
    try {
      const saved = localStorage.getItem('shajarachi_tree_orientation');
      return (saved === 'classic' || saved === 'botanical') ? saved : 'classic';
    } catch {
      return 'classic';
    }
  });

  // Daraxt egasi tomonidan surilgan kartochkalar koordinatalari (Desktop & Mobile Drag)
  const [cardOffsets, setCardOffsets] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const saved = localStorage.getItem('shajarachi_card_offsets');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Kesh qilingan kartochkalar boshlang'ich o'lchamlari (Zoom va Drag paytida 120 FPS ta'minlash uchun)
  const cardBasePositionsRef = useRef<Record<string, CardBox>>({});

  const isOwner = !currentUser || currentUser.role === 'owner' || currentUser.isGuest;

  const getOffsetStyle = (id: string): React.CSSProperties => {
    const off = cardOffsets[id];
    if (!off) return {};
    return {
      transform: `translate(${off.x}px, ${off.y}px)`,
      zIndex: 20,
    };
  };

  // Desktop Mouse Drag on Card
  const handleStartDragCard = (personId: string, e: React.MouseEvent) => {
    if (!isOwner) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialOffset = cardOffsets[personId] || { x: 0, y: 0 };
    let hasMoved = false;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      if (Math.hypot(dx, dy) > 3) {
        hasMoved = true;
        setCardOffsets((prev) => {
          const updated = {
            ...prev,
            [personId]: {
              x: Math.round(initialOffset.x + dx),
              y: Math.round(initialOffset.y + dy),
            },
          };
          return updated;
        });
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (!hasMoved) {
        const p = people[personId];
        if (p) onSelectPerson(p);
      } else {
        try {
          localStorage.setItem('shajarachi_card_offsets', JSON.stringify(cardOffsets));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Mobile Touch Drag on Card
  const handleStartTouchDragCard = (personId: string, e: React.TouchEvent) => {
    if (!isOwner || e.touches.length !== 1) return;
    e.stopPropagation();
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const initialOffset = cardOffsets[personId] || { x: 0, y: 0 };
    let hasMoved = false;

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length !== 1) return;
      const t = moveEvent.touches[0];
      const dx = (t.clientX - startX) / zoom;
      const dy = (t.clientY - startY) / zoom;
      if (Math.hypot(dx, dy) > 4) {
        hasMoved = true;
        moveEvent.preventDefault();
        setCardOffsets((prev) => ({
          ...prev,
          [personId]: {
            x: Math.round(initialOffset.x + dx),
            y: Math.round(initialOffset.y + dy),
          },
        }));
      }
    };

    const onTouchEnd = () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (!hasMoved) {
        const p = people[personId];
        if (p) onSelectPerson(p);
      } else {
        try {
          localStorage.setItem('shajarachi_card_offsets', JSON.stringify(cardOffsets));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
  };

  const handleResetOffsets = () => {
    setCardOffsets({});
    localStorage.removeItem('shajarachi_card_offsets');
  };

  const toggleOrientation = () => {
    setTreeOrientation((prev) => {
      const next = prev === 'botanical' ? 'classic' : 'botanical';
      try {
        localStorage.setItem('shajarachi_tree_orientation', next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Touch handling state refs for smooth multi-touch gestures (pinch-to-zoom & touch drag)
  const touchState = useRef<{
    initialDist: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    initialMidpoint: { x: number; y: number };
    isPinching: boolean;
    touchStartPan: { x: number; y: number };
    touchStartPos: { x: number; y: number };
    lastTapTime: number;
  }>({
    initialDist: 0,
    initialZoom: 0.60,
    initialPan: { x: 80, y: 50 },
    initialMidpoint: { x: 0, y: 0 },
    isPinching: false,
    touchStartPan: { x: 80, y: 50 },
    touchStartPos: { x: 0, y: 0 },
    lastTapTime: 0,
  });

  // Center tree on user or selected node
  const centerOnPerson = useCallback((targetId: string) => {
    const el = document.getElementById(`person-card-${targetId}`);
    if (el && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      
      const currentCenterX = elRect.left + elRect.width / 2;
      const currentCenterY = elRect.top + elRect.height / 2;
      const viewportCenterX = containerRect.left + containerRect.width / 2;
      const viewportCenterY = containerRect.top + containerRect.height / 2;

      setPan((prev) => ({
        x: prev.x + (viewportCenterX - currentCenterX),
        y: prev.y + (viewportCenterY - currentCenterY),
      }));
    }
  }, []);

  useEffect(() => {
    // Initial centering delay
    const timer = setTimeout(() => {
      const focusTarget = meId || rootId;
      if (focusTarget) {
        centerOnPerson(focusTarget);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [meId, centerOnPerson, rootId]);

  // Center-based zoom calculation (avoids drifting to top-left)
  const applyZoom = (newZoomRaw: number, clientX?: number, clientY?: number) => {
    const newZoom = Math.min(Math.max(newZoomRaw, 0.10), 2.5);
    if (!containerRef.current) {
      setZoom(newZoom);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const originX = clientX !== undefined ? clientX - rect.left : rect.width / 2;
    const originY = clientY !== undefined ? clientY - rect.top : rect.height / 2;

    setPan((prevPan) => {
      const scaleRatio = newZoom / zoom;
      return {
        x: originX - (originX - prevPan.x) * scaleRatio,
        y: originY - (originY - prevPan.y) * scaleRatio,
      };
    });

    setZoom(newZoom);
  };

  // Mouse wheel zoom relative to cursor position
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.07 : 0.93;
    applyZoom(zoom * zoomFactor, e.clientX, e.clientY);
  };

  // Mouse drag pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-control')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // --- Mobile Touch Gestures (Smooth 1-finger pan & 2-finger Pinch-to-Zoom) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.interactive-control')) return;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();
      
      // Double-tap detection to zoom in/reset
      if (now - touchState.current.lastTapTime < 300) {
        if (zoom < 1.1) {
          applyZoom(1.2, touch.clientX, touch.clientY);
        } else {
          applyZoom(0.85, touch.clientX, touch.clientY);
        }
      }
      touchState.current.lastTapTime = now;

      touchState.current.isPinching = false;
      touchState.current.touchStartPan = { ...pan };
      touchState.current.touchStartPos = { x: touch.clientX, y: touch.clientY };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      // 2 fingers: Pinch-to-zoom start
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      touchState.current.isPinching = true;
      touchState.current.initialDist = dist;
      touchState.current.initialZoom = zoom;
      touchState.current.initialPan = { ...pan };
      touchState.current.initialMidpoint = { x: midX, y: midY };
      setIsDragging(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchState.current.isPinching && e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scale = dist / (touchState.current.initialDist || 1);
      const targetZoom = Math.min(Math.max(touchState.current.initialZoom * (scale * 1.25), 0.10), 2.5);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const originX = touchState.current.initialMidpoint.x - rect.left;
        const originY = touchState.current.initialMidpoint.y - rect.top;
        const scaleRatio = targetZoom / touchState.current.initialZoom;

        setPan({
          x: originX - (originX - touchState.current.initialPan.x) * scaleRatio,
          y: originY - (originY - touchState.current.initialPan.y) * scaleRatio,
        });
        setZoom(targetZoom);
      }
    } else if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchState.current.touchStartPos.x;
      const deltaY = touch.clientY - touchState.current.touchStartPos.y;

      setPan({
        x: touchState.current.touchStartPan.x + deltaX,
        y: touchState.current.touchStartPan.y + deltaY,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchState.current.isPinching = false;
  };

  const toggleExpand = (personId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  };

  // All parent nodes in the tree
  const allParentIds = useMemo(() => {
    return (Object.values(people) as Person[])
      .filter((p) => getChildren(p.id, people).length > 0)
      .map((p) => p.id);
  }, [people]);

  // Dynamically resolve all top root ancestors so that:
  // 1. Any added parent or ancestor above meId is automatically at the top of the tree.
  // 2. All branches/trees in people are rendered and never hidden.
  // 3. Spouses whose partner is already in an ancestor branch are NOT rendered as orphan roots!
  const displayRoots = useMemo(() => {
    const allPeople = Object.values(people) as Person[];
    if (allPeople.length === 0) return [];

    // Find all nodes that have no parent inside the current people dataset
    const roots = allPeople
      .filter((p) => {
        // If p has a parent or mother in tree, p is not a root
        if (p.parentId && people[p.parentId]) return false;
        if (p.motherId && people[p.motherId]) return false;

        // If p has a spouse:
        const spouseId = p.spouseId || allPeople.find((other) => other.spouseId === p.id)?.id;
        const spouse = spouseId ? people[spouseId] : null;

        if (spouse) {
          // If spouse has a parent or mother in tree, spouse is rendered in that ancestor branch,
          // so p will be rendered beside spouse in the couple unit, NOT as an orphan root!
          if ((spouse.parentId && people[spouse.parentId]) || (spouse.motherId && people[spouse.motherId])) {
            return false;
          }
          // If neither spouse has parents in tree, only choose one as root node (e.g. male or smaller id)
          if (p.gender === 'female' && spouse.gender === 'male') {
            return false;
          }
          if (p.gender === spouse.gender && p.id > spouse.id) {
            return false;
          }
        }

        return true;
      })
      .map((p) => p.id);

    if (roots.length === 0) {
      const fallback = (rootId && people[rootId]) ? rootId : (meId && people[meId]) ? meId : allPeople[0].id;
      return [fallback];
    }

    const primaryTarget = (meId && people[meId]) ? meId : (rootId && people[rootId]) ? rootId : roots[0];
    const meRoot = findRootAncestorId(primaryTarget, people);

    const orderedRoots = [
      ...(roots.includes(meRoot) ? [meRoot] : []),
      ...roots.filter((r) => r !== meRoot)
    ];
    return Array.from(new Set(orderedRoots));
  }, [people, rootId, meId]);

  // Is everything open or closed
  const isAllExpanded = collapsedIds.size === 0;

  const handleToggleAllBranches = () => {
    if (isAllExpanded) {
      setCollapsedIds(new Set(allParentIds));
    } else {
      setCollapsedIds(new Set());
    }
  };

  const resetView = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const originX = rect.width / 2;
      const originY = rect.height / 2;
      const defaultZoom = 0.60;
      
      setPan((prevPan) => {
        const scaleRatio = defaultZoom / zoom;
        return {
          x: originX - (originX - prevPan.x) * scaleRatio,
          y: originY - (originY - prevPan.y) * scaleRatio,
        };
      });
      setZoom(defaultZoom);
    } else {
      setZoom(0.60);
      setPan({ x: 80, y: 50 });
    }
  };

  // Find matching nodes for search
  const isMatch = (person: Person) => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase();
    return (
      person.name.toLowerCase().includes(query) ||
      (person.titleOrNickname && person.titleOrNickname.toLowerCase().includes(query)) ||
      (person.occupation && person.occupation.toLowerCase().includes(query))
    );
  };

  // Active temporary perspective person
  // Helper to get card bounding box (cached unscaled base + current dragging offset)
  const getCardBox = useCallback((id: string, offsets: Record<string, { x: number; y: number }>): CardBox | null => {
    const base = cardBasePositionsRef.current[id];
    if (base) {
      const off = offsets[id] || { x: 0, y: 0 };
      const left = base.left + off.x;
      const top = base.top + off.y;
      return {
        id,
        left,
        right: left + base.width,
        top,
        bottom: top + base.height,
        cx: left + base.width / 2,
        cy: top + base.height / 2,
        width: base.width,
        height: base.height,
      };
    }

    // Fallback: If not yet measured, query DOM once
    const el = document.getElementById(`person-card-${id}`);
    const container = treeContentRef.current;
    if (el && container) {
      const r = el.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      if (cRect.width > 0 && zoom > 0) {
        const off = offsets[id] || { x: 0, y: 0 };
        const left = (r.left - cRect.left) / zoom;
        const top = (r.top - cRect.top) / zoom;
        const width = r.width / zoom;
        const height = r.height / zoom;
        return {
          id,
          left,
          right: left + width,
          top,
          bottom: top + height,
          cx: left + width / 2,
          cy: top + height / 2,
          width,
          height,
        };
      }
    }
    return null;
  }, [zoom]);

  // Purely mathematical recalculation of kinship lines (runs in ~0.05ms, ZERO DOM queries during drag/zoom)
  const recalculateLines = useCallback((offsets: Record<string, { x: number; y: number }>) => {
    const allPeople = Object.values(people) as Person[];
    const lines: KinshipLine[] = [];
    const isBotanical = treeOrientation === 'botanical';

    // Barcha kartochkalarning bounding box'lari (to'siqlardan aylanib o'tish uchun)
    const cardRects: Array<{ id: string; left: number; right: number; top: number; bottom: number }> = [];
    allPeople.forEach((p) => {
      const box = getCardBox(p.id, offsets);
      if (box) cardRects.push(box);
    });

    const processedPairs = new Set<string>();
    const processedCouples = new Set<string>();

    allPeople.forEach((person) => {
      const pBox = getCardBox(person.id, offsets);
      if (!pBox) return;

      // Turmush o'rtog'ini tekshirish
      const spouseId = person.spouseId || allPeople.find((o) => o.spouseId === person.id)?.id;
      const sBox = spouseId ? getCardBox(spouseId, offsets) : null;

      // Agar er-xotindan biri surilgan bo'lsa, o'rtalaridagi elastik rishtani SVG da ko'rsatish
      if (spouseId && sBox) {
        const coupleKey = [person.id, spouseId].sort().join('--');
        if (!processedCouples.has(coupleKey)) {
          processedCouples.add(coupleKey);
          const hasOffset = Boolean(
            (offsets[person.id]?.x || offsets[person.id]?.y) ||
            (offsets[spouseId]?.x || offsets[spouseId]?.y)
          );
          if (hasOffset) {
            const isPLeft = pBox.cx < sBox.cx;
            const leftB = isPLeft ? pBox : sBox;
            const rightB = isPLeft ? sBox : pBox;
            const sX = leftB.right;
            const sY = leftB.cy;
            const eX = rightB.left;
            const eY = rightB.cy;
            const mX = (sX + eX) / 2;
            const mY = (sY + eY) / 2;
            lines.push({
              id: `couple-${coupleKey}`,
              type: 'couple',
              pathD: `M ${sX.toFixed(1)} ${sY.toFixed(1)} Q ${mX.toFixed(1)} ${mY.toFixed(1)}, ${eX.toFixed(1)} ${eY.toFixed(1)}`,
              startX: sX,
              startY: sY,
              endX: eX,
              endY: eY,
              midX: mX,
              midY: mY,
            });
          }
        }
      }

      // Bolalarini topish
      const children = allPeople.filter(
        (c) => c.parentId === person.id || c.motherId === person.id || (spouseId && (c.parentId === spouseId || c.motherId === spouseId))
      );
      if (children.length === 0) return;

      // Agar ota-ona shoxi yopilgan bo'lsa, chiziqlar chizilmaydi
      if (collapsedIds.has(person.id) || (spouseId && collapsedIds.has(spouseId))) return;

      let startX: number;
      let startY: number;

      if (sBox) {
        startX = (pBox.cx + sBox.cx) / 2;
        startY = isBotanical ? Math.min(pBox.top, sBox.top) : Math.max(pBox.bottom, sBox.bottom);
      } else {
        startX = pBox.cx;
        startY = isBotanical ? pBox.top : pBox.bottom;
      }

      // Bolalarning qutilarini olish
      const childBoxes = children.map((c) => ({ person: c, box: getCardBox(c.id, offsets) }));
      const validChildBoxes = childBoxes.filter((cb): cb is { person: Person; box: CardBox } => cb.box !== null);

      validChildBoxes.forEach(({ person: child, box: cBox }) => {
        const pairKey = `${person.id}-${child.id}`;
        if (processedPairs.has(pairKey)) return;
        processedPairs.add(pairKey);

        // Bolalar ustma-ust taxlanganligini aniqlash (bir xil X ustunida turgan aka-uka/opa-singillar)
        const siblingsWithSameX = validChildBoxes.filter(
          (other) => other.person.id !== child.id && Math.abs(other.box.cx - cBox.cx) < 25
        );
        const isVerticallyStacked = siblingsWithSameX.length > 0;

        let endX: number;
        let endY: number;
        let pathD: string;

        if (isVerticallyStacked) {
          // Ota-onaga eng yaqin turgan birinchi bola: to'g'ridan-to'g'ri bog'lanadi
          const isClosestToParent = isBotanical
            ? validChildBoxes.every((other) => other.box.cy <= cBox.cy)
            : validChildBoxes.every((other) => other.box.cy >= cBox.cy);

          if (isClosestToParent) {
            endX = cBox.cx;
            endY = isBotanical ? cBox.bottom : cBox.top;
            pathD = generateStretchyKinshipPath(startX, startY, endX, endY, isBotanical, cardRects, person.id, child.id);
          } else {
            // 4-rasm arxitekturasi: Ustma-ust kartochkalar uchun yon tarafdan kiruvchi silliq tarmoq chiziqlari
            if (startX >= cBox.cx - 10) {
              // Ota-ona yoki asosiy tanasi o'ngda: kartochkaning o'ng qirrasiga kiradi
              endX = cBox.right;
              endY = cBox.cy;
              const trunkX = Math.max(cBox.right + 25, Math.min(startX, cBox.right + 70));
              pathD = `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${trunkX.toFixed(1)} ${(startY + (endY - startY) * 0.35).toFixed(1)}, ${trunkX.toFixed(1)} ${endY.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
            } else {
              // Ota-ona yoki asosiy tanasi chapda: kartochkaning chap qirrasiga kiradi
              endX = cBox.left;
              endY = cBox.cy;
              const trunkX = Math.min(cBox.left - 25, Math.max(startX, cBox.left - 70));
              pathD = `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${trunkX.toFixed(1)} ${(startY + (endY - startY) * 0.35).toFixed(1)}, ${trunkX.toFixed(1)} ${endY.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
            }
          }
        } else {
          // Oddiy gorizontal shajaraviy bola
          endX = cBox.cx;
          endY = isBotanical ? cBox.bottom : cBox.top;
          pathD = generateStretchyKinshipPath(startX, startY, endX, endY, isBotanical, cardRects, person.id, child.id);
        }

        lines.push({
          id: pairKey,
          type: 'parent-child',
          pathD,
          startX,
          startY,
          endX,
          endY,
        });
      });
    });

    setKinshipLines(lines);
  }, [people, collapsedIds, treeOrientation, getCardBox]);

  // Faqat daraxt tuzilishi o'zgarganda DOM o'lchovlarini keshga olish
  const measureBasePositions = useCallback(() => {
    const container = treeContentRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return;

    const allPeople = Object.values(people) as Person[];
    const newPositions: Record<string, CardBox> = {};

    allPeople.forEach((p) => {
      const el = document.getElementById(`person-card-${p.id}`);
      if (el) {
        const r = el.getBoundingClientRect();
        const off = cardOffsets[p.id] || { x: 0, y: 0 };
        const left = (r.left - containerRect.left) / zoom - off.x;
        const top = (r.top - containerRect.top) / zoom - off.y;
        const width = r.width / zoom;
        const height = r.height / zoom;
        newPositions[p.id] = {
          id: p.id,
          left,
          right: left + width,
          top,
          bottom: top + height,
          cx: left + width / 2,
          cy: top + height / 2,
          width,
          height,
        };
      }
    });

    cardBasePositionsRef.current = newPositions;
    recalculateLines(cardOffsets);
  }, [people, zoom, cardOffsets, recalculateLines]);

  // Daraxt tuzilishi, shoxlar yoki ekran o'lchami o'zgarganda bir marta o'lchash
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      measureBasePositions();
    });
    const timer = setTimeout(measureBasePositions, 120);
    const onResize = () => {
      measureBasePositions();
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [people, collapsedIds, treeOrientation, measureBasePositions]);

  // Kartochkalar surilganda: faqat sof matematik hisob-kitob (DOM o'qilmaydi, 120 FPS)
  useEffect(() => {
    recalculateLines(cardOffsets);
  }, [cardOffsets, recalculateLines]);

  // Active temporary perspective person
  const activePerspectivePerson = activePerspectiveId ? people[activePerspectiveId] : null;

  // Set to avoid duplicate rendering of individuals or spouses in the same render pass
  const renderedPersonIds = useRef<Set<string>>(new Set());

  // Recursive Tree Node Renderer
  const renderTreeNode = (personId: string, level = 0): React.ReactNode => {
    const person = people[personId];
    if (!person) return null;
    if (renderedPersonIds.current.has(personId)) return null;

    renderedPersonIds.current.add(personId);
    const allPeopleList = Object.values(people) as Person[];

    // Identify spouse (either direction)
    const spouseId = person.spouseId || allPeopleList.find((other) => other.spouseId === person.id)?.id;
    const spouse = spouseId && people[spouseId] ? people[spouseId] : null;

    if (spouse) {
      renderedPersonIds.current.add(spouse.id);
    }

    // Determine left and right card placement:
    // User requirement: Otam and Onam side by side; the lineage from above lands directly onto the branch child's card.
    const isPersonBiologicalChild = Boolean(person.parentId && people[person.parentId]);
    const isSpouseBiologicalChild = Boolean(spouse?.parentId && people[spouse.parentId]);

    let leftPerson = person;
    let rightPerson = spouse;

    if (spouse) {
      if (isSpouseBiologicalChild && !isPersonBiologicalChild) {
        leftPerson = spouse;
        rightPerson = person;
      } else if (!isSpouseBiologicalChild && !isPersonBiologicalChild) {
        // Neither has parent: male on left
        if (person.gender === 'female' && spouse.gender === 'male') {
          leftPerson = spouse;
          rightPerson = person;
        }
      }
    }

    // Children belonging to this couple (or single parent)
    const childrenMap = new Map<string, Person>();
    allPeopleList.forEach((c) => {
      if (c.parentId === person.id || c.motherId === person.id) {
        childrenMap.set(c.id, c);
      }
      if (spouse && (c.parentId === spouse.id || c.motherId === spouse.id)) {
        childrenMap.set(c.id, c);
      }
    });
    const children = Array.from(childrenMap.values());
    const hasChildren = children.length > 0;
    const isExpanded = !collapsedIds.has(person.id) && (!spouse || !collapsedIds.has(spouse.id));

    // Bolalarni tahlil qilish: avlodlari yoki turmush o'rtog'i bo'lganlar (shoxchalar) va bo'lmaganlar (barglar)
    const hasDescendantsOrSpouse = (c: Person) => {
      const kids = getChildren(c.id, people);
      const spId = c.spouseId || allPeopleList.find((o) => o.spouseId === c.id)?.id;
      return kids.length > 0 || Boolean(spId);
    };

    const branchChildren = children.filter(hasDescendantsOrSpouse);
    const leafChildren = children.filter((c) => !hasDescendantsOrSpouse(c));

    // Barg bolalarni tartiblash: Men birinchi, so'ng tug'ilgan yili/ismi bo'yicha
    leafChildren.sort((a, b) => {
      if (a.id === meId) return -1;
      if (b.id === meId) return 1;
      if (a.birthYear && b.birthYear) return a.birthYear.localeCompare(b.birthYear);
      return a.name.localeCompare(b.name);
    });

    // Barcha aka-uka/opa-singillar barg bo'lsa (Screenshot 4 talabi: Muhammadrizo, Xurshidabonu, Halimaxon, Shahzodaxon)
    const allLeafChildren = children.length > 1 && branchChildren.length === 0;

    const isBotanical = treeOrientation === 'botanical';

    return (
      <div key={person.id} className={`flex ${isBotanical ? 'flex-col-reverse' : 'flex-col'} items-center relative`}>
        {/* Node Card / Couple Unit */}
        <div className="z-10 interactive-control flex items-center justify-center relative">
          {spouse && rightPerson ? (
            <div className="flex items-center justify-center gap-2 sm:gap-3 relative">
              {/* Left Card */}
              <div className="relative" style={getOffsetStyle(leftPerson.id)}>
                <PersonCard
                  person={leftPerson}
                  people={people}
                  meId={meId}
                  activePerspectiveId={activePerspectiveId}
                  currentUser={currentUser}
                  hasChildren={hasChildren}
                  isExpanded={isExpanded}
                  showLifeline={showLifelines}
                  onToggleExpand={() => toggleExpand(leftPerson.id)}
                  onSelect={onSelectPerson}
                  onEdit={onEditPerson}
                  onAddChild={onAddChild}
                  onAddParent={onAddParent}
                  onOpenAddRelative={onOpenAddRelative}
                  onSetTemporaryPerspective={onSetTemporaryPerspective}
                  onUnauthorizedEditAttempt={onUnauthorizedEditAttempt}
                  isSelected={selectedPersonId === leftPerson.id}
                  isHighlighted={isMatch(leftPerson)}
                  isDraggable={isOwner}
                  onStartDrag={(e) => handleStartDragCard(leftPerson.id, e)}
                  onStartTouchDrag={(e) => handleStartTouchDragCard(leftPerson.id, e)}
                />
              </div>

              {/* Horizontal Bridge Line with Couple Heart Badge (O'rtasidan tortilgan rishta) */}
              <div 
                className="flex items-center justify-center shrink-0 relative px-1 sm:px-2 z-10 transition-opacity"
                style={{
                  opacity: (cardOffsets[leftPerson.id]?.x || cardOffsets[rightPerson.id]?.x) ? 0.35 : 1
                }}
              >
                <div className="w-5 sm:w-8 h-1 bg-gradient-to-r from-emerald-500 via-rose-400 to-rose-500 rounded-full shadow-xs" />
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-rose-400 dark:border-rose-500 flex items-center justify-center text-rose-500 shadow-md z-10 mx-0.5"
                  title="Oila rishtasi (Turmush o'rtoqlar)"
                >
                  <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-rose-500 text-rose-500" />
                </div>
                <div className="w-5 sm:w-8 h-1 bg-gradient-to-r from-rose-500 via-rose-400 to-emerald-500 rounded-full shadow-xs" />
              </div>

              {/* Right Card */}
              <div className="relative" style={getOffsetStyle(rightPerson.id)}>
                <PersonCard
                  person={rightPerson}
                  people={people}
                  meId={meId}
                  activePerspectiveId={activePerspectiveId}
                  currentUser={currentUser}
                  hasChildren={hasChildren}
                  isExpanded={isExpanded}
                  showLifeline={showLifelines}
                  onToggleExpand={() => toggleExpand(rightPerson.id)}
                  onSelect={onSelectPerson}
                  onEdit={onEditPerson}
                  onAddChild={onAddChild}
                  onAddParent={onAddParent}
                  onOpenAddRelative={onOpenAddRelative}
                  onSetTemporaryPerspective={onSetTemporaryPerspective}
                  onUnauthorizedEditAttempt={onUnauthorizedEditAttempt}
                  isSelected={selectedPersonId === rightPerson.id}
                  isHighlighted={isMatch(rightPerson)}
                  isDraggable={isOwner}
                  onStartDrag={(e) => handleStartDragCard(rightPerson.id, e)}
                  onStartTouchDrag={(e) => handleStartTouchDragCard(rightPerson.id, e)}
                />
              </div>
            </div>
          ) : (
            <div className="relative" style={getOffsetStyle(person.id)}>
              <PersonCard
                person={person}
                people={people}
                meId={meId}
                activePerspectiveId={activePerspectiveId}
                currentUser={currentUser}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                showLifeline={showLifelines}
                onToggleExpand={() => toggleExpand(person.id)}
                onSelect={onSelectPerson}
                onEdit={onEditPerson}
                onAddChild={onAddChild}
                onAddParent={onAddParent}
                onOpenAddRelative={onOpenAddRelative}
                onSetTemporaryPerspective={onSetTemporaryPerspective}
                onUnauthorizedEditAttempt={onUnauthorizedEditAttempt}
                isSelected={selectedPersonId === person.id}
                isHighlighted={isMatch(person)}
                isDraggable={isOwner}
                onStartDrag={(e) => handleStartDragCard(person.id, e)}
                onStartTouchDrag={(e) => handleStartTouchDragCard(person.id, e)}
              />
            </div>
          )}
        </div>

        {/* Children Branch (Bo'yi kengaytirilgan va eni qisqartirilgan mutanosib shajara) */}
        {hasChildren && isExpanded && (
          <div className={`flex ${isBotanical ? 'flex-col-reverse' : 'flex-col'} items-center ${isBotanical ? 'mb-20 sm:mb-24' : 'mt-20 sm:mt-24'} relative w-full`}>
            {allLeafChildren ? (
              /* Foydalanuvchi talabi (Screenshot 4): Avlodi yo'q farzandlar bitta ustunda USTMA-UST turadi */
              <div className="flex flex-col items-center gap-4 sm:gap-5 relative">
                {leafChildren.map((child) => (
                  <div key={child.id} className="relative">
                    {renderTreeNode(child.id, level + 1)}
                  </div>
                ))}
              </div>
            ) : branchChildren.length > 0 && leafChildren.length > 1 ? (
              /* Aralash: o'z oilasi/bolalari borlar gorizontal shoxlanadi, yolg'iz barglar esa bitta ustunga to'planadi */
              <div className={`flex ${isBotanical ? 'items-end' : 'items-start'} justify-center gap-8 sm:gap-12 relative`}>
                {branchChildren.map((child) => (
                  <div key={child.id} className="flex flex-col items-center relative">
                    {renderTreeNode(child.id, level + 1)}
                  </div>
                ))}
                <div className="flex flex-col items-center gap-4 sm:gap-5 relative">
                  {leafChildren.map((child) => (
                    <div key={child.id} className="relative">
                      {renderTreeNode(child.id, level + 1)}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Standart gorizontal taqsimot */
              <div className={`flex ${isBotanical ? 'items-end' : 'items-start'} justify-center gap-6 sm:gap-10 relative`}>
                {children.map((child) => (
                  <div key={child.id} className="flex flex-col items-center relative">
                    {renderTreeNode(child.id, level + 1)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      id="family-tree-canvas-viewport"
      className="relative w-full h-full min-h-0 flex-1 overflow-hidden select-none cursor-grab active:cursor-grabbing border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-inner touch-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Dynamic Sky Background Canvas */}
      <SkyCanvas isDark={document.documentElement.classList.contains('dark')} />

      {/* Temporary Perspective Active Top Banner */}
      {activePerspectivePerson && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 max-w-[calc(100%-120px)] sm:max-w-md flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl shadow-lg border border-amber-400 animate-in slide-in-from-top-2">
          <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-100 flex-shrink-0 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="text-[11px] sm:text-xs font-semibold truncate">
            <strong>«{activePerspectivePerson.name}»</strong> nomidan ko'rilmoqda
          </div>
          <button
            onClick={onClearTemporaryPerspective}
            className="ml-auto p-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center gap-1 text-[10px] sm:text-[11px] font-bold flex-shrink-0"
            title="Asl profilingizga qaytish"
          >
            <X className="w-3 h-3" />
            <span className="hidden sm:inline">Qaytish</span>
          </button>
        </div>
      )}

      {/* Floating Canvas Controls (Mobile-Responsive Compact Toolbar) */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-lg">
        {/* Daraxt Yo'nalishi (Tabiiy Daraxt vs Klassik Nasabnoma) */}
        <button
          id="btn-toggle-tree-orientation"
          onClick={toggleOrientation}
          className={`px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 shadow-xs ${
            treeOrientation === 'botanical'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
          }`}
          title={
            treeOrientation === 'botanical'
              ? "Klassik shajaraga o'tish (Tepadan pastga)"
              : "Tabiiy daraxtga o'tish (Pastdan tepaga o'suvchi)"
          }
        >
          {treeOrientation === 'botanical' ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">🌱 Tabiiy daraxt</span>
              <span className="sm:hidden">🌱 Daraxt</span>
            </>
          ) : (
            <>
              <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">📜 Klassik shajara</span>
              <span className="sm:hidden">📜 Klassik</span>
            </>
          )}
        </button>

        {/* Surilgan kartochkalarni tiklash (agar mavjud bo'lsa) */}
        {Object.keys(cardOffsets).length > 0 && (
          <button
            id="btn-reset-card-positions"
            onClick={handleResetOffsets}
            className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors flex items-center gap-1"
            title="Kartochkalar surilgan joylashuvini dastlabki holatga qaytarish"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span className="hidden md:inline">Joylashuvni tiklash</span>
          </button>
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Zoom In */}
        <button
          id="btn-zoom-in"
          onClick={() => applyZoom(zoom * 1.18)}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
          title="Kattalashtirish (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          id="btn-zoom-out"
          onClick={() => applyZoom(zoom * 0.82)}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
          title="Kichiklashtirish (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Center on Me */}
        <button
          id="btn-center-me"
          onClick={() => centerOnPerson(meId)}
          className="px-2 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 transition-colors flex items-center gap-1 text-[11px] sm:text-xs font-bold"
          title="Mening kartochkamni markazga keltirish"
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden xs:inline sm:inline">Markazga</span>
        </button>

        {/* Reset Zoom / Current Zoom % */}
        <button
          id="btn-reset-view"
          onClick={resetView}
          className="px-1.5 py-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 text-[11px] sm:text-xs font-semibold"
          title="Masshtabni 100% tiklash"
        >
          <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
          <span>{Math.round(zoom * 100)}%</span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Toggle All Branches */}
        <button
          id="btn-toggle-all-branches"
          onClick={handleToggleAllBranches}
          className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 shadow-xs ${
            isAllExpanded
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 ring-1 ring-emerald-500'
          }`}
          title={isAllExpanded ? "Barcha shoxlarni yopish" : "Barcha shoxlarni ochish"}
        >
          {isAllExpanded ? (
            <>
              <FoldVertical className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Barchasini yopish</span>
              <span className="sm:hidden">Yopish</span>
            </>
          ) : (
            <>
              <UnfoldVertical className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Barchasini ochish</span>
              <span className="sm:hidden">Ochish</span>
            </>
          )}
        </button>
      </div>

      {/* Draggable & Scalable Workspace */}

      {/* Loading Skeleton Top Indicator */}
      {isLoading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Shajara daraxti Supabase'dan yuklanmoqda...</span>
        </div>
      )}

      {/* Draggable & Scalable Workspace */}
      <div
        className="w-full h-full transform-gpu origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          willChange: 'transform',
        }}
      >
        <div 
          id="tree-canvas-content" 
          ref={treeContentRef} 
          className="inline-block p-8 sm:p-14 min-w-max relative"
        >
          {/* Dynamic Kinship SVG Lines Layer (Stretchy elastic curves anchored directly to cards) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            style={{ zIndex: 2 }}
          >
            <defs>
              <linearGradient id="kinship-line-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="couple-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <filter id="kinship-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="#10b981" floodOpacity="0.4" />
              </filter>
            </defs>

            {kinshipLines.map((line) => {
              if (line.type === 'couple') {
                return (
                  <g key={line.id}>
                    {/* Shadow under couple line */}
                    <path
                      d={line.pathD}
                      fill="none"
                      stroke="rgba(0, 0, 0, 0.15)"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    {/* Couple connection line */}
                    <path
                      d={line.pathD}
                      fill="none"
                      stroke="url(#couple-line-grad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="6 3"
                    />
                    {line.midX !== undefined && line.midY !== undefined && (
                      <g transform={`translate(${line.midX}, ${line.midY})`}>
                        <circle r="12" fill="#ffffff" stroke="#f43f5e" strokeWidth="2" />
                        <path
                          d="M -5 -2 C -5 -5 -1 -5 0 -2 C 1 -5 5 -5 5 -2 C 5 2 0 6 0 6 C 0 6 -5 2 -5 -2 Z"
                          fill="#f43f5e"
                          transform="scale(0.85)"
                        />
                      </g>
                    )}
                  </g>
                );
              }

              return (
                <g key={line.id}>
                  {/* Contrast under-line */}
                  <path
                    d={line.pathD}
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.12)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {/* Primary elastic kinship line */}
                  <path
                    d={line.pathD}
                    fill="none"
                    stroke="url(#kinship-line-grad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    filter="url(#kinship-glow)"
                  />
                  {/* Parent connection pin */}
                  <circle cx={line.startX} cy={line.startY} r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                  {/* Child connection pin */}
                  <circle cx={line.endX} cy={line.endY} r="3.5" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />
                </g>
              );
            })}
          </svg>

          {isLoading && Object.keys(people).length === 0 ? (
            /* Tree Loading Skeleton */
            <div className="flex flex-col items-center justify-center p-6 sm:p-12 space-y-6 animate-in fade-in duration-300">
              {/* Root Skeleton Card */}
              <div className="w-64 p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="w-14 h-5 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-28 h-3.5 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="w-20 h-2.5 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="w-3/4 h-full bg-emerald-500/30 animate-pulse" />
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="w-16 h-3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="w-12 h-3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
              </div>

              {/* Stem */}
              <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700 animate-pulse" />

              {/* Cross Branch Bar */}
              <div className="w-96 sm:w-[500px] h-0.5 bg-slate-300 dark:bg-slate-700 relative animate-pulse">
                <div className="absolute left-1/4 -top-3 w-0.5 h-3 bg-slate-300 dark:bg-slate-700" />
                <div className="absolute right-1/4 -top-3 w-0.5 h-3 bg-slate-300 dark:bg-slate-700" />
              </div>

              {/* Children Generation Skeletons */}
              <div className="flex items-start justify-center gap-8 sm:gap-14 pt-2">
                {[1, 2].map((n) => (
                  <div key={n} className="w-60 p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-4 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                      <div className="w-12 h-4 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="w-24 h-3.5 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        <div className="w-16 h-2.5 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="w-1/2 h-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : displayRoots.length > 0 ? (
            <div className={`flex ${treeOrientation === 'botanical' ? 'items-end' : 'items-start'} justify-center gap-6 relative`}>
              {isLoading && (
                <div className="absolute inset-0 bg-white/20 dark:bg-slate-950/20 backdrop-blur-[1px] rounded-3xl pointer-events-none z-10" />
              )}
              {(() => {
                renderedPersonIds.current.clear();
                return displayRoots.map((rId) => renderTreeNode(rId));
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 sm:p-14 max-w-md mx-auto text-center space-y-5">
              {/* Central Glowing + Button (Foydalanuvchi talabi) */}
              <button
                type="button"
                onClick={() => {
                  if (!currentUser && onOpenLoginModal) {
                    onOpenLoginModal();
                  } else {
                    onOpenAddRoot();
                  }
                }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all flex flex-col items-center justify-center border-4 border-white/80 dark:border-slate-800 cursor-pointer group animate-bounce"
                title={currentUser ? "Yangi shajara yaratish va ilk odamni qo'shish" : "Ro'yxatdan o'tish yoki tizimga kirish"}
              >
                <Plus className="w-10 h-10 sm:w-12 sm:h-12 group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">Boshlash</span>
              </button>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Yangi Shajara Yaratish
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Markazdagi «+» tugmasini bosing va shajarangizga ilk shaxsni (o'zingiz yoki katta bobongizni) qo'shing!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
