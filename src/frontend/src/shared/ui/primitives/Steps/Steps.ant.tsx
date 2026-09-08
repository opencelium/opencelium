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
        compact,
    }) => {
        const {isTabletOrMobile} = useBreakpoints();
        const isHorizontal = compact || isTabletOrMobile;
        const steps = useMemo(() => {
            return items.map(i => ({title: i.header, content: isHorizontal ? undefined : i.subheader, status: i.status}))
        }, [items, isHorizontal])
        const handleChange = items.some(item => item.onClick)
            ? (nextStep: number) => { void items[nextStep]?.onClick?.() }
            : undefined;

        return (
            <Steps
                current={current}
                status={status}
                items={steps}
                orientation={isHorizontal ? 'horizontal' : 'vertical'}
                onChange={handleChange}
            />
        )
    };

export default AntSteps;
