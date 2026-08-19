import { useI18n } from '@shared/i18n/hooks/useI18n';
import { WorkflowMenuItem } from '../WorkflowMenuItem/WorkflowMenuItem';
import type { HeaderMenuProps } from './HeaderMenu.types';
import { useHeaderMenu } from './useHeaderMenu';

export function HeaderMenu({ open, items, onClose, onSelect, loadingItemId }: HeaderMenuProps) {
  const { t } = useI18n('workflow');
  const { ref, sections } = useHeaderMenu({ open, items, onClose, loadingItemId });

  if (!open) return null;

  return (
    <div ref={ref} className="headerMenu">
      {Object.entries(sections).map(([sectionKey, sectionItems]) => (
        <div key={sectionKey} className="headerMenuSection">
          {sectionItems.map((item) => {
            const isLoading = item.id === loadingItemId;
            return (
              <WorkflowMenuItem
                key={item.id}
                className="headerMenuItem"
                label={t(item.labelKey)}
                loading={isLoading}
                disabled={item.disabled}
                tooltip={item.disabled && item.disabledTooltipKey ? t(item.disabledTooltipKey) : undefined}
                badge={item.badgeKey ? <span className="headerMenuBadge">{t(item.badgeKey)}</span> : undefined}
                onClick={() => {
                  if (item.disabled) return;
                  onSelect?.(item);
                  if (!item.keepOpenOnSelect) onClose();
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
