import type { Recommendation } from "./types"
import React from "react";
import {RecommendationTags} from "@shared/ui/step-form/RecommendationTags.tsx";
import {EntityText} from "@shared/ui/primitives/Text";
import {Result} from "antd";

interface Props {
    message?: string
    content?: React.ReactNode
    recommendations?: Recommendation[]
}

export function SuccessState({
    message,
    content,
    recommendations,
}: Props) {
    return (
        <div
            style={{
                padding: "0px 0 20px",
                textAlign: "center",
                flex: 1,
            }}
        >

            <Result
                status="success"
                title={message ? <EntityText i18nKey={message} typoProps={{variant: 'title'}}/> : "Success"}
            />


            {recommendations && (
                <RecommendationTags items={recommendations}/>
            )}
        </div>
    )
}
