export interface StringConstraints {
    maxLength?: number;
    minLength?: number;
    required?: boolean;
}

export type FormConstraints = Record<string, StringConstraints>;
