import type {FormRemoteProps} from "@shared/ui/form/FormControl/FormControl.type.ts";
import {executeRemote} from "@shared/api/executeRemote.ts";

export async function executeStepRemote({
    remote,
    values,
    apiExecutor,
}: {
    remote: FormRemoteProps
    values: any
    apiExecutor: any
}) {
    try {
        console.log('executeStepRemote')
        const result = await executeRemote({
            remote,
            values,
            fieldValue: undefined,
            apiExecutor,
        })

        if (!result.success) {
            return {
                success: false,
                result,
            }
        }

        // optional side-effects (if needed)
        // remote.onSuccess?.(ctx, result.data)

        return {
            success: true,
            result,
        }
    } catch (e) {
        console.error(e)
    }
}
