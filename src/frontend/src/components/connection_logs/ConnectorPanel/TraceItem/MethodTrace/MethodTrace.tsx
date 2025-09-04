import {
	ConnectionSocketLog,
	DetailedMethodSegment, HttpMethodType, MethodRequest,
} from '@root/requests/models/ConnectionLog';
import React, { useState } from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import ToggleButton from '../ToggleButton/ToggleButton';
import styles from './MethodTrace.module.css';

import LimitedAceEditor from '@app_component/limited_ace_editor/LimitedAceEditor';
import { useAppDispatch } from '@application/utils/store';
import { cleanMethodTrace } from '@root/redux_toolkit/slices/ConnectionLogSlice';
import {ColorTheme, ITheme} from '@style/Theme';
import Validation from "@application/classes/Validation";
import {getDetailedMethod} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import {ShowIndexPath} from "@app_component/connection_logs/LogsPanel/LogsPanel";
import ErrorMessage from "@app_component/connection_logs/ConnectorPanel/ErrorMessage";
import {isJsonString} from "@application/utils/utils";

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

function detectAceMode(content: string): 'json' | 'xml' {
	return content.trim().startsWith('<') ? 'xml' : 'json';
}

const MethodTrace: React.FC<MethodTraceProps> = ({
	trace,
	flowId,
	executionId,
	theme
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
	const hasError = !!trace?.error?.message;

	const handleToggle = async () => {
		if (!expanded) {
			setLoading(true);
			if (hasError) {

			} else{
				await dispatch(
					getDetailedMethod({
						executionId,
						flowId,
						indexPath: trace.indexPath,
						id: trace.id,
					})
				);
			}
			setLoading(false);
			setExpanded(true);
		} else {
			if (!hasError) {
				dispatch(
					cleanMethodTrace({flowId, indexPath: trace.indexPath})
				);
			}
			setExpanded(false);
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

	const requestMode = requestBody ? detectAceMode(requestBody) : 'json';
	const responseMode = responseBody ? detectAceMode(responseBody) : 'json';
	return (
		<div>
			<div className={styles.methodTrace} onClick={handleToggle}>
				<div className={styles.methodTraceLeftSide}>
					<ToggleButton
						loading={loading}
						expanded={expanded}
						onClick={handleToggle}
						hasError={hasError}
					/>
					<div
						style={{ backgroundColor: methodColor }}
						className={styles.methodType}
					>
						{trace?.segment?.request?.http_method || ''}
					</div>

					{ShowIndexPath && (
						<div style={{ marginLeft: 8 }}>{trace.indexPath}</div>
					)}
					<div className={styles.methodUrl} style={{color: hasError ? ColorTheme.Red : '#000'}}>{trace?.segment?.request?.url || ''}</div>
				</div>
				<div
					className={styles.methodTraceRightSide}
					onClick={(e: any) => {
						e.preventDefault();
						e.stopPropagation();
					}}
				>
					{hasError ? <div className={styles.error} style={{color: ColorTheme.Red}}>{trace.error.message}</div> :
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
									<LimitedAceEditor
										mode='json'
										theme={theme}
										editorTheme='textmate'
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
									<LimitedAceEditor
										mode={requestMode}
										theme={theme}
										editorTheme='textmate'
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
									<LimitedAceEditor
										mode='json'
										theme={theme}
										editorTheme='textmate'
										value={responseHeaders}
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
								<TabPane tabId='body'>
									<LimitedAceEditor
										mode={responseMode}
										theme={theme}
										editorTheme='textmate'
										value={responseBody}
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
					</React.Fragment>}
				</div>
			)}
		</div>
	);
};

export default MethodTrace;
