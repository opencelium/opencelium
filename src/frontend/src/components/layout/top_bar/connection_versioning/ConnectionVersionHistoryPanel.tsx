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

import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@application/utils/store';
import { API_REQUEST_STATE } from '@application/interfaces/IApplication';

import { getAllUsers } from '@entity/user/redux-toolkit/action_creators/UserCreators';
import { deleteConnectionVersion } from '@entity/connection/redux_toolkit/action_creators/ConnectionCreators';

import ConnectionVersioningConfirmDialog from './ConnectionVersioningConfirmDialog';

import TooltipButton from '@app_component/base/tooltip_button/TooltipButton';
import { ColorTheme } from '@style/Theme';
import { useEventListener } from '@application/utils/utils';


export type ConnectionVersionItem = {
	connectionId?: number;
	title?: string;
	snapshotId: string;
	createdAt: number;
	author?: number;
};

export interface ConnectionVersionHistoryPanelProps {
	open: boolean;
	onClose: () => void;
	onSelect: (v: ConnectionVersionItem) => void;
	theme: any;
}

function formatVersionDate(ts: number): string {
  try {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mon = d.toLocaleString('en-US', { month: 'short' });
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy} ${mon} ${dd} at ${hh}:${mm}:${ss}`;
  } catch {
    return `${ts}`;
  }
}

function normalizeVersions(raw: any): ConnectionVersionItem[] {
  if (!Array.isArray(raw)) return [];

  const mapped = raw
    .map((it: any) => {
      const snapshotId = it?.snapshotId;
      const createdAt = it?.createdAt;
      const author = it?.author;

      if (!snapshotId || typeof createdAt !== 'number') return null;

      return {
        connectionId: it?.connectionId,
        title: it?.title,
        snapshotId: String(snapshotId),
        createdAt: createdAt,
        author: author,
      } as ConnectionVersionItem;
    })
    .filter(Boolean) as ConnectionVersionItem[];

  return mapped;
}

const panelBaseStyle: React.CSSProperties = {
  overflowY: 'auto',
  position: 'fixed',
  top: 0,
  height: '100vh',
  width: '360px',
  background: '#fff',
  borderLeft: '1px solid rgba(0,0,0,0.12)',
  zIndex: 9999,
  boxShadow: '0 0 20px rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s',
};

const ConnectionVersionHistoryPanel: FC<ConnectionVersionHistoryPanelProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const dispatch = useAppDispatch();

  const connectionState = useAppSelector((s: any) => s.connectionReducer);
  const userState = useAppSelector((s: any) => s.userReducer);

  const loading = connectionState?.gettingConnectionVersions === API_REQUEST_STATE.START;
  const rawVersions = connectionState?.connectionVersions;

  const users = userState?.users || [];
  const usersLoading = userState?.gettingUsers === API_REQUEST_STATE.START;

  const [deletingSnapshotId, setDeletingSnapshotId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; v: ConnectionVersionItem | null }>({
    open: false,
    v: null,
  });

  const panelRef = useRef() as React.MutableRefObject<HTMLDivElement | null>;

  const checkIfClickedOutside = useCallback(
    (e: any) => {
      if (panelRef.current !== null) {
        if (open && panelRef.current && !panelRef.current.contains(e.target)) {
          const dialogElement = document.querySelector('[role=dialog]');
          const isPartOfDialog = dialogElement ? dialogElement.contains(e.target) : false;
          if (!isPartOfDialog) {
            onClose();
          }
        }
      }
    },
    [open, onClose],
  );

  useEventListener('mousedown', checkIfClickedOutside, window, open);

  useEffect(() => {
    if (!open) return;

    if (!usersLoading && (!Array.isArray(users) || users.length === 0)) {
      dispatch(getAllUsers() as any);
    }
  }, [open, usersLoading, users?.length, dispatch]);

  const getAuthorLabel = useCallback(
    (authorId?: number): string => {
      if (!authorId || !Array.isArray(users) || users.length === 0) return 'Unknown';

      const u = users.find((x: any) => x?.userId === authorId);
      const name = u?.userDetail?.name || '';
      const surname = u?.userDetail?.surname || '';
      const full = `${name} ${surname}`.trim();

      return full || 'Unknown';
    },
    [users],
  );

  const versions = useMemo(() => {
    const normalized = normalizeVersions(rawVersions);
    return [...normalized].sort((a, b) => b.createdAt - a.createdAt);
  }, [rawVersions]);

  const onAskDelete = useCallback((e: React.MouseEvent, v: ConnectionVersionItem) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDelete({ open: true, v });
  }, []);

  const onConfirmDelete = useCallback(async () => {
    const v = confirmDelete.v;
    if (!v?.connectionId || !v?.snapshotId) {
      setConfirmDelete({ open: false, v: null });
      return;
    }

    const connectionId = v.connectionId;
    const snapshotId = v.snapshotId;

    try {
      setDeletingSnapshotId(snapshotId);

      await dispatch(deleteConnectionVersion({ connectionId, snapshotId }) as any).unwrap();
    } catch (err) {
    } finally {
      setDeletingSnapshotId(null);
      setConfirmDelete({ open: false, v: null });
    }
  }, [confirmDelete.v, dispatch]);

  const onCancelDelete = useCallback(() => {
    setConfirmDelete({ open: false, v: null });
  }, []);

  return (
    <>
      <ConnectionVersioningConfirmDialog
        open={confirmDelete.open}
        title="Delete version"
        message="Are you sure you want to delete this version?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />

      <div
        ref={panelRef}
        style={{
          ...panelBaseStyle,
          right: open ? '0' : '-360px',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div
          style={{
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 700 }}>Version History</div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid rgba(0,0,0,0.12)',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: '28px',
            }}
            title="Close"
            tabIndex={open ? 0 : -1}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '0 16px 16px 16px', overflow: 'auto' }}>
          {loading && <div style={{ padding: '8px 0' }}>Loading...</div>}

          {!loading && versions.length === 0 && (
            <div style={{ padding: '8px 0', color: 'rgba(0,0,0,0.6)' }}>No versions yet.</div>
          )}

          {versions.map((v) => {
            const isDeleting = deletingSnapshotId === v.snapshotId;

            return (
              <div
                key={v.snapshotId}
                onClick={() => onSelect(v)}
                style={{
                  padding: '12px',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>{formatVersionDate(v.createdAt)}</div>

                  <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.7)', marginBottom: '4px' }}>
                    Author: {getAuthorLabel(v.author)}
                  </div>

                  <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.7)' }}>SnapshotID: {v.snapshotId}</div>
                </div>

                <TooltipButton
                  target={`delete_version_${v.snapshotId}`}
                  tooltip="Delete version"
                  handleClick={(e: any) => onAskDelete(e, v)}
                  icon={'delete'}
                  isDisabled={isDeleting}
                  hasBackground={true}
                  background={ColorTheme.White}
                  color={ColorTheme.Gray}
                  padding="5px"
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ConnectionVersionHistoryPanel;
