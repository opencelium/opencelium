import {
    type RawBinding, type RawConnector, type RawMethod, type RawOperator, bindingValue, bodyValues, describeCondition, hasReference, list,
    methodsByColor, readConnection, readablePath, replaceReferences, str,
} from './templateJson.ts'

/**
 * One call of an operation in a stored template: where it sits (the loops and conditions around it), what its endpoint
 * is filled with and how each field is set, by a fixed value or from an earlier step. Unlike a whole template, a call is useful
 * to any request that uses the same operation, whatever the task or the other system.
 */
export type OperationUsage = {
    /** Template file name and display name. */
    templateId: string
    template: string
    /** The template's invoker names for the calling side and the other side, as written in the template. */
    system: string
    counterpart: string
    operation: string
    context: string[]
    endpoint: string
    /** `<dot path> = "<fixed value>"` or `<dot path> = item <step> <path>` / `script: …`, one leaf per entry. */
    fields: string[]
}

const MAX_FIELDS = 10
const MAX_VALUE_LENGTH = 120

const clip = (text: string) => (text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH)}...` : text)

/** Operators whose index is a prefix of the call's index enclose it, outermost first ("1" → "1_1" → "1_1_0"). */
function contextOf(index: string, operators: RawOperator[], methodByColor: Map<string, string>): string[] {
    return operators
        .filter((operator) => index.startsWith(`${str(operator.index)}_`))
        .sort((left, right) => str(left.index).length - str(right.index).length)
        .map((operator) => {
            const condition = describeCondition(operator.condition, methodByColor)
            return operator.type === 'loop' ? `for each item of ${condition || 'a list'}` : `if ${condition}`
        })
}

/**
 * The endpoint after the connector's base url, with references in readable form, when it shows how path params or a
 * query are filled; a bare path says nothing the invoker doesn't.
 */
function endpointOf(method: RawMethod, methodByColor: Map<string, string>): string {
    const raw = str(method.request?.endpoint)
    if (!hasReference(raw) && !raw.includes('?')) return ''
    const endpoint = replaceReferences(raw, methodByColor).replace(/\{%\s*|\s*%\}/g, '')
    return clip(endpoint.replace(/^\{url\}/, ''))
}

/**
 * Every leaf the call sets, fixed values written like the others: shown as `params { … }` the model writes whole objects
 * as one literal and loses the references inside them.
 */
function fieldsOf(method: RawMethod, bindings: RawBinding[], methodByColor: Map<string, string>): string[] {
    const color = str(method.color)
    const bound = bindings
        .filter((binding) => str(binding.to?.[0]?.color) === color)
        .map((binding) => ({ field: readablePath(str(binding.to?.[0]?.field)), value: bindingValue(binding, methodByColor) }))
    const inBody = bodyValues(method.request?.body?.fields).map((value) => ({
        field: value.path,
        value: value.isReference ? `item ${replaceReferences(value.text, methodByColor).replace(/\{%\s*|\s*%\}/g, '')}` : `"${value.text}"`,
    }))
    const byField = new Map<string, string>()
    for (const { field, value } of [...bound, ...inBody]) if (field && value && !byField.has(field)) byField.set(field, clip(value))
    return [...byField].slice(0, MAX_FIELDS).map(([field, value]) => `${field} = ${value}`)
}

/** Every call in a template file's JSON; an unreadable template has none. */
export function parseOperationUsages(json: unknown, templateId = ''): OperationUsage[] {
    const { template, connection } = readConnection(json)
    const sides: [RawConnector | undefined, RawConnector | undefined][] = [
        [connection.fromConnector, connection.toConnector], [connection.toConnector, connection.fromConnector],
    ]
    const methodByColor = methodsByColor(sides.flatMap(([connector]) => list<RawMethod>(connector?.methods)))
    const bindings = list<RawBinding>(connection.fieldBinding)
    return sides.flatMap(([connector, other]) => {
        const operators = list<RawOperator>(connector?.operators)
        return list<RawMethod>(connector?.methods).flatMap((method): OperationUsage[] => {
            const operation = str(method.name)
            if (!operation) return []
            return [{
                templateId,
                template: str(template.name),
                system: str(connector?.invoker?.name),
                counterpart: str(other?.invoker?.name),
                operation,
                context: contextOf(str(method.index), operators, methodByColor),
                endpoint: endpointOf(method, methodByColor),
                fields: fieldsOf(method, bindings, methodByColor),
            }]
        })
    })
}
