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
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 100, y: 50 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [showLifelines, setShowLifelines] = useState<boolean>(true);

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

    // Detect if this is a single parent (e.g. Bobo) with exactly one child that is married (e.g. Muxiddin + Gulchehraxon)
    const singleChild = children.length === 1 ? children[0] : null;
    const singleChildSpouseId = singleChild 
      ? (singleChild.spouseId || allPeopleList.find((o) => o.spouseId === singleChild.id)?.id)
      : null;
    const singleChildSpouse = singleChildSpouseId ? people[singleChildSpouseId] : null;
    const isSingleChildWithSpouse = !spouse && Boolean(singleChildSpouse);
    const isSingleChildLeftInCouple = singleChild 
      ? (singleChild.gender === 'male' || (singleChild.parentId && !singleChildSpouse?.parentId))
      : true;

    return (
      <div key={person.id} className="flex flex-col items-center relative">
        {/* Node Card / Couple Unit */}
        <div className="z-10 interactive-control flex items-center justify-center relative">
          {spouse && rightPerson ? (
            <div className="flex items-center justify-center gap-2 sm:gap-3 relative">
              {/* Left Card */}
              <div className="relative">
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
                />
              </div>

              {/* Horizontal Bridge Line with Couple Heart Badge (O'rtasidan tortilgan chiziq) */}
              <div className="flex items-center justify-center shrink-0 relative px-1 sm:px-2 z-10">
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
              <div className="relative">
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
                />
              </div>
            </div>
          ) : isSingleChildWithSpouse ? (
            /* Single parent (Bobo) aligned directly above biological child (Muxiddin) */
            <div className="flex items-center justify-center relative">
              {!isSingleChildLeftInCouple && (
                <div className="w-72 sm:w-[328px] shrink-0 pointer-events-none" />
              )}
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
              />
              {isSingleChildLeftInCouple && (
                <div className="w-72 sm:w-[328px] shrink-0 pointer-events-none" />
              )}
            </div>
          ) : (
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
            />
          )}
        </div>

        {/* Children Branch */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col items-center mt-6 sm:mt-8 relative w-full">
            {/* Vertical connector line from middle of couple (heart) or single parent card down to children */}
            {isSingleChildWithSpouse ? (
              <div 
                className="w-0.5 h-7 sm:h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full absolute -top-0"
                style={{
                  left: isSingleChildLeftInCouple ? '128px' : 'calc(100% - 128px)',
                  transform: 'translateX(-50%)',
                }}
              />
            ) : (
              <div className="w-0.5 h-7 sm:h-8 bg-gradient-to-b from-rose-400 via-emerald-500 to-slate-400 dark:to-slate-600 rounded-full" />
            )}

            {/* Branch to children */}
            <div className="flex items-start justify-center gap-8 sm:gap-10 relative pt-4">
              {/* Rounded/curved horizontal connector bar across multiple children */}
              {children.length > 1 && (
                <div
                  className="absolute top-0 h-0.5 bg-gradient-to-r from-emerald-500/80 via-teal-500 to-emerald-500/80 rounded-full shadow-xs"
                  style={{
                    left: 'calc(132px)',
                    right: 'calc(132px)',
                  }}
                />
              )}

              {/* Render each child with top branch connector */}
              {children.map((child) => {
                const childSpouseId = child.spouseId || allPeopleList.find((other) => other.spouseId === child.id)?.id;
                const childSpouse = childSpouseId ? people[childSpouseId] : null;

                // When child is in a couple, incoming branch lands directly on child's card
                const isChildLeftInCouple = child.gender === 'male' || (child.parentId && !childSpouse?.parentId);
                const topConnectorStyle: React.CSSProperties = childSpouse
                  ? { left: isChildLeftInCouple ? '128px' : 'calc(100% - 128px)', transform: 'translateX(-50%)' }
                  : { left: '50%', transform: 'translateX(-50%)' };

                return (
                  <div key={child.id} className="flex flex-col items-center relative">
                    {/* Top vertical connector from horizontal bar or parent directly down to child */}
                    <div 
                      className="w-0.5 h-4 bg-gradient-to-b from-emerald-500/80 to-slate-400 dark:to-slate-600 absolute -top-4 rounded-full" 
                      style={topConnectorStyle}
                    />
                    {renderTreeNode(child.id, level + 1)}
                  </div>
                );
              })}
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
        className="w-full h-full transform-gpu origin-top-left transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <div className="inline-block p-8 sm:p-12 min-w-max">
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
            <div className="flex items-start justify-center gap-16 relative">
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
                onClick={onOpenAddRoot}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all flex flex-col items-center justify-center border-4 border-white/80 dark:border-slate-800 cursor-pointer group animate-bounce"
                title="Yangi shajara yaratish va ilk odamni qo'shish"
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

              <div className="flex flex-col w-full gap-2 pt-2">
                {!currentUser && onOpenLoginModal && (
                  <button
                    type="button"
                    onClick={onOpenLoginModal}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>Ro'yxatdan o'tish / Kirish</span>
                  </button>
                )}

                {onOpenTelegramBotModal && (
                  <button
                    type="button"
                    onClick={onOpenTelegramBotModal}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#24A1DE]/10 hover:bg-[#24A1DE]/20 text-[#24A1DE] dark:text-cyan-400 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Telegram Bot (@shajarachi_bot)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

