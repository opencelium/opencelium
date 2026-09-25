import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type SaveWorkflow = (params: {
	title: string;
	description: string;
	comment: string;
	categoryId?: number | null;
}) => Promise<void>;

type Params = {
	title: string;
	description: string;
	saveWorkflow: SaveWorkflow;
};

export const useAssignWorkflowCategory = ({ title, description,
	saveWorkflow }: Params) => {
	const { t } = useI18n('workflow');
	const [open, setOpen] = useState(false);
	const [isAssigning, setIsAssigning] = useState(false);

	const assignCategory = async (categoryId: number | null, categoryName: string | null) => {
		setIsAssigning(true);
		try {
			await saveWorkflow({ title, description,
				comment: categoryId
					? t('saveDialog.autoCategoryAssignedComment', { category: categoryName })
					: t('saveDialog.autoCategoryClearedComment'),
				categoryId,
			});
			setOpen(false);
		} catch {
			// saveWorkflow displays the relevant error.
		} finally {
			setIsAssigning(false);
		}
	};

	return { open, setOpen, isAssigning, assignCategory };
};
