import { useEffect, useState } from 'react';
import { Button, Modal, TreeSelect } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useGetCategoriesQuery } from '@entities/category/api/categoryApi';
import { buildCategoryTree } from '@entities/category/model/buildCategoryTree';
import type { AssignCategoryDialogProps } from './AssignCategoryDialog.types';

export function AssignCategoryDialog({ open, currentCategoryId, loading, onClose, onAssign }: AssignCategoryDialogProps) {
  const { t } = useI18n('workflow');
  const confirm = useConfirm();
  const { data: categories = [], isFetching: isLoadingCategories } = useGetCategoriesQuery(undefined, { skip: !open });
  const [selectedId, setSelectedId] = useState<number | null>(currentCategoryId);

  // Re-sync to the connection's current category every time the dialog reopens,
  // discarding whatever was left selected from a previous, cancelled visit.
  useEffect(() => {
    if (open) setSelectedId(currentCategoryId);
  }, [open, currentCategoryId]);

  const treeData = buildCategoryTree(categories);
  const nameFor = (id: number | null) =>
    id != null ? categories.find((category) => category.id === id)?.name ?? null : null;

  const handleAssignClick = () => {
    onAssign(selectedId, nameFor(selectedId));
  };

  const handleRemoveClick = async () => {
    const confirmed = await confirm({
      title: t('assignCategoryDialog.confirmUnassign.title'),
      message: t('assignCategoryDialog.confirmUnassign.message'),
      confirmText: t('actions.delete'),
      cancelText: t('actions.cancel'),
      confirmVariant: 'solid',
    });
    if (!confirmed) return;
    onAssign(null, null);
  };

  return (
    <Modal
      open={open}
      title={t('assignCategoryDialog.title')}
      onCancel={onClose}
      destroyOnHidden
      width={520}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {currentCategoryId != null ? (
            <Button danger disabled={loading} onClick={handleRemoveClick} data-testid="workflow-assign-category-remove">
              {t('actions.delete')}
            </Button>
          ) : <span />}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={onClose} disabled={loading} data-testid="workflow-assign-category-cancel">
              {t('actions.cancel')}
            </Button>
            <Button
              type="primary"
              loading={loading}
              disabled={selectedId === currentCategoryId}
              onClick={handleAssignClick}
              data-testid="workflow-assign-category-save"
            >
              {t('actions.select')}
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} data-testid="workflow-assign-category-dialog">
        <div style={{ color: 'var(--color-text-secondary)' }}>
          {t('assignCategoryDialog.description')}
        </div>
        <TreeSelect
          autoFocus
          treeData={treeData}
          value={selectedId ?? undefined}
          onChange={(value) => setSelectedId(value ?? null)}
          loading={isLoadingCategories}
          placeholder={t('assignCategoryDialog.selectPlaceholder')}
          treeDefaultExpandAll
          allowClear
          disabled={loading}
          style={{ width: '100%' }}
        />
      </div>
    </Modal>
  );
}
