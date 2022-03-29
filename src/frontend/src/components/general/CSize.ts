import {isNumber} from "../utils";
interface ISize{
    size: string,
    loadingSize: string,
}

export class CSize implements ISize{

    size = '0';
    loadingSize = '0';

    constructor(size: number | string) {
        if(isNumber(size)){
            this.size = `${size}px`;
        } else{
            this.size = `${size}`;
        }
        this.setLoadingSize();
    }

    setLoadingSize(): void{
        let clearNumber = '';
        if(this.size.length > 0){
            if(isNumber(this.size[0])){
                clearNumber += this.size[0];
                let measure = '';
                for(let i = 1; i < this.size.length; i++){
                    if(isNumber(this.size[i])){
                        clearNumber += this.size[i];
                    } else{
                        measure = this.size.substr(i);
                        break;
                    }
                }
                this.loadingSize = `${parseInt(clearNumber) * 2 / 3}${measure}`;
            }
        }
    }
}