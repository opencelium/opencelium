import React, {useEffect, useState} from "react";
import {useFormContext, useWatch} from "react-hook-form";
import {Cron} from 'react-js-cron'
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
    autoFocus?: boolean;
}
export const CronEditor: React.FC<CronEditorProps> = ({ name, label, mode, autoFocus }) => {
    const { control, getValues, setValue } = useFormContext();

    const initial = getValues()[name] || '';

    const [fullCron, setFullCron] = useState<string>(
        toQuartzDayRule(hasSeconds(initial) ? initial : addSeconds(initial))
    );

    // ✅ holds only a valid value for the Cron UI
    const [cronValue, setCronValue] = useState(stripSeconds(fullCron));

    // Sync local state when the form value changes externally (e.g. form.reset
    // after the entity payload loads in update/view mode). Every local edit already
    // round-trips through `setValue` below, so `watched` echoes back exactly what we
    // just typed — comparing against the RAW `watched` (not a re-normalized version of
    // it) is what tells apart "this is our own edit" from "a real external reset".
    // Comparing the normalized form instead would re-run `toQuartzDayRule`/`addSeconds`
    // on every keystroke and silently restore characters (e.g. a `?`) the user just deleted.
    const watched = useWatch({ control, name }) as string | undefined;
    useEffect(() => {
        if (typeof watched !== 'string' || watched === fullCron) return;
        const normalized = toQuartzDayRule(hasSeconds(watched) ? watched : addSeconds(watched));
        setFullCron(normalized);
        setCronValue(stripSeconds(normalized));
    }, [watched]);

    useEffect(() => {
        setValue(name, fullCron, { shouldDirty: true });
    }, [fullCron]);

    return (
        <div style={{display: 'grid', gap: 4}}>
            <FormInput
                label={label}
                autoFocus={autoFocus}
                value={fullCron}
                onChange={(e) => {
                    const val = e.target.value;

                    // Never rewrite what the user is typing — the field stays free text;
                    // the server validates it on save. Only the graphical builder below
                    // is kept in sync, and only once the value is a well-formed 6-field cron.
                    setFullCron(val);

                    if (hasSeconds(val)) {
                        const normalized = toQuartzDayRule(normalizeCron(val));

                        if (normalized.split(' ').length === 6) {
                            setCronValue(stripSeconds(normalized));
                        }
                    }
                }}
                name={name}
            />

            {mode !== 'view' && (
                <div style={{ display: "flex", justifyContent: 'right' }}>
                    <Cron
                        allowEmpty={'always'}
                        // Its built-in "Clear" button defaults to filling the expression
                        // with "every" (`* * * * *`) instead of emptying it — make it emit
                        // an empty value instead, so it actually clears the input below too.
                        clearButtonAction="empty"
                        // react-js-cron is 5-field standard cron and doesn't accept Quartz
                        // tokens like `?`. Visualize `?` as `*` so existing Quartz expressions
                        // render instead of showing a red invalid state.
                        value={cronValue.replace(/\?/g, '*')}
                        setValue={(val: string) => {
                            if (!val) {
                                setFullCron('');
                                setCronValue('');
                                return;
                            }

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
