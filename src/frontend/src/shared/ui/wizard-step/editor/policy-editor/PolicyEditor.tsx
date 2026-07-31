import React from 'react';
import { useFormContext } from 'react-hook-form';

import { FormSelect } from "@shared/ui/form/FormSelect";
import { FormInput } from "@shared/ui/form/FormInput";
import { IconButton } from "@shared/ui/primitives/IconButton";
import FormCodeEditor from "@shared/ui/form/FormCodeEditor";

import { SelectOption } from "@shared/ui/primitives/Select/Select.types.ts";
import type { AccessStrategy, Mode, PolicyEffect } from "@/engine/policy";
import {FieldArrayEditor} from "@shared/ui/wizard-step/editor/general/FieldArrayEditor.tsx";

interface PolicyEditorProps {
    name: string;
    label?: string;
}

const STRATEGIES: SelectOption<AccessStrategy>[] = [
    { label: 'Allow', value: 'allow' },
    { label: 'Hide', value: 'hide' },
    { label: 'Disable', value: 'disable' },
    { label: 'Forbid', value: 'forbid' },
];

const EFFECTS: SelectOption<PolicyEffect>[] = [
    { label: 'Allow', value: 'allow' },
    { label: 'Deny', value: 'deny' },
];

const MODES: SelectOption<Mode>[] = [
    { label: 'Create', value: 'create' },
    { label: 'Update', value: 'update' },
    { label: 'View', value: 'view' },
    { label: 'Delete', value: 'delete' },
];

export const PolicyEditor: React.FC<PolicyEditorProps> = ({ name, label }) => {
    const { watch } = useFormContext();

    const rules = watch(`${name}.rules`) || [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* ===============================
               STRATEGY (outside the array)
            =============================== */}
            <FormSelect
                name={`${name}.strategy`}
                label="Strategy"
                options={STRATEGIES}
            />

            {/* ===============================
               RULES ARRAY
            =============================== */}
            <FieldArrayEditor
                name={`${name}.rules`}
                label={label}
                emptyText="No policy rules yet."
                addButtonText="Add Policy Rule"
                defaultItem={{
                    effect: 'allow',
                    roles: [],
                    modes: [],
                    permissions: [],
                    condition: '',
                    resolver: '',
                }}
                renderItem={({ index, remove }) => {
                    return (
                        <div
                            style={{
                                position: 'relative',
                                padding: 20,
                                display: 'grid',
                                gap: 20,
                            }}
                        >
                            {/* DELETE */}
                            <div
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 0,
                                }}
                            >
                                <IconButton
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    iconProps={{ name: 'delete' }}
                                    onClick={() => remove(index)}
                                />
                            </div>

                            {/* ===============================
                               PBAC
                            =============================== */}
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                    PBAC (Permission Based Access Control)
                                </h4>

                                <div style={{ display: 'flex', gap: 15 }}>
                                    <div style={{ flex: 1 }}>
                                        <FormSelect
                                            name={`${name}.rules.${index}.effect`}
                                            label="Effect"
                                            options={EFFECTS}
                                        />
                                    </div>

                                    <div style={{ flex: 2 }}>
                                        <FormSelect
                                            name={`${name}.rules.${index}.modes`}
                                            label="Modes"
                                            placeholder="All actions"
                                            options={MODES}
                                            multiple
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ===============================
                               RBAC
                            =============================== */}
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                    RBAC (Role Based Access Control)
                                </h4>

                                <div style={{ display: 'flex', gap: 15 }}>
                                    <div style={{ flex: 1 }}>
                                        <FormSelect
                                            name={`${name}.rules.${index}.roles`}
                                            label="Roles"
                                            multiple
                                            creatable
                                            onCreate={async (value) => ({
                                                label: value,
                                                value: value,
                                            })}
                                            options={[]}
                                        />
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <FormSelect
                                            name={`${name}.rules.${index}.permissions`}
                                            label="Permissions"
                                            multiple
                                            creatable
                                            onCreate={async (value) => ({
                                                label: value,
                                                value: value,
                                            })}
                                            options={[]}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ===============================
                               ABAC
                            =============================== */}
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                    ABAC (Attribute Based Access Control)
                                </h4>

                                <div style={{ display: 'flex', gap: 15 }}>
                                    <div style={{ flex: 1 }}>
                                        <FormInput
                                            name={`${name}.rules.${index}.resolver`}
                                            label="Resolver Name"
                                            placeholder="e.g. isOwner"
                                        />
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <FormCodeEditor
                                            name={`${name}.rules.${index}.condition`}
                                            label="Condition (JS Callback)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }}
            />
        </div>
    );
};
