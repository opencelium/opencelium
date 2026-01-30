/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, { FC } from 'react';
import ReactDOM from 'react-dom';
import Button from '@app_component/base/button/Button';

export interface ConnectionVersioningConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
};

const dialogStyle: React.CSSProperties = {
  width: 'min(520px, 100%)',
  background: '#fff',
  borderRadius: '10px',
  boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
  border: '1px solid rgba(0,0,0,0.12)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid rgba(0,0,0,0.08)',
  fontSize: '16px',
  fontWeight: 700,
};

const bodyStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: '14px',
  color: 'rgba(0,0,0,0.78)',
  lineHeight: 1.4,
};

const footerStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderTop: '1px solid rgba(0,0,0,0.08)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
};

const ConnectionVersioningConfirmDialog: FC<ConnectionVersioningConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const node = (
    <div
      style={overlayStyle}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div style={dialogStyle} role="dialog" aria-modal="true">
        <div style={headerStyle}>{title}</div>
        <div style={bodyStyle}>{message}</div>
        <div style={footerStyle}>
          <Button handleClick={onCancel} label={cancelLabel}/>
          <Button handleClick={onConfirm} label={confirmLabel}/>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(node, document.body);
};

export default ConnectionVersioningConfirmDialog;
