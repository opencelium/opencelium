export const SECTION1_HEADER =
    `/* \n\tHere are variables that came from arguments and can be used\n\tin the script. All responses of the method are stored in Responses \n\tvariable.\n\t\tThe response has next structure:\n\t\tsuccess - for success response\n\t\t\theader - header data of the success\n\t\t\tpayload - response data of the success\n\t\tfail - for fail response\n\t\t\theader - header data of the fail\n\t\t\tpayload - response data of the fail \n*/\n`

export const SECTION2_COMMENT =
    `/*\nPlease, define the initial value for your variables.\nIn this section you can define a logic of your script.\n*/\n`

export function buildVarDeclarations(args: { name: string }[]): string {
    return args.map((a) => `var ${a.name};\n`).join('')
}

export function buildSection1(args: { name: string }[]): string {
    return SECTION1_HEADER + buildVarDeclarations(args)
}

export function buildFullScript(args: { name: string }[], section2UserContent: string): string {
    return buildSection1(args) + '\n\n' + SECTION2_COMMENT + section2UserContent
}

export function extractSection2Content(script: string): string {
    const idx = script.indexOf(SECTION2_COMMENT)
    if (idx === -1) return ''
    return script.slice(idx + SECTION2_COMMENT.length)
}

// STRING_LITERAL_RE splits text into alternating non-string / string-literal parts.
// Captures single-quoted, double-quoted, and template-literal strings.
const STRING_LITERAL_RE = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Renames a variable in a script, replacing only identifier references
// (whole-word matches outside string literals) — not occurrences inside strings.
export function renameVariableInScript(script: string, oldName: string, newName: string): string {
    if (!oldName || !newName || oldName === newName) return script
    const varRe = new RegExp(`\\b${escapeRegex(oldName)}\\b`, 'g')
    // split produces [nonString, string, nonString, string, ...] where odd indices are captured string literals
    const parts = script.split(STRING_LITERAL_RE)
    return parts.map((part, i) => (i % 2 === 0 ? part.replace(varRe, newName) : part)).join('')
}

// Replaces all identifier references to a deleted arg with OC_ARG_NOT_EXIST (outside strings).
export function replaceDeletedArgInScript(script: string, argName: string): string {
    return renameVariableInScript(script, argName, 'OC_ARG_NOT_EXIST')
}

export interface ScriptMarker {
    row: number
    startCol: number
    endCol: number
}

const OC_NOT_EXIST_TOKEN = 'OC_ARG_NOT_EXIST'

// Returns the row/col positions of every OC_ARG_NOT_EXIST token in the script.
export function findOcArgNotExistMarkersInScript(script: string): ScriptMarker[] {
    const markers: ScriptMarker[] = []
    const lines = script.split('\n')
    for (let row = 0; row < lines.length; row++) {
        const line = lines[row]
        let col = 0
        while (col < line.length) {
            const idx = line.indexOf(OC_NOT_EXIST_TOKEN, col)
            if (idx === -1) break
            markers.push({ row, startCol: idx, endCol: idx + OC_NOT_EXIST_TOKEN.length })
            col = idx + OC_NOT_EXIST_TOKEN.length
        }
    }
    return markers
}
