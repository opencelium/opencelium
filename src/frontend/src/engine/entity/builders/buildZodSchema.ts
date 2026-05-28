import { z } from 'zod'
import type { EntityDefinition, FieldDefinition } from '../EntityDefinition'
import {PolicyContext, policyEngine} from "@/engine/policy";
import {i18n} from "@shared/i18n/config/i18n.ts";
function setNestedPlainShape(
    shape: Record<string, unknown>,
    path: string,
    schema: z.ZodTypeAny
) {
    const keys = path.split('.')
    let current = shape

    keys.forEach((key, index) => {
        if (index === keys.length - 1) {
            current[key] = schema
        } else {
            if (!current[key]) {
                current[key] = {}
            }
            current = current[key]
        }
    })
}
function buildZodObjectFromPlainShape(
    plainShape: Record<string, unknown>
): z.ZodObject<any> {

    const finalShape: Record<string, z.ZodTypeAny> = {}

    for (const key in plainShape) {
        const value = plainShape[key]

        // if this is already a Zod schema
        if (value && typeof value === 'object' && '_def' in (value as any)) {
            finalShape[key] = value as z.ZodTypeAny
        } else {
            // nested object
            finalShape[key] = buildZodObjectFromPlainShape(
                value as Record<string, unknown>
            )
        }
    }

    return z.object(finalShape)
}
export function buildFieldSchema(
    field: FieldDefinition,
    skipValidation: boolean
) {
    const t = i18n.getFixedT(i18n.language, 'error');
    const v = field.validation;

    // 1. Start with any so we can intercept the value before type validation
    let schema: z.ZodTypeAny = z.any();

    if (skipValidation) {
        return schema.optional().nullable();
    }

    /* ===============================
       1. REQUIRED CHECK (FIRST)
    ============================== */
    if (v?.required) {
        schema = schema.refine(
            val => {
                if (Array.isArray(val)) return val.length > 0;
                return val !== undefined && val !== null && val !== '';
            },
            { message: t('field.required') }
        );
    }

    /* ===============================
       2. TYPE & DATA VALIDATION
    ============================== */
    if (field.type === 'string') {
        schema = schema.pipe(
            z.string({ invalid_type_error: t('field.mustString') })
        );

        if (v) {
            // Use .superRefine for flexible checks,
            // so we don't duplicate the empty/required logic
            schema = schema.superRefine((val, ctx) => {
                const isEmpty = val === '';
                const shouldSkip = isEmpty && (v.allowEmptyString || !v.required);

                if (shouldSkip) return;

                if (v.min !== undefined && val.length < v.min) {
                    ctx.addIssue({ code: z.ZodIssueCode.too_small, minimum: v.min, type: 'string', inclusive: true, message: t('field.minLength', { min: v.min }) });
                }
                if (v.max !== undefined && val.length > v.max) {
                    ctx.addIssue({ code: z.ZodIssueCode.too_big, maximum: v.max, type: 'string', inclusive: true, message: t('field.maxLength', { max: v.max }) });
                }
                if (v.email && !isEmpty && !z.string().email().safeParse(val).success) {
                    ctx.addIssue({ code: z.ZodIssueCode.invalid_string, validation: 'email', message: t('field.invalidEmail') });
                }
                if (v.regex) {
                    v.regex.forEach(rule => {
                        if (!isEmpty && !rule.pattern.test(val)) {
                            ctx.addIssue({ code: z.ZodIssueCode.custom, message: rule.message });
                        }
                    });
                }
            });
        }

    } else if (field.type === 'number') {
        // Convert the input to a number BEFORE type validation
        schema = schema.pipe(
            z.preprocess((val) => {
                if (val === '' || val === null || val === undefined) return undefined;
                const parsed = Number(val);
                return isNaN(parsed) ? val : parsed;
            }, z.number({ invalid_type_error: t('field.mustNumber') }))
        );

        if (v) {
            if (v.min !== undefined) schema = (schema as z.ZodNumber).min(v.min, t('field.minLength', { min: v.min }));
            if (v.max !== undefined) schema = (schema as z.ZodNumber).max(v.max, t('field.maxLength', { max: v.max }));
        }
    } else if (field.type === 'file') {
        // Files can arrive as a freshly picked File, a server-stored path string, or null.
        schema = schema.pipe(
            z.union([
                z.instanceof(File),
                z.string(),
                z.null(),
            ], { errorMap: () => ({ message: t('field.mustFile') }) })
        );

        if (v?.max !== undefined) {
            schema = schema.superRefine((val, ctx) => {
                if (val instanceof File && val.size > v.max!) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.too_big,
                        maximum: v.max!,
                        type: 'number',
                        inclusive: true,
                        message: t('field.fileTooLarge', { max: v.max }),
                    });
                }
            });
        }
    }

    /* ===============================
       3. CUSTOM VALIDATORS
    ============================== */
    if (v?.custom?.length) {
        schema = schema.superRefine((val, ctx) => {
            if (!v.required && (val === undefined || val === null || val === '')) return
            for (const rule of v.custom!) {
                if (!rule.validate(val, {})) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: rule.message })
                }
            }
        })
    }

    /* ===============================
       4. FINAL TOUCHES
    ============================== */
    if (!v?.required) {
        return schema.optional().nullable();
    }

    return schema;
}
export function buildZodSchema(
    entity: EntityDefinition,
    ctx: PolicyContext
) {
    const plainShape: Record<string, unknown> = {}

    const fieldAccessMap = new Map<string, boolean>()

    entity.fields.forEach(field => {

        const decision = policyEngine.evaluate(
            field.access,
            { ...ctx, resource: field.name }
        )

        const skipValidation =
            decision.strategy === 'hide'

        const fieldSchema = buildFieldSchema(
            field,
            skipValidation
        )

        setNestedPlainShape(
            plainShape,
            field.name,
            fieldSchema
        )
    })

    return buildZodObjectFromPlainShape(plainShape)
}
