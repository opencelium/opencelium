import React, {useEffect, useRef} from 'react';
import LimitedAceEditor from "@app_component/limited_ace_editor/LimitedAceEditor";
import styles from "@app_component/connection_logs/ConnectorPanel/TraceItem/MethodTrace/MethodTrace.module.css";
import {TabPane} from "reactstrap";
import {ITheme} from "@style/Theme";
import {formatXML, isXML} from "@root/utils/utils";
import {isJsonString} from "@application/utils/utils";
import {debounce} from "lodash";
const DEFAULT_HEIGHT = 100;
const TabPaneLog = ({tabId, value, theme, height, setHeight}: {tabId: string, value: any, theme: ITheme, height: number | undefined, setHeight: (newHeight: number) => void,}) => {
    const isXmlFormat = isXML(value);
    const mode = value ? isXmlFormat ? 'xml' : isJsonString(value) ? 'json' : 'text' : 'text';
    if (isXmlFormat) {
        value = formatXML(value);
    }
    const ref = useRef<any>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let first = true;
        const commit = debounce((h: number) => setHeight(Math.round(h)), 200);

        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (first) { first = false; continue; } // ignore initial layout ping
                const borderBox =
                    (entry as any).borderBoxSize?.[0]?.blockSize ??
                    // Safari fallback:
                    el.getBoundingClientRect().height;
                commit(borderBox);
            }
        });

        // ⭐ Observe border-box so padding/borders are included
        try {
            ro.observe(el, { box: 'border-box' as any });
        } catch {
            // Older browsers: fall back (still works thanks to getBoundingClientRect above)
            ro.observe(el);
        }

        return () => { ro.disconnect(); commit.cancel(); };
    }, [setHeight]);


    return (
        <TabPane tabId={tabId}>
            <div ref={ref} style={{
                overflow: 'auto',
                resize: 'vertical',
                width: 'auto',
                height: (height ?? DEFAULT_HEIGHT) + 'px',
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
            </div>
        </TabPane>
    )
}

export default TabPaneLog;
