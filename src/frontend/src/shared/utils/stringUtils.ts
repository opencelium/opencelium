export function capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, c => c.toUpperCase());
}
