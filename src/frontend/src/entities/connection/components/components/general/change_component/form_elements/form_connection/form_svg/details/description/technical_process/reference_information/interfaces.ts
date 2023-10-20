import CMethodItem from "@classes/content/connection/method/CMethodItem";
import CConnection from "@classes/content/connection/CConnection";

export interface ReferenceInformationProps {
    body: any,
    method: CMethodItem,
    connection: CConnection,
    onReferenceClick: (fieldName: string) => void,
    isToggledIcon: boolean,
    toggleIcon: (isToggledIcon: boolean) => void,
}

export interface Reference {
    source: CMethodItem,
    target: CMethodItem
}
