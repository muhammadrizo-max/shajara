import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { AuthUser, Person } from '../types';
import { PersonCard } from './PersonCard';
import { getChildren } from '../utils/kinship';
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
  Maximize2
} from 'lucide-react';

interface FamilyTreeCanvasProps {
  people: Record<string, Person>;
  rootId: string;
  meId: string;
  activePerspectiveId?: string;
  currentUser?: AuthUser | null;
  searchQuery: string;
  selectedPersonId: string | null;
  onSelectPerson: (person: Person) => void;
  onEditPerson: (person: Person) => void;
  onAddChild: (parent: Person) => void;
  onSetTemporaryPerspective: (personId: string) => void;
  onClearTemporaryPerspective: () => void;
  onUnauthorizedEditAttempt: () => void;
}

export const FamilyTreeCanvas: React.FC<FamilyTreeCanvasProps> = ({
  people,
  rootId,
  meId,
  activePerspectiveId,
  currentUser,
  searchQuery,
  selectedPersonId,
  onSelectPerson,
  onEditPerson,
  onAddChild,
  onSetTemporaryPerspective,
  onClearTemporaryPerspective,
  onUnauthorizedEditAttempt,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 100, y: 50 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

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
    initialZoom: 0.85,
    initialPan: { x: 100, y: 50 },
    initialMidpoint: { x: 0, y: 0 },
    isPinching: false,
    touchStartPan: { x: 100, y: 50 },
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
    const newZoom = Math.min(Math.max(newZoomRaw, 0.25), 2.5);
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
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
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
      const targetZoom = Math.min(Math.max(touchState.current.initialZoom * scale, 0.25), 2.5);

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
      const defaultZoom = 0.85;
      
      setPan((prevPan) => {
        const scaleRatio = defaultZoom / zoom;
        return {
          x: originX - (originX - prevPan.x) * scaleRatio,
          y: originY - (originY - prevPan.y) * scaleRatio,
        };
      });
      setZoom(defaultZoom);
    } else {
      setZoom(0.85);
      setPan({ x: 100, y: 50 });
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
  const activePerspectivePerson = activePerspectiveId ? people[activePerspectiveId] : null;

  // Recursive Tree Node Renderer
  const renderTreeNode = (personId: string, level = 0): React.ReactNode => {
    const person = people[personId];
    if (!person) return null;

    const children = getChildren(personId, people);
    const hasChildren = children.length > 0;
    const isExpanded = !collapsedIds.has(personId);
    const matched = isMatch(person);

    return (
      <div key={person.id} className="flex flex-col items-center relative">
        {/* Node Card */}
        <div className="z-10 interactive-control">
          <PersonCard
            person={person}
            people={people}
            meId={meId}
            activePerspectiveId={activePerspectiveId}
            currentUser={currentUser}
            hasChildren={hasChildren}
            isExpanded={isExpanded}
            onToggleExpand={() => toggleExpand(person.id)}
            onSelect={onSelectPerson}
            onEdit={onEditPerson}
            onAddChild={onAddChild}
            onSetTemporaryPerspective={onSetTemporaryPerspective}
            onUnauthorizedEditAttempt={onUnauthorizedEditAttempt}
            isSelected={selectedPersonId === person.id}
            isHighlighted={matched}
          />
        </div>

        {/* Children Branch */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col items-center mt-8 relative">
            {/* Vertical connector line from parent to horizontal bar */}
            <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-700 -mt-8 mb-0" />

            <div className="flex items-start justify-center gap-6 relative pt-4">
              {/* Horizontal line connecting all children if multiple */}
              {children.length > 1 && (
                <div
                  className="absolute top-0 h-0.5 bg-slate-300 dark:bg-slate-700"
                  style={{
                    left: 'calc(132px)',
                    right: 'calc(132px)',
                  }}
                />
              )}

              {/* Render each child with its top branch connector */}
              {children.map((child) => (
                <div key={child.id} className="flex flex-col items-center relative">
                  {/* Vertical connector line from horizontal bar to child */}
                  <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-700 absolute -top-4" />
                  {renderTreeNode(child.id, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      id="family-tree-canvas-viewport"
      className="relative w-full h-full min-h-0 flex-1 bg-slate-50/70 dark:bg-slate-950 overflow-hidden select-none cursor-grab active:cursor-grabbing border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-inner touch-none"
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
      {/* Background Blueprint Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, #94a3b8 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

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

      {/* Canvas Info Badge on Desktop */}
      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-emerald-600" />
          <span>Surish: Barmoq / sichqoncha bilan torting</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        <div>Masshtab: 2 barmoq bilan chimchilash (pinch) yoki +/- tugmalari</div>
      </div>

      {/* Draggable & Scalable Workspace */}
      <div
        className="w-full h-full transform-gpu origin-top-left transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <div className="inline-block p-8 sm:p-12 min-w-max">
          {renderTreeNode(rootId)}
        </div>
      </div>
    </div>
  );
};

