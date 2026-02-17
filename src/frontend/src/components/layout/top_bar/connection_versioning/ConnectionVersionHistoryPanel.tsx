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

import React, {
	FC,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import ReactDOM from 'react-dom';
import { useAppDispatch, useAppSelector } from '@application/utils/store';
import { API_REQUEST_STATE } from '@application/interfaces/IApplication';

import { getAllUsers } from '@entity/user/redux-toolkit/action_creators/UserCreators';
import { deleteConnectionVersion } from '@entity/connection/redux_toolkit/action_creators/ConnectionCreators';

import Button from '@app_component/base/button/Button';
import TooltipButton from '@app_component/base/tooltip_button/TooltipButton';
import { ColorTheme } from '@style/Theme';
import { useEventListener, setFocusById } from '@application/utils/utils';

import {
	PanelRoot,
	PanelHeader,
	PanelTitle,
	CloseBtn,
	PanelContent,
	EmptyRow,
	TimelineRoot,
	TimelineLine,
	DateRow,
	DateSpacer,
	DateInnerRow,
	DateHr,
	DateLabel,
	ItemRow,
	TimeCol,
	TimeLabel,
	Dot,
	Card,
	CardHeader,
	AuthorText,
	DotsButton,
	DotsIcon,
	DotSmall,
	CommentArea,
	ExpandButtonContainer,
	CommentTextarea,
	SaveRow,
	MenuRoot,
	MenuItem,
} from './ConnectionVersionHistoryPanel.styles';
import Confirmation from '@entity/connection/components/components/general/app/Confirmation';
import Dialog from '@app_component/base/dialog/Dialog';
import InputText from '@app_component/base/input/text/InputText';
import InputTextarea from '@app_component/base/input/textarea/InputTextarea';
import Validation from '@application/classes/Validation';
import { addTemplate, exportTemplate } from '@entity/template/redux_toolkit/action_creators/TemplateCreators';
import { Template } from '@entity/connection/classes/Template';
import { ConnectionRequest } from '@entity/connection/requests/classes/Connection';

export type ConnectionVersionItem = {
	connectionId?: number;
	title?: string;
	snapshotId: string;
	createdAt: number;
	author?: number;
	comment?: string;
};

export interface ConnectionVersionHistoryPanelProps {
	open: boolean;
	onClose: () => void;
	onSelect: (v: ConnectionVersionItem) => void;
	theme: any;
}

function normalizeVersions(raw: any): ConnectionVersionItem[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.map((it: any) => {
			const snapshotId = it?.snapshotId;
			const createdAt = it?.createdAt;
			if (!snapshotId || typeof createdAt !== 'number') return null;

			return {
				connectionId: it?.connectionId,
				title: it?.title,
				snapshotId: String(snapshotId),
				createdAt,
				author: it?.author,
				comment: it?.comment,
			} as ConnectionVersionItem;
		})
		.filter(Boolean) as ConnectionVersionItem[];
}

function pad2(n: number): string {
	return String(n).padStart(2, '0');
}

function formatTimeHHMM(ts: number): string {
	try {
		const d = new Date(ts);
		return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
	} catch {
		return '';
	}
}

function formatDateDDMMYYYY(ts: number): string {
	try {
		const d = new Date(ts);
		const dd = pad2(d.getDate());
		const mm = pad2(d.getMonth() + 1);
		const yyyy = d.getFullYear();
		return `${dd}.${mm}.${yyyy}`;
	} catch {
		return '';
	}
}

type TimelineRow =
	| { kind: 'date'; key: string; dateLabel: string }
	| { kind: 'item'; key: string; item: ConnectionVersionItem };

function buildTimelineRows(
	versionsDesc: ConnectionVersionItem[],
): TimelineRow[] {
	const rows: TimelineRow[] = [];
	let lastDate = '';

	for (const v of versionsDesc) {
		const d = formatDateDDMMYYYY(v.createdAt);
		if (d && d !== lastDate) {
			rows.push({ kind: 'date', key: `date_${d}`, dateLabel: d });
			lastDate = d;
		}
		rows.push({ kind: 'item', key: `item_${v.snapshotId}`, item: v });
	}

	return rows;
}

function stopPropagationOnly(e: any) {
	e.stopPropagation();
}

function stopBoth(e: any) {
	e.preventDefault();
	e.stopPropagation();
}

function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n));
}

function sanitizeConnectionForTemplate(connection: any): any {
	if (!connection || typeof connection !== 'object') return connection;

	const c = JSON.parse(JSON.stringify(connection));
	c.nodeId = null;

	const sanitizeSide = (side: 'fromConnector' | 'toConnector') => {
		const co = c?.[side];
		if (!co || typeof co !== 'object') return;

		co.nodeId = null;

		if (co.invoker && typeof co.invoker === 'object') {
			const name = co.invoker?.name ?? '';
			co.invoker = { name };
		}

		if (!Array.isArray(co.methods)) co.methods = [];
		if (!Array.isArray(co.operators)) co.operators = [];
	};

	sanitizeSide('fromConnector');
	sanitizeSide('toConnector');

	return c;
}

const ConnectionVersionHistoryPanel: FC<ConnectionVersionHistoryPanelProps> = ({
	open,
	onClose,
	onSelect,
}) => {
	const dispatch = useAppDispatch();

	const connectionState = useAppSelector((s: any) => s.connectionReducer);
	const userState = useAppSelector((s: any) => s.userReducer);
	const appVersion = useAppSelector((s: any) => s.applicationReducer?.version);

	const loading =
		connectionState?.gettingConnectionVersions === API_REQUEST_STATE.START;
	const rawVersions = connectionState?.connectionVersions;

	const users = userState?.users || [];
	const usersLoading = userState?.gettingUsers === API_REQUEST_STATE.START;

	const [deletingSnapshotId, setDeletingSnapshotId] = useState<string | null>(
		null,
	);
	const [confirmDelete, setConfirmDelete] = useState<{
		open: boolean;
		v: ConnectionVersionItem | null;
	}>({
		open: false,
		v: null,
	});

	const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
	const [expandedSnapshotId, setExpandedSnapshotId] = useState<string | null>(
		null,
	);
	const [comments, setComments] = useState<Record<string, string>>({});

	const [expandedWidths, setExpandedWidths] = useState<Record<string, number>>(
		{},
	);

	const [hoveredSnapshotId, setHoveredSnapshotId] = useState<string | null>(
		null,
	);

	const [menu, setMenu] = useState<{
		open: boolean;
		snapshotId: string | null;
		x: number;
		y: number;
	}>({ open: false, snapshotId: null, x: 0, y: 0 });

	const [copiedSnapshotId, setCopiedSnapshotId] = useState<string | null>(null);
	const copiedTimerRef = useRef<number | null>(null);

	const panelRef = useRef<HTMLDivElement | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);

	const dotsRefs = useRef<Record<string, HTMLButtonElement | null>>({});

	const [downloadTplDialog, setDownloadTplDialog] = useState<{
		open: boolean;
		v: ConnectionVersionItem | null;
	}>({ open: false, v: null });

	const [templateName, setTemplateName] = useState<string>('');
	const [templateDescription, setTemplateDescription] = useState<string>('');
	const [templateNameError, setTemplateNameError] = useState<string>('');
	const [isDownloadingTemplate, setIsDownloadingTemplate] = useState<boolean>(false);

	const validateTemplateFields = useCallback(() => {
		let err = '';
		if (templateName.trim() === '') {
			err = 'Name is a required field';
			setFocusById('download_template_name');
		}
		setTemplateNameError(err);
		return err === '';
	}, [templateName]);

	const onOpenDownloadTemplateDialog = useCallback((v: ConnectionVersionItem) => {
		setTemplateName('');
		setTemplateDescription('');
		setTemplateNameError('');
		setDownloadTplDialog({ open: true, v });
	}, []);

	const onCloseDownloadTemplateDialog = useCallback(() => {
		if (isDownloadingTemplate) return;
		setDownloadTplDialog({ open: false, v: null });
	}, [isDownloadingTemplate]);

	const onDownloadAsTemplate = useCallback(async () => {
		const v = downloadTplDialog.v;

		if (!v?.connectionId || !v?.snapshotId) {
			setDownloadTplDialog({ open: false, v: null });
			return;
		}

		if (!validateTemplateFields()) return;

		setIsDownloadingTemplate(true);

		try {
			const req = new ConnectionRequest();
			const resp = await req.getConnectionBySnapshot(v.connectionId, v.snapshotId);
			const snapshotConnectionRaw = resp?.data;

			const snapshotConnection = sanitizeConnectionForTemplate(snapshotConnectionRaw);

			const createdTemplate = await dispatch(
				addTemplate(
					new Template({
						name: templateName,
						description: templateDescription,
						version: appVersion || '',
						connection: snapshotConnection,
						dispatch,
					}) as any,
				) as any,
			).unwrap();

			await dispatch(exportTemplate(createdTemplate) as any).unwrap();

			setDownloadTplDialog({ open: false, v: null });
		} catch (e) {
		} finally {
			setIsDownloadingTemplate(false);
		}
	}, [
		downloadTplDialog.v,
		validateTemplateFields,
		dispatch,
		appVersion,
		templateName,
		templateDescription,
	]);

	const closeMenu = useCallback(() => {
		setMenu({ open: false, snapshotId: null, x: 0, y: 0 });
		setCopiedSnapshotId(null);
		if (copiedTimerRef.current) {
			window.clearTimeout(copiedTimerRef.current);
			copiedTimerRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (open) return;

		setExpandedSnapshotId(null);
		setActiveSnapshotId(null);
		setHoveredSnapshotId(null);
		closeMenu();
	}, [open, closeMenu]);

	useEffect(() => {
		return () => {
			if (copiedTimerRef.current) {
				window.clearTimeout(copiedTimerRef.current);
				copiedTimerRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (!open) return;

		const handler = (e: PointerEvent) => {
			if (!menu.open || !menu.snapshotId) return;

			const target = e.target as Node | null;
			if (!target) return;

			const m = menuRef.current;
			if (m && m.contains(target)) return;

			const btn = dotsRefs.current[menu.snapshotId];
			if (btn && btn.contains(target)) return;

			closeMenu();
		};

		window.addEventListener('pointerdown', handler, true);
		return () => window.removeEventListener('pointerdown', handler, true);
	}, [open, menu.open, menu.snapshotId, closeMenu]);

	useEffect(() => {
		if (!open) return;

		const handler = (e: PointerEvent) => {
			if (!expandedSnapshotId) return;

			const targetEl = e.target as HTMLElement | null;
			if (!targetEl) return;

			if (targetEl.closest('[data-oc-comment-area="true"]')) return;

			setExpandedSnapshotId(null);
		};

		window.addEventListener('pointerdown', handler, true);
		return () => window.removeEventListener('pointerdown', handler, true);
	}, [open, expandedSnapshotId]);

	const checkIfClickedOutsidePanel = useCallback(
		(e: any) => {
			if (!open) return;

			const panelEl = panelRef.current;
			if (!panelEl) return;

			if (!panelEl.contains(e.target)) {
				const dialogElement = document.querySelector('[role=dialog]');
				const isPartOfDialog = dialogElement
					? dialogElement.contains(e.target)
					: false;
				const isPartOfMenu = menuRef.current
					? menuRef.current.contains(e.target)
					: false;
				if (!isPartOfDialog && !isPartOfMenu) onClose();
			}
		},
		[open, onClose],
	);

	useEventListener('mousedown', checkIfClickedOutsidePanel, window, open);

	useEffect(() => {
		if (!open) return;

		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				if (menu.open) closeMenu();
				else onClose();
			}
		};

		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open, menu.open, closeMenu, onClose]);

	useEffect(() => {
		if (!open) return;

		if (!usersLoading && (!Array.isArray(users) || users.length === 0)) {
			dispatch(getAllUsers() as any);
		}
	}, [open, usersLoading, users?.length, dispatch]);

	const getAuthorLabel = useCallback(
		(authorId?: number): string => {
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

	const versions = useMemo(() => {
		const normalized = normalizeVersions(rawVersions);
		return [...normalized].sort((a, b) => b.createdAt - a.createdAt);
	}, [rawVersions]);

	useEffect(() => {
		setComments((prev) => {
			const next = { ...prev };
			for (const v of versions) {
				if (next[v.snapshotId] === undefined) next[v.snapshotId] = v.comment ?? '';
			}
			return next;
		});
	}, [versions]);

	const rows = useMemo(() => buildTimelineRows(versions), [versions]);

	const onAskDelete = useCallback((v: ConnectionVersionItem) => {
		setConfirmDelete({ open: true, v });
	}, []);

	const onConfirmDelete = useCallback(async () => {
		const v = confirmDelete.v;
		if (!v?.connectionId || !v?.snapshotId) {
			setConfirmDelete({ open: false, v: null });
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
		} finally {
			setDeletingSnapshotId(null);
			setConfirmDelete({ open: false, v: null });
		}
	}, [confirmDelete.v, dispatch]);

	const onCancelDelete = useCallback(() => {
		setConfirmDelete({ open: false, v: null });
	}, []);

	const onToggleMenu = useCallback((e: any, v: ConnectionVersionItem) => {
		stopBoth(e);

		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const desiredX = rect.right + 8;
		const desiredY = rect.top;

		setCopiedSnapshotId(null);
		if (copiedTimerRef.current) {
			window.clearTimeout(copiedTimerRef.current);
			copiedTimerRef.current = null;
		}

		setMenu((prev) => {
			if (prev.open && prev.snapshotId === v.snapshotId)
				return { open: false, snapshotId: null, x: 0, y: 0 };
			return { open: true, snapshotId: v.snapshotId, x: desiredX, y: desiredY };
		});
	}, []);

	const onMenuCopySnapshot = useCallback(
		async (v: ConnectionVersionItem) => {
			try {
				await navigator.clipboard.writeText(v.snapshotId);
			} catch (e) {
				try {
					const ta = document.createElement('textarea');
					ta.value = v.snapshotId;
					ta.style.position = 'fixed';
					ta.style.left = '-9999px';
					ta.style.top = '0';
					document.body.appendChild(ta);
					ta.focus();
					ta.select();
					document.execCommand('copy');
					document.body.removeChild(ta);
				} catch (e2) {
				}
			}

			setCopiedSnapshotId(v.snapshotId);

			if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
			copiedTimerRef.current = window.setTimeout(() => {
				setCopiedSnapshotId(null);
				closeMenu();
			}, 1200);
		},
		[closeMenu],
	);

	const onMenuDelete = useCallback(
		(v: ConnectionVersionItem) => {
			closeMenu();
			onAskDelete(v);
		},
		[closeMenu, onAskDelete],
	);

	const onSaveComment = useCallback(
		async (e: any, v: ConnectionVersionItem) => {
			stopBoth(e);
			// TODO: dispatch save comment
			setActiveSnapshotId(null);
		},
		[],
	);

	const computeExpandedWidthFor = useCallback(
		(snapshotId: string, textareaEl: HTMLTextAreaElement | null) => {
			if (!textareaEl) return;
			const panelEl = panelRef.current;
			if (!panelEl) return;

			const panelRect = panelEl.getBoundingClientRect();
			const taRect = textareaEl.getBoundingClientRect();

			const padding = 16;
			const maxAllowed = Math.floor(taRect.right - panelRect.left - padding);

			const desired = 460;
			const minW = 320;
			const w = clamp(desired, minW, Math.max(minW, maxAllowed));

			setExpandedWidths((prev) =>
				prev[snapshotId] === w ? prev : { ...prev, [snapshotId]: w },
			);
		},
		[],
	);

	const focusComment = useCallback((snapshotId: string) => {
		const el = document.getElementById(
			`comment_ta_${snapshotId}`,
		) as HTMLTextAreaElement | null;
		if (!el) return;
		try {
			el.focus();
			const len = el.value?.length ?? 0;
			el.setSelectionRange(len, len);
		} catch {}
		setActiveSnapshotId(snapshotId);
	}, []);

	const timelineMemo = useMemo(() => {
		return (
			<TimelineRoot>
				<TimelineLine />

				{rows.map((row) => {
					if (row.kind === 'date') {
						return (
							<DateRow key={row.key}>
								<DateSpacer />
								<DateInnerRow>
									<DateHr />
									<DateLabel>{row.dateLabel}</DateLabel>
									<DateHr />
								</DateInnerRow>
							</DateRow>
						);
					}

					const v = row.item;
					const timeLabel = formatTimeHHMM(v.createdAt);

					const isActive = activeSnapshotId === v.snapshotId;
					const isExpanded = expandedSnapshotId === v.snapshotId;
					const isHovered = hoveredSnapshotId === v.snapshotId;
					const showExpand = isActive || isHovered;

					const commentValue = comments[v.snapshotId] ?? '';

					const normalWidth = 320;
					const expandedWidth = expandedWidths[v.snapshotId] ?? 420;
					const shiftLeft = isExpanded ? Math.max(0, expandedWidth - normalWidth) : 0;

					return (
						<ItemRow key={row.key}>
							<TimeCol>
								<TimeLabel>{timeLabel}</TimeLabel>
								<Dot />
							</TimeCol>

							<Card onClick={() => onSelect(v)} $width={normalWidth}>
								<CardHeader>
									<AuthorText>Author: {getAuthorLabel(v.author)}</AuthorText>

									<DotsButton
										ref={(el) => {
											dotsRefs.current[v.snapshotId] = el;
										}}
										type='button'
										title='Menu'
										onMouseDown={stopBoth}
										onClick={(e) => onToggleMenu(e, v)}
									>
										<DotsIcon>
											<DotSmall />
											<DotSmall />
											<DotSmall />
										</DotsIcon>
									</DotsButton>
								</CardHeader>

								<CommentArea
									data-oc-comment-area='true'
									onMouseEnter={() => setHoveredSnapshotId(v.snapshotId)}
									onMouseLeave={() =>
										setHoveredSnapshotId((prev) => (prev === v.snapshotId ? null : prev))
									}
								>
									{showExpand && (
										<ExpandButtonContainer onMouseDown={stopBoth} onClick={stopBoth}>
											<TooltipButton
												position={'bottom'}
												icon={isExpanded ? 'close_fullscreen' : 'open_in_full'}
												tooltip={isExpanded ? 'Minimize' : 'Maximize'}
												target={`version_comment_expand_${v.snapshotId}`}
												hasBackground={true}
												background={isExpanded ? ColorTheme.Blue : ColorTheme.White}
												color={isExpanded ? ColorTheme.White : ColorTheme.Gray}
												padding='2px'
												handleClick={(e: any) => {
													stopBoth(e);

													if (!isExpanded) {
														const ta = document.getElementById(
															`comment_ta_${v.snapshotId}`,
														) as HTMLTextAreaElement | null;
														computeExpandedWidthFor(v.snapshotId, ta);
														setExpandedSnapshotId(v.snapshotId);
													} else {
														setExpandedSnapshotId(null);
													}

													Promise.resolve().then(() => focusComment(v.snapshotId));
												}}
											/>
										</ExpandButtonContainer>
									)}

									<CommentTextarea
										id={`comment_ta_${v.snapshotId}`}
										value={commentValue}
										placeholder='Comment'
										onMouseDown={stopPropagationOnly}
										onClick={stopPropagationOnly}
										onFocus={(e) => {
											e.stopPropagation();
											setActiveSnapshotId(v.snapshotId);
										}}
										onBlur={(e) => {
											e.stopPropagation();
											setActiveSnapshotId((prev) => (prev === v.snapshotId ? null : prev));
										}}
										onChange={(e) => {
											const val = e.target.value;
											setComments((prev) => ({ ...prev, [v.snapshotId]: val }));
										}}
										$expanded={isExpanded}
										$expandedWidth={expandedWidth}
										$shiftLeft={shiftLeft}
									/>

									{isActive && (
										<SaveRow
											onMouseDown={(e) => {
												e.preventDefault();
												e.stopPropagation();
											}}
											onClick={stopPropagationOnly}
										>
											<Button handleClick={onSaveComment as any} label='Save' />
										</SaveRow>
									)}
								</CommentArea>
							</Card>
						</ItemRow>
					);
				})}
			</TimelineRoot>
		);
	}, [
		rows,
		activeSnapshotId,
		expandedSnapshotId,
		hoveredSnapshotId,
		comments,
		expandedWidths,
		onSelect,
		getAuthorLabel,
		onToggleMenu,
		computeExpandedWidthFor,
		focusComment,
		onSaveComment,
	]);

	const renderMenu = useCallback(() => {
		if (!menu.open || !menu.snapshotId) return null;

		const v = versions.find((x) => x.snapshotId === menu.snapshotId);
		if (!v) return null;

		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const width = 210;
		const height = 3 * 40;

		let x = menu.x;
		let y = menu.y;
		if (x + width > vw - 8) x = vw - width - 8;
		if (y + height > vh - 8) y = vh - height - 8;
		if (x < 8) x = 8;
		if (y < 8) y = 8;

		const isDeleting = deletingSnapshotId === v.snapshotId;
		const isCopied = copiedSnapshotId === v.snapshotId;

		return (
			<MenuRoot ref={menuRef} style={{ left: x, top: y }}>
				<MenuItem
					$isDisabled={isCopied}
					style={{
						color: isCopied ? ColorTheme.Blue : undefined,
						fontWeight: isCopied ? 600 : undefined,
					}}
					onMouseDown={(e) => {
						stopBoth(e);
						if (isCopied) return;
						onMenuCopySnapshot(v);
					}}
					onClick={stopBoth}
				>
					{isCopied ? 'Copied' : 'Copy snapshotId'}
				</MenuItem>

				<MenuItem
					onMouseDown={(e) => {
						stopBoth(e);
						closeMenu();
						onOpenDownloadTemplateDialog(v);
					}}
					onClick={stopBoth}
				>
					Download as Template
				</MenuItem>

				<MenuItem
					$isDisabled={isDeleting}
					style={{
						color: isDeleting ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.88)',
					}}
					onMouseDown={(e) => {
						stopBoth(e);
						onMenuDelete(v);
					}}
					onClick={stopBoth}
				>
					Delete
				</MenuItem>
			</MenuRoot>
		);
	}, [
		menu.open,
		menu.snapshotId,
		menu.x,
		menu.y,
		versions,
		deletingSnapshotId,
		copiedSnapshotId,
		onMenuCopySnapshot,
		onMenuDelete,
		closeMenu,
		onOpenDownloadTemplateDialog,
	]);

	const node = (
		<>
			<Confirmation
				active={confirmDelete.open}
				title={'Confirmation'}
				message={'Are you sure you want to delete this version?'}
				okClick={onConfirmDelete}
				cancelClick={onCancelDelete}
			/>

			<Dialog
				active={downloadTplDialog.open}
				toggle={onCloseDownloadTemplateDialog}
				title={'Download as Template'}
				actions={[
					{
						id: 'download_as_template_ok',
						label: isDownloadingTemplate ? 'Downloading...' : 'Download',
						onClick: onDownloadAsTemplate,
						isLoading: isDownloadingTemplate,
					},
					{
						id: 'download_as_template_cancel',
						label: 'Cancel',
						onClick: onCloseDownloadTemplateDialog,
					},
				]}
			>
				<InputText
					id={'download_template_name'}
					maxLength={Validation.TextLength.Short}
					error={templateNameError}
					onChange={(e) => {
						setTemplateName(e.target.value);
						setTemplateNameError('');
					}}
					value={templateName}
					label={'Name'}
					name={'download_template_name'}
					icon={'title'}
					autoFocus
					required
				/>

				<InputTextarea
					id={'download_template_description'}
					maxLength={Validation.TextLength.Medium}
					onChange={(e) => setTemplateDescription(e.target.value)}
					value={templateDescription}
					label={'Description'}
					name={'download_template_description'}
					icon={'notes'}
				/>
			</Dialog>

			{renderMenu()}

			<PanelRoot ref={panelRef} $open={open}>
				<PanelHeader>
					<PanelTitle>Version History</PanelTitle>

					<CloseBtn type='button' onClick={onClose} title='Close' tabIndex={open ? 0 : -1}>
						×
					</CloseBtn>
				</PanelHeader>

				<PanelContent>
					{!loading && versions.length === 0 && <EmptyRow>No versions yet.</EmptyRow>}
					{timelineMemo}
				</PanelContent>
			</PanelRoot>
		</>
	);

	return ReactDOM.createPortal(node, document.body);
};

export default ConnectionVersionHistoryPanel;
