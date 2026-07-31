import React from 'react';
import {FormInput} from "@shared/ui/form/FormInput";
import {FormTextarea} from "@shared/ui/form/FormTextarea";
import {FormCheckboxGroup} from "@shared/ui/form/FormCheckboxGroup";
import {FormSwitch} from "@shared/ui/form/FormSwitch";
import {FormSelect} from "@shared/ui/form/FormSelect";
import {FormCheckbox} from "@shared/ui/form/FormCheckbox";
import {FormMultiSelect} from "@shared/ui/form/FormMultiSelect";
import {Button} from "@shared/ui/primitives/Button";
import {Icon} from "@shared/ui/primitives/Icon";
import {IconButton} from "@shared/ui/primitives/IconButton";
import {FormFileDropZone} from "@shared/ui/form/FormFileDropZone";
import {Tooltip} from "@shared/ui/primitives/Tooltip";
import {CommonText} from "@shared/ui/primitives/Text";

const TestPrimitives = () => (
    <React.Fragment>
        <CommonText
            i18nKey="welcome"
            values={{ name: 'Ruzalin' }}
        />
        <Button loading={true}>Loading button</Button>
            <Button iconLeft={'edit'}>Left icon</Button>
            <Button iconRight={'close'}>Right icon</Button>
        <div>
            <Tooltip content="Tooltip">
                Tooltip
            </Tooltip>
        </div>
        <Icon name={'user'}/>
        <IconButton iconProps={{name: 'check'}}/>
        <FormInput name={"email"} label={"E-Mail"} />
        <FormInput name={"password"} label={"Password"} />
        <FormTextarea
            name="description"
            label="Description"
            showCounter
        />
        <FormCheckboxGroup
            name="interests"
            label="Interests"
            required
            options={[
                { value: 'sport', label: 'Sport' },
                { value: 'music', label: 'Music' },
                { value: 'tech', label: 'Technology' },
            ]}
        />

        <FormSwitch
            name="active"
            label="Activate"
            required
        />

        <FormSelect
            name="role"
            label="Role"
            required
            placeholder="Select role"
            options={[
                { value: 'admin', label: 'Admin' },
                { value: 'user', label: 'User' },
                { value: 'guest', label: 'Guest' },
            ]}
        />

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
    <FormFileDropZone
        name="avatar"
        label="Profile Photo"
        accept="image/*"
    />

    <FormFileDropZone
        name="documents"
        label="Documents"
        multiple
        accept=".pdf,.doc"
    />
    </React.Fragment>
);

export default TestPrimitives;
