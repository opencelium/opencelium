import type { CollapseProps } from './Collapse.types';
import { useDynamicUI } from '@app/providers/ui/DynamicFacade.tsx';

export function Collapse(props: CollapseProps) {
    const { Collapse } = useDynamicUI();
    return <Collapse {...props} />;
}
