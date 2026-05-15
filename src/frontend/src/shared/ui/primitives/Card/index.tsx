import type { CardProps } from './Card.types';
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function Card(props: CardProps) {
    const { Card } = useDynamicUI();
    return <Card {...props} />;
}
