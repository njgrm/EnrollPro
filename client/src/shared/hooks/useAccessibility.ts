import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settings.slice';

/**
 * Applies accessibility settings (font size) to the <html> element.
 * Must be called once in the authenticated layout.
 */
export function useAccessibility() {
	const { fontSize } = useSettingsStore();

	useEffect(() => {
		const html = document.documentElement;

		// Font Size — sets root font-size so all rem-based values scale
		html.style.fontSize = `${(fontSize / 100) * 16}px`;
	}, [fontSize]);
}
