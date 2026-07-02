import React from 'react'
import { boundaryService } from './boundaryService'
import type { BoundaryErrorScope, CrashFallbackProps } from "@shared/errors/types.ts";

type Props = {
    fallback: (props: CrashFallbackProps) => React.ReactNode
    scope?: BoundaryErrorScope
    // When any value here changes, the boundary clears its error and retries —
    // e.g. pass [pathname] so navigating away from a crashed page recovers it.
    resetKeys?: unknown[]
    children: React.ReactNode
}

type State = {
    hasError: boolean
    error?: Error
    resetKeys?: unknown[]
}

function resetKeysChanged(prev?: unknown[], next?: unknown[]): boolean {
    if (prev === next) return false
    if (!prev || !next || prev.length !== next.length) return true
    return prev.some((value, i) => !Object.is(value, next[i]))
}

export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false, resetKeys: this.props.resetKeys }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error }
    }

    static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
        if (!resetKeysChanged(state.resetKeys, props.resetKeys)) return null
        return {
            resetKeys: props.resetKeys,
            ...(state.hasError ? { hasError: false, error: undefined } : null),
        }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        boundaryService.report({
            error,
            errorInfo: {
                componentStack: errorInfo.componentStack,
            },
            scope: this.props.scope ?? 'app',
        })
    }

    reset = () => {
        this.setState({ hasError: false, error: undefined })
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback({
                reset: this.reset,
                scope: this.props.scope ?? 'app',
                error: this.state.error,
            })
        }

        return this.props.children
    }
}
