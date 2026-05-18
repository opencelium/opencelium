export type Reference =
    | { type: 'enhancement'; id: string }
    | { type: 'webhook'; url: string }
    | { type: 'requiredData'; key: string };
