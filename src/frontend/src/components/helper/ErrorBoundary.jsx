import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        //Console.print(errorInfo.componentStack)
    }

    render() {
        if (this.state.hasError) {
            return <h1>Something went wrong</h1>;
        }
        return this.props.children;
    }
}

export const ErrorWrapper = ({children}) => {
    return(
        <ErrorBoundary>
            {children}
        </ErrorBoundary>
    )
}