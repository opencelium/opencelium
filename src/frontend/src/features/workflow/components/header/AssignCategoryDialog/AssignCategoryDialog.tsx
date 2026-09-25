import { Button, Modal, TreeSelect } from 'antd';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { AssignCategoryDialogProps } from './AssignCategoryDialog.types';
import { useAssignCategoryDialog } from './useAssignCategoryDialog';

export function AssignCategoryDialog({ open, currentCategoryId, loading, onClose, onAssign }: AssignCategoryDialogProps) {
  const { t } = useI18n('workflow');
  const state = useAssignCategoryDialog({ open, currentCategoryId, onAssign });

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
            <Button danger disabled={loading} onClick={state.remove} data-testid="workflow-assign-category-remove">
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
              disabled={state.selectedId === currentCategoryId}
              onClick={state.assign}
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
          treeData={state.treeData}
          value={state.selectedId ?? undefined}
          onChange={(value) => state.setSelectedId(value ?? null)}
          loading={state.isLoadingCategories}
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
