import { NEW_FEATURES, type NewFeatureId } from './newFeatures'
import { isFeatureCurrent } from './newFeature.utils'
import { useNewFeatureStore } from './newFeature.store'
import { useAppVersion } from './useAppVersion'

export function useNewFeature(id: NewFeatureId) {
    const version = useAppVersion()
    const isSeen = useNewFeatureStore(state => state.seen.includes(id))
    const markSeen = useNewFeatureStore(state => state.markSeen)
    return {
        isNew: !isSeen && isFeatureCurrent(NEW_FEATURES[id].since, version),
        markSeen: () => markSeen(id),
    }
}

