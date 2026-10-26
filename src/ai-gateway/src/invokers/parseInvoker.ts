import { XMLParser } from 'fast-xml-parser'
import type { FieldNode, Invoker, InvokerOperation } from './invoker.types.ts'

type XmlNode = Record<string, unknown>

const ALWAYS_ARRAY = new Set(['operation', 'field', 'item'])

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseTagValue: false,
    isArray: (name) => ALWAYS_ARRAY.has(name),
})

function asNode(value: unknown): XmlNode | undefined {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as XmlNode) : undefined
}

function asNodes(value: unknown): XmlNode[] {
    if (!Array.isArray(value)) return []
    return value.flatMap((entry): XmlNode[] => {
        const node = asNode(entry)
        return node ? [node] : []
    })
}

function text(value: unknown): string {
    if (typeof value === 'string') return value.trim()
    const node = asNode(value)
    return typeof node?.['#text'] === 'string' ? node['#text'].trim() : ''
}

function attr(node: XmlNode | undefined, name: string): string {
    const value = node?.[`@_${name}`]
    return typeof value === 'string' ? value : ''
}

function parseFields(body: unknown): FieldNode[] {
    return asNodes(asNode(body)?.field).map((field) => ({
        name: attr(field, 'name'),
        type: attr(field, 'type'),
        children: parseFields(field),
    }))
}

function placeholders(endpoint: string): string[] {
    return [...endpoint.matchAll(/\{([^{}]+)\}/g)].flatMap((match) => (match[1] ? [match[1]] : []))
}

function parseOperation(node: XmlNode, requiredData: Set<string>): InvokerOperation {
    const request = asNode(node.request)
    const success = asNode(asNode(node.response)?.success)
    const endpoint = text(request?.endpoint)
    return {
        name: attr(node, 'name'),
        httpMethod: text(request?.method).toUpperCase(),
        endpoint,
        endpointParams: [...new Set(placeholders(endpoint).filter((name) => !requiredData.has(name)))],
        requestFields: parseFields(request?.body),
        responseFields: parseFields(success?.body),
    }
}

export function parseInvoker(xml: string): Invoker {
    const root = asNode(asNode(parser.parse(xml))?.invoker)
    if (!root) throw new Error('Not an invoker document: missing <invoker> root')

    const requiredData = asNodes(asNode(root.requiredData)?.item).map((item) => attr(item, 'name'))
    const requiredDataSet = new Set(requiredData)
    const operations = asNodes(asNode(root.operations)?.operation)
        .filter((operation) => attr(operation, 'type') !== 'test')
        .map((operation) => parseOperation(operation, requiredDataSet))
        .filter((operation) => operation.name !== '')

    return {
        name: text(root.name),
        description: text(root.description),
        requiredData,
        operations,
    }
}
