// Copyright (c) 2018-2024, NeKz
// SPDX-License-Identifier: MIT
import { CmdInfo } from './types/CmdInfo.js';
import { NetMessage } from './types/NetMessages.js';
export class Message {
    constructor(type) {
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tick", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "slot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.type = type;
    }
    static default(type) {
        return new this(type);
    }
    getType() {
        return this.type;
    }
    getName() {
        return this.constructor.name;
    }
    getTick() {
        return this.tick;
    }
    getSlot() {
        return this.slot;
    }
    setTick(tick) {
        this.tick = tick;
        return this;
    }
    setSlot(slot) {
        this.slot = slot;
        return this;
    }
    read(_buf, _demo) {
        throw new Error(`read() for ${this.constructor.name} not implemented!`);
    }
    write(_buf, _demo) {
        throw new Error(`write() for ${this.constructor.name} not implemented!`);
    }
}
export class Packet extends Message {
    constructor(type) {
        super(type);
        Object.defineProperty(this, "packets", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cmdInfo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "inSequence", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "outSequence", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "restData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    findPacket(type) {
        const byType = type instanceof NetMessage
            ? (packet) => packet instanceof type
            : (packet) => type(packet);
        return (this.packets ?? []).find(byType);
    }
    findPackets(type) {
        const byType = type instanceof NetMessage
            ? (packet) => packet instanceof type
            : (packet) => type(packet);
        return (this.packets ?? []).filter(byType);
    }
    read(buf, demo) {
        let mssc = demo.demoProtocol === 4 ? 2 : 1;
        this.cmdInfo = [];
        while (mssc--) {
            const cmd = new CmdInfo();
            cmd.read(buf);
            this.cmdInfo.push(cmd);
        }
        this.inSequence = buf.readInt32();
        this.outSequence = buf.readInt32();
        this.data = buf.readBitStream(buf.readInt32() * 8);
        return this;
    }
    write(buf) {
        this.cmdInfo.forEach((cmd) => cmd.write(buf));
        buf.writeInt32(this.inSequence);
        buf.writeInt32(this.outSequence);
        buf.writeInt32(this.data.length / 8);
        buf.writeBitStream(this.data, this.data.length);
        return this;
    }
    *[Symbol.iterator]() {
        for (const packet of this.packets ?? []) {
            yield packet;
        }
    }
}
export class SignOn extends Packet {
}
export class SyncTick extends Message {
    read() {
        return this;
    }
    write() {
        return this;
    }
}
export class ConsoleCmd extends Message {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "command", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.command = buf.readASCIIString(buf.readInt32());
        return this;
    }
    write(buf) {
        buf.writeInt32(this.command.length + 1);
        buf.writeASCIIString(this.command, this.command.length + 1);
        return this;
    }
}
export class UserCmd extends Message {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "cmd", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "userCmd", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "restData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.cmd = buf.readInt32();
        this.data = buf.readBitStream(buf.readInt32() * 8);
        return this;
    }
    write(buf) {
        buf.writeInt32(this.cmd);
        buf.writeInt32(this.data.length / 8);
        buf.writeBitStream(this.data, this.data.length);
        return this;
    }
}
export class DataTable extends Message {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dataTable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.data = buf.readBitStream(buf.readInt32() * 8);
        return this;
    }
    write(buf) {
        buf.writeInt32(this.data.length / 8);
        buf.writeBitStream(this.data, this.data.length);
        return this;
    }
}
export class Stop extends Message {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "restData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.restData = buf.readBitStream(buf.bitsLeft);
        return this;
    }
    write(buf) {
        buf.writeBitStream(this.restData, this.restData.bitsLeft);
        return this;
    }
}
export class CustomData extends Message {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "unk", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.unk = buf.readInt32();
        this.data = buf.readBitStream(buf.readInt32() * 8);
        return this;
    }
    write(buf) {
        buf.writeInt32(this.unk);
        buf.writeInt32(this.data.length / 8);
        buf.writeBitStream(this.data, this.data.length);
        return this;
    }
}
export class StringTable extends Message {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stringTables", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "restData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.data = buf.readBitStream(buf.readInt32() * 8);
        return this;
    }
    write(buf) {
        buf.writeInt32(this.data.length / 8);
        buf.writeBitStream(this.data, this.data.length);
        return this;
    }
}
export const DemoMessages = {
    NewEngine: [
        undefined,
        SignOn, // 1
        Packet, // 2
        SyncTick, // 3
        ConsoleCmd, // 4
        UserCmd, // 5
        DataTable, // 6
        Stop, // 7
        CustomData, // 8
        StringTable, // 9
    ],
    OldEngine: [
        undefined,
        SignOn, // 1
        Packet, // 2
        SyncTick, // 3
        ConsoleCmd, // 4
        UserCmd, // 5
        DataTable, // 6
        Stop, // 7
        StringTable, // 8
    ],
    Message,
    SignOn,
    Packet,
    SyncTick,
    ConsoleCmd,
    UserCmd,
    DataTable,
    Stop,
    CustomData,
    StringTable,
};
