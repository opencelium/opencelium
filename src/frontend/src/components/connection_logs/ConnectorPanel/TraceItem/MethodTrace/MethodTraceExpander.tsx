import React, {useState} from 'react';
import styles from "@app_component/connection_logs/ConnectorPanel/TraceItem/MethodTrace/MethodTrace.module.css";
import ToggleButton from "@app_component/connection_logs/ConnectorPanel/TraceItem/ToggleButton/ToggleButton";
import {ShowIndexPath} from "@app_component/connection_logs/LogsPanel/LogsPanel";
import {ColorTheme} from "@style/Theme";
import {
    ConnectionSocketLog,
    DetailedMethodSegment,
    HttpMethodType,
    MethodProperty
} from "@root/requests/models/ConnectionLog";
import {TextSize} from "@app_component/base/text/interfaces";
import {copyStringToClipboard} from "@application/utils/utils";
import {copyLogContentToClipboard} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import Button from "@app_component/base/button/Button";
import {useAppDispatch} from "@application/utils/store";
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
interface MethodTraceExpanderProps {
    trace: ConnectionSocketLog<DetailedMethodSegment>,
    expanded: boolean,
    loading: boolean,
    handleToggle: () => void,
}
const MethodTraceExpander = ({trace, expanded, loading, handleToggle}: MethodTraceExpanderProps) => {
    const dispatch = useAppDispatch();
    const [isMouseOver, setIsMouseOver] = useState<boolean>(false);
    const hasError = !!trace?.error?.message;
    const methodColor = getMethodColor(trace?.segment?.request?.http_method);
    const url = trace?.segment?.request?.url || '';
    const properties = trace?.properties as MethodProperty;
    return (
        <div className={styles.methodTrace} onClick={handleToggle} onMouseOver={() => setIsMouseOver(true)} onMouseLeave={() => {setIsMouseOver(false)}}>
            <div className={styles.methodTraceLeftSide}>
                <div style={{minWidth: '40px'}}>
                    <ToggleButton
                        loading={loading}
                        expanded={expanded}
                        onClick={handleToggle}
                        hasError={hasError}
                    />
                </div>
                {trace?.segment?.request?.http_method && <div
                    style={{backgroundColor: methodColor}}
                    className={styles.methodType}
                >
                    {trace?.segment?.request?.http_method || ''}
                </div>
                }

                {ShowIndexPath && (
                    <div style={{marginLeft: 8}}>{trace.indexPath}</div>
                )}
                <div className={styles.methodUrl} style={{color: hasError ? ColorTheme.Red : '#000'}}>
                    <span title={url}
                          style={{textDecoration: 'underline'}}>{`${url || (properties?.name) || ''}`}</span>
                </div>

                {isMouseOver && <Button
                    iconSize={TextSize.Size_16}
                    icon={'file_copy'}
                    hasBackground={false}
                    handleClick={(e) => {
                        e?.stopPropagation();
                        copyStringToClipboard(url);
                        dispatch(copyLogContentToClipboard())
                    }}
                    style={{
                        marginRight: hasError ? 0 : '5px',
                        marginLeft: '5px',
                    }}
                />}
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

    )
}

export default MethodTraceExpander;
