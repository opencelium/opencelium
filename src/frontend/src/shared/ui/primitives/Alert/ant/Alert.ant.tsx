import {Alert as AntAlertBase} from "antd";
import type {AlertComponent} from "@shared/ui/primitives/Alert/Alert.types.ts";

export const AntAlert: AlertComponent = ({
    type = 'info',
    message,
    description,
    showIcon = true,
    closable,
    onClose,
    action,
    className,
    style,
}) => {
    return (
        <AntAlertBase
            type={type}
            message={message}
            description={description}
            showIcon={showIcon}
            closable={closable}
            onClose={onClose}
            action={action}
            className={className}
            style={style}
        />
    );
};
