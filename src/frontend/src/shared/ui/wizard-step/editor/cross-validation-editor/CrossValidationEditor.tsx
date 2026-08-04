import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { FormInput } from "@shared/ui/form/FormInput";
import { FormSelect } from "@shared/ui/form/FormSelect";
import { IconButton } from "@shared/ui/primitives/IconButton";
import FormCodeEditor from "@shared/ui/form/FormCodeEditor";
import {FieldArrayEditor} from "@shared/ui/wizard-step/editor/general/FieldArrayEditor.tsx";

interface CrossValidationEditorProps {
    name: string;
    label?: string;
}

export const CrossValidationEditor: React.FC<CrossValidationEditorProps> = ({ name, label }) => {
    const { watch } = useFormContext();

    // ===============================
    // DATA
    // ===============================

    const entityFields = watch('fields') || [];

    // ===============================
    // DERIVED
    // ===============================

    const fieldOptions = useMemo(() => {
        return entityFields
            .filter((f: any) => f?.name)
            .map((f: any) => ({
                label: f.name,
                value: f.name,
            }));
    }, [entityFields]);

    // ===============================
    // RENDER
    // ===============================

    return (
        <FieldArrayEditor
            name={name}
            label={label}
            emptyText="No cross-field validations yet."
            addButtonText="Add Cross-Field Validation"
            defaultItem={{
                path: '',
                message: '',
                fields: [],
                validate: '',
            }}
            renderItem={({ index, remove }) => {
                return (
                    <div
                        style={{
                            position: 'relative',
                            padding: '16px 40px 16px 16px',
                            display: 'grid',
                            gap: 15,
                        }}
                    >
                        {/* ===============================
                           PATH + MESSAGE
                        =============================== */}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{ flex: 1 }}>
                                <FormSelect
                                    name={`${name}.${index}.path`}
                                    label="Error Path (Field)"
                                    options={fieldOptions}
                                    placeholder="Show error on..."
                                />
                            </div>

                            <div style={{ flex: 2 }}>
                                <FormInput
                                    name={`${name}.${index}.message`}
                                    label="Error Message"
                                    placeholder="e.g. Passwords do not match or lang key"
                                />
                            </div>
                        </div>

                        {/* ===============================
                           RELATED FIELDS
                        =============================== */}
                        <FormSelect
                            name={`${name}.${index}.fields`}
                            label="Related Fields"
                            options={fieldOptions}
                            multiple
                            placeholder="Select fields to watch..."
                        />

                        {/* ===============================
                           VALIDATION LOGIC
                        =============================== */}
                        <FormCodeEditor
                            name={`${name}.${index}.validate`}
                            label="Validation Logic (data)"
                        />

                        {/* ===============================
                           DELETE
                        =============================== */}
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
                    </div>
                );
            }}
        />
    );
};
