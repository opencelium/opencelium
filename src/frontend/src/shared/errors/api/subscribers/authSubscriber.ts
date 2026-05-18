import { errorBus } from '../errorBus'

export function initApiAuthErrorSubscriber() {
    return errorBus.subscribe((error) => {
        if (error.type === 'UNAUTHORIZED') {
            console.log('logout')
        }
    })
}
