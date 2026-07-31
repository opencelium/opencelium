    import React from 'react';
    import { IconButton } from "@shared/ui/primitives/IconButton";
    import { FormInput } from "@shared/ui/form/FormInput";
    import {FieldArrayEditor} from "@shared/ui/wizard-step/editor/general/FieldArrayEditor.tsx";


    export const RecommendationEditor = ({ name, label }) => {
        return (
            <FieldArrayEditor
                name={name}
                label={label}
                emptyText="No recommendations yet."
                addButtonText="Add Recommendation"
                defaultItem={{ title: '', link: '' }}
                renderItem={({ index, remove }) => (
                    <div style={{ padding: '12px 40px 12px 12px', position: 'relative' }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{ flex: 1 }}>
                                <FormInput
                                    name={`${name}.${index}.title`}
                                    label="Label"
                                />
                            </div>
                            <div style={{ flex: 2 }}>
                                <FormInput
                                    name={`${name}.${index}.link`}
                                    label="URL"
                                />
                            </div>
                        </div>

                        <div style={{ position: 'absolute', right: 0, top: 0, transform: 'translateY(-50%)' }}>
                            <IconButton
                                type="button"
                                variant="ghost"
                                onClick={() => remove(index)}
                                size="sm"
                                iconProps={{ name: 'delete' }}
                            />
                        </div>
                    </div>
                )}
            />
        );
    };
