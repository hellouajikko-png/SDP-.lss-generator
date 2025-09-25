// Copyright (c) 2018-2024, NeKz
// SPDX-License-Identifier: MIT
import { SourceDemoBuffer } from '../buffer.js';
export class StringTable {
    constructor() {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "entries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "classes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf, demo) {
        this.name = buf.readASCIIString();
        this.entries = [];
        this.classes = [];
        const EntryType = StringTableEntryTypes[this.name];
        let entries = buf.readInt16();
        while (entries--) {
            const entryName = buf.readASCIIString();
            const entry = new StringTableEntry(entryName);
            if (buf.readBoolean()) {
                entry.read(buf, EntryType, demo);
            }
            this.entries.push(entry);
        }
        if (buf.readBoolean()) {
            let entries = buf.readInt16();
            while (entries--) {
                const entryName = buf.readASCIIString();
                const entry = new StringTableClass(entryName);
                if (buf.readBoolean()) {
                    entry.read(buf);
                }
                this.classes.push(entry);
            }
        }
    }
    write(buf, demo) {
        buf.writeASCIIString(this.name);
        buf.writeInt16(this.entries.length);
        this.entries.forEach((entry) => {
            buf.writeASCIIString(entry.name);
            buf.writeBoolean(entry.dataBuffer !== undefined);
            if (entry.dataBuffer !== undefined) {
                entry.write(buf, demo);
            }
        });
        buf.writeBoolean(this.classes.length !== 0);
        if (this.classes.length !== 0) {
            buf.writeInt16(this.classes.length);
            this.classes.forEach((entry) => {
                buf.writeASCIIString(entry.name);
                buf.writeBoolean(entry.data !== undefined);
                if (entry.data !== undefined) {
                    entry.write(buf);
                }
            });
        }
    }
}
export class StringTableEntry {
    constructor(name) {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "length", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dataBuffer", {
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
        this.name = name;
    }
    read(buf, type, demo) {
        this.length = buf.readInt16();
        this.dataBuffer = buf.readBitStream(this.length * 8);
        if (type) {
            this.data = new type();
            this.data.read(this.dataBuffer, demo);
        }
    }
    write(buf, demo) {
        buf.writeInt16(this.length);
        if (this.data) {
            const data = SourceDemoBuffer.allocate(this.length);
            this.data.write(data, demo);
            this.dataBuffer = data.clone();
        }
        buf.writeBitStream(this.dataBuffer, this.length * 8);
    }
}
export class StringTableClass {
    constructor(name) {
        Object.defineProperty(this, "name", {
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
        this.name = name;
    }
    read(buf) {
        const length = buf.readInt16();
        this.data = buf.readASCIIString(length);
    }
    write(buf) {
        buf.writeInt16(this.data.length);
        buf.writeASCIIString(this.data);
    }
}
// player_info_s
export class PlayerInfo {
    constructor() {
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "xuid", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "userId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "guid", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "friendsId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "friendsName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fakePlayer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isHltv", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "customFiles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "filesDownloaded", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf, demo) {
        if (demo.isNewEngine()) {
            this.version = buf.readInt32();
            this.xuid = buf.readInt32();
        }
        this.name = buf.readASCIIString(32);
        this.userId = buf.readInt32();
        this.guid = buf.readASCIIString(32);
        this.friendsId = buf.readInt32();
        this.friendsName = buf.readASCIIString(32);
        this.fakePlayer = buf.readBoolean();
        this.isHltv = buf.readBoolean();
        this.customFiles = [
            buf.readInt32(),
            buf.readInt32(),
            buf.readInt32(),
            buf.readInt32(),
        ];
        this.filesDownloaded = buf.readInt32();
    }
    write(buf, demo) {
        if (demo.isNewEngine()) {
            buf.writeInt32(this.version);
            buf.writeInt32(this.xuid);
        }
        buf.writeASCIIString(this.name, 32);
        buf.writeInt32(this.userId);
        buf.writeASCIIString(this.guid, 32);
        buf.writeInt32(this.friendsId);
        buf.writeASCIIString(this.friendsName, 32);
        buf.writeBoolean(this.fakePlayer);
        buf.writeBoolean(this.isHltv);
        buf.writeInt32(this.customFiles.at(0)),
            buf.writeInt32(this.customFiles.at(1)),
            buf.writeInt32(this.customFiles.at(2)),
            buf.writeInt32(this.customFiles.at(3)),
            buf.writeInt32(this.filesDownloaded);
    }
}
export const StringTableEntryTypes = {
    userinfo: PlayerInfo,
};
