const listSearchByPath = new Map<string, string>();

export function rememberListLocation(pathname: string, search: string) {
    listSearchByPath.set(pathname, search);
}

export function listLocation(path: string) {
    return path + (listSearchByPath.get(path) ?? '');
}
