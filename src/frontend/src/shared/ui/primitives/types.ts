import type { UISystem } from '@shared/theme/types';

export type FactoryComponent<ComponentType> =
    Partial<Record<UISystem, ComponentType>>;

export type UIFactory<T> = {
    default: T
} & FactoryComponent<T>
