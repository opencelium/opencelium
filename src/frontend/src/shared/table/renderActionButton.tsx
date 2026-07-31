import {ConfirmActionButton} from "@shared/ui/actions/ConfirmActionButton.tsx";
import {Button} from "@shared/ui/primitives/Button";

export function renderActionButton(
    action,
    payload,
    key,
    disabled?: boolean,
) {
    const variant = action.danger ? 'danger' : 'secondary';

    if (action.confirm) {
        return (
            <ConfirmActionButton
                key={key}
                variant={variant}
                confirm={action.confirm}
                disabled={disabled}
                onConfirm={() =>
                    action.onConfirm?.(payload)
                }
            >
                {action.label}
            </ConfirmActionButton>
        );
    }

    return (
        <Button
            key={key}
            variant={variant}
            disabled={disabled}
            onClick={() =>
                action.onClick?.(payload)
            }
        >
            {action.label}
        </Button>
    );
}
