import {ZodTypeAny, ZodString, ZodObject, ZodOptional} from 'zod';
import { unwrapZodObject } from './unwrapZod';
import type {StringConstraints} from "@shared/form/types.ts";
import type {EntityDefinition} from "@/engine/entity/EntityDefinition.ts";

export function buildStringConstraints<FormFieldPath>(
    schema: ZodTypeAny,
    path: FormFieldPath
): StringConstraints {
    return {
        ...getStringConstraints(schema, path),
    };
}
export function getStringConstraints(
    schema: ZodTypeAny,
    fieldName: string
): StringConstraints {
    const objectSchema = unwrapZodObject(schema);

    if (!objectSchema) {
        return {};
    }

    const path = fieldName.split('.');
    let field: ZodTypeAny = objectSchema;

    for (const key of path) {
        if (!(field instanceof ZodObject)) {
            return {};
        }
        field = field.shape[key];
        if (!field) {
            return {};
        }
    }


    if (!(field instanceof ZodString)) {
        return {};
    }

    const constraints: StringConstraints = {};
    if (
        constraints.minLength !== undefined &&
        constraints.maxLength !== undefined &&
        constraints.minLength > constraints.maxLength
    ) {
        console.warn(
            `[FormConstraints] minLength (${constraints.minLength}) > maxLength (${constraints.maxLength}) for field "${fieldName}".`
        );

        // pick a safe strategy
        constraints.maxLength = constraints.minLength;
    }
    if (!field?._def?.checks) {
        return  {};
    }
// shared/form/zodConstraints.ts
    for (const check of field?._def?.checks) {
        if (check._zod.def.check === 'max_length') {
            constraints.maxLength = check._zod.def.maximum;
        }

        if (check._zod.def.check === 'min_length') {
            constraints.minLength = check._zod.def.minimum;
        }

        if (check._zod.def.check === 'length_equals') {
            constraints.minLength = check._zod.def.length;
            constraints.maxLength = check._zod.def.length;
        }
    }


    return constraints;
}
export function buildConstraintsFromSchema(
    schema: ZodObject<unknown>,
    entity: EntityDefinition
): Partial<Record<string, StringConstraints>> {

    const constraints: Partial<
        Record<string, StringConstraints>
    > = {}

    entity.fields.forEach(field => {
        constraints[field.name] =
            {
                ...buildStringConstraints(schema, field.name),
                required: field.validation?.required === true,
            }
    })

    return constraints
}
