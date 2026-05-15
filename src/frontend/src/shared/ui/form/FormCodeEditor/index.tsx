import React from 'react';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import {Controller, useFormContext} from "react-hook-form";
import {FormControl} from "@shared/ui/form/FormControl";
interface FormCodeEditorProps {
    name: string;
    label?: string;
    readOnly?: boolean;
    hint?: string;
    mode?: string | object;
}

const FormCodeEditor = ({name, label, readOnly, hint, mode}: FormCodeEditorProps) => {
    const {
        control,
        formState: { errors },
    } = useFormContext();
    const error = errors[name]?.message as string | undefined;

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <FormControl
                    label={label}
                    hint={hint}
                    error={error}
                    name={name}
                >
                    <AceEditor
                        mode={mode || "javascript"}
                        theme="github"
                        onChange={field.onChange}
                        value={field.value || ""}
                        name={`ace_${name}`}
                        width="100%"
                        height="120px"
                        fontSize={12}
                        setOptions={{ useWorker: false, showPrintMargin: false }}
                        readOnly={readOnly}
                    />
                </FormControl>
            )}
        />
    )
}

export default FormCodeEditor;
