import { NEW_FEATURES, type NewFeatureId } from './newFeatures'
import { isFeatureCurrent } from './newFeature.utils'
import { useAppVersion } from './useAppVersion'

/** Shown until the backend runs a release newer than the feature's `since`; interacting with it does not dismiss it. */
export function useNewFeature(id: NewFeatureId) {
    const version = useAppVersion()
    return { isNew: isFeatureCurrent(NEW_FEATURES[id].since, version) }
}
