import { describe, expect, it } from 'vitest'
import { isCapabilitiesQuestion, readConfirmAnswer, readStopRequest, splitRequests } from './spokenAnswers'

describe('readConfirmAnswer', () => {
    it('confirms on yes, confirm or delete, in English and German', () => {
        for (const said of ['Yes.', 'ja bitte', 'confirm', 'Delete!', 'yes, delete', 'remove it', 'okay', 'go ahead', 'do it',
            'Ja, löschen.', 'bestätigen', 'entfernen', 'mach das']) {
            expect(readConfirmAnswer(said), said).toBe('yes')
        }
    })

    it('cancels on no or cancel, in English and German', () => {
        for (const said of ['no', 'Cancel.', 'no thanks', 'keep it', 'Nein, abbrechen!', 'nö', 'behalten']) {
            expect(readConfirmAnswer(said), said).toBe('no')
        }
    })

    it('cancels a mixed answer, so it never removes by mistake', () => {
        expect(readConfirmAnswer("no, don't delete")).toBe('no')
        expect(readConfirmAnswer('nein, nicht löschen')).toBe('no')
        expect(readConfirmAnswer('yes cancel')).toBe('no')
    })

    it('leaves a longer sentence for a new request', () => {
        expect(readConfirmAnswer('yes and then add a loop after it')).toBeNull()
        expect(readConfirmAnswer('the weather is nice')).toBeNull()
    })
})

describe('readStopRequest', () => {
    it('tells "stop" from "stop listening"', () => {
        expect(readStopRequest('stop')).toBe('stop')
        expect(readStopRequest('Stopp!')).toBe('stop')
        expect(readStopRequest('never mind')).toBe('stop')
        expect(readStopRequest('stop listening')).toBe('stop-listening')
        expect(readStopRequest('hör auf zuzuhören')).toBe('stop-listening')
    })

    it('leaves "stop the test" to the test run', () => {
        expect(readStopRequest('stop the test')).toBeNull()
        expect(readStopRequest('stoppe den Testlauf')).toBeNull()
        expect(readStopRequest('stop it now')).toBeNull()
        expect(readStopRequest('stop it')).toBe('stop')
    })
})

describe('isCapabilitiesQuestion', () => {
    it('recognises the question in both languages', () => {
        expect(isCapabilitiesQuestion('what can you do?')).toBe(true)
        expect(isCapabilitiesQuestion('Was kannst du?')).toBe(true)
        expect(isCapabilitiesQuestion('add a loop')).toBe(false)
    })
})

describe('splitRequests', () => {
    it('splits on "and then" / "und dann", in order', () => {
        expect(splitRequests('add GetComments from Jira and then map it from SearchIssues'))
            .toEqual(['add GetComments from Jira', 'map it from SearchIssues'])
        expect(splitRequests('füge eine Schleife hinzu und dann teste den Workflow'))
            .toEqual(['füge eine Schleife hinzu', 'teste den Workflow'])
        expect(splitRequests('save the workflow, then run a live test')).toEqual(['save the workflow', 'run a live test'])
    })

    it('keeps one request whole, a plain "and" included', () => {
        expect(splitRequests('map the title and the body from SearchIssues')).toEqual(['map the title and the body from SearchIssues'])
        expect(splitRequests('save it then go')).toEqual(['save it then go'])
    })
})
