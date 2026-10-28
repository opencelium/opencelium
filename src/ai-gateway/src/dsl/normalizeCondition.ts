import { type Condition, type ConditionOp, UNARY_CONDITION_OPS } from './workflowDsl.schema.ts'

const isEmptyLiteral = (value: Condition['right']) => 'literal' in value && value.literal.trim() === ''

// Reading the step value on the right of a comparison is the same test with the sides swapped.
const SWAPPED: Partial<Record<ConditionOp, ConditionOp>> = { eq: 'eq', ne: 'ne', gt: 'lt', lt: 'gt' }

/**
 * Conditions whose intent is unambiguous are rewritten instead of sent back for repair:
 * - exists / empty ignore the right side, so whatever the model put there becomes "" (a ref there reads as a comparison);
 * - `= ""` and `!= ""` are the empty / exists tests;
 * - `"Closed" = <ref>` reads the step on the left, as every other condition does.
 * Two fixed values or a fixed list are left for `validateWorkflow` to report.
 */
export function normalizeCondition(condition: Condition): Condition {
    const { left, op, right } = condition
    if (UNARY_CONDITION_OPS.has(op)) return isEmptyLiteral(right) ? condition : { ...condition, right: { literal: '' } }
    if ('ref' in left && isEmptyLiteral(right) && (op === 'eq' || op === 'ne')) {
        return { left, op: op === 'eq' ? 'empty' : 'exists', right: { literal: '' } }
    }
    const swapped = SWAPPED[op]
    if ('literal' in left && 'ref' in right && swapped) return { left: right, op: swapped, right: left }
    return condition
}
