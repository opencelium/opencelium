export type SourceType = 'request' | 'response';
export interface DirectReferenceData {
    color: string,
    type: SourceType,
    field: string,
}
