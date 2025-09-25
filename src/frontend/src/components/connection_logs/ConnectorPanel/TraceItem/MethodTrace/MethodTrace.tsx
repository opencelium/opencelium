import {
	ConnectionSocketLog,
	DetailedMethodSegment, HttpMethodType, MethodProperty,
} from '@root/requests/models/ConnectionLog';
import React, {useEffect, useState} from 'react';
import { Nav, TabContent } from 'reactstrap';
import ToggleButton from '../ToggleButton/ToggleButton';
import styles from './MethodTrace.module.css';

import {RootState, useAppDispatch, useAppSelector} from '@application/utils/store';
import {cleanMethodTrace, setTraceConfig} from '@root/redux_toolkit/slices/ConnectionLogSlice';
import {ColorTheme, ITheme} from '@style/Theme';
import {getDetailedMethod} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import {ShowIndexPath} from "@app_component/connection_logs/LogsPanel/LogsPanel";
import ErrorMessage from "@app_component/connection_logs/ConnectorPanel/TraceItem/MethodTrace/ErrorMessage";
import {isJsonString} from "@application/utils/utils";
import NavItemLog from "@app_component/connection_logs/ConnectorPanel/TraceItem/MethodTrace/NavItemLog";
import TabPaneLog from "@app_component/connection_logs/ConnectorPanel/TraceItem/MethodTrace/TabPaneLog";
import MethodTraceExpander
	from "@app_component/connection_logs/ConnectorPanel/TraceItem/MethodTrace/MethodTraceExpander";

interface MethodTraceProps {
	trace: ConnectionSocketLog<DetailedMethodSegment>;
	flowId: string;
	executionId: string;
	theme: ITheme;
}

export

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
		if (!!stored?.request) setRequestHeight(stored.request);
		if (!!stored?.response) setResponseHeight(stored.response);
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
						request: requestHeight || traceConfigs[trace.indexPath]?.height?.request,
						response: responseHeight || traceConfigs[trace.indexPath]?.height?.response,
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
			dispatch(setTraceConfig({indexPath: trace.indexPath, config: {isOpened: false}}));
		}
	};
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
			dispatch(setTraceConfig({
				indexPath: trace.indexPath,
				config: { isOpened: true, height: { request: nextReq, response: nextRes } }
			}));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [requestHeight, responseHeight]);
	return (
		<div>
			<MethodTraceExpander trace={trace} expanded={expanded} loading={loading} handleToggle={handleToggle}/>

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
								/>
							</Nav>
							<TabContent activeTab={activeRequestTab} className={styles.tabContent}>
								<TabPaneLog height={requestHeight} setHeight={setRequestHeight} tabId={'header'} theme={theme} value={requestHeaders} content={requestHeaders}/>
								<TabPaneLog height={requestHeight} setHeight={setRequestHeight} tabId={'body'} theme={theme} value={requestBody} content={requestBody}/>
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
								/>
							</Nav>
							<TabContent activeTab={activeResponseTab} className={styles.tabContent}>
								<TabPaneLog height={responseHeight} setHeight={setResponseHeight} tabId={'header'} theme={theme} value={responseHeaders} content={responseHeaders}/>
								<TabPaneLog height={responseHeight} setHeight={setResponseHeight} tabId={'body'} theme={theme} value={responseBody} content={responseBody}/>
							</TabContent>
						</div>
					</React.Fragment>}
				</div>
			)}
		</div>
	);
};

export default MethodTrace;
