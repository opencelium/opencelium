import type {PartialStepProps} from "@shared/ui/tour/Tour.tsx";
import type {PolicyDefinition} from "@/engine/policy";
import type {CommandNode} from "@shared/command/types.ts";
import type {FormRemoteProps, StepRemoteProps} from "@shared/ui/form/FormControl/FormControl.type.ts";
import type {DialogController} from "@shared/ui/dialog/DialogContext.tsx";
import React from "react";

export type Mode = 'create' | 'update' | 'view'

/* ===============================
   FIELD
================================ */

export type ValidationConfig = {
    required?: boolean
    min?: number
    max?: number
    email?: boolean
    regex?: {
        pattern: RegExp
        message: string
    }[]
    allowEmptyString?: boolean
    remote?: FormRemoteProps
    custom?: {
        validate: (value: any, values: any, mode?: Mode) => boolean
        message: string
    }[]
}


export type FieldComponentType =
    | 'input'
    | 'textarea'
    | 'password'
    | 'select'
    | 'checkbox'
    | 'date'
    | 'file-dropzone'
    | 'switch'
export type Role = string
export type Permission = string
export type FieldDefinition = {
    name: string
    label?: string
    labelKey?: string

    type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'other' | 'array' | 'file'
    placeholder?: string
    defaultValue?: string | number | boolean | Date | unknown
    getDefaultValue?: () => Promise<string | number | boolean | Date | unknown>,

    ui: {
        component: FieldComponentType
        props?: Record<string, unknown>
        overrideKey?: string
    }

    /** When true the field stays editable even in view mode or when forcedReadOnly is set. */
    interactive?: boolean

    validation?: ValidationConfig

    access?: PolicyDefinition
    table?: TableFieldDefinition

    search?: boolean

    data?: any,
}

/* ===============================
   TABLE COLUMN
================================ */

export type ColumnAlign = 'left' | 'center' | 'right'

export type TableFieldDefinition = {
    /** Whether the field is rendered as a column. Defaults to true when table is set. */
    visible?: boolean
    /** Lower numbers come first. Fields without an order keep definition order, after ordered ones. */
    order?: number
    sortable?: boolean
    /** Include this column in the global search input. */
    searchable?: boolean
    /** i18n key (entities namespace) used as the column header. */
    labelKey?: string
    /** Literal fallback header. Falls back to FieldDefinition.label / .labelKey / .name. */
    label?: string
    width?: number
    align?: ColumnAlign
    /** Transform the raw cell value before sort / search / render. */
    mapToValue?: (row: unknown, raw: unknown) => unknown
    /** Fully custom cell renderer. Receives the row and the (mapped) value. */
    render?: (row: unknown, value: unknown) => React.ReactNode
}

/* ===============================
   SECTION
================================ */

export type SectionDefinition = {
    id: string
    title?: string
    description?: string
    fields: string[]
    overrideKey?: string
    access?: PolicyDefinition
}

/* ===============================
   WIZARD
================================ */

export type Recommendation = {
    title: string
    link: string
}

export type WizardStepDefinition = {
    id: string
    header: string
    subheader?: string
    access?: PolicyDefinition

    sectionIds: string[]

    actions?: {
        nextLabel?: string
        submitLabel?: string
        prevLabel?: string
    }

    /**
     * Which fields to validate when moving to the next step
     */
    validateFields?: string[]
    info?: PartialStepProps[],

    remote?: StepRemoteProps,
}

export type WizardModeConfig = {
    header?: string
    subheader?: string
    successMessage?: string
    info?: PartialStepProps[],
    onSubmit?: (formData: any) => void,
    getSuccessMessage?: (formData: T) => string,
}

export type WizardDefinition = {
    image?: unknown
    imageField?: string
    /**
     * Optional dynamic preview rendered in place of `image` while the form is active.
     * The component is rendered inside FormProvider so it can `useWatch` form fields.
     * Engines must NOT decorate this — the entity owns the styling.
     */
    renderImage?: React.ComponentType
    overrideKey?: string
    recommendations?: Recommendation[]
    steps: WizardStepDefinition[]
    modes?: Partial<Record<Mode, WizardModeConfig>>
}
export type CrossFieldValidation = {
    fields: string[]
    validate: (data: unknown) => boolean
    message: string
    path: string
}
export type RouteType = 'create' | 'list' | 'view' | 'edit';

export type EntityRoute =
    | { type: RouteType }
    | {
    type: RouteType;
    entityRouteName?: string;
    path?: string;      // override
    element?: React.ReactNode; // override
    layout?: 'app' | 'public' | 'auth';
};
/* ===============================
   ENTITY
================================ */

/**
 * Context passed to lifecycle actions. `formData` is the un-mapped form data
 * (still has File objects for file fields); `payload` is the mapToApi'd shape.
 * `response` is the main mutation's result and is only present in `after` stages.
 */
export type LifecycleCtx<TForm = unknown, TPayload = unknown, TResponse = unknown> = {
    mode: Mode
    entity: EntityDefinition
    payload: TPayload
    formData: TForm
    identifier?: string
    response?: TResponse
}

type ActionShared<TCtx = any> = {
    condition?: (ctx: TCtx) => boolean;
    /**
     * When true, a thrown error is logged + surfaced via `errorMessageKey` toast
     * but does NOT abort the lifecycle stage or fail the main mutation.
     * Use for non-critical follow-ups (file uploads, telemetry, cache touches).
     */
    bestEffort?: boolean;
    /** i18n key (entities namespace) for the toast shown when bestEffort=true and the action throws. */
    errorMessageKey?: string;
};

type DeclarativeApiAction<TCtx = any> = ActionShared<TCtx> & {
    url: string | ((ctx: TCtx) => string);
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    mapBody?: (ctx: TCtx) => any;
    mapHeaders?: (ctx: TCtx) => Record<string, string>;
    ignoreError?: boolean;
};

type ImperativeApiAction<TCtx = any> = ActionShared<TCtx> & {
    execute: (ctx: TCtx) => Promise<unknown> | unknown;
};

type ApiAction<TCtx = any> = DeclarativeApiAction<TCtx> | ImperativeApiAction<TCtx>;

type LifecycleStage = {
    before?: string[]; // action names
    after?: string[];
};

type Lifecycle = {
    create?: LifecycleStage;
    update?: LifecycleStage;
    delete?: LifecycleStage;
};

export type OperationConfig = {
    /** HTTP method override. Defaults: create → POST, update → PUT, delete → DELETE */
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    /** Override the request URL. Receives baseUrl and (for update/delete) the identifier. */
    buildUrl?: (baseUrl: string, identifier?: string) => string;
};

type EntityApi<TCtx = any> = {
    baseUrl: string
    identifierField: string; // Field used for lookup in CMDK (email, username)
    primaryKey?: string;     // Field used to build the URL on PUT/DELETE (usually 'id' or 'uuid')
    resolveIdentifier: (input: string) => Promise<string[]>;
    mapToForm?: (data: any) => any;
    mapToApi?: ({mode, data}: {mode: Mode, data: any}) => any;
    getHeaders?: ({mode}: {mode: Mode}) => Record<string, string>,
    actions?: Record<string, ApiAction<TCtx>>;
    lifecycle?: Lifecycle;

    /** Per-operation overrides for HTTP method and URL construction. */
    operations?: {
        create?: OperationConfig;
        update?: OperationConfig;
        delete?: OperationConfig;
    };
}
export type ListActionType = 'view' | 'update' | 'delete' | 'custom'

/** Common config shared by built-in navigation/delete actions. */
type BaseListActionConfig = {
    /** Row property used as the URL identifier. Defaults to list.rowKey ?? api.primaryKey ?? 'id'. */
    field?: string
    /**
     * URL shape:
     *   true  → `/[entity]/[verb]/[value]`           (default for `id`-style keys)
     *   false → `/[entity]/[verb]/[field]/[value]`   (matches command-palette default)
     * Defaults to true when `field` is unspecified, otherwise false.
     */
    customPath?: boolean
}

export type ViewActionConfig = BaseListActionConfig & {
    type: 'view'
    /** Override the navigation URL. Receives the entity, the resolved value, and the row. */
    buildNavigationUrl?: (entity: EntityDefinition, value: string, row: unknown) => string
}

export type UpdateActionConfig = BaseListActionConfig & {
    type: 'update'
    buildNavigationUrl?: (entity: EntityDefinition, value: string, row: unknown) => string
}

export type DeleteActionConfig = BaseListActionConfig & {
    type: 'delete'
    /** i18n key OR literal message; receives `{ entityName, field, value }` for interpolation. */
    confirmMessage?: (value: string, entity: EntityDefinition, row: unknown) => string
    /** Override the DELETE request URL. */
    buildDeleteUrl?: (entity: EntityDefinition, value: string, row: unknown) => string
    /** Hook called after a successful delete. */
    afterDelete?: (value: string, row: unknown) => Promise<void> | void
    /**
     * When this returns a non-empty string, the delete button is rendered disabled
     * and the returned text is shown as a tooltip. Return `null` / `undefined` to leave
     * the button enabled. The string should already be translated.
     */
    disabledReason?: (row: unknown, entity: EntityDefinition) => string | null | undefined
}

/** Custom action — caller provides the rendered button. */
export type CustomActionConfig = {
    type: 'custom'
    /** Stable key used for React reconciliation. */
    key: string
    render: (ctx: CustomActionContext) => React.ReactNode
}

export type CustomActionContext = {
    entity: EntityDefinition
    row: unknown
    rowId: string
}

export type ListAction =
    | ViewActionConfig
    | UpdateActionConfig
    | DeleteActionConfig
    | CustomActionConfig

export type ListDefinition = {
    /** i18n key (entities namespace) for the page title; falls back to entity.plural / `${name}s`. */
    titleKey?: string
    /** i18n key (entities namespace) for the page subtitle. */
    subtitleKey?: string
    /**
     * Optional Trans-component map for the subtitle. When set, the subtitle is rendered through
     * `<Trans components={subtitleComponents} />`, so tags inside the translation string (e.g.
     * `<ntLink>Notification Templates</ntLink>`) are replaced by the matching React element.
     */
    subtitleComponents?: Record<string, React.ReactElement>
    /** Override URL for fetching the collection. Defaults to `${api.baseUrl}/all`. */
    fetchUrl?: string
    /**
     * Flatten a non-array fetch response into row objects. Use when `fetchUrl` returns a
     * keyed object or any shape that isn't an array / `{items|data|content}` array. Receives
     * the raw response, returns the row list that the table will render.
     */
    mapToRows?: (raw: unknown) => unknown[]
    /** Initial sorted column. */
    defaultSort?: { field: string; direction: 'asc' | 'desc' }
    /** When false, the global search input is hidden. Defaults to true. */
    searchable?: boolean
    /** i18n key (common or entities) for the search placeholder. */
    searchPlaceholderKey?: string
    /** i18n key for the empty-state message. */
    emptyKey?: string
    /**
     * Per-row actions. Defaults to view/update/delete inferred from routes/api.
     * Pass an explicit array (possibly empty) to take full control.
     */
    actions?: ListAction[]
    /** Field used to build view/update URLs and to identify rows. Defaults to api.primaryKey ?? 'id'. */
    rowKey?: string
    /** Page size for client-side pagination. Defaults to 15. */
    pageSize?: number
    /** Renders a checkbox column. Implied by `bulkDelete` or any `bulkActions`. */
    selectable?: boolean
    /** Bulk delete config. `true` uses defaults; pass an object to override. */
    bulkDelete?: true | BulkDeleteConfig
    /** Custom bulk-action buttons shown in the list header alongside Create / Delete-selected. */
    bulkActions?: BulkAction[]
    /**
     * Custom buttons shown in the list header between Delete-selected and Create.
     * Use for actions that aren't tied to row selection (e.g. import / upload).
     */
    headerActions?: HeaderAction[]
    /**
     * Optional row filters. Each filter declares its own type, label, default value and
     * row predicate. When present, GenericEntityList renders a filter icon next to the
     * search input that toggles a filter container with one control per entry.
     */
    filters?: ListFilter[]
    /**
     * Optional React hook invoked once per list render to compute per-row decoration
     * (currently just a className). Lets entities subscribe to context/Redux state and
     * apply transient visual states such as a highlight pulse on rows that just changed.
     * Must follow the rules of hooks (always call from the top level).
     */
    useRowDecoration?: () => {
        rowClassName?: (row: unknown, rowId: string) => string | undefined
    }
}

export type HeaderActionContext = {
    entity: EntityDefinition
}

export type HeaderAction = {
    /** Stable React key. */
    key: string
    render: (ctx: HeaderActionContext) => React.ReactNode
}

export type BulkDeleteConfig = {
    /** Override URL. Defaults to `${api.baseUrl}/list/delete`. */
    url?: string
    /** HTTP method. Defaults to 'PUT'. */
    method?: 'PUT' | 'POST' | 'DELETE'
    /** Row property used to extract the identifier. Defaults to list.rowKey ?? api.primaryKey ?? 'id'. */
    field?: string
    /** Override request payload. Defaults to `{ identifiers: ids }`. */
    buildPayload?: (ids: string[]) => unknown
    /** Hook called after a successful bulk delete. */
    afterDelete?: (ids: string[]) => Promise<void> | void
}

export type BulkActionContext = {
    /** Selected row objects (raw API shape). */
    rows: unknown[]
    /** Stringified identifiers, taken from `field` (or list.rowKey ?? api.primaryKey ?? 'id'). */
    ids: string[]
    entity: EntityDefinition
    /** Clears the table's row-selection state. */
    clearSelection: () => void
    /** Global dialog controller, for actions that open a form/confirmation dialog. */
    dialog: DialogController
}

/* ===============================
   LIST FILTERS
================================ */

export type ListFilterValue = string | number | boolean | string[] | number[] | null | undefined

type BaseFilterConfig = {
    /** Stable key for state + React reconciliation. */
    key: string
    /** i18n key (entities namespace) for the filter label. */
    labelKey?: string
    /** Literal label fallback when `labelKey` is not provided. */
    label?: string
}

/** A boolean toggle filter rendered as a `Switch`. */
export type SwitchFilterConfig = BaseFilterConfig & {
    type: 'switch'
    /** Initial value. Defaults to false. */
    defaultValue?: boolean
    /**
     * Row predicate. Called for every row with the current filter value.
     * Return true to keep the row, false to hide it.
     */
    apply: (row: unknown, value: boolean) => boolean
}

export type ListFilter = SwitchFilterConfig

export type ListFilterState = Record<string, ListFilterValue>

export type BulkAction = {
    /** Stable React key. */
    key: string
    /** i18n key (entities namespace) for the button label. */
    labelKey?: string
    /** Literal label fallback when `labelKey` is not provided. */
    label?: string
    /** Antd-style button variant. Defaults to 'default'. */
    buttonType?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
    /** Row property used to extract `ids`. Defaults to list.rowKey ?? api.primaryKey ?? 'id'. */
    field?: string
    /** Minimum selection count required for the button to render. Defaults to 1. */
    minSelected?: number
    /** Maximum selection count; when exceeded, the button is disabled. */
    maxSelected?: number
    /** Optional confirmation dialog shown before `run`. Both keys are entities-namespace. */
    confirm?: {
        titleKey: string
        messageKey: string
    }
    /** Action handler. Receives selected rows + ids and helpers. */
    run: (ctx: BulkActionContext) => Promise<void> | void
}

export type EntityDefinition = {
    name: string
    plural?: string

    routes?: EntityRoute[];

    access?: PolicyDefinition
    crossValidations?: CrossFieldValidation[]

    api?: EntityApi,

    fields: FieldDefinition[]
    sections: SectionDefinition[]

    wizard: WizardDefinition

    list?: ListDefinition

    commands?: (entity: EntityDefinition) => CommandNode<any>[];

    i18n?: Record<string, Record<string, any>>;
}
