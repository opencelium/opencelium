import React, {useEffect, useRef, useState} from 'react';
import LimitedAceEditor from "@app_component/limited_ace_editor/LimitedAceEditor";
import styles from "@app_component/connection_logs/ConnectorPanel/TraceItem/MethodTrace/MethodTrace.module.css";
import localStyles from "./MethodTrace.module.css";
import {TabPane} from "reactstrap";
import {ColorTheme, ITheme} from "@style/Theme";
import {formatXML, isXML} from "@root/utils/utils";
import {copyStringToClipboard, isJsonString} from "@application/utils/utils";
import {debounce} from "lodash";
import {TextSize} from "@app_component/base/text/interfaces";
import {copyLogContentToClipboard} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import Button from "@app_component/base/button/Button";
import {useAppDispatch} from "@application/utils/store";
const DEFAULT_HEIGHT = 100;
const TabPaneLog = ({tabId, value, theme, height, setHeight, content}: {content: string, tabId: string, value: any, theme: ITheme, height: number | undefined, setHeight: (newHeight: number) => void,}) => {
    const dispatch = useAppDispatch();
    const isXmlFormat = isXML(value);
    const mode = value ? isXmlFormat ? 'xml' : isJsonString(value) ? 'json' : 'text' : 'text';
    if (isXmlFormat) {
        value = formatXML(value);
    }
    const ref = useRef<any>(null);
    const [isMouseOver, setIsMouseOver] = useState<boolean>(false);
    useEffect(() => {
        setIsMouseOver(false);
    }, []);
    const updateMouseOver = (newValue: boolean) => {
        if (newValue !== isMouseOver) {
            if (newValue) {
                if (!!content) {
                    setIsMouseOver(newValue);
                }
            } else {
                setIsMouseOver(newValue);
            }
        }
    }
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let first = true;
        const commit = debounce((h: number) => {
            if (h > 50) {
                setHeight(Math.round(h));
            }
        }, 200);

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
    }, []);
    return (
        <TabPane tabId={tabId} onMouseOver={() => updateMouseOver(true)} onMouseLeave={() => {updateMouseOver(false)}}>
            <div ref={ref} style={{
                position: 'relative',
                overflow: 'auto',
                resize: 'vertical',
                width: 'auto',
                height: (height ?? DEFAULT_HEIGHT) + 'px',
                paddingBottom: '5px',
            }}>
                {!!content ? <LimitedAceEditor
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
                /> :
                    <div className={localStyles.emptyBodyContent}>{"No data"}</div>
                }
                {(isMouseOver && !!content) && <Button
                    iconSize={TextSize.Size_16}
                    icon={'file_copy'}
                    hasBackground={false}
                    handleClick={() => {
                        copyStringToClipboard(content);
                        dispatch(copyLogContentToClipboard())
                    }}
                    style={{
                        position: 'absolute',
                        top: '5px',
                        right: '18px',
                    }}
                />}
            </div>
        </TabPane>
    )
}

export default TabPaneLog;
