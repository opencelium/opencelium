import { createContext } from 'react';
import type { ExecutionPlaygroundLocation } from '../model/executionPlayground';

export const LogPlaygroundOpenContext = createContext<((location: ExecutionPlaygroundLocation) => void) | null>(null);
export const LogPlaygroundRootContext = createContext<Pick<ExecutionPlaygroundLocation, 'direction' | 'executionId'> | null>(null);
