import { Fragment } from 'react';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { IS_MAC } from '@shared/utils/platform';
import { SHORTCUT_GROUPS } from './shortcutsDialog.data';
import type { ShortcutsDialogProps } from './ShortcutsDialog.types';

export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  const { t } = useI18n('workflow');

  return (
    <Dialog open={open} onClose={onClose} title={t('shortcutsDialog.title')} width={460}>
      <div className="shortcutsList">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.titleKey} className="shortcutsGroup">
            <div className="shortcutsGroupTitle">{t(group.titleKey)}</div>
            {group.items.map((item) => (
              <div key={item.descKey} className="shortcutRow">
                <span className="shortcutKeys">
                  {item.keys.map((key, index) => (
                    <Fragment key={key}>
                      {index > 0 && <span className="shortcutPlus">+</span>}
                      <kbd className="shortcutKbd">
                        {key === 'ctrl' && IS_MAC ? '⌘' : t(`shortcutsDialog.keys.${key}`)}
                      </kbd>
                    </Fragment>
                  ))}
                </span>
                <span className="shortcutDesc">{t(item.descKey)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Dialog>
  );
}
