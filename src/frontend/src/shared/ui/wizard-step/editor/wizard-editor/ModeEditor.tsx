import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Card } from '@shared/ui/primitives/Card';
import { FormInput } from "@shared/ui/form/FormInput";
import { FormCheckbox } from "@shared/ui/form/FormCheckbox";
import {Tabs} from "@shared/ui/primitives/Tabs";

interface WizardModeEditorProps {
    name: string; // 'wizard.modes'
}

const MODES: { key: 'create' | 'update' | 'view'; label: string }[] = [
    { key: 'create', label: 'Create' },
    { key: 'update', label: 'Update' },
    { key: 'view', label: 'View' },
];

export const WizardModeEditor: React.FC<WizardModeEditorProps> = ({ name }) => {
    const { control } = useFormContext();

    // Watch the whole modes object so we know which checkboxes are checked
    const modesState = useWatch({
        control,
        name,
    }) || {};

    const tabItems = MODES.map((mode) => {
        const modePath = `${name}.${mode.key}`;
        const isEnabled = !!modesState[mode.key]?.enabled;

        return {
            key: mode.key,
            // Add an indicator (e.g. a dot or text) if the mode is enabled
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {mode.label}
                    {isEnabled && (
                        <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-status-success-fg)'
                        }} />
                    )}
                </div>
            ),
            content: (
                <Card style={{  marginTop: 10 }}>
                    <div style={{ marginBottom: 20, paddingBottom: 15, borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <FormCheckbox
                            name={`${modePath}.enabled`}
                            label={`Enable ${mode.label} mode`}
                            text={`Generate wizard logic for ${mode.key} operations`}
                        />
                    </div>

                    {/* Show fields only if the checkbox is active */}
                    {isEnabled ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <FormInput
                                name={`${modePath}.header`}
                                label="Header Title"
                                placeholder="e.g. Create New User"
                            />
                            <FormInput
                                name={`${modePath}.subheader`}
                                label="Subheader"
                                placeholder="Subtitle text..."
                            />
                            <FormInput
                                name={`${modePath}.successMessage`}
                                label="Success Message"
                                placeholder="Saved successfully!"
                            />
                            <FormInput
                                name={`${modePath}.infoContent`}
                                label="Help Panel (info.content)"
                                placeholder="Guidelines for this mode..."
                                // multiline={true}
                            />
                        </div>
                    ) : (
                        <div style={{
                            padding: '10px 0',
                            textAlign: 'center',
                            color: 'var(--color-text-disabled)',
                            fontSize: '14px'
                        }}>
                            This mode is currently disabled and won't be generated.
                        </div>
                    )}
                </Card>
            ),
        };
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div>
                <h4 style={{ margin: 0 }}>Mode Configuration</h4>
            </div>
            <Tabs
                defaultValue="create"
                items={tabItems}
            />
        </div>
    );
};
