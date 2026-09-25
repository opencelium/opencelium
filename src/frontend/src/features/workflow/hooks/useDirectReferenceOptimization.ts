import { useCallback } from 'react';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { isDirectReferenceEnhancement } from '../components/request-editor/body-editor/bodyReference';

type Params = {
	fieldBindings?: any[];
	setFieldBindings: (bindings: any[] | undefined) => void;
};

export function useDirectReferenceOptimization({ fieldBindings, setFieldBindings }: Params) {
	const confirm = useConfirm();
	const { t } = useI18n('workflow');

	return useCallback(async () => {
		const directBindings = (fieldBindings ?? []).filter((binding: any) =>
			isDirectReferenceEnhancement(binding?.enhancement));
		if (directBindings.length === 0) return fieldBindings;

		const optimize = await confirm({
			title: t('enhancement.optimizeDirectReferences.title'),
			message: t('enhancement.optimizeDirectReferences.message', { count: directBindings.length }),
			confirmText: t('actions.apply'),
			cancelText: t('actions.cancel'),
		});
		if (!optimize) return fieldBindings;

		const directIds = new Set(directBindings.map((binding: any) =>
			binding.enhancement.enhanceId));
		const optimizedBindings = (fieldBindings ?? []).filter((binding: any) =>
			!directIds.has(binding?.enhancement?.enhanceId));
		setFieldBindings(optimizedBindings);
		return optimizedBindings;
	}, [confirm, fieldBindings, setFieldBindings, t]);
}
