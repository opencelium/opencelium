import React from "react";
import { SettingOutlined } from '@ant-design/icons';

import { ReferenceItem } from "./ReferenceItem";
import type { Enhancement } from "../../../../types/connection";
import {useDispatch, useSelector} from "react-redux";
import {updateEnhancementInConnection} from "../../../../store/connection/utils";
import type { RootState } from "../../../../store";
import {updateConnection} from "../../../../store/connection/connectionSlice";
import { dropEnhancementArgs } from "../../../../utils/enhancementArgs";
import {Button} from "antd";
import { useI18n } from "@shared/i18n/hooks/useI18n";

interface ReferenceProps {
    enhancement: Enhancement;
    clearValue: () => void,
    readOnly?: boolean,
    onClick?: () => void,
}

export const Reference: React.FC<ReferenceProps> = ({
    enhancement,
    readOnly,
    clearValue,
    onClick,
}) => {
    const { t } = useI18n('workflow');
    const dispatch = useDispatch();
    const connection = useSelector((state: RootState) => state.connection.connection);
    const args: Record<string, string> = enhancement.args || {};
    const variableEntries = Object.entries(args).filter(([key]) => key !== "RESULT_VAR");
    const onDelete = (argKey: string) => {
        if (connection) {
            const updatedEnhancement = dropEnhancementArgs(enhancement, [argKey]);

            const updatedConnection = updateEnhancementInConnection(connection, updatedEnhancement, clearValue);

            dispatch(updateConnection(updatedConnection));
        }
    }
    if (variableEntries.length === 0)
        return <div style={{ opacity: 0.6 }}>{t('references.noVariableReferences')}</div>;

    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                alignItems: "center",
            }}
        >
            <Button onClick={onClick} type="text" size="small" icon={<SettingOutlined />} style={{marginLeft: 0, marginRight: '-8px'}} />
            {variableEntries.map(([key, value]) => (
                <ReferenceItem key={key} argKey={key} value={value} onDelete={onDelete} readOnly={readOnly} />
            ))}
        </div>
    );
};
