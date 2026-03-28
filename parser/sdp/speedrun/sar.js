// Copyright (c) 2018-2024, NeKz
// SPDX-License-Identifier: MIT
import { ConsoleCmd, UserCmd } from '../messages.js';
export const ReplayHeader = 'sar-tas-replay v1.8\n';
export class SarTimer {
    static default() {
        return new SarTimer();
    }
    time(demo) {
        if (!demo.messages?.length) {
            throw new Error('Cannot adjust ticks without parsed messages.');
        }
        const timings = [];
        for (const message of demo.messages) {
            if (message instanceof ConsoleCmd) {
                if (message.command === 'sar_timer_start') {
                    timings.push({ tick: message.tick, type: 'start' });
                }
                else if (message.command === 'sar_timer_stop') {
                    timings.push({ tick: message.tick, type: 'stop' });
                }
            }
        }
        const start = timings.reverse().find((x) => x.type === 'start');
        const end = timings.find((x) => x.type === 'stop');
        return start !== undefined && end !== undefined
            ? {
                startTick: start.tick,
                endTick: end.tick,
                delta: (end.tick ?? 0) - (start.tick ?? 0),
            }
            : undefined;
    }
}
export class SarReplay {
    constructor(size) {
        Object.defineProperty(this, "buffer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.buffer = this.alloc(size).buffer;
    }
    static default() {
        return new SarReplay(0);
    }
    convert(demos) {
        this.writeString(ReplayHeader);
        this.writeInt32(demos.length);
        for (const demo of demos) {
            for (const message of demo.messages ?? []) {
                if (message instanceof UserCmd && message.userCmd) {
                    this.writeInt32(message.userCmd.buttons || 0);
                    this.writeFloat(message.userCmd.forwardMove || 0);
                    this.writeInt8(message.userCmd.impulse || 0);
                    this.writeInt16(message.userCmd.mouseDx || 0);
                    this.writeInt16(message.userCmd.mouseDy || 0);
                    this.writeFloat(message.userCmd.sideMove || 0);
                    this.writeFloat(message.userCmd.upMove || 0);
                    this.writeFloat(message.userCmd.viewAngleX || 0);
                    this.writeFloat(message.userCmd.viewAngleY || 0);
                    this.writeFloat(message.userCmd.viewAngleZ || 0);
                }
            }
        }
        return this.buffer;
    }
    alloc(size) {
        return new DataView(new ArrayBuffer(size));
    }
    concat(buffers) {
        const array = new Uint8Array(buffers.reduce((sum, buffer) => (sum += buffer.byteLength), 0));
        let offset = 0;
        for (const buffer of buffers) {
            array.set(new Uint8Array(buffer), offset);
            offset += buffer.byteLength;
        }
        return array.buffer;
    }
    writeInt8(value) {
        const data = this.alloc(1);
        const result = data.setInt8(value, 0);
        this.buffer = this.concat([this.buffer, data.buffer]);
        return result;
    }
    writeInt16(value) {
        const data = this.alloc(2);
        data.setInt16(value, 0, true);
        this.buffer = this.concat([this.buffer, data.buffer]);
    }
    writeInt32(value) {
        const data = this.alloc(4);
        data.setInt32(value, 0, true);
        this.buffer = this.concat([this.buffer, data.buffer]);
    }
    writeFloat(value) {
        const data = this.alloc(4);
        data.setFloat32(value, 0, true);
        this.buffer = this.concat([this.buffer, data.buffer]);
    }
    writeString(value) {
        const data = this.alloc(value.length);
        let offset = 0;
        for (const c of value) {
            data.setInt8(c.charCodeAt(0), offset);
            offset += 1;
        }
        this.buffer = this.concat([this.buffer, data.buffer]);
    }
}
