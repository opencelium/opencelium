import { i18n } from '@shared/i18n/config/i18n'
import { resolveGuideNode } from '@features/onboarding/guides/model/resolveGuideNode'
import { workflowCommandBridgeStore } from '@features/workflow/command/workflowCommandBridge'
import { tell } from './tell'

export type MethodPart = 'body' | 'header'

/**
 * "Open the body of cmdb.objects.read", "CreateUser header", "open body": opens that part of the method's request
 * right away, where "where is the body of …" walks there with a guide. A named method is the first match in the tree;
 * none named is the selected method, else the first.
 */
export function openMethodPartFromRequest(part: MethodPart, method: string): void {
    const bridge = workflowCommandBridgeStore.getState()
    const resolution = resolveGuideNode(bridge.getNodes(), bridge.getEdges(), method || undefined)
    switch (resolution.kind) {
        case 'found':
            bridge.centerOnNode(resolution.nodeId)
            bridge.openRequestEditor({ nodeId: resolution.nodeId, mode: part })
            return
        case 'no-methods':
            tell.error(i18n.getFixedT(i18n.language, 'onboarding')('guides.errors.noMethods'))
            return
        case 'no-match':
            tell.error(i18n.getFixedT(i18n.language, 'common')('commandPalette.workflowEdit.unknownStep', { method: resolution.method }))
            return
        default: {
            const _exhaustive: never = resolution
            return _exhaustive
        }
    }
}
