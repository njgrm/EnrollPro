import { useCallback, useEffect, useState } from "react";
import { sileo } from "sileo";
import api from "@/shared/api/axiosInstance";
import { toastApiError } from "@/shared/hooks/useApiToast";
import { useSettingsStore } from "@/store/settings.slice";
import { SCP_TYPES } from "../constants";
import type { ScpConfig, ScpStepConfig } from "../types";
import { getDefaultProgramSteps, getSteProgramSteps } from "../utils/scpSteps";

export function useCurriculumScpConfigs() {
  const { activeSchoolYearId, viewingSchoolYearId } = useSettingsStore();
  const ayId = viewingSchoolYearId ?? activeSchoolYearId;

  const [scpConfigs, setScpConfigs] = useState<ScpConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingScp, setSavingScp] = useState(false);

  const fetchData = useCallback(async () => {
    if (!ayId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const scpRes = await api.get(`/curriculum/${ayId}/scp-config`);
      const fetched = scpRes.data.scpProgramConfigs as ScpConfig[];

      const merged = SCP_TYPES.map((type) => {
        const found = fetched.find((config) => config.scpType === type.value);

        if (found) {
          return {
            ...found,
            isOffered: found.isOffered ?? false,
            isTwoPhase: found.isTwoPhase ?? false,
            notes: found.notes ?? null,
            gradeRequirements: found.gradeRequirements ?? null,
            rankingFormula: found.rankingFormula ?? null,
            steps: found.steps ?? [],
          };
        }

        return {
          scpType: type.value,
          isOffered: false,
          isTwoPhase: false,
          cutoffScore: null,
          notes: null,
          gradeRequirements: null,
          rankingFormula: null,
          artFields: [],
          languages: [],
          sportsList: [],
          steps: [],
        };
      });

      setScpConfigs(merged);
    } catch (error) {
      toastApiError(error as never);
    } finally {
      setLoading(false);
    }
  }, [ayId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateScpField = useCallback(
    (
      index: number,
      field: keyof ScpConfig,
      value: string | boolean | number | string[] | null,
    ) => {
      setScpConfigs((current) => {
        const next = [...current];
        next[index] = { ...next[index], [field]: value };

        if (field === "isOffered" && value === true) {
          const scpType = next[index].scpType;

          if (next[index].steps.length === 0) {
            next[index] = {
              ...next[index],
              steps: getDefaultProgramSteps(scpType, next[index].isTwoPhase),
            };
          }
        }

        if (field === "isTwoPhase") {
          next[index] = {
            ...next[index],
            steps: getSteProgramSteps(value as boolean),
          };
        }

        return next;
      });
    },
    [],
  );

  const handleUpdateStep = useCallback(
    (
      scpIndex: number,
      stepIndex: number,
      field: keyof ScpStepConfig,
      value: string | boolean | number | null,
    ) => {
      setScpConfigs((current) => {
        const next = [...current];
        const steps = [...next[scpIndex].steps];
        steps[stepIndex] = { ...steps[stepIndex], [field]: value };
        next[scpIndex] = { ...next[scpIndex], steps };
        return next;
      });
    },
    [],
  );

  const handleSaveScp = useCallback(async () => {
    if (!ayId) {
      return;
    }

    setSavingScp(true);

    try {
      const uppercasedConfigs = scpConfigs.map((scp) => ({
        ...scp,
        isTwoPhase: scp.isTwoPhase ?? false,
        artFields: scp.artFields.map((field) => field.trim().toUpperCase()),
        languages: scp.languages.map((language) =>
          language.trim().toUpperCase(),
        ),
        sportsList: scp.sportsList.map((sport) => sport.trim().toUpperCase()),
        notes: scp.notes ?? null,
        gradeRequirements: scp.gradeRequirements ?? null,
        rankingFormula: scp.rankingFormula ?? null,
        steps: scp.steps.map((step) => ({
          stepOrder: step.stepOrder,
          scheduledDate: step.scheduledDate,
          scheduledTime: step.scheduledTime,
          venue: step.venue?.trim().toUpperCase() || null,
          notes: step.notes,
          cutoffScore: step.cutoffScore ?? null,
        })),
      }));

      await api.put(`/curriculum/${ayId}/scp-config`, {
        scpProgramConfigs: uppercasedConfigs,
      });

      sileo.success({
        title: "SCP Configuration Saved",
        description: "Special programs updated for this year.",
      });

      fetchData();
    } catch (error) {
      toastApiError(error as never);
    } finally {
      setSavingScp(false);
    }
  }, [ayId, fetchData, scpConfigs]);

  return {
    ayId,
    scpConfigs,
    loading,
    savingScp,
    handleUpdateScpField,
    handleUpdateStep,
    handleSaveScp,
  };
}
