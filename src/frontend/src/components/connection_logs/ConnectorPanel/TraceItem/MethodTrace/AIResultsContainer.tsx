import React from 'react';

const AiResultsContainer = ({aiResults}: {aiResults: any}) => {
    const results: {chromaDBResult: any[], aiBotResult: string, hasAI: boolean} = aiResults || {chromaDBResult: [], aiBotResult: '', hasAI: false};
    const hasAiBot = results.hasAI;
    const aiBotResults: string[] = hasAiBot ? results.aiBotResult.split('### ') : [];
    const aibotName = hasAiBot ? aiBotResults.shift() : 'no bot';
    return (
        <div style={{marginLeft: '40px', marginTop: '10px'}}>
            <p><strong>AI possible solutions/descriptions: </strong></p>
            {hasAiBot ? <span>{`${aibotName}`}</span> : <span>AI bot is not set</span>}
            {hasAiBot ?
                aiBotResults.map((result: any, index: number) => (
                    <p>{`${result}`}</p>
                ))
                :
                results.chromaDBResult.map((result: any, index: number) => (
                    <p>{`${index + 1}. ${result?.metadata?.solution || result?.metadata?.description}`}</p>
                ))
            }
        </div>
    )
}

export default AiResultsContainer;
