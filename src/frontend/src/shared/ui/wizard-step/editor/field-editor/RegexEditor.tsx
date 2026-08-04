import React from 'react';
import { FormInput } from "@shared/ui/form/FormInput";
import { IconButton } from "@shared/ui/primitives/IconButton";
import {FieldArrayEditor} from "@shared/ui/wizard-step/editor/general/FieldArrayEditor.tsx";

interface RegexEditorProps {
    fieldIndex: number;
    name: string;
    label?: string,
}

export const RegexEditor: React.FC<RegexEditorProps> = ({ fieldIndex, name, label }) => {
    const arrayName = `${name}.${fieldIndex}.validation.regex`;

    return (
        <FieldArrayEditor
            name={arrayName}
            variant="compact"
            label={label}
            emptyText="No regular expressions yet."
            addButtonText="Add Reg Exp"
            defaultItem={{ pattern: '', message: '' }}
            renderItem={({ index, remove }) => (
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-end',
                        position: 'relative',
                        paddingRight: 40,
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <FormInput
                            name={`${arrayName}.${index}.pattern`}
                            label="Pattern"
                            placeholder="/^[A-Z]+$/"
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <FormInput
                            name={`${arrayName}.${index}.message`}
                            label="Error Message"
                        />
                    </div>

                    <div style={{ position: 'absolute', right: 0, bottom: 0 }}>
                        <IconButton
                            size="sm"
                            variant="ghost"
                            iconProps={{ name: 'delete' }}
                            onClick={() => remove(index)}
                        />
                    </div>
                </div>
            )}
        />
    );
};
