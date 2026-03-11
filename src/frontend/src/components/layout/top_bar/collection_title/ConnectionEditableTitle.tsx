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

import React, { FC, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import Text from '@app_component/base/text/Text';
import Button from '@app_component/base/button/Button';
import { ColorTheme } from '@style/Theme';
import { EntityHeaderTextSize } from '@entity/application/utils/constants';
import { useAppDispatch, useAppSelector } from '@application/utils/store';
import { setEntityHeader } from '@application/redux_toolkit/slices/ApplicationSlice';
import { setConnection } from '@root/redux_toolkit/slices/ConnectionSlice';
import { getAndUpdateConnectionTitle } from '@entity/connection/redux_toolkit/action_creators/ConnectionCreators';
import {
	ConnectionEditableTitleStyled,
	ConnectionTitleActionsStyled,
	ConnectionTitleInputStyled,
	ConnectionTitleTextStyled,
} from './styles';
import { API_REQUEST_STATE } from '@application/interfaces/IApplication';

interface ConnectionEditableTitleProps {
	title: string;
}

const PLACEHOLDER_TITLES = ['Add Connection', 'Update Connection'];

const ConnectionEditableTitle: FC<ConnectionEditableTitleProps> = ({
	title,
}) => {
	const dispatch = useAppDispatch();

	const { connection, currentConnection, updatingConnection } = useAppSelector(
		(state) => state.connectionReducer,
	);

	const activeConnection = useMemo(() => {
		return connection || currentConnection || null;
	}, [connection, currentConnection]);

	const resolvedTitle = useMemo(() => {
		if (activeConnection?.title && `${activeConnection.title}`.trim() !== '') {
			return `${activeConnection.title}`;
		}
		return title || '';
	}, [activeConnection, title]);

	const canEdit = useMemo(() => {
		if (!resolvedTitle || `${resolvedTitle}`.trim() === '') {
			return false;
		}
		return !PLACEHOLDER_TITLES.includes(`${resolvedTitle}`.trim());
	}, [resolvedTitle]);

	const [isEditing, setIsEditing] = useState(false);
	const [draftTitle, setDraftTitle] = useState(resolvedTitle);

	useEffect(() => {
		if (!isEditing) {
			setDraftTitle(resolvedTitle);
		}
	}, [resolvedTitle, isEditing]);

	const saveTitle = async () => {
		const normalizedTitle = `${draftTitle || ''}`.trim();

		if (!normalizedTitle) {
			return;
		}

		const baseConnection = connection || currentConnection || {};

		const connectionId =
			baseConnection?.id || baseConnection?.connectionId || null;

		const updatedConnection = {
			...baseConnection,
			title: normalizedTitle,
		};

		dispatch(setEntityHeader(normalizedTitle));
		dispatch(setConnection(updatedConnection as any));

		if (connectionId) {
			await dispatch(
				getAndUpdateConnectionTitle({
					...currentConnection,
					...updatedConnection,
					id: connectionId,
					connectionId,
				} as any),
			);
		}

		setIsEditing(false);
	};

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			saveTitle();
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			setDraftTitle(resolvedTitle);
			setIsEditing(false);
		}
	};

	if (isEditing) {
		return (
			<ConnectionEditableTitleStyled>
				<ConnectionTitleInputStyled
					autoFocus
					value={draftTitle}
					onChange={(e) => setDraftTitle(e.target.value)}
					onKeyDown={onKeyDown}
					maxLength={256}
				/>
				<ConnectionTitleActionsStyled>
					<Button
						hasBackground={false}
						icon={'check'}
						color={ColorTheme.Blue}
						isLoading={updatingConnection === API_REQUEST_STATE.START}
						handleClick={saveTitle}
					/>
					<Button
						hasBackground={false}
						icon={'close'}
						color={ColorTheme.Gray}
						handleClick={() => {
							setDraftTitle(resolvedTitle);
							setIsEditing(false);
						}}
					/>
				</ConnectionTitleActionsStyled>
			</ConnectionEditableTitleStyled>
		);
	}

	return (
		<ConnectionEditableTitleStyled>
			<ConnectionTitleTextStyled>
				<Text value={resolvedTitle} size={`${EntityHeaderTextSize}px`} />
			</ConnectionTitleTextStyled>
			{canEdit && (
				<ConnectionTitleActionsStyled>
					<Button
						hasBackground={false}
						icon={'edit'}
						iconSize={'16px'}
						color={ColorTheme.Gray}
						handleClick={() => setIsEditing(true)}
					/>
				</ConnectionTitleActionsStyled>
			)}
		</ConnectionEditableTitleStyled>
	);
};

export default ConnectionEditableTitle;
