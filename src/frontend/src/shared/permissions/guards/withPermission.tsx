import { can } from '../can'
import { useAuthUser } from '@/entities/auth'

type Options = {
    fallback?: React.ReactNode
    redirectTo?: string
    getEntity?: (props: any) => unknown
}

export function withPermission(
    permission: Permission,
    options: Options = {}
) {
    return function <P>(Component: React.ComponentType<P>) {
        return function WithPermission(props: P) {
            const user = useAuthUser()
            const entity = options.getEntity?.(props)

            const allowed = can({
                permission,
                user,
                entity,
            })

            if (!allowed) {
                if (options.redirectTo) {
                    return <Navigate to={options.redirectTo} />
                }

                return options.fallback ?? null
            }

            return <Component {...props} />
        }
    }
}
