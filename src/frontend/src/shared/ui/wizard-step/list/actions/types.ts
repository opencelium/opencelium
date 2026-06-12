import type {
    EntityDefinition,
    ViewActionConfig,
    UpdateActionConfig,
    DeleteActionConfig,
    CustomActionConfig,
} from '@/engine/entity/EntityDefinition';

/** Props passed to every built-in row-action component. */
export type ListActionButtonProps<TConfig> = {
    entity: EntityDefinition;
    row: unknown;
    /** The pre-resolved row identifier (entity.list.rowKey ?? api.primaryKey ?? 'id'). */
    rowId: string;
    config: TConfig;
    /** Stable selector for e2e tests; emitted as `data-testid` on the action button. */
    testId?: string;
};

export type ViewActionProps = ListActionButtonProps<ViewActionConfig>;
export type UpdateActionProps = ListActionButtonProps<UpdateActionConfig>;
export type DeleteActionProps = ListActionButtonProps<DeleteActionConfig>;
export type CustomActionProps = ListActionButtonProps<CustomActionConfig>;
