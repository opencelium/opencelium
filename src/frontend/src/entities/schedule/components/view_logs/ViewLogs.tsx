import React, {useEffect, useMemo, useRef, useState} from 'react';
import Dialog from "@basic_components/Dialog";
import {Schedule} from "@entity/schedule/classes/Schedule";
import {useAppDispatch} from "@application/utils/store";
import {setCurrentExecutionLogs} from "@entity/schedule/redux_toolkit/slices/ScheduleSlice";
import styles from "./ViewLogs.module.css";
import InputText from "@app_component/base/input/text/InputText";
import {debounce} from "lodash";
const isLogTooLarge = (log: string): boolean => {
    const bytes = new TextEncoder().encode(log).length;
    return bytes > 10 * 1024 * 1024; // 10MB in bytes
};
const ViewLogs = () => {
    const dispatch = useAppDispatch();
    const {currentExecutionLogs} = Schedule.getReduxState();
    const [searchInput, setSearchInput] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const firstMatchRef = useRef<any>(null);
    const logTooLarge = useMemo(() => isLogTooLarge(currentExecutionLogs.logs), [currentExecutionLogs.logs]);

    const debouncedUpdateSearchTerm = useMemo(() => debounce((val: string) => {
        if (val.length > 2) {
            setSearchTerm(val);
        }
    }, 300), []);
    useEffect(() => {
        debouncedUpdateSearchTerm(searchInput);
        return () => debouncedUpdateSearchTerm.cancel();
    }, [searchInput]);

    useEffect(() => {
        if (firstMatchRef.current) {
            firstMatchRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [searchTerm]);
    const close = () => {
        setSearchTerm('');
        setSearchInput('');
        dispatch(setCurrentExecutionLogs({executionId: '', logs: ''}))
    }
    const highlightMatches = (text: string, term: string): React.ReactNode => {
        if (!term) return text;

        const regex = new RegExp(`(${term})`, 'gi');
        const parts = text.split(regex);

        let firstMatchFound = false;

        return parts.map((part, i) => {
            if (regex.test(part)) {
                if (!firstMatchFound) {
                    firstMatchFound = true;
                    return (
                        <mark
                            key={i}
                            ref={firstMatchRef}
                            style={{ backgroundColor: 'yellow', padding: 0 }}
                        >
                            {part}
                        </mark>
                    );
                } else {
                    return (
                        <mark key={i} style={{ backgroundColor: 'yellow', padding: 0 }}>
                            {part}
                        </mark>
                    );
                }
            }
            return part;
        });
    };
    return (
        <Dialog
            actions={[
                {
                    label: 'Close',
                    onClick: close,
                    id: 'close_view_logs',
                },
            ]}
            active={currentExecutionLogs.logs !== ''}
            toggle={close}
            theme={{dialog: styles.modalDialog, body: styles.modalBody}}
            title={`Log of the execution #${currentExecutionLogs.executionId}`}
        >
            {!logTooLarge && (<InputText placeholder={'Search ... (min 3 symbols)'} value={searchInput} onChange={(e) => setSearchInput(e.target.value)}/>)}
            {logTooLarge && (
                <div style={{ color: 'gray', fontStyle: 'italic', marginBottom: 8 }}>
                    {`Log is too large to enable search ( > 10MB).`}
                </div>
            )}
            <pre style={{whiteSpace: 'pre-wrap', fontFamily: 'monospace', height: '435px'}}>
                {highlightMatches(currentExecutionLogs.logs, searchTerm)}
            </pre>
        </Dialog>
    )
}

export default ViewLogs;
