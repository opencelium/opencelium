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

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@application/utils/store';
import { API_REQUEST_STATE } from '@application/interfaces/IApplication';
import ConnectionVersioningConfirmDialog from './ConnectionVersioningConfirmDialog';
import { getAllUsers } from '@entity/user/redux-toolkit/action_creators/UserCreators';
import {
	getConnectionVersions,
	deleteConnectionVersion,
} from '@entity/connection/redux_toolkit/action_creators/ConnectionCreators';

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
		return new Date(ts).toLocaleString();
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

			if (!snapshotId || typeof createdAt !== 'number') return null;

			return {
				connectionId: it?.connectionId,
				title: it?.title,
				snapshotId: String(snapshotId),
				createdAt: createdAt,
				author: typeof it?.author === 'number' ? it.author : null,
			} as ConnectionVersionItem;
		})
		.filter(Boolean) as ConnectionVersionItem[];
	return mapped;
}

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

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [
		pendingDelete,
		setPendingDelete,
	] = useState<ConnectionVersionItem | null>(null);
	const [deletingSnapshotId, setDeletingSnapshotId] = useState<string | null>(
		null,
	);

	const versions = useMemo(() => {
		const normalized = normalizeVersions(rawVersions);
		return [...normalized].sort((a, b) => b.createdAt - a.createdAt);
	}, [rawVersions]);

	const users = userState?.users || [];

	useEffect(() => {
		if (!open) return;

		if (!loading && (!Array.isArray(users) || users.length === 0)) {
			dispatch(getAllUsers() as any);
		}
	}, [open, loading, users?.length, dispatch]);

	const getAuthorLabel = useCallback(
		(authorId: number): string => {
			if (!authorId || !Array.isArray(users) || users.length === 0)
				return 'Unknown';

			const u = users.find((x: any) => x?.userId === authorId);
			const name = u?.userDetail?.name || '';
			const surname = u?.userDetail?.surname || '';
			const full = `${name} ${surname}`.trim();

			return full || 'Unknown';
		},
		[users],
	);

	const requestDelete = useCallback(
		(e: React.MouseEvent, v: ConnectionVersionItem) => {
			e.preventDefault();
			e.stopPropagation();
			setPendingDelete(v);
			setConfirmOpen(true);
		},
		[],
	);

	const cancelDelete = useCallback(() => {
		setConfirmOpen(false);
		setPendingDelete(null);
	}, []);

	const confirmDelete = useCallback(async () => {
		const v = pendingDelete;
		if (!v?.connectionId || !v?.snapshotId) {
			cancelDelete();
			return;
		}

		try {
			setDeletingSnapshotId(v.snapshotId);

			await dispatch(
				deleteConnectionVersion({
					connectionId: v.connectionId,
					snapshotId: v.snapshotId,
				}) as any,
			).unwrap();

			dispatch(getConnectionVersions(v.connectionId) as any);
		} catch (err) {
		} finally {
			setDeletingSnapshotId(null);
			cancelDelete();
		}
	}, [pendingDelete, dispatch, cancelDelete]);

	if (!open) return null;

	return (
		<>
			<div
				onClick={onClose}
				style={{
					position: 'fixed',
					inset: 0,
					zIndex: 9998,
				}}
			/>
			<div
				style={{
					position: 'fixed',
					top: 0,
					right: 0,
					height: '100vh',
					width: '360px',
					background: '#fff',
					borderLeft: '1px solid rgba(0,0,0,0.12)',
					zIndex: 9999,
					boxShadow: '0 0 20px rgba(0,0,0,0.08)',
					display: 'flex',
					flexDirection: 'column',
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
					<div style={{ fontSize: '18px', fontWeight: 700 }}>
						Version History
					</div>

					<button
						type='button'
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
						title='Close'
					>
						×
					</button>
				</div>

				<div style={{ padding: '0 16px 16px', overflow: 'auto' }}>
					{loading && <div style={{ padding: '8px 0' }}>Loading...</div>}

					{!loading && versions.length === 0 && (
						<div style={{ padding: '8px 0', color: 'rgba(0,0,0,0.6)' }}>
              No versions yet.
            </div>
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
									position: 'relative',
								}}
								title='Open version'
							>
								<div style={{ fontWeight: 700, marginBottom: '4px' }}>
									{formatVersionDate(v.createdAt)}
								</div>

								<div
									style={{
										fontSize: '13px',
										color: 'rgba(0,0,0,0.7)',
										marginBottom: '4px',
									}}
								>
									Author: {getAuthorLabel(v.author)}
								</div>

								<div
									style={{
										fontSize: '12px',
										color: 'rgba(0,0,0,0.6)',
									}}
								>
									SnapshotID: {v.snapshotId}
								</div>

								<button
									type='button'
									onClick={(e) => requestDelete(e, v)}
									disabled={isDeleting}
									title='Delete version'
									style={{
										position: 'absolute',
										top: '10px',
										right: '10px',
										border: 'none',
										background: 'transparent',
										cursor: 'pointer',
										fontSize: '14px',
										color: '#d9534f',
									}}
								>
									🗑
								</button>
							</div>
						);
					})}
				</div>
			</div>

			<ConnectionVersioningConfirmDialog
				open={confirmOpen}
				title='Delete version'
				message='Are you sure you want to delete this version?'
				yesLabel='Delete'
				noLabel='Cancel'
				variant='danger'
				onNo={cancelDelete}
				onYes={confirmDelete}
			/>
		</>
	);
};

export default ConnectionVersionHistoryPanel;
