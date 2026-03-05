import CConnection from "@classes/content/connection/CConnection";
import CMethodItem from "@classes/content/connection/method/CMethodItem";
import React from "react";

export interface ReferenceInformationProps {
    body: any,
    method: CMethodItem,
    connection: CConnection,
    onReferenceClick: (fieldName: string) => void,
    isToggledIcon: boolean,
    toggleIcon: (isToggledIcon: boolean) => void,
    location: 'body' | 'header';
    style?: React.CSSProperties
}

export interface Reference {
    source: CMethodItem,
    target: CMethodItem
}
