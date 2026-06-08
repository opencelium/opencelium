import React from "react";
import { SettingOutlined } from '@ant-design/icons';

import { ReferenceItem } from "./ReferenceItem";
import type { Enhancement } from "../../../types/connection";
import {useDispatch, useSelector} from "react-redux";
import {updateEnhancementInConnection} from "../../../store/connection/utils";
import type { RootState } from "../../../store";
import {updateConnection} from "../../../store/connection/connectionSlice";
import {EnhancementReference} from "../../strategies/EnhancementReference";
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
    const args = enhancement.args || {};
    const variableEntries = Object.entries(args).filter(([key]) => key !== "RESULT_VAR");
    //arg: VAR_0 | VAR_1 | ...
    const onDelete = (argKey: string) => {
        if (connection) {
            // 1️⃣ Remove variable from args
            const newArgs = { ...enhancement.args };
            delete newArgs[argKey];

            // 2️⃣ Replace variable occurrences in script
            const regex = new RegExp(`\\b${argKey}\\b`, "g");
            const newScript = enhancement.script.replace(regex, EnhancementReference.NotExistArg);

            // 3️⃣ Build updated enhancement
            const updatedEnhancement = { ...enhancement, args: newArgs, script: newScript };

            // 4️⃣ Create updated connection immutably
            const updatedConnection = updateEnhancementInConnection(connection, updatedEnhancement, clearValue);

            // 5️⃣ Dispatch Redux update
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
