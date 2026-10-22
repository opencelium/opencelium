import React from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import {Cron, converter} from 'react-js-cron';
import type {Mode} from '@/engine/entity/EntityDefinition.ts';
import 'react-js-cron/styles.css';
import {FormInput} from '@shared/ui/form/FormInput';
import {quartzToPickerCron} from '@shared/lib/cron/quartzCron';
import {toQuartzDayRule} from './cron-editor.utils';

interface CronEditorProps {
    name: string;
    mode: Mode;
    label?: string;
    autoFocus?: boolean;
}

export const CronEditor: React.FC<CronEditorProps> = ({name, label, mode, autoFocus}) => {
    const {control, setValue} = useFormContext();
    const fullCron = (useWatch({control, name}) as string | undefined) ?? '';
    let pickerValue = '';
    try {
        const candidate = quartzToPickerCron(fullCron);
        if (candidate) converter.parseCronString(candidate);
        pickerValue = candidate;
    } catch {
    }

    return (
        <div style={{display: 'grid', gap: 4}}>
            <FormInput
                label={label}
                autoFocus={autoFocus}
                value={fullCron}
                readOnly={mode === 'view'}
                onChange={(event) => setValue(name, event.target.value, {shouldDirty: true})}
                name={name}
            />
            {mode !== 'view' && (
                <div style={{display: 'flex', justifyContent: 'right'}}>
                    <Cron
                        allowEmpty="always"
                        clearButtonAction="empty"
                        humanizeValue
                        value={pickerValue}
                        setValue={(value: string) => {
                            if (value && pickerValue) {
                                try {
                                    if (JSON.stringify(converter.parseCronString(value)) ===
                                        JSON.stringify(converter.parseCronString(pickerValue))) return;
                                } catch {
                                    return;
                                }
                            }
                            const fields = fullCron.trim().split(/\s+/);
                            const seconds = fields.length === 6 ? fields[0] : '0';
                            setValue(name, value ? toQuartzDayRule(`${seconds} ${value}`) : '', {
                                shouldDirty: true,
                            });
                        }}
                    />
                </div>
            )}
        </div>
    );
};
