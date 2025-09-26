import React from 'react';

const AiResultsContainer = ({aiResults}: {aiResults: any}) => {
    return (
        <div style={{marginLeft: '40px', marginTop: '10px'}}>
            <p><strong>AI possible solutions/descriptions: </strong></p>
            {aiResults.map((result: any, index: number) => (
                <p>{`${index + 1}. ${result?.metadata?.solution || result?.metadata?.description}`}</p>
            ))}
        </div>
    )
}

export default AiResultsContainer;
