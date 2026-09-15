import type {
    EnhancementScriptArg,
    EnhancementScriptRequest,
    EnhancementScriptResponse,
} from '@features/workflow/ai/enhancementScript.types'

/**
 * Stand-in for the backend's script assistant. A real model writes these; the rules here
 * cover the transforms that actually recur in integration work, so the UI is exercised
 * against plausible output. What this module is really pinning down is the *contract* the
 * backend must honour: a script that reads only the declared VAR_n, assigns exactly once
 * to RESULT_VAR, and is a single expression.
 */

/** The marker dropEnhancementArgs leaves where an argument the script used has gone. */
const NOT_EXIST_ARG = 'VARIABLE_NOT_EXIST'

const RESULT = 'RESULT_VAR'

type Rule = {
    match: RegExp
    /** Undefined when the rule needs more arguments than the enhancement has. */
    build: (args: string[]) => string | undefined
    summary: string
}

const first = (args: string[]) => args[0] ?? NOT_EXIST_ARG

// Ordered: the first match wins, so narrower intents ("full name") precede broader ones.
const RULES: Rule[] = [
    {
        match: /\b(join|concat|combin|full name|zusammen|verbinde)/i,
        build: (args) => (args.length < 2 ? undefined : `${RESULT} = ${args.join(" + ' ' + ")}`),
        summary: 'Joins the inputs into one string separated by spaces.',
    },
    {
        match: /\b(iso|date|datum|timestamp|zeitstempel)/i,
        build: (args) => `${RESULT} = new Date(${first(args)}).toISOString()`,
        summary: 'Parses the input as a date and writes it in ISO-8601.',
    },
    {
        match: /\b(upper|uppercase|capital|gross|groß)/i,
        build: (args) => `${RESULT} = String(${first(args)}).toUpperCase()`,
        summary: 'Upper-cases the input.',
    },
    {
        match: /\b(lower|lowercase|klein)/i,
        build: (args) => `${RESULT} = String(${first(args)}).toLowerCase()`,
        summary: 'Lower-cases the input.',
    },
    {
        match: /\b(trim|whitespace|leerzeichen)/i,
        build: (args) => `${RESULT} = String(${first(args)}).trim()`,
        summary: 'Removes leading and trailing whitespace.',
    },
    {
        match: /\b(number|numeric|integer|int|zahl)/i,
        build: (args) => `${RESULT} = Number(${first(args)})`,
        summary: 'Converts the input to a number.',
    },
    {
        match: /\b(boolean|yes\/no|true|false|ja\/nein)/i,
        build: (args) => `${RESULT} = ${first(args)} ? 'true' : 'false'`,
        summary: 'Writes the input as a true/false string.',
    },
    {
        match: /\b(default|fallback|empty|missing|leer|standard)/i,
        build: (args) => `${RESULT} = ${first(args)} || ''`,
        summary: 'Falls back to an empty string when the input is missing.',
    },
    {
        match: /\b(first|before|split|teile)/i,
        build: (args) => `${RESULT} = String(${first(args)}).split(' ')[0]`,
        summary: 'Takes the first space-separated part of the input.',
    },
    {
        match: /\b(truncat|shorten|max length|kurz)/i,
        build: (args) => `${RESULT} = String(${first(args)}).slice(0, 255)`,
        summary: 'Truncates the input to 255 characters.',
    },
]

const argNames = (args: EnhancementScriptArg[]) => args.map((arg) => arg.name)

const passThrough = (args: string[]): EnhancementScriptResponse => ({
    script: `${RESULT} = ${first(args)}`,
    summary: 'Passes the input through unchanged — the instruction did not name a transform.',
})

const generate = (
    instruction: string,
    args: EnhancementScriptArg[],
    isJavaScript: boolean,
): EnhancementScriptResponse => {
    const names = argNames(args)
    if (names.length === 0) {
        return {
            script: `${RESULT} = ''`,
            summary: 'This enhancement has no inputs yet, so the script can only write a constant.',
        }
    }
    // The rules below emit JavaScript. A real model is told the language and writes in it;
    // this stand-in would otherwise hand a Python enhancement `new Date(...)`.
    if (!isJavaScript) {
        return {
            script: `${RESULT} = ${first(names)}`,
            summary: 'The mock assistant only writes JavaScript — this is a pass-through.',
        }
    }
    for (const rule of RULES) {
        if (!rule.match.test(instruction)) continue
        const script = rule.build(names)
        if (script) return { script, summary: rule.summary }
    }
    return passThrough(names)
}

/**
 * Rewrites a script that still names a dropped input. Every marker becomes the first
 * argument that does exist; with nothing left to read from, the script is reduced to a
 * constant rather than left naming a variable that is not passed to it.
 */
const repair = (script: string, args: EnhancementScriptArg[]): EnhancementScriptResponse => {
    const names = argNames(args)
    const markers = script.split(NOT_EXIST_ARG).length - 1
    if (markers === 0) {
        return { script, summary: 'The script names no missing input — nothing to repair.' }
    }
    if (names.length === 0) {
        return {
            script: `${RESULT} = ''`,
            summary: 'No inputs remain on this enhancement, so the script now writes an empty value.',
        }
    }
    return {
        script: script.split(NOT_EXIST_ARG).join(names[0]),
        summary: markers === 1
            ? `Replaced the missing input with ${names[0]}.`
            : `Replaced ${markers} missing inputs with ${names[0]}.`,
    }
}

export const generateEnhancementScript = (
    request: EnhancementScriptRequest,
): EnhancementScriptResponse => (
    request.intent === 'repair'
        ? repair(request.script, request.args)
        : generate(request.instruction, request.args, request.language === 'js')
)
