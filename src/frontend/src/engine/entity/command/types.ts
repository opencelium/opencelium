import type {EntityDefinition} from "@/engine/entity/EntityDefinition.ts";
import type {CommandExecutionContext, CommandNode} from "@shared/command/types.ts";

export type EntityCommandType = 'create' | 'list' | 'update' | 'view' | 'delete';


export interface EntityCommandConfig {
    include?: EntityCommandType[];
    exclude?: EntityCommandType[];

    overrideProps?: Partial<
        Record<EntityCommandType, Partial<CommandNode<any>>>
    >;

    overrides?: Partial<
        Record<EntityCommandType, (def: EntityDefinition, ctx: CommandExecutionContext) => void>
    >;
    getUrl?: Partial<
        Record<
            EntityCommandType,
            (params: {
                def: EntityDefinition;
                identifier?: string;
                field?: string;
            }) => string
        >
    >;
}

export type CreateEntityCommandsType = {
    def: EntityDefinition,
    config?: EntityCommandConfig,
    dsl?: EntityCommandDSL,
    // Override the word users type/see in the command palette without changing
    // the entity registry name (which is tied to routes and the backend API path).
    commandName?: string,
}

export type GeneralCommandType = CreateEntityCommandsType & {
    name: string,
}
export type UpdateByConfig = {
    field: string;
    customPath?: string,
    resolve?: (input: string) => Promise<any>;
    buildFetchUrl?: (def: EntityDefinition, value: string) => string;
    buildNavigationUrl?: (def: EntityDefinition, value: string) => string;
};
export type DeleteByConfig = {
    field: string;
    customPath?: string,
    resolve?: (input: string) => Promise<any>;
    confirmMessage?: (value: string, def: EntityDefinition) => string;
    buildDeleteUrl?: (def: EntityDefinition, value: string) => string;
    afterDelete?: (value: string, ctx: any) => Promise<void>;
};
export type ViewByConfig = {
    field: string;
    customPath?: boolean;
    resolve?: (input: string) => Promise<any>;
    buildFetchUrl?: (def: EntityDefinition, value: string) => string;
    buildNavigationUrl?: (def: EntityDefinition, value: string) => string;
    beforeOpen?: (value: string, ctx: any) => Promise<void>;
    afterOpen?: (value: string, ctx: any) => Promise<void>;
};
export type EntityCommandDSL = {
    update?: {
        by?: UpdateByConfig[];
    };
    delete?: {
        by?: DeleteByConfig[];
    };
    view?: {
        by?: ViewByConfig[];
    };
};
