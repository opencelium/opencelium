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
import { useLocation } from 'react-router';

import { useAppDispatch, useAppSelector } from '@application/utils/store';
import { API_REQUEST_STATE } from '@application/interfaces/IApplication';

import {
	updateConnection,
	getConnectionVersions,
	getConnectionVersionBySnapshot,
} from '@entity/connection/redux_toolkit/action_creators/ConnectionCreators';

import ConnectionVersionHistoryPanel, {
	ConnectionVersionItem,
} from './ConnectionVersionHistoryPanel';

import { ITheme } from '@style/Theme';
import ConnectionVersioningConfirmDialog from './ConnectionVersioningConfirmDialog';

export interface ConnectionVersioningProps {
	theme: ITheme;
}

function isConnectionEditorLikeRoute(pathname: string): boolean {
	const p = (pathname || '').toLowerCase();
	const isConnections = p.includes('/connections');
	return isConnections;
}

const ConnectionVersioning: FC<ConnectionVersioningProps> = ({ theme }) => {
	const dispatch = useAppDispatch();
	const location = useLocation();

	const [isHistoryOpen, setIsHistoryOpen] = useState(false);

	const [confirmOpenVersion, setConfirmOpenVersion] = useState<null | ConnectionVersionItem>(null);
	const [
		pendingVersion,
		setPendingVersion,
	] = useState<ConnectionVersionItem | null>(null);

	const pathname = location?.pathname || '';
	const isEditorRoute = useMemo(() => isConnectionEditorLikeRoute(pathname), [
		pathname,
	]);

	const connectionState = useAppSelector((s: any) => s.connectionReducer);

	const currentConnection =
		connectionState?.currentConnection || connectionState?.connection || null;

	const connectionId = useMemo(() => {
		if (!currentConnection) return null;
		return currentConnection.id || currentConnection.connectionId || null;
	}, [currentConnection]);

	const isDirty = !!connectionState?.isDirty;

	const canShow = isEditorRoute && !!connectionId;

	const isSaving =
		connectionState?.updatingConnection === API_REQUEST_STATE.START;
	const isSaved =
		connectionState?.updatingConnection === API_REQUEST_STATE.FINISH &&
		!connectionState?.isDirty;

	const saveLabel = useMemo(() => {
		if (!canShow) return '';
		if (isSaving) return 'Saving...';
		return isSaved ? 'Saved' : 'Save';
	}, [canShow, isSaving, isSaved]);

	const onSave = useCallback(() => {
		if (!connectionId) return;

		const payload = connectionState?.connection || currentConnection;

		dispatch(updateConnection(payload) as any);
	}, [connectionId, connectionState?.connection, currentConnection, dispatch]);

	const onOpenHistory = useCallback(() => {
		if (!connectionId) return;

		setIsHistoryOpen(true);

		dispatch(getConnectionVersions(connectionId) as any);
	}, [connectionId, dispatch]);

	const onCloseHistory = useCallback(() => {
		setIsHistoryOpen(false);
	}, []);

	const doOpenVersion = useCallback(
		(v: ConnectionVersionItem) => {
			if (!connectionId) return;

			dispatch(
				getConnectionVersionBySnapshot({
					connectionId,
					snapshotId: v.snapshotId,
				}) as any,
			);

			setIsHistoryOpen(false);
		},
		[connectionId, dispatch],
	);

	const onSelectVersion = useCallback(
		(v: ConnectionVersionItem) => {
			if (!connectionId) return;

			if (isDirty) {
				setPendingVersion(v);
				setConfirmOpenVersion(v);
				return;
			}

			doOpenVersion(v);
		},
		[connectionId, doOpenVersion, isDirty],
	);

	useEffect(() => {
		if (!connectionId) return;

		const finished =
			connectionState?.updatingConnection === API_REQUEST_STATE.FINISH;
		if (finished && isHistoryOpen) {
			dispatch(getConnectionVersions(connectionId) as any);
		}
	}, [
		connectionId,
		connectionState?.updatingConnection,
		dispatch,
		isHistoryOpen,
	]);

	if (!canShow) return null;

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '8px',
				marginRight: '10px',
			}}
		>
			<button
				type='button'
				onClick={onSave}
				disabled={isSaving}
				style={{
					height: '34px',
					padding: '0 14px',
					borderRadius: '6px',
					border: '1px solid rgba(0,0,0,0.1)',
					background: '#7da0d6',
					color: '#fff',
					cursor: 'pointer',
					fontSize: '14px',
					fontWeight: 600,
				}}
				title={isSaved ? 'Saved' : 'Save'}
			>
				{saveLabel}
			</button>

			<button
				type='button'
				onClick={onOpenHistory}
				style={{
					width: '34px',
					height: '34px',
					borderRadius: '6px',
					border: '1px solid rgba(0,0,0,0.12)',
					background: '#fff',
					cursor: 'pointer',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
				title='Version history'
			>
				<svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
					<path
						d='M12 8v5l3 2'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
					/>
					<path
						d='M3 12a9 9 0 1 0 3-6.7'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
					/>
					<path
						d='M3 4v5h5'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
					/>
				</svg>
			</button>

			<ConnectionVersionHistoryPanel
				open={isHistoryOpen}
				onClose={onCloseHistory}
				onSelect={onSelectVersion}
				theme={theme}
			/>

			<ConnectionVersioningConfirmDialog
				open={!!confirmOpenVersion}
				title="Unsaved changes"
				message="You did not save the current connection and it will be lost after opening the version. (Yes/no)"
				yesLabel="Yes"
				noLabel="No"
				onNo={() => setConfirmOpenVersion(null)}
				onYes={() => {
					const v = confirmOpenVersion;
					setConfirmOpenVersion(null);
					if (!v) return;

					dispatch(getConnectionVersionBySnapshot({ connectionId: connectionId!, snapshotId: v.snapshotId }) as any);
					setIsHistoryOpen(false);
				}}
			/>
		</div>
	);
};

export default ConnectionVersioning;
