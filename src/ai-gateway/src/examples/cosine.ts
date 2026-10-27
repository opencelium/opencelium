export function cosine(left: number[], right: number[]): number {
    let dot = 0, leftNorm = 0, rightNorm = 0
    left.forEach((value, index) => {
        const other = right[index] ?? 0
        dot += value * other
        leftNorm += value * value
        rightNorm += other * other
    })
    return leftNorm && rightNorm ? dot / Math.sqrt(leftNorm * rightNorm) : 0
}
