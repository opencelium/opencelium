import type { Aggregator } from '../model/types'

const DISPLAY_PATTERN = /\{\{([^.}]+)\.([^}]+)\}\}/g
const SERVER_PATTERN = /\{\{(\d+)\}\}/g


const OC_TOKEN = '{{OC_ARG_NOT_EXIST}}'
export function toDisplayFormat(text: string, aggregators: Aggregator[]): string {
    return text.replace(SERVER_PATTERN, (match, argIdStr) => {
        const argId = Number(argIdStr)
        for (const agg of aggregators) {
            const arg = agg.args.find((a) => a.id === argId)
            if (arg) return `{{${agg.name}.${arg.name}}}`
        }
        return match
    })
}

export function toServerFormat(text: string, aggregators: Aggregator[]): string {
    return text.replace(DISPLAY_PATTERN, (match, aggregatorName, argName) => {
        const agg = aggregators.find((a) => a.name === aggregatorName)
        if (!agg) return match
        const arg = agg.args.find((a) => a.name === argName)
        if (!arg) return match
        return `{{${arg.id}}}`
    })
}

export function replaceInactiveArgs(text: string, aggregators: Aggregator[]): string {
    return text.replace(DISPLAY_PATTERN, (match, aggregatorName) => {
        const agg = aggregators.find((a) => a.name === aggregatorName)
        if (agg && !agg.active) return OC_TOKEN
        return match
    })
}

// Replace a specific aggregator's args with {{OC_ARG_NOT_EXIST}} if it is inactive
export function replaceAggregatorArgs(text: string, aggregator: Aggregator): string {
    if (aggregator.active) return text
    const re = /\{\{([^.}]+)\.([^}]+)\}\}/g
    return text.replace(re, (match, aggName) =>
        aggName === aggregator.name ? OC_TOKEN : match
    )
}

// Find positions of every {{OC_ARG_NOT_EXIST}} token in text (for Ace markers)
export type ArgMarker = { row: number; startCol: number; endCol: number }

export function findOcArgNotExistMarkers(text: string): ArgMarker[] {
    const markers: ArgMarker[] = []
    const lines = text.split('\n')
    lines.forEach((line, row) => {
        let idx = 0
        while ((idx = line.indexOf(OC_TOKEN, idx)) !== -1) {
            markers.push({ row, startCol: idx, endCol: idx + OC_TOKEN.length })
            idx += OC_TOKEN.length
        }
    })
    return markers
}
