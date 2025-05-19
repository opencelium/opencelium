import {OperatorTrace, Trace} from "@root/requests/models/ConnectionLog";

type TraceUpdateCallback = (trace: Trace) => boolean;

export function findAndUpdateTrace(
    traces: Trace[],
    indexPath: string,
    updater: TraceUpdateCallback
): boolean {
    if (!traces) {
        return false;
    }
    for (let i = 0; i < traces.length; i++) {
        const trace = traces[i];

        if (trace.indexPath === indexPath) {
            return updater(trace); // update trace directly
        }

        if (trace.logType === 'operator') {
            const found = findAndUpdateTrace((trace as OperatorTrace).traces, indexPath, updater);
            if (found) return true;
        }
    }
    return false;
}
