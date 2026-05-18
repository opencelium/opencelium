import React from "react";
import type {PolicyDefinition} from "@/engine/policy";
import type {IconName} from "@shared/ui/primitives/Icon/Icon.types.ts";

export interface CommandExecutionContext {
    openModal: (node: React.ReactNode) => void;
    navigate: (url: string) => void;
    openNewTab: (url: string) => void;
    render: (node: React.ReactNode) => void;
    setLoading: (isLoading: boolean) => void;

    confirm: (message: string) => Promise<boolean>;

    notify: (message: string, type?: 'success' | 'error') => void;

    setInputValue: (v: string) => void,
}

export type CommandNodeType =
    | 'literal'
    | 'entity'
    | 'argument';

export type CommandGroup = string;

export interface CommandNode<Entity> {
    type: CommandNodeType;
    url?: string,
    value?: string;          // for literal
    name?: string;           // argument name
    children?: CommandNode<Entity>[];
    aliases?: string[];

    icon?: IconName;
    group?: CommandGroup;
    description?: string;
    shortcut?: string[];

    access?: PolicyDefinition;

    resolve?: (input?: unknown) => Promise<string[]>; // ⚡ async suggestions

    execute?: (
        args: Entity,
        ctx: CommandExecutionContext
    ) => Promise<void> | void;
}

export type Suggestion = {
    value: string;
    label?: string;
    icon?: IconName;
    group?: CommandGroup;
    description?: string;
    shortcut?: string[];
};
