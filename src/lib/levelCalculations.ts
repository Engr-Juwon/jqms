import { ProjectLevel, StructuralElement } from '@/types';

export interface EnrichedLevelProgress extends ProjectLevel {
  totalElementsCount: number;
  approvedElementsCount: number;
  pouredElementsCount: number;
  pendingElementsCount: number;
  rejectedElementsCount: number;
  directPercentage: number;
  effectivePercentage: number;
  isDirectlyComplete: boolean;
  isPrecedenceComplete: boolean;
  precedenceSourceLevelName?: string;
  statusLabel: 'COMPLETED' | 'INHERITED_COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'PENDING_APPROVAL';
}

/**
 * Calculates level completion percentages based on approved elements,
 * and applies the Superstructure Precedence Rule:
 * If any level above level K is completed (or 100% approved),
 * then level K below it is inherently completed (100%).
 */
export function calculateLevelProgressList(
  levels: ProjectLevel[],
  elements: StructuralElement[]
): EnrichedLevelProgress[] {
  if (!levels || levels.length === 0) return [];

  // 1. Sort levels vertically ascending by order, fallback to elevation
  const sortedLevels = [...levels].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
      return a.order - b.order;
    }
    return (a.elevation || 0) - (b.elevation || 0);
  });

  // 2. Compute direct element metrics for each level
  const directMetrics = sortedLevels.map((lvl) => {
    const lvlElements = elements.filter((e) => e.levelId === lvl.id);
    const total = lvlElements.length;
    const approved = lvlElements.filter((e) => e.status === 'APPROVED').length;
    const poured = lvlElements.filter((e) => e.status === 'POURED' || e.status === 'APPROVED').length;
    const rejected = lvlElements.filter((e) => e.status === 'REJECTED').length;
    const pending = total - (approved + rejected);

    const directPercentage = total > 0 ? Math.round((approved / total) * 100) : (lvl.isCompleted ? 100 : 0);
    const isDirectlyComplete = (total > 0 && approved === total) || lvl.isCompleted === true || directPercentage === 100;

    return {
      lvl,
      total,
      approved,
      poured,
      rejected,
      pending,
      directPercentage,
      isDirectlyComplete,
    };
  });

  // 3. Apply Superstructure Precedence Rule (Downward propagation from highest completed level)
  // Scan backwards from highest level to lowest
  let highestCompletedLevelName: string | null = null;
  const result: EnrichedLevelProgress[] = [];

  for (let i = directMetrics.length - 1; i >= 0; i--) {
    const item = directMetrics[i];
    let isPrecedenceComplete = false;
    let precedenceSourceLevelName: string | undefined = undefined;
    let effectivePercentage = item.directPercentage;

    if (highestCompletedLevelName) {
      // A level above this one is already marked/calculated as completed
      if (!item.isDirectlyComplete) {
        isPrecedenceComplete = true;
        precedenceSourceLevelName = highestCompletedLevelName;
        effectivePercentage = 100;
      }
    }

    if (item.isDirectlyComplete && !highestCompletedLevelName) {
      highestCompletedLevelName = item.lvl.name;
    }

    let statusLabel: EnrichedLevelProgress['statusLabel'] = 'NOT_STARTED';
    if (item.isDirectlyComplete) {
      statusLabel = 'COMPLETED';
    } else if (isPrecedenceComplete) {
      statusLabel = 'INHERITED_COMPLETED';
    } else if (effectivePercentage > 0 || item.poured > 0) {
      statusLabel = 'IN_PROGRESS';
    }

    result[i] = {
      ...item.lvl,
      totalElementsCount: item.total,
      approvedElementsCount: item.approved,
      pouredElementsCount: item.poured,
      pendingElementsCount: item.pending,
      rejectedElementsCount: item.rejected,
      directPercentage: item.directPercentage,
      effectivePercentage,
      isDirectlyComplete: item.isDirectlyComplete,
      isPrecedenceComplete,
      precedenceSourceLevelName,
      isCompleted: effectivePercentage === 100,
      completionPercentage: effectivePercentage,
      statusLabel,
    };
  }

  return result;
}

/**
 * Calculates overall structural progress for the project
 */
export function calculateOverallStructuralProgress(enrichedLevels: EnrichedLevelProgress[]): {
  overallPercentage: number;
  totalElementsCount: number;
  totalApprovedCount: number;
  completedLevelsCount: number;
  totalLevelsCount: number;
} {
  if (!enrichedLevels || enrichedLevels.length === 0) {
    return {
      overallPercentage: 0,
      totalElementsCount: 0,
      totalApprovedCount: 0,
      completedLevelsCount: 0,
      totalLevelsCount: 0,
    };
  }

  const totalElements = enrichedLevels.reduce((acc, l) => acc + l.totalElementsCount, 0);
  const totalApproved = enrichedLevels.reduce((acc, l) => acc + l.approvedElementsCount, 0);
  const completedLevels = enrichedLevels.filter((l) => l.effectivePercentage === 100).length;

  let overallPercentage = 0;
  if (totalElements > 0) {
    overallPercentage = Math.round((totalApproved / totalElements) * 100);
  } else if (enrichedLevels.length > 0) {
    const sum = enrichedLevels.reduce((acc, l) => acc + l.effectivePercentage, 0);
    overallPercentage = Math.round(sum / enrichedLevels.length);
  }

  return {
    overallPercentage,
    totalElementsCount: totalElements,
    totalApprovedCount: totalApproved,
    completedLevelsCount: completedLevels,
    totalLevelsCount: enrichedLevels.length,
  };
}
