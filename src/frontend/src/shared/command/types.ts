import React from "react";
import type {PolicyDefinition} from "@/engine/policy";
import type {IconName} from "@shared/ui/primitives/Icon/Icon.types.ts";

export interface CommandConfirmOptions {
    title?: React.ReactNode;
    message?: React.ReactNode;
}

export interface CommandExecutionContext {
    openModal: (node: React.ReactNode, options?: {width?: number | string}) => void;
    navigate: (url: string) => void;
    openNewTab: (url: string) => void;
    render: (node: React.ReactNode) => void;
    setLoading: (isLoading: boolean) => void;

    confirm: (options: string | CommandConfirmOptions) => Promise<boolean>;

    notify: (message: string, type?: 'success' | 'error') => void;

    setInputValue: (v: string) => void,

    /** Return keyboard focus to the palette input (e.g. after a modal closes). */
    focusInput?: () => void,
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
