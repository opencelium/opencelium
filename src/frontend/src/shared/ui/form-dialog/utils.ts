import {ZodTypeAny} from "zod";
import {getStringConstraints} from "@shared/form/zodConstraints.ts";
import {unwrapZodObject} from "@shared/form/unwrapZod.ts";

export function extractConstraints(schema: ZodTypeAny) {
    const objectSchema = unwrapZodObject(schema);
    if (!objectSchema) return {};

    return Object.keys(objectSchema.shape).reduce((acc, key) => {
        acc[key] = getStringConstraints(schema, key);
        return acc;
    }, {} as Record<string, any>);
}
