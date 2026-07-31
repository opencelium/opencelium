import type {FormRemoteProps} from "@shared/ui/form/FormControl/FormControl.type.ts";
import {buildRemoteRequest} from "@/engine/entity/utils/buildRemoteRequest.ts";

export async function executeRemote({
    remote,
    values,
    fieldValue,
    apiExecutor,
}: {
    remote: FormRemoteProps
    values: any
    fieldValue?: any
    apiExecutor: any
}) {
    try {
        const response = await apiExecutor(
            buildRemoteRequest({ remote, fieldValue, values })
        )

        if (!remote.handleResponse) {
            return { success: true, data: response }
        }
        const result = remote.handleResponse(response, null)

        if (result !== true) {
            return {
                success: false,
                message:
                    typeof result === 'string'
                        ? result
                        : remote.transKey,
            }
        }

        return { success: true, data: response }
    } catch (error) {
        if (remote.handleResponse) {
            const result = remote.handleResponse(null, error)

            if (result !== true) {
                return {
                    success: false,
                    message:
                        typeof result === 'string'
                            ? result
                            : remote.transKey,
                }
            }
        }

        return {
            success: false,
            message: remote.transKey,
        }
    }
}
