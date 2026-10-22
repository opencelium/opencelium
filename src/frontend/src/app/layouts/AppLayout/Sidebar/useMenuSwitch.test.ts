import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NavigateFunction } from 'react-router-dom'
import { useLayoutStore } from '@app/layouts/AppLayout/layout.store'
import { switchMenu } from './useMenuSwitch'

const pushing: NavigateFunction = ((to: string) => window.history.pushState(null, '', to)) as NavigateFunction
const vetoed: NavigateFunction = (() => undefined) as NavigateFunction

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
        const navigate = vi.fn(vetoed)
        switchMenu(navigate, 'admin')
        expect(navigate).toHaveBeenCalledWith('/user')
        expect(useLayoutStore.getState().menuType).toBe('main')
    })
})
