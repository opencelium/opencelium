import { describe, expect, it } from 'vitest'
import { buildTutorialVersions } from './tutorialVersions'

describe('tutorial versions', () => {
    it('lists the samples newest first, with only the newest current', () => {
        const versions = buildTutorialVersions()
        expect(versions).toHaveLength(4)
        const times = versions.map(version => version.createdAt)
        expect([...times].sort((a, b) => b - a)).toEqual(times)
        expect(versions.map(version => version.current)).toEqual([true, false, false, false])
    })

    // A sample must never be mistaken for, or collide with, a real snapshot.
    it('gives every sample its own obviously invented snapshot id', () => {
        const ids = buildTutorialVersions().map(version => version.snapshotId)
        expect(new Set(ids).size).toBe(ids.length)
        ids.forEach(id => expect(id.startsWith('tutorial-version-')).toBe(true))
    })

    it('carries a comment and an author on every sample', () => {
        buildTutorialVersions().forEach(version => {
            expect(version.comment).not.toBe('')
            expect(version.author).not.toBe('')
        })
    })
})
