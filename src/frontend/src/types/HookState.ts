
export type TextVariableType<T> = keyof T;
// @ts-ignore
export type TextFunctionType<T> = `update${Capitalize<keyof T>}`;