import {create} from "zustand";
import type {LdapLog} from "@entities/ldap/model/types.ts";

interface LdapState {
    logs: LdapLog[];
    setLogs: (logs: LdapLog[]) => void;
}

export const useLdapStore = create<LdapState>((set) => ({
    logs: [],
    setLogs: (logs) => set({ logs}),
}));
