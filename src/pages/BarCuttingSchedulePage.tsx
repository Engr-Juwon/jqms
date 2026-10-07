import React from "react";
import { useParams } from "react-router-dom";
import { BarCuttingRegistryPage } from "./BarCuttingRegistryPage";
import { BarCuttingDetailPage } from "./BarCuttingDetailPage";

/**
 * Backward-compatible delegator for Bar Cutting module.
 * Directs to BarCuttingDetailPage when a :scheduleId parameter is present,
 * or renders BarCuttingRegistryPage otherwise.
 */
export const BarCuttingSchedulePage: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId?: string }>();
  if (scheduleId) {
    return <BarCuttingDetailPage />;
  }
  return <BarCuttingRegistryPage />;
};

export { BarCuttingRegistryPage, BarCuttingDetailPage };
export default BarCuttingSchedulePage;
