import {useUISystem} from "@shared/theme/hooks/useUISystem.tsx";
import type {ButtonComponent} from "@shared/ui/primitives/Button/Button.types.ts";
import {ButtonFactory} from "@shared/ui/primitives/Button/Button.factory.ts";
import {InputFactory} from "@shared/ui/primitives/Input/Input.factory.ts";
import type {InputComponent} from "@shared/ui/primitives/Input/Input.types.ts";
import type {TextareaComponent} from "@shared/ui/primitives/Textarea/Textarea.types.ts";
import {TextareaFactory} from "@shared/ui/primitives/Textarea/Textarea.factory.ts";
import type {CheckboxComponent} from "@shared/ui/primitives/Checkbox/Checkbox.types.ts";
import {CheckboxFactory} from "@shared/ui/primitives/Checkbox/Checkbox.factory.ts";
import type {CheckboxGroupComponent} from "@shared/ui/primitives/CheckboxGroup/CheckboxGroup.types.ts";
import {CheckboxGroupFactory} from "@shared/ui/primitives/CheckboxGroup/CheckboxGroup.factory.ts";
import type {SwitchComponent} from "@shared/ui/primitives/Switch/Switch.types.ts";
import {SwitchFactory} from "@shared/ui/primitives/Switch/Switch.factory.ts";
import {SelectFactory} from "@shared/ui/primitives/Select/Select.factory.ts";
import type {SelectComponent} from "@shared/ui/primitives/Select/Select.types.ts";
import {MultiSelectFactory} from "@shared/ui/primitives/MultiSelect/MultiSelect.factory.ts";
import type {MultiSelectComponent} from "@shared/ui/primitives/MultiSelect/MultiSelect.types.ts";
import type {DialogComponent} from "@shared/ui/primitives/Dialog/Dialog.types.ts";
import {DialogFactory} from "@shared/ui/primitives/Dialog/Dialog.factory.ts";
import type {IconComponent} from "@shared/ui/primitives/Icon/Icon.types.ts";
import {IconFactory} from "@shared/ui/primitives/Icon/Icon.factory.ts";
import type {FileInputComponent} from "@shared/ui/primitives/FileInput/FileInput.types.ts";
import {FileInputFactory} from "@shared/ui/primitives/FileInput/FileInput.factory.ts";
import {TooltipFactory} from "@shared/ui/primitives/Tooltip/Tooltip.factory.ts";
import type {TooltipComponent} from "@shared/ui/primitives/Tooltip/Tooltip.types.ts";
import type {TypographyComponent} from "@shared/ui/primitives/Typography/Typography.types.ts";
import {TypographyFactory} from "@shared/ui/primitives/Typography/Typography.factory.ts";
import {TableFactory} from "@shared/ui/primitives/Table/Table.factory.ts";
import type {TableComponent} from "@shared/ui/primitives/Table/Table.types.ts";
import type {CardComponent} from "@shared/ui/primitives/Card/Card.types.ts";
import {CardFactory} from "@shared/ui/primitives/Card/Card.factory.ts";
import {useMemo} from "react";
import type {UISystem} from "@shared/theme/types.ts";
import type {UIFactory} from "@shared/ui/primitives/types.ts";
import {TabsFactory} from "@shared/ui/primitives/Tabs/Tabs.factory.ts";
import type {TabsComponent} from "@shared/ui/primitives/Tabs/Tabs.types.ts";
import {FieldContainerFactory} from "@shared/ui/primitives/FieldContainer/FieldContainer.factory.ts";
import type {FieldContainerComponent} from "@shared/ui/primitives/FieldContainer/FieldContainer.types.ts";
import {DividerFactory} from "@shared/ui/primitives/Divider/Divider.factory.ts";
import type {DividerComponent} from "@shared/ui/primitives/Divider/Divider.types.tsx";
import {StepsFactory} from "@shared/ui/primitives/Steps/Steps.factory.ts";
import type {StepsComponent} from "@shared/ui/primitives/Steps/Divider.types.tsx";
import {CollapseFactory} from "@shared/ui/primitives/Collapse/Collapse.factory.ts";
import type {CollapseComponent} from "@shared/ui/primitives/Collapse/Collapse.types.ts";
import {DropzoneFactory} from "@shared/ui/primitives/DropZone/DropZone.factory.ts";
import type {DropzoneComponent} from "@shared/ui/primitives/DropZone/DropZone.types.ts";
import {AlertFactory} from "@shared/ui/primitives/Alert/Alert.factory.ts";
import type {AlertComponent} from "@shared/ui/primitives/Alert/Alert.types.ts";
import {RadioFactory} from "@shared/ui/primitives/Radio/Radio.factory.ts";
import type {RadioComponent} from "@shared/ui/primitives/Radio/Radio.types.ts";
import {TreeFactory} from "@shared/ui/primitives/Tree/Tree.factory.ts";
import type {TreeComponent} from "@shared/ui/primitives/Tree/Tree.types.ts";

export interface DynamicUI {
    Button: ButtonComponent;
    Input: InputComponent;
    Textarea: TextareaComponent;
    Checkbox: CheckboxComponent;
    CheckboxGroup: CheckboxGroupComponent;
    Switch: SwitchComponent;
    Select: SelectComponent;
    MultiSelect: MultiSelectComponent;
    FileInput: FileInputComponent;
    Dialog: DialogComponent;
    Icon: IconComponent;
    Tooltip: TooltipComponent;
    Typography: TypographyComponent;
    Table: TableComponent<unknown>;
    Card: CardComponent;
    Tabs: TabsComponent;
    FieldContainer: FieldContainerComponent;
    Divider: DividerComponent;
    Steps: StepsComponent,
    Collapse: CollapseComponent,
    Dropzone: DropzoneComponent,
    Alert: AlertComponent,
    Radio: RadioComponent,
    Tree: TreeComponent,
}
const systemCapabilities = {
    custom: {
        Button: true,
        Input: true,
        Textarea: true,
        Checkbox: true,
        CheckboxGroup: true,
        Switch: true,
        Select: true,
        MultiSelect: true,
        FileInput: true,
        Dialog: true,
        Icon: true,
        Tooltip: true,
        Typography: true,
        Table: true,
        Card: true,
        Tabs: true,
        FieldContainer: true,
        Divider: true,
        Steps: true,
        Collapse: false,
        Dropzone: false,
        Alert: false,
        Radio: false,
        Tree: true,
    },
    material: {
        Button: true,
        Input: true,
        Textarea: true,
        Checkbox: true,
        CheckboxGroup: true,
        Switch: true,
        Select: true,
        MultiSelect: true,
        FileInput: true,
        Dialog: true,
        Icon: true,
        Tooltip: true,
        Typography: true,
        Table: true,
        Card: true,
        Tabs: true,
        FieldContainer: true,
        Divider: true,
        Steps: true,
        Collapse: true,
        Dropzone: true,
        Alert: true,
        Radio: true,
        Tree: true,
    },
};
function resolveComponent<T>(
    factory: UIFactory<T>,
    system: UISystem,
    componentName: string,
    fallback: UISystem = 'ant'
): T {
    let component;
    if (systemCapabilities[system]?.[componentName]) {
        component = factory[system] ?? factory[fallback];
    } else {
        component = factory[fallback];
    }

    if (!component) {
        component = factory.default;
    }

    return component;
}
export function useDynamicUI(): DynamicUI {
    const { system } = useUISystem();

    return useMemo(() => ({
        Button: resolveComponent(ButtonFactory, system, 'Button'),
        Input: resolveComponent(InputFactory, system, 'Input'),
        Textarea: resolveComponent(TextareaFactory, system, 'Textarea'),
        Checkbox: resolveComponent(CheckboxFactory, system, 'Checkbox'),
        CheckboxGroup: resolveComponent(CheckboxGroupFactory, system, 'CheckboxGroup'),
        Switch: resolveComponent(SwitchFactory, system, 'Switch'),
        Select: resolveComponent(SelectFactory, system, 'Select'),
        MultiSelect: resolveComponent(MultiSelectFactory, system, 'MultiSelect'),
        FileInput: resolveComponent(FileInputFactory, system, 'FileInput'),
        Dialog: resolveComponent(DialogFactory, system, 'Dialog'),
        Icon: resolveComponent(IconFactory, system, 'Icon'),
        Tooltip: resolveComponent(TooltipFactory, system, 'Tooltip'),
        Typography: resolveComponent(TypographyFactory, system, 'Typography'),
        Table: resolveComponent(TableFactory, system, 'Table'),
        Card: resolveComponent(CardFactory, system, 'Card'),
        Tabs: resolveComponent(TabsFactory, system, 'Tabs'),
        FieldContainer: resolveComponent(FieldContainerFactory, system, 'FieldContainer'),
        Divider: resolveComponent(DividerFactory, system, 'Divider'),
        Steps: resolveComponent(StepsFactory, system, 'Steps'),
        Collapse: resolveComponent(CollapseFactory, system, 'Collapse'),
        Dropzone: resolveComponent(DropzoneFactory, system, 'Dropzone'),
        Alert: resolveComponent(AlertFactory, system, 'Alert'),
        Radio: resolveComponent(RadioFactory, system, 'Radio'),
        Tree: resolveComponent(TreeFactory, system, 'Tree'),
    }), [system]);
}

