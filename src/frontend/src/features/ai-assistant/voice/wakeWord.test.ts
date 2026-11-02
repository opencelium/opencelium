import { describe, expect, it } from 'vitest'
import { matchWakeWord } from './wakeWord'

describe('matchWakeWord', () => {
    it.each([
        ['Beebot: where is the header of the method?', 'where is the header of the method?'],
        ['Beebot, wo ist der Header der Methode?', 'wo ist der Header der Methode?'],
        ['beebot show me the body of getCustomers', 'show me the body of getCustomers'],
        ['Bee bot, where is the URL?', 'where is the URL?'],
        ['B-bot where is the URL', 'where is the URL'],
        ['Bebot. Wo finde ich den Body?', 'Wo finde ich den Body?'],
        ['Hey Beebot, list the users', 'list the users'],
        ['Okay, Bibot: zeige alle Rollen', 'zeige alle Rollen'],
        ['Beabot where are the headers', 'where are the headers'],
    ])('hears %j as addressed', (transcript, request) => {
        expect(matchWakeWord(transcript)).toEqual({ isAddressed: true, request })
    })

    it('hears the name alone as addressed, with nothing asked yet', () => {
        expect(matchWakeWord('Beebot.')).toEqual({ isAddressed: true, request: '' })
    })

    it.each([
        'where is the header of the method?',
        'I told Beebot about it yesterday',
        'Wir müssen den Bericht bis morgen fertig haben',
        'Bob, can you check the build?',
        'Robot vacuum is running again',
        'be bold',
        '',
    ])('ignores %j', (transcript) => {
        expect(matchWakeWord(transcript)).toEqual({ isAddressed: false })
    })
})
