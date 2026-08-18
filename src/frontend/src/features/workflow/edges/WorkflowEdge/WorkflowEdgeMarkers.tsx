export function WorkflowEdgeMarkers() {
    return (
        <svg width='0' height='0'>
            <defs>
                <marker id='workflow-arrow' markerWidth='10' markerHeight='10'
                    refX='10' refY='3' orient='auto' markerUnits='userSpaceOnUse'>
                    <path d='M0,0 L0,6 L10,3 z' className='workflowArrowMarker' />
                </marker>
                <marker id='workflow-arrow-highlighted' markerWidth='10' markerHeight='10'
                    refX='10' refY='3' orient='auto' markerUnits='userSpaceOnUse'>
                    <path d='M0,0 L0,6 L10,3 z' className='workflowArrowMarkerHighlighted' />
                </marker>
            </defs>
        </svg>
    );
}
