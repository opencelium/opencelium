export function randomId(): number {
    return Math.floor(Math.random() * 1_000_000) + 1;
}
