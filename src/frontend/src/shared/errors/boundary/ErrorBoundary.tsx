import React from 'react'
import { boundaryService } from './boundaryService'
import type {BoundaryErrorScope} from "@shared/errors/types.ts";

type Props = {
    fallback: React.ReactNode
    scope?: BoundaryErrorScope
    children: React.ReactNode
}

type State = {
    hasError: boolean
}

export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false }

    static getDerivedStateFromError() {
        return { hasError: true }
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

    render() {
        if (this.state.hasError) {
            return this.props.fallback
        }

        return this.props.children
    }
}
