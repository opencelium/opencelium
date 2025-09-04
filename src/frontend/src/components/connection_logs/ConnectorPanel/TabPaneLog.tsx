import React from 'react';
import LimitedAceEditor from "@app_component/limited_ace_editor/LimitedAceEditor";
import styles from "@app_component/connection_logs/ConnectorPanel/TraceItem/MethodTrace/MethodTrace.module.css";
import {TabPane} from "reactstrap";
import {ITheme} from "@style/Theme";
function detectAceMode(content: string): 'json' | 'xml' {
    return content.trim().startsWith('<') ? 'xml' : 'json';
}
const TabPaneLog = ({tabId, value, theme}: {tabId: string, value: any, theme: ITheme}) => {
    const mode = value ? detectAceMode(value) : 'json';
    return (
        <TabPane tabId={tabId} style={{
            overflow: 'auto',
            resize: 'vertical',
            width: 'auto',
            height: '100px',
            paddingBottom: '5px',
        }}>
            <LimitedAceEditor
                style={{maxHeight: '100%'}}
                mode={mode}
                theme={theme}
                editorTheme='textmate'
                value={value}
                fontSize={14}
                showPrintMargin={false}
                showGutter={true}
                highlightActiveLine={false}
                wrapEnabled={true}
                setOptions={{ useWorker: false, showLineNumbers: false }}
                className={styles.aceEditor}
                readOnly={true}
                width={'100%'}
                height={'100%'}
            />
        </TabPane>
    )
}

export default TabPaneLog;
