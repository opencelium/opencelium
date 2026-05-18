import {FormProvider, useForm} from "react-hook-form";
import React, {useMemo} from "react";
import {useDialog} from "@shared/ui/dialog/useDialog.ts";
import {zodResolver} from "@hookform/resolvers/zod";
import {FormConstraintsProvider} from "@shared/form/FormConstraintsContext.tsx";
import {extractConstraints} from "@shared/ui/form-dialog/utils.ts";
import type {UseFormDialogOptions} from "@shared/ui/form-dialog/types.ts";
import {Button} from "@shared/ui/primitives/Button";
import {ConfirmActionButton} from "@shared/ui/actions/ConfirmActionButton.tsx";

const FormDialogContent = <T,>({
    schema,
    initialValues,
    onSubmit,
    render,
    cancelText,
    submitText,
    confirmOptions,
}: UseFormDialogOptions<T>) => {

    const dialog = useDialog();

    const form = useForm<T>({
        resolver: zodResolver(schema),
        defaultValues: initialValues as T,
        mode: 'onSubmit',
    });

    const constraints = useMemo(
        () => extractConstraints(schema),
        [schema]
    );

    const close = async () => {
        if (form.formState.isDirty) {
            // could use ConfirmActionButton here
            dialog.open({
                title: 'Discard changes?',
                content: <p>You have unsaved changes.</p>,
                footer: (
                    <>
                        <Button onClick={() => dialog.close()}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                dialog.close(); // confirm
                                dialog.close(); // editor
                            }}
                        >
                            Discard
                        </Button>
                    </>
                ),
            });
            return;
        }

        dialog.close();
    };

    return (
        <FormProvider {...form}>
            <FormConstraintsProvider constraints={constraints}>

                {render({ form, close })}

                <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                    <Button variant="secondary" onClick={close}>
                        {cancelText ?? 'Cancel'}
                    </Button>

                    <ConfirmActionButton
                        onConfirm={form.handleSubmit(async (values) => {
                            console.log('confirm')
                            await onSubmit(values);
                            dialog.close();
                        },
                            (errors) => {
                                console.log('INVALID', errors);
                            })}
                        confirm={confirmOptions}
                    >
                        {submitText ?? 'Save'}
                    </ConfirmActionButton>
                </div>

            </FormConstraintsProvider>
        </FormProvider>
    );
};


export default FormDialogContent
