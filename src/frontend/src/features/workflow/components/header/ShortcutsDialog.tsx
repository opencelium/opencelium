import { Fragment } from 'react';
import { Dialog } from '@shared/ui/primitives/Dialog';
import { useI18n } from '@shared/i18n/hooks/useI18n';

type Props = {
  open: boolean;
  onClose: () => void;
};

type ShortcutGroup = {
  titleKey: string;
  items: { keys: string[]; descKey: string }[];
};

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    titleKey: 'shortcutsDialog.groups.canvas',
    items: [
      { keys: ['drag'], descKey: 'shortcutsDialog.items.pan' },
      { keys: ['scroll'], descKey: 'shortcutsDialog.items.zoom' },
    ],
  },
  {
    titleKey: 'shortcutsDialog.groups.nodes',
    items: [
      { keys: ['doubleClick'], descKey: 'shortcutsDialog.items.openConfig' },
      { keys: ['drag'], descKey: 'shortcutsDialog.items.moveNode' },
      { keys: ['ctrl', 'drag'], descKey: 'shortcutsDialog.items.duplicate' },
      { keys: ['ctrl', 'click'], descKey: 'shortcutsDialog.items.multiSelect' },
    ],
  },
  {
    titleKey: 'shortcutsDialog.groups.general',
    items: [
      { keys: ['ctrl', 's'], descKey: 'shortcutsDialog.items.save' },
      { keys: ['esc'], descKey: 'shortcutsDialog.items.close' },
    ],
  },
];

export function ShortcutsDialog({ open, onClose }: Props) {
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
                      <kbd className="shortcutKbd">{t(`shortcutsDialog.keys.${key}`)}</kbd>
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
