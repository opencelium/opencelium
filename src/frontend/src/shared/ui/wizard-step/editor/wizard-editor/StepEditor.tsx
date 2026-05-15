import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormInput } from '@shared/ui/form/FormInput';
import { FormSelect } from '@shared/ui/form/FormSelect';
import { IconButton } from '@shared/ui/primitives/IconButton';
import {FieldArrayEditor} from "@shared/ui/wizard-step/editor/general/FieldArrayEditor.tsx";
import {PolicyEditor} from "@shared/ui/wizard-step/editor/policy-editor/PolicyEditor.tsx";

interface StepEditorProps {
    name: string;
    label?: string;
}

export const StepEditor: React.FC<StepEditorProps> = ({ name, label }) => {
    const { watch } = useFormContext();

    // ===============================
    // DATA
    // ===============================

    const steps = watch(`${name}.steps`) || [];
    const allSections = watch('sections') || [];

    // ===============================
    // DERIVED DATA
    // ===============================

    const sectionOptions = useMemo(() => {
        return allSections
            .filter((s: any) => s?.id)
            .map((s: any) => ({
                label: s.title || s.id,
                value: s.id,
            }));
    }, [allSections]);

    const usedSectionIds = useMemo(() => {
        return steps.flatMap((step: any) => step.sectionIds || []);
    }, [steps]);

    // ===============================
    // RENDER
    // ===============================

    return (
        <FieldArrayEditor
            name={`${name}.steps`}
            label={label}
            emptyText="No steps yet."
            addButtonText="Add Step"
            defaultItem={{
                id: '',
                header: '',
                subheader: '',
                sectionIds: [],
                validateFields: [],
                infoContent: '',
            }}
            renderItem={({ index, remove }) => {
                const step = steps[index] || {};
                const stepSectionIds: string[] = step.sectionIds || [];

                // ===============================
                // FILTERED OPTIONS
                // ===============================

                const filteredSectionOptions = sectionOptions.filter(opt =>
                    !usedSectionIds.includes(opt.value) ||
                    stepSectionIds.includes(opt.value)
                );

                const fieldsInSelectedSections = allSections
                    .filter((s: any) => stepSectionIds.includes(s.id))
                    .flatMap((s: any) => s.fields || [])
                    .map((f: string) => ({
                        label: f,
                        value: f,
                    }));

                // ===============================
                // UI
                // ===============================

                return (
                    <div
                        style={{
                            position: 'relative',
                            padding: '16px 40px 16px 16px',
                            display: 'grid',
                            gap: 15,
                        }}
                    >
                        {/* ID + HEADER */}
                        <div style={{display: 'flex', gap: 10}}>
                            <div style={{flex: 1}}>
                                <FormInput
                                    name={`${name}.steps.${index}.id`}
                                    label="Step ID"
                                />
                            </div>
                            <div style={{flex: 2}}>
                                <FormInput
                                    name={`${name}.steps.${index}.header`}
                                    label="Step Header"
                                />
                            </div>
                        </div>

                        {/* SUBHEADER */}
                        <FormInput
                            name={`${name}.steps.${index}.subheader`}
                            label="Subheader"
                        />

                        {/* SELECTS */}
                        <div style={{display: 'flex', gap: 10}}>
                            <div style={{flex: 1}}>
                                <FormSelect
                                    name={`${name}.steps.${index}.sectionIds`}
                                    label="Included Sections"
                                    options={filteredSectionOptions}
                                    multiple
                                />
                            </div>

                            <div style={{flex: 1}}>
                                <FormSelect
                                    name={`${name}.steps.${index}.validateFields`}
                                    label="Fields to Validate"
                                    options={fieldsInSelectedSections}
                                    multiple
                                    disabled={stepSectionIds.length === 0}
                                />
                            </div>
                        </div>

                        {/* INFO */}
                        <FormInput
                            name={`${name}.steps.${index}.infoContent`}
                            label="Info / Help Content"
                            placeholder="Text for the info panel..."
                        />


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
