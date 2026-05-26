export type ConfigCommentPosition = 'before' | 'inline' | 'after'

export type ConfigComment = {
    path: string
    position: ConfigCommentPosition
    text: string
}

export type ConfigValue =
    | string
    | number
    | boolean
    | null
    | ConfigValue[]
    | { [key: string]: ConfigValue }

export type ConfigData = Record<string, ConfigValue>

export type ApplicationConfigResponse = {
    data: ConfigData
    comments: ConfigComment[]
}

export type ApplicationConfigPatchResponse = {
    status: string
    restartRequired: boolean
    message: string
}
