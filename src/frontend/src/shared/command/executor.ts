import type {ASTNode} from "@shared/command/ast.ts";
import type {CommandExecutionContext} from "@shared/command/types.ts";

export async function executeAST(
    ast: ASTNode[],
    ctx: CommandExecutionContext
) {
    const last = ast[ast.length - 1];

    if (!last?.node.execute) return;

    const args: Record<string, unknown> = {};

    ast.forEach((n) => {
        if (n.node.type === 'entity') {
            args[n.node.name!] = n.value;
        }
    });

    await last.node.execute(args, ctx);
}
