export interface WebhookProps {
    name: string;
    type: string;
    value: string;
    label: string;
}
export default class Webhook implements WebhookProps{
    name: string = '';
    type: string = '';
    value: string = '';
    label: string = '';
    constructor(webhookValue: string);
    constructor(name: string, type: string);
    constructor(webhookValueOrName: string, type?: string) {
        if(typeof type === "undefined") {
            this.value = webhookValueOrName;
            this.setValueAndType();
            this.setLabel();
        } else {
            this.name = webhookValueOrName;
            this.type = type;
            this.setWebhookValue();
            this.setLabel()
        }
    }

    static compareTwoWebhooks(webhook1: {name: string, type: string}, webhook2: {name: string, type: string}) {
        const webhookInstance1 = new Webhook(webhook1.name, webhook1.type);
        const webhookInstance2 = new Webhook(webhook2.name, webhook2.type);
        return webhookInstance1.value === webhookInstance2.value;
    }

    setWebhookValue() {
        this.value = `${this.name}:${this.type}`
    }

    setValueAndType() {
        const lastColonIndex = this.value.lastIndexOf(':');
        // If no colon is found, return an empty object or handle as needed
        if (lastColonIndex === -1) {
            throw new Error("No colon found in the webhookValue string");
        }
        this.name = this.value.slice(0, lastColonIndex);
        this.type = this.value.slice(lastColonIndex + 1);
    }

    setLabel() {
        switch (this.type) {
            case 'string':
            case 'int':
            case 'double':
            case 'boolean':
                this.label = `${this.name}`;
                break;
            case 'array':
                this.label = `${this.name} (Array)`;
                break;
            case 'object':
                this.label = `${this.name} (Object)`;
                break;
        }
    }

    serialize(): WebhookProps {
        return {
            name: this.name,
            label: this.label,
            value: this.value,
            type: this.type,
        }
    }
}
