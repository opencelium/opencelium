import { createContext, useContext, useMemo } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';

/** The method a step colour belongs to, or undefined when the colour is not in the workflow. */
export type MethodLabelByColor = (color: string) => string | undefined;

/**
 * Lets reference chips name the method they read from. Provided by the editor that knows the
 * workflow's methods; without a provider chips still render, just without the method name.
 */
export const ReferenceSourceContext = createContext<MethodLabelByColor>(() => undefined);

export const useReferenceSourceLabels = () => {
	const methodLabel = useContext(ReferenceSourceContext);
	const { t } = useI18n('workflow');
	return useMemo(() => ({
		methodLabel,
		webhook: t('references.chipSource.webhook'),
		global: t('references.chipSource.global'),
	}), [methodLabel, t]);
};

export type ReferenceSourceLabels = ReturnType<typeof useReferenceSourceLabels>;

type MethodLike = { color?: string | null; label?: string | null; name?: string | null };

/** Builds the colour → method name lookup from a connection's methods. */
export const createMethodLabelByColor = (methods: readonly MethodLike[]): MethodLabelByColor => {
	const byColor = new Map(methods.filter((method) => method.color)
		.map((method) => [String(method.color).toLowerCase(), method.label || method.name || undefined]));
	return (color) => byColor.get(color.toLowerCase());
};
