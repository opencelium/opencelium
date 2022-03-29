export class Console{

    constructor() {
    }

    static print(info: string | number | object | Array<any>): void{
        if(typeof(info) === 'string' || typeof(info) === 'number'){
            console.log(info);
        } else if(Array.isArray(info)){
            console.table(info);
        } else if(info && typeof info === 'object' && info.constructor === Object){
            console.table(info);
        } else{
            console.table(info);
        }
    }

    getName(): string{
        return 'Console';
    }
}