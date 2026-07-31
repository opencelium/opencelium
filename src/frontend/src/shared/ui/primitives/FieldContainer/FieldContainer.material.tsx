import { OutlinedInput } from '@mui/material';
import type {FieldContainerComponent} from "@shared/ui/primitives/FieldContainer/FieldContainer.types.ts";

const MaterialFieldContainer: FieldContainerComponent = ({ children, ...props }) => {
    return (
        <OutlinedInput
            fullWidth
            inputComponent={() => <>{children}</>}
            {...props}
        />
    );
};

export default MaterialFieldContainer;
