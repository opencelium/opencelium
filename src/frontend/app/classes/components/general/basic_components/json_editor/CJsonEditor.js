export class CJsonEditor{
    static getPlaceholder(){
        return '{ ... }';
    }

    static getClassName(){
        return 'method_body';
    }

    static hasImport(){
        return true;
    }

    static isAbsolute(){
        return true;
    }
}