import {Radio as AntRadioBase} from "antd";
import type {RadioComponent} from "@shared/ui/primitives/Radio/Radio.types.ts";

export const AntRadio: RadioComponent = ({
    checked,
    disabled,
    onChange,
    label,
    name,
    value,
    testId,
}) => {
    return (
        <AntRadioBase
            checked={checked}
            disabled={disabled}
            name={name}
            value={value}
            onChange={(e) => onChange?.(e.target.checked)}
            data-testid={testId}
        >
            {label}
        </AntRadioBase>
    );
};
