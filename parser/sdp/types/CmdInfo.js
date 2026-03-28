// Copyright (c) 2018-2024, NeKz
// SPDX-License-Identifier: MIT
export class CmdInfo {
    constructor() {
        Object.defineProperty(this, "flags", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "viewOrigin", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "viewAngles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "localViewAngles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "viewOrigin2", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "viewAngles2", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "localViewAngles2", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.flags = buf.readInt32();
        this.viewOrigin = buf.readVector();
        this.viewAngles = buf.readQAngle();
        this.localViewAngles = buf.readQAngle();
        this.viewOrigin2 = buf.readVector();
        this.viewAngles2 = buf.readQAngle();
        this.localViewAngles2 = buf.readQAngle();
        return this;
    }
    write(buf) {
        buf.writeInt32(this.flags);
        buf.writeVector(this.viewOrigin);
        buf.writeQAngle(this.viewAngles);
        buf.writeQAngle(this.localViewAngles);
        buf.writeVector(this.viewOrigin2);
        buf.writeQAngle(this.viewAngles2);
        buf.writeQAngle(this.localViewAngles2);
        return this;
    }
}
