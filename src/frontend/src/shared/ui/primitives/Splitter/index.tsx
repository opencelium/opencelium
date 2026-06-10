import type { SplitterProps } from './Splitter.types';
import { useDynamicUI } from '@app/providers/ui/DynamicFacade';

export function Splitter(props: SplitterProps) {
    const { Splitter: Impl } = useDynamicUI();
    return <Impl {...props} />;
}
