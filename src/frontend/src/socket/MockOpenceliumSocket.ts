import { EventEmitter } from "events";

class MockSocketClient extends EventEmitter {
    connected = true;

    emit(event: string, ...args: any[]): boolean {
        return super.emit(event, ...args);
    }

    on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    off(event: string, listener: (...args: any[]) => void): this {
        return super.off(event, listener);
    }

    disconnect() {
        this.connected = false;
        this.emit("disconnect");
    }

    connect() {
        this.connected = true;
        this.emit("connect");
    }
}

export const mockSocket = new MockSocketClient();
