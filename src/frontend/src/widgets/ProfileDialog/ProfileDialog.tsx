import React, {useState} from "react";
import {Button} from "@shared/ui/primitives/Button";
import {FormProvider} from "react-hook-form";
import {FormConstraintsProvider} from "@shared/form/FormConstraintsContext.tsx";
import {Dialog} from "@shared/ui/primitives/Dialog";
import {FormInput} from "@shared/ui/form/FormInput";
import {useLoginForm} from "@features/auth/model/useLoginForm.ts";

const ProfileDialog = () => {
    const [open, setOpen] = useState(false);
    const {form, constraints} = useLoginForm();

    const onSubmit = (data: any) => {
        console.log('FORM DATA:', data);
    };

    const save = () => {}

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                Button with dialog form
            </Button>

            <FormProvider {...form}>
                <FormConstraintsProvider constraints={constraints}>
                    <Dialog
                        open={open}
                        onClose={() => setOpen(false)}
                        title="Edit profile"
                        footer={
                            <>
                                <Button variant="secondary" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" onClick={form.handleSubmit(save)}>
                                    Save
                                </Button>
                            </>
                        }
                    >
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 16,
                                width: 320,
                            }}
                        >
                            <FormInput
                                name="email"
                                label="Email"
                                placeholder="you@example.com"
                                showCounter
                                required
                            />

                            <FormInput
                                rightSlot="👁"
                                name="password"
                                label="Password"
                                placeholder="••••••"
                                showCounter
                                required
                            />
                        </form>
                    </Dialog>
                </FormConstraintsProvider>
            </FormProvider>
        </>
);
};

export default ProfileDialog;
