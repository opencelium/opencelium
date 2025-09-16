import {
	ConnectionSocketLog,
	DetailedMethodSegment, HttpMethodType, MethodProperty, MethodRequest,
} from '@root/requests/models/ConnectionLog';
import React, {useEffect, useState} from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import ToggleButton from '../ToggleButton/ToggleButton';
import styles from './MethodTrace.module.css';

import LimitedAceEditor from '@app_component/limited_ace_editor/LimitedAceEditor';
import {RootState, useAppDispatch, useAppSelector} from '@application/utils/store';
import {cleanMethodTrace, setTraceConfig} from '@root/redux_toolkit/slices/ConnectionLogSlice';
import {ColorTheme, ITheme} from '@style/Theme';
import Validation from "@application/classes/Validation";
import {getDetailedMethod} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import {ShowIndexPath} from "@app_component/connection_logs/LogsPanel/LogsPanel";
import ErrorMessage from "@app_component/connection_logs/ConnectorPanel/ErrorMessage";
import {isJsonString} from "@application/utils/utils";
import NavItemLog from "@app_component/connection_logs/ConnectorPanel/NavItemLog";
import TabPaneLog from "@app_component/connection_logs/ConnectorPanel/TabPaneLog";

interface MethodTraceProps {
	trace: ConnectionSocketLog<DetailedMethodSegment>;
	flowId: string;
	executionId: string;
	theme: ITheme;
}

function getMethodColor(httpMethod: HttpMethodType): string {
	switch (httpMethod) {
		case 'POST':
			return '#10a54a';
		case 'GET':
			return '#0f6ab4';
		case 'PUT':
			return '#c5862b';
		case 'DELETE':
			return '#a41e22';
		default:
			return '#000000';
	}
}

const MethodTrace: React.FC<MethodTraceProps> = ({
	trace,
	flowId,
	executionId,
	theme
}) => {
	const dispatch = useAppDispatch();
	const {traceConfigs} = useAppSelector((state: RootState) => state.connectionLogReducer);
	const [expanded, setExpanded] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);
	const [requestHeight, setRequestHeight] = useState<number | undefined>();
	const [responseHeight, setResponseHeight] = useState<number | undefined>();
	const [activeRequestTab, setActiveRequestTab] = useState<'header' | 'body'>(
		'body'
	);
	const openFromStoreHeights = () => {
		const stored = traceConfigs[trace.indexPath]?.height;
		if (stored?.request != null) setRequestHeight(stored.request);
		if (stored?.response != null) setResponseHeight(stored.response);
	};
	const [activeResponseTab, setActiveResponseTab] = useState<'header' | 'body'>(
		'body'
	);
	const hasError = !!trace?.error?.message;

	const handleToggle = async () => {
		if (!expanded) {
			setLoading(true);
			if (!hasError) {
				await dispatch(
					getDetailedMethod({
						executionId,
						flowId,
						indexPath: trace.indexPath,
						id: trace.id,
					})
				);
			}
			openFromStoreHeights();
			setLoading(false);
			setExpanded(true);
			dispatch(setTraceConfig({
				indexPath: trace.indexPath,
				config: {
					isOpened: true,
					height: {
						request: requestHeight || traceConfigs[trace.indexPath]?.height.request,
						response: responseHeight || traceConfigs[trace.indexPath]?.height.response,
					}
				}
			}));
		} else {
			if (!hasError) {
				dispatch(
					cleanMethodTrace({flowId, indexPath: trace.indexPath})
				);
			}
			setExpanded(false);
			console.log('setTraceConfig 2')
			console.log({indexPath: trace.indexPath, config: {isOpened: false}})
			dispatch(setTraceConfig({indexPath: trace.indexPath, config: {isOpened: false}}));
		}
	};

	const methodColor = getMethodColor(trace?.segment?.request?.http_method);

	const requestDetails = trace.segment.request;
	const responseDetails = trace.segment.response;

	const requestHeaders = !!requestDetails?.header && isJsonString(requestDetails.header)
		? JSON.stringify(JSON.parse(requestDetails.header), null, 2)
		: '';
	const requestBody =
		requestDetails && requestDetails.payload
			? typeof requestDetails.payload === 'string'
				? requestDetails.payload
				: JSON.stringify(requestDetails.payload, null, 2)
			: '';

	const responseHeaders = !!responseDetails?.header && isJsonString(responseDetails.header)
		? JSON.stringify(JSON.parse(responseDetails.header), null, 2)
		: '';
	const responseBody =
		responseDetails && responseDetails.payload
			? typeof responseDetails.payload === 'string'
				? responseDetails.payload
				: JSON.stringify(responseDetails.payload, null, 2)
			: '';
	const properties = trace?.properties as MethodProperty;
	const url = trace?.segment?.request?.url || '';
	useEffect(() => {
		if (traceConfigs[trace.indexPath]) {
			if (traceConfigs[trace.indexPath].isOpened) {
				handleToggle();
			}
		}
	}, []);
	useEffect(() => {
		const current = traceConfigs[trace.indexPath]?.height;
		const nextReq = requestHeight ?? current?.request;
		const nextRes = responseHeight ?? current?.response;

		if (nextReq !== current?.request || nextRes !== current?.response) {
			console.log('setTraceConfig 3')
			console.log({
				indexPath: trace.indexPath,
				config: { isOpened: true, height: { request: nextReq, response: nextRes } }
			})
			dispatch(setTraceConfig({
				indexPath: trace.indexPath,
				config: { isOpened: true, height: { request: nextReq, response: nextRes } }
			}));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [requestHeight, responseHeight]);
	return (
		<div>
			<div className={styles.methodTrace} onClick={handleToggle}>
				<div className={styles.methodTraceLeftSide}>
					<div style={{minWidth: '40px'}}><ToggleButton
						loading={loading}
						expanded={expanded}
						onClick={handleToggle}
						hasError={hasError}
					/>
					</div>
					{trace?.segment?.request?.http_method && <div
						style={{ backgroundColor: methodColor }}
						className={styles.methodType}
					>
						{trace?.segment?.request?.http_method || ''}
					</div>
					}

					{ShowIndexPath && (
						<div style={{ marginLeft: 8 }}>{trace.indexPath}</div>
					)}
					<div className={styles.methodUrl} style={{color: hasError ? ColorTheme.Red : '#000'}}>
						<span title={url} style={{textDecoration: 'underline'}}>{`${url || (properties?.name) || ''}`}</span>
					</div>
				</div>
				<div
					className={styles.methodTraceRightSide}
					onClick={(e: any) => {
						e.preventDefault();
						e.stopPropagation();
					}}
				>
					{!hasError &&
						<React.Fragment>
							<div className={styles.methodStatus}>{trace.segment?.response?.status || ''}</div>
							<div>{'|'}</div>
							<div className={styles.methodTime}>{trace.segment?.response?.duration || ''}</div>
						</React.Fragment>
					}
				</div>
			</div>

			{expanded && (
				<div className={styles.requestResponseContainer}>
					{hasError ?
						<ErrorMessage trace={trace}/>
					:
					<React.Fragment>
						{/* Request */}
						<div className={styles.methodRequest}>
							<Nav tabs className={styles.nav}>
								<NavItemLog
									navLinkProps={{
										active: activeRequestTab === 'header',
										onClick: (e) => {
											e.preventDefault();
											setActiveRequestTab('header');
										}
									}}
									title={'Header'}
									content={requestHeaders}
								/>
								<NavItemLog
									navLinkProps={{
										active: activeRequestTab === 'body',
										onClick: (e) => {
											e.preventDefault();
											setActiveRequestTab('body');
										}
									}}
									title={'Body'}
									content={requestBody}
								/>
							</Nav>
							<TabContent activeTab={activeRequestTab} className={styles.tabContent}>
								<TabPaneLog height={requestHeight} setHeight={setRequestHeight} tabId={'header'} theme={theme} value={requestHeaders}/>
								<TabPaneLog height={requestHeight} setHeight={setRequestHeight} tabId={'body'} theme={theme} value={requestBody}/>
							</TabContent>
						</div>
						{/* Response */}
						<div className={styles.methodResponse}>
							<Nav tabs className={styles.nav}>
								<NavItemLog
									navLinkProps={{
										active: activeResponseTab === 'header',
										onClick: (e) => {
											e.preventDefault();
											setActiveResponseTab('header');
										}
									}}
									title={'Header'}
									content={responseHeaders}
								/>
								<NavItemLog
									navLinkProps={{
										active: activeResponseTab === 'body',
										onClick: (e) => {
											e.preventDefault();
											setActiveResponseTab('body');
										}
									}}
									title={'Body'}
									content={requestBody}
								/>
							</Nav>
							<TabContent activeTab={activeResponseTab} className={styles.tabContent}>
								<TabPaneLog height={responseHeight} setHeight={setResponseHeight} tabId={'header'} theme={theme} value={responseHeaders}/>
								<TabPaneLog height={responseHeight} setHeight={setResponseHeight} tabId={'body'} theme={theme} value={responseBody}/>
							</TabContent>
						</div>
					</React.Fragment>}
				</div>
			)}
		</div>
	);
};

export default MethodTrace;
