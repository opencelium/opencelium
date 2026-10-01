import { createContext, useContext } from 'react';

const JointDeadEndContext = createContext<string | null>(null);

export const JointDeadEndProvider = JointDeadEndContext.Provider;

export const useHasNoJointTarget = (nodeId: string) => useContext(JointDeadEndContext) === nodeId;
