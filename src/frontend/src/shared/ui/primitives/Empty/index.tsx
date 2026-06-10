import type { EmptyProps } from './Empty.types';
import { useDynamicUI } from '@app/providers/ui/DynamicFacade';

export function Empty(props: EmptyProps) {
    const { Empty: Impl } = useDynamicUI();
    return <Impl {...props} />;
}
