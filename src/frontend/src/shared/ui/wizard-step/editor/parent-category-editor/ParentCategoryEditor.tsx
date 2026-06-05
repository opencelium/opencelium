import React from 'react'
import { TreeSelect } from 'antd'
import { useController, useFormContext } from 'react-hook-form'
import { useGetCategoriesQuery } from '@entities/category/api/categoryApi'
import type { Category } from '@entities/category/model/types'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import type { Mode } from '@/engine/entity/EntityDefinition'

interface ParentCategoryEditorProps {
    name: string
    label?: string
    mode?: Mode
}

type TreeNode = {
    value: number
    title: string
    children?: TreeNode[]
}

function collectDescendantIds(categories: Category[], id: number): Set<number> {
    const result = new Set<number>([id])
    for (const c of categories) {
        if (c.parentCategory?.id === id) {
            collectDescendantIds(categories, c.id).forEach((d) => result.add(d))
        }
    }
    return result
}

function buildTree(
    categories: Category[],
    excluded: Set<number>,
    parentId: number | null = null,
): TreeNode[] {
    return categories
        .filter((c) => (c.parentCategory?.id ?? null) === parentId && !excluded.has(c.id))
        .map((c) => ({
            value: c.id,
            title: c.name,
            children: c.subCategories?.length
                ? buildTree(categories, excluded, c.id)
                : undefined,
        }))
}

export function ParentCategoryEditor({ name, label, mode }: ParentCategoryEditorProps) {
    const { t } = useI18n('entities')
    const { control, watch } = useFormContext()
    const { field, fieldState } = useController({ name, control })
    const { data: categories = [], isLoading } = useGetCategoriesQuery()

    const currentId = watch('id') as number | undefined
    const excluded = currentId ? collectDescendantIds(categories, currentId) : new Set<number>()
    const treeData = buildTree(categories, excluded)

    const readOnly = mode === 'view'
    const translatedLabel = label ? t(label, { defaultValue: label }) : undefined

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {translatedLabel && (
                <label style={{ fontSize: 14 }}>{translatedLabel}</label>
            )}
            <TreeSelect
                loading={isLoading}
                treeData={treeData}
                value={field.value ?? undefined}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Select parent category"
                allowClear
                treeDefaultExpandAll
                disabled={readOnly}
                style={{ width: '100%' }}
                status={fieldState.error ? 'error' : undefined}
            />
            {fieldState.error?.message && (
                <span style={{ color: 'var(--color-status-error-fg)', fontSize: 12 }}>
                    {t(fieldState.error.message, { defaultValue: fieldState.error.message })}
                </span>
            )}
        </div>
    )
}
