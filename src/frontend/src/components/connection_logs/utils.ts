export function getParentIndex(childIndex: string) {
    return childIndex.split('_').slice(0, -1).join('_');
}
