export function createId(prefix?: string): string {
    const cryptoApi = globalThis.crypto;
    const rawId =
        cryptoApi?.randomUUID?.()
        ?? createIdFromRandomValues(cryptoApi)
        ?? createIdFromMathRandom();

    return prefix ? `${prefix}-${rawId}` : rawId;
}

export function createShortId(prefix?: string): string {
    const id = createId().replace(/-/g, '').slice(0, 8);
    return prefix ? `${prefix}-${id}` : id;
}

function createIdFromRandomValues(cryptoApi?: Crypto): string | undefined {
    if (!cryptoApi?.getRandomValues) return undefined;

    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
    return [
        hex.slice(0, 4).join(''),
        hex.slice(4, 6).join(''),
        hex.slice(6, 8).join(''),
        hex.slice(8, 10).join(''),
        hex.slice(10, 16).join(''),
    ].join('-');
}

function createIdFromMathRandom(): string {
    const hex = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0'),
    );
    hex[6] = ((parseInt(hex[6], 16) & 0x0f) | 0x40).toString(16).padStart(2, '0');
    hex[8] = ((parseInt(hex[8], 16) & 0x3f) | 0x80).toString(16).padStart(2, '0');

    return [
        hex.slice(0, 4).join(''),
        hex.slice(4, 6).join(''),
        hex.slice(6, 8).join(''),
        hex.slice(8, 10).join(''),
        hex.slice(10, 16).join(''),
    ].join('-');
}
