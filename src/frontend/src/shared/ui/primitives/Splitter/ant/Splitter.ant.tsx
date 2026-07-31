import React from 'react';
import { Splitter } from 'antd';
import type { SplitterComponent } from '../Splitter.types';

export const AntSplitter: SplitterComponent = ({
    panels,
    layout = 'horizontal',
    onResizeEnd,
    className,
    style,
}) => {
    return (
        <Splitter
            layout={layout}
            className={className}
            style={style}
            onResizeEnd={onResizeEnd}
        >
            {panels.map((panel) => (
                <Splitter.Panel
                    key={panel.key}
                    defaultSize={panel.defaultSize}
                    min={panel.min}
                    max={panel.max}
                    collapsible={panel.collapsible}
                >
                    {panel.content}
                </Splitter.Panel>
            ))}
        </Splitter>
    );
};
