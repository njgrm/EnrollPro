import { useState, useEffect, useCallback } from 'react';
import api from '@/shared/api/axiosInstance';
import { useSettingsStore } from '@/store/settings.slice';

export interface ScpConfig {
	id: number;
	scpType: string;
	isOffered: boolean;
	isTwoPhase: boolean;
	cutoffScore: number | null;
	notes: string | null;
}

export function useScpConfigs() {
	const { activeSchoolYearId, viewingSchoolYearId } = useSettingsStore();
	const ayId = viewingSchoolYearId ?? activeSchoolYearId;

	const [configs, setConfigs] = useState<ScpConfig[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchConfigs = useCallback(async () => {
		if (!ayId) return;

		setLoading(true);
		setError(null);

		try {
			const res = await api.get(`/curriculum/${ayId}/scp-config`);
			const fetched = (res.data.scpProgramConfigs ?? []) as ScpConfig[];
			setConfigs(fetched.filter((c) => c.isOffered));
		} catch (err: unknown) {
			const message =
				(err as { response?: { data?: { message?: string } } })?.response?.data
					?.message ?? 'Failed to load SCP configs';
			setError(message);
		} finally {
			setLoading(false);
		}
	}, [ayId]);

	useEffect(() => {
		fetchConfigs();
	}, [fetchConfigs]);

	return { configs, loading, error };
}
