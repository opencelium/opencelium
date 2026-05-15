import React, {useEffect, useState} from "react";
import {useFormContext, useWatch} from "react-hook-form";
import {Cron} from 'react-js-cron'
import {useI18n} from "@shared/i18n/hooks/useI18n.ts";
import type {Mode} from "@/engine/entity/EntityDefinition.ts";
import 'react-js-cron/styles.css'
import {FormInput} from "@shared/ui/form/FormInput";
import {
    addSeconds,
    hasSeconds,
    normalizeCron,
    stripSeconds,
    toQuartzDayRule
} from "@shared/ui/wizard-step/editor/cron-editor/cron-editor.utils.ts";
interface CronEditorProps {
    name: string;
    mode: Mode;
    label?: string;
}
export const CronEditor: React.FC<CronEditorProps> = ({ name, label, mode }) => {
    const { control, getValues, setValue } = useFormContext();

    const initial = getValues()[name] || '';

    const [fullCron, setFullCron] = useState<string>(
        toQuartzDayRule(hasSeconds(initial) ? initial : addSeconds(initial))
    );

    // ✅ holds only a valid value for the Cron UI
    const [cronValue, setCronValue] = useState(stripSeconds(fullCron));

    // Sync local state when the form value changes externally (e.g. form.reset
    // after the entity payload loads in update/view mode).
    const watched = useWatch({ control, name }) as string | undefined;
    useEffect(() => {
        if (typeof watched !== 'string') return;
        const normalized = toQuartzDayRule(hasSeconds(watched) ? watched : addSeconds(watched));
        if (normalized === fullCron) return;
        setFullCron(normalized);
        setCronValue(stripSeconds(normalized));
    }, [watched]);

    useEffect(() => {
        setValue(name, fullCron, { shouldDirty: true });
    }, [fullCron]);

    const isSixPartCron = (val: string) =>
        val.trim().split(/\s+/).length === 6;

    return (
        <div>
            <FormInput
                label={label}
                value={fullCron}
                onChange={(e) => {
                    const val = e.target.value;

                    setFullCron(val);

                    // ✅ update Cron ONLY if the cron is valid
                    if (hasSeconds(val)) {
                        const normalized = toQuartzDayRule(normalizeCron(val));

                        if (normalized.split(' ').length === 6) {
                            setCronValue(stripSeconds(normalized)); // 👈 update Cron UI
                            setFullCron(normalized); // normalize input
                        }
                    }
                }}
                name={name}
            />

            {mode !== 'view' && (
                <div style={{ display: "flex", justifyContent: 'right' }}>
                    <Cron
                        allowEmpty={'always'}
                        // react-js-cron is 5-field standard cron and doesn't accept Quartz
                        // tokens like `?`. Visualize `?` as `*` so existing Quartz expressions
                        // render instead of showing a red invalid state.
                        value={cronValue.replace(/\?/g, '*')}
                        setValue={(val) => {
                            const seconds = fullCron.split(' ')[0] || '0';
                            const newFull = toQuartzDayRule(`${seconds} ${val}`);

                            setFullCron(newFull);
                            setCronValue(stripSeconds(newFull)); // 👈 sync UI
                        }}
                    />
                </div>
            )}
        </div>
    );
};
