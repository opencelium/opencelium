import { overrideRegistry } from '@/engine/entity/overrides/overrideRegistry'

overrideRegistry.registerField('userGroupSelect', ({ defaultRender }) => {
    return (
        <div style={{ border: '1px solid red', padding: 10 }}>
            {defaultRender()}
        </div>
    )
})
