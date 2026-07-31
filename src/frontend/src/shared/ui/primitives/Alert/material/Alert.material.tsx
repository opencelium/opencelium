import {Alert as MuiAlert, AlertTitle as MuiAlertTitle, IconButton as MuiIconButton} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type {AlertComponent} from "@shared/ui/primitives/Alert/Alert.types.ts";

export const MaterialAlert: AlertComponent = ({
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
    const closeAction = closable ? (
        <MuiIconButton aria-label="close" color="inherit" size="small" onClick={onClose}>
            <CloseIcon fontSize="inherit" />
        </MuiIconButton>
    ) : undefined;

    return (
        <MuiAlert
            severity={type}
            icon={showIcon ? undefined : false}
            action={action ?? closeAction}
            className={className}
            style={style}
        >
            {description ? <MuiAlertTitle>{message}</MuiAlertTitle> : message}
            {description}
        </MuiAlert>
    );
};
