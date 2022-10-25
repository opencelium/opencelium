interface RequiredDataProps{
    authType: string,
    setRequiredData: (newRequiredData: any) => void,
    initialRequiredData?: any,
}

interface EntryProps{
    name: string,
    visibility: {label: string, value: string},
    value?: string,
    key?: string,
}

interface RequiredDataEntryProps{
    index?: string,
    entry?: EntryProps,
    mode?: 'add' | 'update',
    updateEntry?: (entry: EntryProps) => void,
    addEntry?: (entry: EntryProps) => void,
    hasLabels?: boolean,
}

export {
    RequiredDataProps,
    EntryProps,
    RequiredDataEntryProps,
}