import {Trace} from "@root/requests/models/ConnectionLog";

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

        if (trace.type === 'LOOP' || trace.type === 'IF') {
            const found = findAndUpdateTrace(trace.children, indexPath, updater);
            if (found) return true;
        }
    }
    return false;
}
export function isXML(str: string): boolean {
    if (typeof str !== "string" || !str.trim().startsWith("<")) {
        return false;
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(str, "application/xml");
        const parserError = doc.getElementsByTagName("parsererror");
        return parserError.length === 0;
    } catch {
        return false;
    }
}
export function formatXML(xml: string, indent = 2): string {
    // Remove line breaks & extra spaces
    xml = xml.replace(/>\s*</g, "><").trim();

    let formatted = "";
    let pad = 0;
    const PADDING = " ".repeat(indent);

    xml.split(/>(?=<)/g).forEach((node) => {
        if (!node) return;

        let indentChange = 0;
        if (node.match(/^<\/\w/)) {
            // Closing tag
            pad -= 1;
        }

        formatted += PADDING.repeat(pad) + node + ">\n";

        if (node.match(/^<\w([^>]*[^/])?$/)) {
            // Opening tag (not self-closing)
            indentChange = 1;
        }

        pad += indentChange;
    });

    return formatted.trim();
}
