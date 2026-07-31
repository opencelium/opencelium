import React, {useEffect, useMemo} from "react";
import {useFormContext} from "react-hook-form";
import {Table} from "antd";
import {EntityText} from "@shared/ui/primitives/Text";
import {Checkbox} from "@shared/ui/primitives/Checkbox";
import type {Permission} from "@entities/role/model/types.ts";
import {useGetComponentsQuery} from "@entities/role/api/componentApi.ts";
import type {Mode} from "@/engine/entity/EntityDefinition.ts";

const ALL_PERMISSIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE'] as const;
interface PermissionEditorProps {
    name: string;
    label?: string;
    mode?: Mode;
}

export const PermissionEditor: React.FC<PermissionEditorProps> = ({ name, label, mode }) => {
    const isReadOnly = mode === 'view';
    const { watch, setValue } = useFormContext();

    const {
        formState,
        getFieldState,
    } = useFormContext();

    const { error: rhfError } = getFieldState(name, formState);
    const error = rhfError?.message;
    const componentIds = watch('components') || [];
    const mappedComponents = watch('mappedComponents') || [];
    const { data = [] ,  isLoading = [] } = useGetComponentsQuery();
    const allComponents = data ?? [];
    useEffect(() => {
        // remove stale permissions
        let updated = mappedComponents.filter((p: any) =>
            componentIds.includes(p.componentId)
        );

        // add new ones
        componentIds.forEach((id: number) => {
            const exists = updated.find(p => p.componentId === id);

            if (!exists) {
                updated.push({
                    componentId: id,
                    permissions: [],
                });
            }
        });

        if (JSON.stringify(updated) !== JSON.stringify(mappedComponents)) {
            setValue('mappedComponents', updated, {shouldDirty: true});
        }
    }, [componentIds]);

    const togglePermission = (componentId: number, perm: Permission) => {
        const updated = mappedComponents.map((c: any) => {
            if (c.componentId !== componentId) return c;

            const exists = c.permissions.includes(perm);

            return {
                ...c,
                permissions: exists
                    ? c.permissions.filter((p: Permission) => p !== perm)
                    : [...c.permissions, perm],
            };
        });
        if (JSON.stringify(updated) !== JSON.stringify(mappedComponents)) {
            setValue('mappedComponents', updated, { shouldDirty: true });
        }
    };
    const tableData = mappedComponents.map((p: any) => {
        const full = allComponents.find(c => c.componentId === p.componentId);

        return {
            ...p,
            name: full?.name,
        };
    });
    const columns = [
        {
            title: 'Component',
            dataIndex: 'name',
        },
        ...ALL_PERMISSIONS.map((perm) => ({
            title: perm,
            render: (_: any, record: any) => (
                <Checkbox
                    checked={record.permissions?.includes(perm)}
                    disabled={isReadOnly}
                    onChange={() =>
                        togglePermission(record.componentId, perm)
                    }
                />
            ),
        })),
    ];

    return (
        <div>
            {label && (
                <label className="form-control__label">
                    <span style={{position: 'relative'}}>
                        <EntityText typoProps={{isBold: true}} i18nKey={label}/>
                    </span>
                    <span className="form-control__required">*</span>
                </label>
            )}
            <Table
                rowKey="componentId"
                dataSource={tableData}
                columns={columns}
                pagination={false}
            />
            {
                error && (
                    <div className="form-control__error">
                        <EntityText i18nKey={error} typoProps={{isDanger: true}}/>
                    </div>
                )
            }
        </div>
    )
}
