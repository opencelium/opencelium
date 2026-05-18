import { X } from 'lucide-react';
import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  shifted?: boolean;
  shiftedFar?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
}>;

export function SidebarDrawer({
  open,
  title,
  subtitle,
  onClose,
  shifted,
  shiftedFar,
  secondary,
  tertiary,
  children,
}: Props) {
  return (
    <aside
      className={`rightDrawer ${open ? 'rightDrawerOpen' : ''} ${
        shifted ? 'rightDrawerShifted' : ''
      } ${shiftedFar ? 'rightDrawerShiftedFar' : ''} ${secondary ? 'rightDrawerSecondary' : ''} ${tertiary ? 'rightDrawerTertiary' : ''}`}
    >
      <div className="drawerHeader">
        <div>
          <div className="drawerTitle">{title}</div>
          <div className="drawerSubTitle">{subtitle}</div>
        </div>

        <button className="iconButton" type="button" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="drawerBody">{children}</div>
    </aside>
  );
}
