import React, { useState } from 'react';
import AceEditor from 'react-ace';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { MethodTrace as MethodTraceType } from '@root/requests/models/ConnectionLog';
import ToggleButton from '../ToggleButton/ToggleButton';
import styles from './MethodTrace.module.css';

import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-xml';
import 'ace-builds/src-noconflict/theme-textmate';
import {useAppDispatch} from "@application/utils/store";
import {getMethodTrace} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import {cleanMethodTrace} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import {ShowIndexPath} from "@app_component/connection_logs/LogsPanel";

interface MethodTraceProps {
	trace: MethodTraceType;
	connectorId: string;
	executionId: string;
	connectionId: string;
}

function getMethodColor(httpMethod: MethodTraceType['httpMethod']): string {
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

function detectAceMode(content: string): 'json' | 'xml' {
	return content.trim().startsWith('<') ? 'xml' : 'json';
}

const MethodTrace: React.FC<MethodTraceProps> = ({
	trace,
	connectorId,
	executionId,
	connectionId,
}) => {
	const dispatch = useAppDispatch();
	const [expanded, setExpanded] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);

	const [activeRequestTab, setActiveRequestTab] = useState<'header' | 'body'>(
		'body'
	);

	const [activeResponseTab, setActiveResponseTab] = useState<'header' | 'body'>(
		'body'
	);

	const handleToggle = async () => {
		if (!expanded) {
			setLoading(true);
			await dispatch(
				getMethodTrace({
					executionId,
					connectionId,
					connectorId,
					indexPath: trace.indexPath,
				})
			);
			setLoading(false);
			setExpanded(true);
		} else {
			dispatch(cleanMethodTrace({ connectorId, indexPath: trace.indexPath }));
			setExpanded(false);
		}
	};

	const methodColor = getMethodColor(trace.httpMethod);

	const requestDetails = trace.requestDetails;
	const responseDetails = trace.responseDetails;

	const requestHeaders = requestDetails
		? JSON.stringify(requestDetails.headers, null, 2)
		: '';
	const requestBody =
		requestDetails && requestDetails.body
			? typeof requestDetails.body === 'string'
				? requestDetails.body
				: JSON.stringify(requestDetails.body, null, 2)
			: '';

	const responseHeaders = responseDetails
		? JSON.stringify(responseDetails.headers, null, 2)
		: '';
	const responseBody =
		responseDetails && responseDetails.body
			? typeof responseDetails.body === 'string'
				? responseDetails.body
				: JSON.stringify(responseDetails.body, null, 2)
			: '';

	const requestMode = requestBody ? detectAceMode(requestBody) : 'json';
	const responseMode = responseBody ? detectAceMode(responseBody) : 'json';

	return (
		<div style={{cursor: 'pointer'}} onClick={handleToggle}>
			<div className={styles.methodTrace}>
				<div className={styles.methodTraceLeftSide}>
					<ToggleButton
						loading={loading}
						expanded={expanded}
						onClick={handleToggle}
					/>
					<div
						style={{backgroundColor: methodColor}}
						className={styles.methodType}
					>
						{trace.httpMethod}
					</div>

					{ShowIndexPath && <div style={{marginLeft: 8}}>{trace.indexPath}</div>}
					<div className={styles.methodUrl}>{trace.url}</div>
				</div>
				<div className={styles.methodTraceRightSide}>
					<div className={styles.methodStatus}>{trace.statusCode}</div>
					<div>{"|"}</div>
					<div className={styles.methodTime}>{trace.executionTime} ms</div>
				</div>
			</div>

			{expanded && (
				<div className={styles.requestResponseContainer}>
					{/* Request */}
					<div className={styles.methodRequest}>
						<Nav tabs className={styles.nav}>
							<NavItem>
								<NavLink
									active={activeRequestTab === 'header'}
									onClick={(e) => {
										e.preventDefault();
										setActiveRequestTab('header');
									}}
									className={styles.navLink}
								>
									Header
								</NavLink>
							</NavItem>
							<NavItem>
								<NavLink
									active={activeRequestTab === 'body'}
									onClick={(e) => {
										e.preventDefault();
										setActiveRequestTab('body');
									}}
									className={styles.navLink}
								>
									Body
								</NavLink>
							</NavItem>
						</Nav>
						<TabContent activeTab={activeRequestTab}>
							<TabPane tabId='header'>
								<AceEditor
									mode='json'
									theme='textmate'
									value={requestHeaders}
									fontSize={14}
									showPrintMargin={false}
									showGutter={false}
									highlightActiveLine={false}
									wrapEnabled={true}
									setOptions={{ useWorker: false }}
									className={styles.aceEditor}
									readOnly={true}
								/>
							</TabPane>
							<TabPane tabId='body'>
								<AceEditor
									mode={requestMode}
									theme='textmate'
									value={requestBody}
									fontSize={14}
									showPrintMargin={false}
									showGutter={true}
									highlightActiveLine={false}
									wrapEnabled={true}
									setOptions={{ useWorker: false, showLineNumbers: false }}
									className={styles.aceEditor}
									readOnly={true}
								/>
							</TabPane>
						</TabContent>
					</div>

					{/* Response */}
					<div className={styles.methodResponse}>
						<Nav tabs className={styles.nav}>
							<NavItem>
								<NavLink
									active={activeResponseTab === 'header'}
									onClick={(e) => {
										e.preventDefault();
										setActiveResponseTab('header');
									}}
									className={styles.navLink}
								>
									Header
								</NavLink>
							</NavItem>
							<NavItem>
								<NavLink
									active={activeResponseTab === 'body'}
									onClick={(e) => {
										e.preventDefault();
										setActiveResponseTab('body');
									}}
									className={styles.navLink}
								>
									Body
								</NavLink>
							</NavItem>
						</Nav>
						<TabContent activeTab={activeResponseTab}>
							<TabPane tabId='header'>
								<AceEditor
									mode='json'
									theme='textmate'
									value={responseHeaders}
									fontSize={14}
									showPrintMargin={false}
									showGutter={true}
									highlightActiveLine={false}
									wrapEnabled={true}
									setOptions={{ useWorker: false }}
									className={styles.aceEditor}
									readOnly={true}
								/>
							</TabPane>
							<TabPane tabId='body'>
								<AceEditor
									mode={responseMode}
									theme='textmate'
									value={responseBody}
									fontSize={14}
									showPrintMargin={false}
									showGutter={true}
									highlightActiveLine={false}
									wrapEnabled={true}
									setOptions={{ useWorker: false }}
									className={styles.aceEditor}
									readOnly={true}
								/>
							</TabPane>
						</TabContent>
					</div>
				</div>
			)}
		</div>
	);
};

export default MethodTrace;
