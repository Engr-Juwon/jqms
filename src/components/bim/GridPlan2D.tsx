import React from "react";
import { StructuralElement, ProjectLevel, Gridline, NCR } from "@/types";
import { GridPlanCanvas } from "@/components/registry/GridPlanCanvas";

interface GridPlan2DProps {
  elements: StructuralElement[];
  levels?: ProjectLevel[];
  gridlines?: Gridline[];
  ncrs?: NCR[];
  onSelectElement?: (element: StructuralElement) => void;
  selectedElementId?: string;
  projectId?: string;
  className?: string;
}

export const GridPlan2D: React.FC<GridPlan2DProps> = ({
  elements,
  levels = [],
  gridlines = [],
  ncrs = [],
  onSelectElement,
  projectId,
  className = "",
}) => {
  return (
    <GridPlanCanvas
      elements={elements}
      levels={levels}
      gridlines={gridlines}
      ncrs={ncrs}
      projectId={projectId}
      onSelectElement={onSelectElement}
      className={className}
    />
  );
};

export default GridPlan2D;
