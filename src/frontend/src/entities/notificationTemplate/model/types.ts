export interface AggregatorArg {
    id: number
    name: string
    description: string
}

export interface Aggregator {
    id: number
    name: string
    script: string
    active: boolean
    args: AggregatorArg[]
}

export interface NotificationTemplateContent {
    contentId?: number
    body: string
    subject: string
    language: string
}

export interface NotificationTemplate {
    templateId: number
    name: string
    type: string
    content: NotificationTemplateContent[]
}

// Form shape — subject/body stored in display format {{aggregatorName.argName}}
export interface NotificationTemplateFormDto {
    templateId?: number
    name: string
    type: string
    aggregator?: number | null
    subject: string
    body: string
}

// Server shape for create/update
export interface NotificationTemplateDto {
    name: string
    type: string
    content: NotificationTemplateContent[]
}
