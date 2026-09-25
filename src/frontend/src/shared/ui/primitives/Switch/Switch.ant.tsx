import React from 'react';
import { Switch as AntSwitch } from 'antd';
import type { SwitchComponent } from './Switch.types';
import './switch.ant.css';
import {EntityText} from "@shared/ui/primitives/Text";

export const AntSwitchImpl: SwitchComponent = ({
    checked,
    defaultChecked,
    disabled,
    onChange,
    text,
    textKey,
    textPosition = 'right',
    readOnly,
    loading,
    testId,
}) => {
    const label = textKey
        ? (
            <span className="ant-switch-label">
                {checked ? <EntityText isBold i18nKey={textKey.on}/> : <EntityText isBold i18nKey={textKey.off}/>}
            </span>
        )
        : text
            ? <span className="ant-switch-label">{checked ? text.on : text.off}</span>
            : null;

    return (
        <label className="ant-switch-wrapper">
            {textPosition === 'left' && label}
            <AntSwitch
                checked={checked}
                defaultChecked={defaultChecked}
                disabled={disabled || readOnly}
                loading={loading}
                onChange={onChange}
                data-testid={testId}
            />
            {textPosition === 'right' && label}
        </label>
    );
};
