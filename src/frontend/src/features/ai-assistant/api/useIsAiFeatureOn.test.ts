import { describe, expect, it } from 'vitest'
import type { AiHealth } from '../model/aiGateway.types'
import { isAiFeatureOn } from './useIsAiFeatureOn'

const health = (disabledFeatures?: AiHealth['disabledFeatures']) => ({
    status: 'ok', ollama: { reachable: true, models: [] }, workflowModel: { name: 'm', available: true }, invokerCount: 0, disabledFeatures,
}) as AiHealth

describe('isAiFeatureOn', () => {
    it('is off only for a feature an admin switched off', () => {
        expect(isAiFeatureOn(health(['help']), 'help')).toBe(false)
        expect(isAiFeatureOn(health(['help']), 'command-palette')).toBe(true)
    })

    it('is on for a gateway that does not report switches, and before health is known', () => {
        expect(isAiFeatureOn(health(), 'help')).toBe(true)
        expect(isAiFeatureOn(undefined, 'help')).toBe(true)
    })
})
