import React, { useState } from 'react';
import { FormSelect } from "@shared/ui/form/FormSelect";
import { FormInput } from "@shared/ui/form/FormInput";
import { FormCheckbox } from "@shared/ui/form/FormCheckbox";
import { IconButton } from "@shared/ui/primitives/IconButton";
import FormCodeEditor from "@shared/ui/form/FormCodeEditor";
import { RegexEditor } from "./RegexEditor";

import type { SelectOption } from "@shared/ui/primitives/Select/Select.types.ts";
import {FieldArrayEditor} from "@shared/ui/wizard-step/editor/general/FieldArrayEditor.tsx";
import {PolicyEditor} from "@shared/ui/wizard-step/editor/policy-editor/PolicyEditor.tsx";
import FieldsSection from "@shared/ui/wizard-step/editor/general/FieldsSection.tsx";
import FieldsRow from "@shared/ui/wizard-step/editor/general/FieldsRow.tsx";
import FieldsContainer from "@shared/ui/wizard-step/editor/general/FieldsContainer.tsx";

interface FieldEditorProps {
    name: string;
    label?: string;
}

const DATA_TYPES: SelectOption<string>[] = [
    { label: 'string', value: 'string' },
    { label: 'number', value: 'number' },
    { label: 'boolean', value: 'boolean' },
    { label: 'date', value: 'date' },
    { label: 'enum', value: 'enum' },
    { label: 'other', value: 'other' }
];

const UI_COMPONENTS: SelectOption<string>[] = [
    { label: 'input', value: 'input' },
    { label: 'password', value: 'password' },
    { label: 'select', value: 'select' },
    { label: 'checkbox', value: 'checkbox' },
    { label: 'date', value: 'date' },
    { label: 'file dropzone', value: 'file_dropzone' }
];

export const FieldEditor: React.FC<FieldEditorProps> = ({ name, label }) => {
    return (
        <FieldArrayEditor
            name={name}
            label={label}
            emptyText="No fields yet."
            defaultItem={{
                name: '',
                type: 'string',
                label: '',
                labelKey: '',
                placeholder: '',
                defaultValue: '',
                ui: { component: 'input', overrideKey: '', props: '' },
                table: { visible: true, sortable: true },
                validation: {
                    required: false,
                    email: false,
                    allowEmptyString: false,
                    min: undefined,
                    max: undefined,
                    regex: [],
                },
                search: true,
            }}
            addButtonText="Add Field"
            renderItem={({ index, remove }) => (
                <FieldsContainer onDelete={() => remove(index)}>
                    {/* GENERAL */}
                    <FieldsSection label={'step.field.general_section.label'}>
                        <FieldsRow>
                            <FormInput name={`${name}.${index}.name`} label="Key"/>
                            <FormInput name={`${name}.${index}.label`} label="Label"/>
                            <FormInput name={`${name}.${index}.labelKey`} label="Label Key"/>
                        </FieldsRow>
                        <FieldsRow>
                            <FormSelect
                                name={`${name}.${index}.type`}
                                label="Type"
                                options={DATA_TYPES}
                            />
                            <FormInput name={`${name}.${index}.placeholder`} label="Placeholder"/>
                            <FormInput name={`${name}.${index}.defaultValue`} label="Default"/>
                        </FieldsRow>
                    </FieldsSection>

                    {/* UI */}
                    <FieldsSection label={'step.field.ui_section.label'}>
                        <FieldsRow>
                            <FormSelect
                                name={`${name}.${index}.ui.component`}
                                label="Component"
                                options={UI_COMPONENTS}
                            />
                            <FormInput
                                name={`${name}.${index}.ui.overrideKey`}
                                label="Override Key"
                            />
                        </FieldsRow>
                        <FieldsRow>
                            <FormCodeEditor
                                name={`${name}.${index}.ui.props`}
                                label="Props"
                            />
                        </FieldsRow>
                    </FieldsSection>

                    {/* TABLE */}
                    <FieldsSection label={'step.field.table_section.label'}>
                        <FieldsRow align={'left'}>
                            <FormCheckbox name={`${name}.${index}.table.visible`} text="Visible"/>
                            <FormCheckbox name={`${name}.${index}.table.sortable`} text="Sortable"/>
                            <FormCheckbox name={`${name}.${index}.search`} text="Searchable"/>
                        </FieldsRow>
                    </FieldsSection>

                    {/* VALIDATION */}
                    <FieldsSection label={'step.field.validation_section.label'}>
                        <FieldsRow align={'left'}>
                            <FormCheckbox name={`${name}.${index}.validation.required`} text="Required"/>
                            <FormCheckbox name={`${name}.${index}.validation.email`} text="Email"/>
                            <FormCheckbox
                                name={`${name}.${index}.validation.allowEmptyString`}
                                text="Allow empty"
                            />
                        </FieldsRow>
                        <FieldsRow>
                            <div style={{display: 'flex', gap: 20}}>
                                <div style={{width: '100%'}}>
                                    <FormInput name={`${name}.${index}.validation.min`} label="Min" type="number"/>
                                </div>

                                <div style={{width: '100%'}}>
                                    <FormInput name={`${name}.${index}.validation.max`} label="Max" type="number"/>
                                </div>
                            </div>
                        </FieldsRow>

                        <FieldsRow>
                            <RegexEditor fieldIndex={index} name={name} label={"Reg Expressions"} />
                        </FieldsRow>
                    </FieldsSection>

                    {/* ACCESS POLICY */}
                    <FieldsSection label={'step.field.policy_section.label'}>
                        <FieldsRow>
                            <PolicyEditor
                                name={`${name}.${index}.access`}
                                label="Rules for this field"
                            />
                        </FieldsRow>
                    </FieldsSection>
                </FieldsContainer>
            )}
        />
    );
};
