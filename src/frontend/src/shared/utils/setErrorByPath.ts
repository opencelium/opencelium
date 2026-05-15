export function setErrorByPath(obj: any, path: string, value: any) {
    const parts = path.split('.')
    let current = obj

    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
            current[parts[i]] = {}
        }
        current = current[parts[i]]
    }

    current[parts[parts.length - 1]] = value
}
