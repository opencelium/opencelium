type Join<K, P> =
    K extends string | number
        ? P extends string | number
            ? `${K}.${P}`
            : never
        : never

export type DeepKeys<T> = {
    [K in keyof T]:
    T[K] extends Record<string, any>
        ? Join<K & string, DeepKeys<T[K]>>
        : K & string
}[keyof T]

export type LeafKeys<T, Prefix extends string = ''> = {
    [K in keyof T]:
    T[K] extends string
        ? `${Prefix}${Extract<K, string>}`
        : T[K] extends object
            ? LeafKeys<T[K], `${Prefix}${Extract<K, string>}.`>
            : never
}[keyof T];
