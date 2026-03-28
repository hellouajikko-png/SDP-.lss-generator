// Copyright (c) 2018-2024, NeKz
// SPDX-License-Identifier: MIT
export class QAngle {
    constructor(pitch, yaw, roll) {
        Object.defineProperty(this, "pitch", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "yaw", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "roll", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.pitch = pitch;
        this.yaw = yaw;
        this.roll = roll;
    }
    *[Symbol.iterator]() {
        yield this.pitch;
        yield this.yaw;
        yield this.roll;
    }
}
