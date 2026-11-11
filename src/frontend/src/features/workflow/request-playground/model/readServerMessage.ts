import { normalizeError } from '@shared/errors/api/normalizeError';

// The backend's own explanation (ErrorResource `message`), or null when it sent none.
export const readServerMessage = (error: unknown): string | null => normalizeError(error).serverMessage ?? null;
