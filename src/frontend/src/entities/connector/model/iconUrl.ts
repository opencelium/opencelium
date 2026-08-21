import defaultConnectorImage from '@/assets/images/default_connector.png'
import { resolveStorageUrl } from '@shared/utils/storageUrl'

export { defaultConnectorImage }

export const resolveConnectorIconUrl = (icon?: string | null): string | null =>
    resolveStorageUrl(icon)

const asIconPath = (icon: unknown): string | null =>
    typeof icon === 'string' && icon.trim() ? icon : null

/**
 * A connector without its own icon inherits the one from its invoker — the same chain
 * the workflow method node walks (see workflowNodeHydration), so a connector shows the
 * same image everywhere it appears. Returns null when nothing in the chain has one,
 * leaving the default connector image to the renderer.
 *
 * `invokerIcon` is for connector shapes that don't embed their invoker's icon:
 * ConnectorMetaDTO (GET /connector/meta/all, which the workflow sidebar lists) carries
 * only the invoker's name, so the caller looks the icon up from the invoker list.
 *
 * `icon` can still be a freshly picked File (the wizard's pending change), which is
 * not a displayable path here.
 */
export const resolveConnectorIcon = (
    connector: {
        icon?: string | File | null
        // `name` is here so a ConnectorMetaDTO's `{ name }`-only invoker is accepted:
        // an object type with no property in common is rejected outright by TS.
        invoker?: { name?: string; icon?: string | null } | null
    },
    invokerIcon?: string | null,
): string | null =>
    asIconPath(connector.icon) ?? asIconPath(connector.invoker?.icon) ?? asIconPath(invokerIcon)
