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
	getConnectionVersionBySnapshot, setCurrentConnectionVersion,
} from '@entity/connection/redux_toolkit/action_creators/ConnectionCreators';

import ConnectionVersionHistoryPanel, {
	ConnectionVersionItem,
} from './ConnectionVersionHistoryPanel';

import { ColorTheme, ITheme } from '@style/Theme';
import TooltipButton from '@app_component/base/tooltip_button/TooltipButton';
import Button from '@app_component/base/button/Button';
import Confirmation from '@entity/connection/components/components/general/app/Confirmation';

export interface ConnectionVersioningProps {
	theme: ITheme;
}

function isConnectionEditorLikeRoute(pathname: string): boolean {
  const p = (pathname || '').toLowerCase();

  const isUpdate = /\/connections\/\d+\/update\b/.test(p);
  const isView = /\/connections\/\d+\/view\b/.test(p);
  const isAdd = /\/connections\/add\b/.test(p);

  return isUpdate || isView || isAdd;
}

const ConnectionVersioning: FC<ConnectionVersioningProps> = ({ theme }) => {
	const dispatch = useAppDispatch();
	const location = useLocation();

	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const [pendingOpenHistory, setPendingOpenHistory] = useState(false);

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

	const onSave = useCallback(() => {
		if (!connectionId) return;

		const payload = connectionState?.connection || currentConnection;

		dispatch(updateConnection(payload) as any);
	}, [connectionId, connectionState?.connection, currentConnection, dispatch]);

	const onOpenHistory = useCallback(() => {
		if (!connectionId) return;

		setPendingOpenHistory(true);

		dispatch(getConnectionVersions(connectionId) as any);
	}, [connectionId, dispatch]);

	const onCloseHistory = useCallback(() => {
		setIsHistoryOpen(false);
	}, []);

	const dispatchCurrentVersion = (v: ConnectionVersionItem) => {
		dispatch(
			getConnectionVersionBySnapshot({
				connectionId,
				snapshotId: v.snapshotId,
			}) as any,
		);
		dispatch(setCurrentConnectionVersion({
			connectionId,
			snapshotId: v.snapshotId,
		}))
	}

	const doOpenVersion = useCallback(
		async (v: ConnectionVersionItem) => {
			if (!connectionId) return;

			dispatchCurrentVersion(v);
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

	const versionsLoading =
	connectionState?.gettingConnectionVersions === API_REQUEST_STATE.START;
	const versionsLoaded =
		connectionState?.gettingConnectionVersions === API_REQUEST_STATE.FINISH;

	useEffect(() => {
		if (!pendingOpenHistory) return;

		if (!versionsLoaded) return;

		setPendingOpenHistory(false);
		setIsHistoryOpen(true);
	}, [pendingOpenHistory, versionsLoaded]);

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
			<Button
				handleClick={onSave}
				isDisabled={!isDirty || isSaving}
				label={isSaving ? 'Saving...' : (isDirty ? 'Save' : 'Saved')}
			/>


			<TooltipButton
				target={`version_history`}
				tooltip="Open Version History"
				handleClick={onOpenHistory}
				icon={'history'}
				isLoading={versionsLoading || pendingOpenHistory}
				isDisabled={versionsLoading || pendingOpenHistory}
				hasBackground={true}
				background={ColorTheme.White}
				color={ColorTheme.Gray}
				padding="5px"
			/>

			<ConnectionVersionHistoryPanel
				open={isHistoryOpen}
				onClose={onCloseHistory}
				onSelect={onSelectVersion}
				theme={theme}
			/>

			<Confirmation
				active={!!confirmOpenVersion}
				title={'Confirmation'}
				message={'You did not save the current connection and it will be lost after opening the version. Do you want to continue?'}
				okClick={() => {
					const v = confirmOpenVersion;
					setConfirmOpenVersion(null);
					if (!v) return;

					dispatchCurrentVersion(v);
				}}
				cancelClick={() => setConfirmOpenVersion(null)}
			/>
		</div>
	);
};

export default ConnectionVersioning;
