import { useState, useCallback, useEffect } from "react";
import api from "@/shared/api/axiosInstance";
import { toastApiError } from "@/shared/hooks/useApiToast";
import { ACTIVE_REGISTRATION_EXCLUDED_STATUSES } from "@/features/admission/constants/registrationWorkflow";

export interface Application {
  id: number;
  lrn: string;
  lastName: string;
  firstName: string;
  middleName: string | null;
  suffix: string | null;
  trackingNumber: string;
  status: string;
  applicantType: string;
  gradeLevelId: number;
  gradeLevel: { name: string };
  createdAt: string;
}

interface EarlyRegistrationApiRow {
  id: number;
  lrn?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string | null;
  suffix?: string | null;
  trackingNumber: string;
  status: string;
  applicantType: string;
  gradeLevelId: number;
  gradeLevel: { name: string };
  createdAt: string;
  learner?: {
    firstName?: string;
    lastName?: string;
    middleName?: string | null;
    extensionName?: string | null;
    lrn?: string;
  };
}

export function useEarlyRegistrations(ayId: number | null) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    if (!ayId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("schoolYearId", String(ayId));
      if (search) params.append("search", search);

      if (status !== "ALL") {
        params.append("status", status);
      }

      if (type !== "ALL") params.append("applicantType", type);
      params.append("page", String(page));
      params.append("limit", "50");

      const allStatusPromise = api.get(`/early-registrations?${params.toString()}`);

      const excludedCountPromises =
        status === "ALL"
          ? ACTIVE_REGISTRATION_EXCLUDED_STATUSES.map((excludedStatus) => {
              const excludedParams = new URLSearchParams();
              excludedParams.append("schoolYearId", String(ayId));
              if (search) excludedParams.append("search", search);
              if (type !== "ALL") excludedParams.append("applicantType", type);
              excludedParams.append("status", excludedStatus);
              excludedParams.append("page", "1");
              excludedParams.append("limit", "1");

              return api.get(`/early-registrations?${excludedParams.toString()}`);
            })
          : [];

      const [res, ...excludedResponses] = await Promise.all([
        allStatusPromise,
        ...excludedCountPromises,
      ]);

      let filteredApps = (res.data.data as EarlyRegistrationApiRow[]).map(
        (app): Application => ({
          ...app,
          firstName: app.learner?.firstName || app.firstName || "",
          lastName: app.learner?.lastName || app.lastName || "",
          middleName: app.learner?.middleName || app.middleName || null,
          suffix: app.learner?.extensionName || app.suffix || null,
          lrn: app.learner?.lrn || app.lrn || "",
        }),
      );

      if (status === "ALL") {
        filteredApps = filteredApps.filter(
          (app: Application) =>
            !ACTIVE_REGISTRATION_EXCLUDED_STATUSES.includes(
              app.status as (typeof ACTIVE_REGISTRATION_EXCLUDED_STATUSES)[number],
            ),
        );
      }

      const excludedTotals =
        status === "ALL"
          ? excludedResponses.reduce(
              (sum, response) =>
                sum + Number(response?.data?.pagination?.total ?? 0),
              0,
            )
          : 0;

      setApplications(filteredApps);
      setTotal(
        status === "ALL"
          ? Math.max(0, Number(res.data?.pagination?.total ?? 0) - excludedTotals)
          : Number(res.data?.pagination?.total ?? 0),
      );
    } catch (err) {
      toastApiError(err as never);
    } finally {
      setLoading(false);
    }
  }, [ayId, search, status, type, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    applications,
    total,
    loading,
    search,
    setSearch,
    status,
    setStatus,
    type,
    setType,
    page,
    setPage,
    fetchData,
  };
}
