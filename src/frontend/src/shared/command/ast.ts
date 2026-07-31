import type {CommandNode} from "@shared/command/types.ts";

export interface ASTNode {
    node: CommandNode;
    value?: string;
    children?: ASTNode[];
}
