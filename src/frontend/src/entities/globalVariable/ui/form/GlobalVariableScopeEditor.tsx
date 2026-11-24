import { Select, TreeSelect } from 'antd'
import { useController, useFormContext } from 'react-hook-form'
import type { FieldOverrideProps } from '@/engine/entity/overrides/types'
import { FormControl } from '@shared/ui/form/FormControl'
import { Radio } from '@shared/ui/primitives/Radio'
import { useFetchEntitiesQuery } from '@shared/api/genericApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useGetCategoriesQuery } from '@entities/category/api/categoryApi'
import { buildCategoryTree } from '@entities/category/model/buildCategoryTree'
import type { ConnectionMeta } from '@entities/connection/command/connectionCache'
import { emptyScope } from '../../model/form'
import type { GlobalVariableScopeDto, ScopeType } from '../../model/types'

const SCOPE_TYPES: ScopeType[] = ['ALL', 'CATEGORIES', 'WORKFLOWS']

export function GlobalVariableScopeEditor({ field, mode }: FieldOverrideProps) {
    const { t } = useI18n('entities')
    const { control } = useFormContext()
    const { field: controller, fieldState } = useController({ name: field.name, control })
    const scope = (controller.value as GlobalVariableScopeDto | undefined) ?? emptyScope()
    const isReadOnly = mode === 'view'
    const { data: categories = [], isLoading: isLoadingCategories } = useGetCategoriesQuery(undefined, {
        skip: scope.type !== 'CATEGORIES',
    })
    const { data: workflows, isLoading: isLoadingWorkflows } = useFetchEntitiesQuery('/connection/all/meta', {
        skip: scope.type !== 'WORKFLOWS',
    })

    const update = (patch: Partial<GlobalVariableScopeDto>) => controller.onChange({ ...scope, ...patch })
    const workflowOptions = ((workflows ?? []) as ConnectionMeta[]).map((workflow) => ({ value: workflow.id, label: workflow.title }))

    return (
        <FormControl name={field.name} label={field.label} error={fieldState.error?.message} hint="global-variable.fields.scope.hint">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} data-testid="global-variable-field-scope">
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {SCOPE_TYPES.map((type) => (
                        <Radio
                            key={type}
                            name="global-variable-scope-type"
                            value={type}
                            checked={scope.type === type}
                            disabled={isReadOnly}
                            onChange={() => update({ type })}
                            label={t(`global-variable.scope.${type}`)}
                        />
                    ))}
                </div>
                {scope.type === 'CATEGORIES' && (
                    <TreeSelect
                        multiple
                        treeCheckable
                        showCheckedStrategy={TreeSelect.SHOW_PARENT}
                        loading={isLoadingCategories}
                        treeData={buildCategoryTree(categories)}
                        value={scope.categoryIds}
                        onChange={(categoryIds: number[]) => update({ categoryIds })}
                        placeholder={t('global-variable.fields.scope.categoriesPlaceholder')}
                        treeDefaultExpandAll
                        disabled={isReadOnly}
                        status={fieldState.error ? 'error' : undefined}
                        data-testid="global-variable-field-scope-categories"
                    />
                )}
                {scope.type === 'WORKFLOWS' && (
                    <Select
                        mode="multiple"
                        loading={isLoadingWorkflows}
                        options={workflowOptions}
                        value={scope.workflowIds}
                        onChange={(workflowIds: number[]) => update({ workflowIds })}
                        placeholder={t('global-variable.fields.scope.workflowsPlaceholder')}
                        optionFilterProp="label"
                        disabled={isReadOnly}
                        status={fieldState.error ? 'error' : undefined}
                        data-testid="global-variable-field-scope-workflows"
                    />
                )}
            </div>
        </FormControl>
    )
}
