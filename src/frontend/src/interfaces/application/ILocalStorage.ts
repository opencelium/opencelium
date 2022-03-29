interface ILocalStorage{
    set(key: string, value: any, namespace?: string): void,
    get(key: string, namespace?: string): any,
    remove(key: string, namespace?: string): void,
    removeAll(key: string, namespace?: string): void,
}

export {
    ILocalStorage,
}