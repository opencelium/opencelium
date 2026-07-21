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

    setInputValue: (v: string) => void,

    /** Return keyboard focus to the palette input (e.g. after a modal closes). */
    focusInput?: () => void,

    /** Set by the workflow editor's embedded command palette — create/update
     * wizards opened from there skip the success screen's recommendation tags,
     * since they point to unrelated top-level pages that don't fit the in-editor flow. */
    hideRecommendations?: boolean,
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

    resolve?: (input?: unknown) => Promise<SuggestionOption[]>; // ⚡ async suggestions

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
    /** Inert, informational row — not highlightable/selectable via keyboard or click. */
    disabled?: boolean;
};

// A resolver can return a plain string (value === label) or an object pairing
// the value substituted into the palette input with a separate display label
// — used when the value must carry extra disambiguating data (e.g. an id)
// that shouldn't be shown to the user. `disabled` marks a purely informational
// suggestion (e.g. a "nothing to show" message) that can't be selected.
export type SuggestionOption = string | { value: string; label: string; disabled?: boolean };
