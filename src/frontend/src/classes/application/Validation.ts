export class Validation{

    static cannotBeEmpty(callback: any){
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = function () {
                if(arguments[0] !== ''){
                    originalMethod.apply(this, arguments);
                } else{
                    callback('Cannot be empty');
                }
            };
            return descriptor;
        };
    }
}