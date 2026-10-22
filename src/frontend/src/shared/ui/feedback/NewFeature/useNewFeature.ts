import { NEW_FEATURES, type NewFeatureId } from './newFeatures'
import { isFeatureCurrent } from './newFeature.utils'
import { useNewFeatureStore } from './newFeature.store'
import { useAppVersion } from './useAppVersion'

/** Shown until the user clicks "Got it" or the backend runs a release newer than the feature's `since`. */
export function useNewFeature(id: NewFeatureId) {
    const version = useAppVersion()
    const isDismissed = useNewFeatureStore(state => state.dismissed.includes(id))
    const dismiss = useNewFeatureStore(state => state.dismiss)
    return {
        isNew: !isDismissed && isFeatureCurrent(NEW_FEATURES[id].since, version),
        dismiss: () => dismiss(id),
    }
}
