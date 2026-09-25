import { useEffect, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useGetCategoriesQuery } from '@entities/category/api/categoryApi';
import { buildCategoryTree } from '@entities/category/model/buildCategoryTree';
import type { AssignCategoryDialogProps } from './AssignCategoryDialog.types';

export function useAssignCategoryDialog({ open, currentCategoryId, onAssign }: Pick<
  AssignCategoryDialogProps, 'open' | 'currentCategoryId' | 'onAssign'>) {
  const { t } = useI18n('workflow');
  const confirm = useConfirm();
  const { data: categories = [], isFetching } = useGetCategoriesQuery(undefined, { skip: !open });
  const [selectedId, setSelectedId] = useState<number | null>(currentCategoryId);

  useEffect(() => {
    if (open) setSelectedId(currentCategoryId);
  }, [open, currentCategoryId]);

  const assign = () => onAssign(selectedId, selectedId != null
    ? categories.find((category) => category.id === selectedId)?.name ?? null : null);
  const remove = async () => {
    const confirmed = await confirm({
      title: t('assignCategoryDialog.confirmUnassign.title'),
      message: t('assignCategoryDialog.confirmUnassign.message'),
      confirmText: t('actions.delete'),
      cancelText: t('actions.cancel'),
      confirmVariant: 'solid',
    });
    if (confirmed) onAssign(null, null);
  };

  return { selectedId, setSelectedId, treeData: buildCategoryTree(categories),
    isLoadingCategories: isFetching, assign, remove };
}
