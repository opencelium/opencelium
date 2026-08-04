import React from 'react';
import {Button} from "@shared/ui/primitives/Button";
import {FormInput} from "@shared/ui/form/FormInput";
import {Card} from "@shared/ui/primitives/Card";
import {FormConstraintsProvider} from "@shared/form/FormConstraintsContext.tsx";
import TestPrimitives from "@features/sandbox/ui/primitives/TestPrimitives.tsx";
import {FormProvider} from "react-hook-form";
import {FormCheckbox} from "@shared/ui/form/FormCheckbox";
import {FormMultiSelect} from "@shared/ui/form/FormMultiSelect";
import {useLoginForm} from "@features/auth/model/useLoginForm.ts";

const TestCard = () => {
    const {form, constraints} = useLoginForm();
    const onSubmit = (data: any) => {
        console.log('FORM DATA:', data);
    };
    return (
        <Card
            title="Login"
        >
            <FormProvider {...form}>
                <FormConstraintsProvider constraints={constraints}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            width: 320,
                        }}
                    >
                        <FormCheckbox
                            name="acceptTerms"
                            label="I accept the terms and conditions"
                            required
                        />

                        <FormMultiSelect
                            name="tags"
                            label="Tags"
                            required
                            placeholder="Select tags"
                            options={[
                                { value: 'react', label: 'React' },
                                { value: 'ts', label: 'TypeScript' },
                                { value: 'zod', label: 'Zod' },
                            ]}
                        />
                        <Button htmlType={'submit'}>{"Submit"}</Button>
                    </form>
                </FormConstraintsProvider>
            </FormProvider>
        </Card>

    )
}

export default TestCard;
