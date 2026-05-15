import {interpolateUrl} from "@shared/utils/interpolateUrl.ts";
import type {FormRemoteProps} from "@shared/ui/form/FormControl/FormControl.type.ts";

type BuildRemoteParams = {
    remote: FormRemoteProps
    fieldValue: any
    values: any
}

export function buildRemoteRequest({
                                       remote,
                                       fieldValue,
                                       values,
                                   }: BuildRemoteParams) {
    const params = remote.map(fieldValue, values)

    let finalUrl = remote.url
    let body: any = undefined

    if (remote.method === 'GET') {
        if (remote.query) {
            const queryString = new URLSearchParams(params).toString()
            finalUrl = queryString
                ? `${remote.url}?${queryString}`
                : remote.url
        } else {
            finalUrl = interpolateUrl(
                remote.url,
                params,
                remote.encodeParams !== false // default true
            )
        }
    } else {
        body = params
    }

    return {
        url: finalUrl,
        method: remote.method,
        body,
        options: {
            ignoreError: remote?.ignoreError,
        }
    }
}
