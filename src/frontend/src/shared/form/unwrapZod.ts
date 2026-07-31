import {
    ZodTypeAny,
    ZodObject,
    ZodOptional,
    ZodNullable,
} from 'zod';

export function unwrapZodObject(
    schema: ZodTypeAny
): ZodObject<any> | null {
    let current: ZodTypeAny = schema;

    while (true) {
        if (current instanceof ZodObject) {
            return current;
        }

        if (
            current instanceof ZodOptional ||
            current instanceof ZodNullable
        ) {
            current = current._def.schema;
            continue;
        }

        return null;
    }
}
