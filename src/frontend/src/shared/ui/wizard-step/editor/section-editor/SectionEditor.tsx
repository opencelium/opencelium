import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormSelect } from '@shared/ui/form/FormSelect';
import { FormInput } from '@shared/ui/form/FormInput';
import { IconButton } from '@shared/ui/primitives/IconButton';
import {FieldArrayEditor} from "@shared/ui/wizard-step/editor/general/FieldArrayEditor.tsx";
import {PolicyEditor} from "@shared/ui/wizard-step/editor/policy-editor/PolicyEditor.tsx";

interface SectionEditorProps {
    name: string;
    label?: string;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({ name, label }) => {
    const { watch } = useFormContext();

    // ===============================
    // DATA
    // ===============================

    const sections = watch(name) || [];
    const allEntityFields = watch('fields') || [];

    // ===============================
    // DERIVED DATA
    // ===============================

    const fieldOptions = useMemo(() => {
        const usedFieldNames = sections.flatMap((section: any) =>
            Array.isArray(section.fields) ? section.fields : []
        );

        return allEntityFields
            .filter((f: any) => f?.name)
            .map((f: any) => ({
                label: f.name,
                value: f.name,
                disabled: usedFieldNames.includes(f.name),
            }));
    }, [allEntityFields, sections]);

    // ===============================
    // RENDER
    // ===============================

    return (
        <FieldArrayEditor
            name={name}
            label={label}
            emptyText="No sections yet."
            addButtonText="Add Section"
            defaultItem={{
                id: '',
                title: '',
                description: '',
                fields: [],
                overrideKey: '',
            }}
            renderItem={({ index, remove }) => {
                const section = sections[index] || {};
                const selectedFields: string[] = section.fields || [];

                // Fields available for this section:
                const optionsForThisSection = fieldOptions.filter(opt =>
                    !opt.disabled || selectedFields.includes(opt.value)
                );

                return (
                    <div
                        style={{
                            position: 'relative',
                            padding: '16px 40px 16px 16px',
                            display: 'grid',
                            gap: 15,
                        }}
                    >
                        {/* ID + TITLE */}
                        <div style={{display: 'flex', gap: 10}}>
                            <div style={{flex: 1}}>
                                <FormInput
                                    name={`${name}.${index}.id`}
                                    label="Section ID"
                                    placeholder="e.g. main-info"
                                />
                            </div>

                            <div style={{flex: 2}}>
                                <FormInput
                                    name={`${name}.${index}.title`}
                                    label="Title (Optional)"
                                    placeholder="e.g. General Information"
                                />
                            </div>
                        </div>

                        {/* DESCRIPTION */}
                        <FormInput
                            name={`${name}.${index}.description`}
                            label="Description (Optional)"
                            placeholder="Write a short subheader for this section..."
                        />

                        {/* FIELDS + OVERRIDE */}
                        <div style={{display: 'flex', gap: 10}}>
                            <div style={{flex: 3}}>
                                <FormSelect
                                    name={`${name}.${index}.fields`}
                                    label="Fields in this section"
                                    placeholder="Select unused fields..."
                                    options={optionsForThisSection}
                                    multiple
                                />
                            </div>

                            <div style={{flex: 1}}>
                                <FormInput
                                    name={`${name}.${index}.overrideKey`}
                                    label="Override Key"
                                    placeholder="Custom layout key"
                                />
                            </div>
                        </div>

                        <div>
                            <h4 style={{fontSize: 14}}>Access Policy</h4>
                            <PolicyEditor
                                name={`${name}.${index}.access`}
                                label="Rules for this field"
                            />
                        </div>
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
                                iconProps={{name: 'delete'}}
                                onClick={() => remove(index)}
                            />
                        </div>
                    </div>
                );
            }}
        />
    );
};
