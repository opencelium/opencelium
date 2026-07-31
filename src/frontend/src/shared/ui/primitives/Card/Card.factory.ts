import type { CardComponent } from './Card.types';
import { MaterialCard } from './Card.material';
import { AntCard } from './Card.ant';
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const CardFactory: UIFactory<CardComponent> = {
    default: AntCard,
    material: MaterialCard,
    ant: AntCard,
};
