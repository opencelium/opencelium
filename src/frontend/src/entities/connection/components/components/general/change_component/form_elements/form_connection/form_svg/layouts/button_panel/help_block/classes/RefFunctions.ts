
export default class RefFunctions{

    static getTechnicalLayout(ref: any): any{
        return ref.current.technicalLayoutRef.current;
    }

    static getSvg(ref: any): any{
        const technicalLayout = this.getTechnicalLayout(ref);
        if(technicalLayout){
            const svg = technicalLayout.svg.ref;
            return svg || null;
        }
        return null;
    }

}
