import {ITheme} from "../../general/Theme";
import {LabelProps} from "@molecule/form_section/label/interfaces";

interface FormSectionProps{
    theme?: ITheme,
    label?: LabelProps,
    hasFullWidthInForm?: boolean,
    dependencies?: boolean[],
}

export {
    FormSectionProps,
}