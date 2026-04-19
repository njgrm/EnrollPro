import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import EarlyRegistrationList from "./EarlyRegistrationList";
import RegistrationPipelines from "../pipelines/RegistrationPipelines";

type WorkspaceView = "monitoring" | "batch";

const VIEW_QUERY_KEY = "view";
const DEFAULT_VIEW: WorkspaceView = "monitoring";

function normalizeView(raw: string | null): WorkspaceView {
  return raw === "batch" ? "batch" : "monitoring";
}

export default function EarlyRegistrationWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeView = useMemo<WorkspaceView>(
    () => normalizeView(searchParams.get(VIEW_QUERY_KEY)),
    [searchParams],
  );

  const handleViewChange = (nextView: string) => {
    const normalizedNextView = normalizeView(nextView);

    setSearchParams(
      (previousParams) => {
        const nextParams = new URLSearchParams(previousParams);

        if (normalizedNextView === DEFAULT_VIEW) {
          nextParams.delete(VIEW_QUERY_KEY);
        } else {
          nextParams.set(VIEW_QUERY_KEY, normalizedNextView);
        }

        return nextParams;
      },
      { replace: true },
    );
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeView} onValueChange={handleViewChange}>
        <TabsList className="h-auto gap-1 border border-border bg-white p-1">
          <TabsTrigger value="monitoring" className="font-bold">
            Application Monitoring
          </TabsTrigger>
          <TabsTrigger value="batch" className="font-bold">
            Registration Pipelines
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeView === "batch" ? (
        <RegistrationPipelines />
      ) : (
        <EarlyRegistrationList />
      )}
    </div>
  );
}
