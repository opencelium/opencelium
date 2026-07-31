import { FormInput } from '@/shared/ui/form/FormInput';

export const UserEditorDialogContent = () => {
    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
            <FormInput name="email" label="Email" showCounter/>
            <FormInput name="firstname" label="Name" showCounter/>
        </div>
)
    ;
};
