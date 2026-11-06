import { describe, expect, it } from 'vitest'
import { isCapabilitiesQuestion, readConfirmAnswer, readStopRequest, splitRequests } from './spokenAnswers'

describe('readConfirmAnswer', () => {
    it('takes a yes or a no, in English and German', () => {
        expect(readConfirmAnswer('Yes.', false)).toBe('yes')
        expect(readConfirmAnswer('ja bitte', false)).toBe('yes')
        expect(readConfirmAnswer('no', false)).toBe('no')
        expect(readConfirmAnswer('Nein, abbrechen!', false)).toBe('no')
    })

    it('asks for "yes, delete" before anything is removed', () => {
        expect(readConfirmAnswer('yes', true)).toBe('needs-delete')
        expect(readConfirmAnswer('yes, delete', true)).toBe('yes')
        expect(readConfirmAnswer('Ja, löschen.', true)).toBe('yes')
        expect(readConfirmAnswer('no', true)).toBe('no')
    })

    it('leaves a longer sentence for a new request', () => {
        expect(readConfirmAnswer('yes and then add a loop after it', false)).toBeNull()
        expect(readConfirmAnswer('the weather is nice', false)).toBeNull()
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
