import { beforeEach, describe, expect, it } from 'vitest'
import type { NavigateFunction } from 'react-router-dom'
import { useLayoutStore } from '@app/layouts/AppLayout/layout.store'
import { switchMenu } from './useMenuSwitch'

const pushing: NavigateFunction = ((to: string) => window.history.pushState(null, '', to)) as NavigateFunction

describe('switchMenu', () => {
    beforeEach(() => {
        window.history.replaceState(null, '', '/workflow/update/5')
        useLayoutStore.setState({ menuType: 'main', lastPathByMenu: { main: '/workflow/update/5', admin: '/user' } })
    })

    it('switches the menu once the navigation goes through', () => {
        switchMenu(pushing, 'admin')
        expect(window.location.pathname).toBe('/user')
        expect(useLayoutStore.getState().menuType).toBe('admin')
    })

    it('keeps the menu when a leave guard drops the navigation', () => {
        const attempted: unknown[] = []
        const vetoed = ((to: unknown) => { attempted.push(to) }) as NavigateFunction
        switchMenu(vetoed, 'admin')
        expect(attempted).toEqual(['/user'])
        expect(useLayoutStore.getState().menuType).toBe('main')
    })
})
