import {useMemo} from 'react';
import {Steps} from "antd";
import './Steps.css';
import type {StepsComponent} from "@shared/ui/primitives/Steps/Divider.types.tsx";
import {useBreakpoints} from "@app/hooks/useBreakpoints.tsx";

const AntSteps: StepsComponent =
    ({
        current,
        status,
        items,
    }) => {
        const {isTabletOrMobile} = useBreakpoints();
        const steps = useMemo(() => {
            return items.map(i => ({title: i.header, content: isTabletOrMobile ? undefined : i.subheader, status: i.status, onClick: i?.onClick}))
        }, [items, isTabletOrMobile])
        return (
            <Steps
                current={current}
                status={status}
                items={steps}
                orientation={isTabletOrMobile ? 'horizontal' : 'vertical'}
            />
        )
    };

export default AntSteps;
