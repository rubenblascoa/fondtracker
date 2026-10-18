import { AnalyticsSection } from "../AnalyticsSection";
import type { Investment, Status } from "../../api";

type Props = {
  funds: Investment[];
  status: Status | null;
};

export function AnalyticsTab({ funds, status }: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <AnalyticsSection funds={funds} status={status} />
    </div>
  );
}
