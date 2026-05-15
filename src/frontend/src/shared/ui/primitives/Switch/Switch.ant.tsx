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
    readOnly,
    loading,
}) => {
    return (
        <label className="ant-switch-wrapper">
            <AntSwitch
                checked={checked}
                defaultChecked={defaultChecked}
                disabled={disabled || readOnly}
                loading={loading}
                onChange={onChange}
            />
            {textKey
                ?
                <span className="ant-switch-label">
                    {checked ? <EntityText isBold i18nKey={textKey.on}/> : <EntityText isBold i18nKey={textKey.off}/>}
                </span>
                : text ? <span className="ant-switch-label">{checked ? text.on : text.off}</span> : null
            }
        </label>
    );
};
