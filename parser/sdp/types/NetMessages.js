// Copyright (c) 2018-2024, NeKz
// SPDX-License-Identifier: MIT
import { SoundInfo } from './SoundInfo.js';
import { GameEventDescriptor, GameEventManager } from './GameEventManager.js';
import { SourceDemoBuffer } from '../buffer.js';
import { UserMessages } from './UserMessages.js';
export class NetMessage {
    constructor(type) {
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.type = type;
    }
    getType() {
        return this.type;
    }
    getName() {
        return this.constructor.name;
    }
    read(_buf, _demo) {
        throw new Error(`read() for ${this.constructor.name} not implemented!`);
    }
    write(_buf, _demo) {
        throw new Error(`write() for ${this.constructor.name} not implemented!`);
    }
}
export class NetNop extends NetMessage {
    read() { }
    write() { }
}
export class NetDisconnect extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "text", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.text = buf.readASCIIString();
    }
    write(buf) {
        buf.writeASCIIString(this.text);
    }
}
export class NetFile extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "transferId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fileName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fileRequested", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unk", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf, demo) {
        this.transferId = buf.readInt32();
        this.fileName = buf.readASCIIString();
        this.fileRequested = buf.readBoolean();
        if (demo.demoProtocol === 4) {
            this.unk = buf.readBoolean();
        }
    }
    write(buf, demo) {
        buf.writeInt32(this.transferId);
        buf.writeASCIIString(this.fileName);
        buf.writeBoolean(this.fileRequested);
        if (demo.demoProtocol === 4) {
            buf.writeBoolean(this.unk);
        }
    }
}
export class NetSplitScreenUser extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "unk", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.unk = buf.readBoolean();
    }
    write(buf) {
        buf.writeBoolean(this.unk);
    }
}
export class NetTick extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "tick", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "hostFrameTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "hostFrameTimeStdDeviation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        const NET_TICK_SCALEUP = 100_000;
        this.tick = buf.readInt32();
        this.hostFrameTime = buf.readInt16() / NET_TICK_SCALEUP;
        this.hostFrameTimeStdDeviation = buf.readInt16() / NET_TICK_SCALEUP;
    }
    write(buf) {
        const NET_TICK_SCALEUP = 100_000;
        buf.writeInt32(this.tick);
        const [hostFrameTime, hostFrameTimeStdDeviation] = new Float32Array([
            this.hostFrameTime * NET_TICK_SCALEUP,
            this.hostFrameTimeStdDeviation * NET_TICK_SCALEUP,
        ]);
        buf.writeInt16(hostFrameTime);
        buf.writeInt16(hostFrameTimeStdDeviation);
    }
}
export class NetStringCmd extends NetMessage {
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
        this.command = buf.readASCIIString();
    }
    write(buf) {
        buf.writeASCIIString(this.command);
    }
}
export class NetSetConVar extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "convars", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.convars = [];
        let length = buf.readInt8();
        while (length--) {
            this.convars.push({
                name: buf.readASCIIString(),
                value: buf.readASCIIString(),
            });
        }
    }
    write(buf) {
        buf.writeInt8(this.convars.length);
        this.convars.forEach(({ name, value }) => {
            buf.writeASCIIString(name);
            buf.writeASCIIString(value);
        });
    }
}
export class NetSignonState extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "signonState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "spawnCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "numServerPlayers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "playersNetworkIdsCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "playersNetworkIds", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mapNameLength", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mapName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf, demo) {
        this.signonState = buf.readInt8();
        this.spawnCount = buf.readInt32();
        if (demo.isNewEngine()) {
            this.numServerPlayers = buf.readInt32();
            this.playersNetworkIdsCount = buf.readInt32();
            if (this.playersNetworkIdsCount > 0) {
                this.playersNetworkIds = buf.readArrayBuffer(this.playersNetworkIdsCount);
            }
            this.mapNameLength = buf.readInt32();
            if (this.mapNameLength > 0) {
                this.mapName = buf.readASCIIString(this.mapNameLength);
            }
        }
    }
    write(buf, demo) {
        buf.writeInt8(this.signonState);
        buf.writeInt32(this.spawnCount);
        if (demo.isNewEngine()) {
            buf.writeInt32(this.numServerPlayers);
            buf.writeInt32(this.playersNetworkIdsCount);
            if (this.playersNetworkIdsCount > 0) {
                buf.writeArrayBuffer(this.playersNetworkIds, this.playersNetworkIdsCount);
            }
            buf.writeInt32(this.mapNameLength);
            if (this.mapNameLength > 0) {
                buf.writeASCIIString(this.mapName, this.mapNameLength);
            }
        }
    }
}
export class SvcServerInfo extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "protocol", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serverCount", {
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
        Object.defineProperty(this, "isDedicated", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "clientCrc", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxClasses", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mapCrc", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "playerSlot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxClients", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unk", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tickInterval", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cOs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "gameDir", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mapName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "skyName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "hostName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf, demo) {
        this.protocol = buf.readInt16();
        this.serverCount = buf.readInt32();
        this.isHltv = buf.readBoolean();
        this.isDedicated = buf.readBoolean();
        this.clientCrc = buf.readInt32();
        this.maxClasses = buf.readInt16();
        this.mapCrc = buf.readInt32();
        this.playerSlot = buf.readInt8();
        this.maxClients = buf.readInt8();
        if (demo.isNewEngine()) {
            this.unk = buf.readInt32();
        }
        else if (demo.networkProtocol === 24) {
            this.unk = buf.readBits(96);
        }
        this.tickInterval = buf.readFloat32();
        this.cOs = String.fromCharCode(buf.readInt8());
        this.gameDir = buf.readASCIIString();
        this.mapName = buf.readASCIIString();
        this.skyName = buf.readASCIIString();
        this.hostName = buf.readASCIIString();
    }
    write(buf, demo) {
        buf.writeInt16(this.protocol);
        buf.writeInt32(this.serverCount);
        buf.writeBoolean(this.isHltv);
        buf.writeBoolean(this.isDedicated);
        buf.writeInt32(this.clientCrc);
        buf.writeInt16(this.maxClasses);
        buf.writeInt32(this.mapCrc);
        buf.writeInt8(this.playerSlot);
        buf.writeInt8(this.maxClients);
        if (demo.isNewEngine()) {
            buf.writeInt32(this.unk);
        }
        else if (demo.networkProtocol === 24) {
            buf.writeBits(this.unk, 96);
        }
        buf.writeFloat32(this.tickInterval);
        buf.writeInt8(this.cOs.charCodeAt(0));
        buf.writeASCIIString(this.gameDir);
        buf.writeASCIIString(this.mapName);
        buf.writeASCIIString(this.skyName);
        buf.writeASCIIString(this.hostName);
    }
}
export class SvcSendTable extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "needsDecoder", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "propsLength", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "props", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.needsDecoder = buf.readBoolean();
        this.propsLength = buf.readInt16();
        this.props = buf.readBits(this.propsLength);
    }
    write(buf) {
        buf.writeBoolean(this.needsDecoder);
        buf.writeInt16(this.propsLength);
        buf.writeBits(this.props, this.propsLength);
    }
}
export class SvcClassInfo extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "length", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "createOnClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serverClasses", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.length = buf.readInt16();
        this.createOnClient = buf.readBoolean();
        if (!this.createOnClient) {
            this.serverClasses = [];
            let count = this.length;
            while (count--) {
                this.serverClasses.push({
                    classId: buf.readBits(Math.log2(count) + 1),
                    className: buf.readASCIIString(),
                    dataTableName: buf.readASCIIString(),
                });
            }
        }
    }
    write(buf) {
        buf.writeInt16(this.length);
        buf.writeBoolean(this.createOnClient);
        if (!this.createOnClient) {
            let count = this.length;
            this.serverClasses.forEach(({ classId, className, dataTableName }) => {
                --count;
                buf.writeBits(classId, Math.log2(count) + 1);
                buf.writeASCIIString(className);
                buf.writeASCIIString(dataTableName);
            });
        }
    }
}
export class SvcSetPause extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "paused", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.paused = buf.readBoolean();
    }
    write(buf) {
        buf.writeBoolean(this.paused);
    }
}
export class SvcCreateStringTable extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxEntries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "numEntries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "userDataFixedSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "userDataSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "userDataSizeBits", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "flags", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stringDataLength", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stringData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf, demo) {
        this.name = buf.readASCIIString();
        this.maxEntries = buf.readInt16();
        this.numEntries = buf.readBits(Math.log2(this.maxEntries) + 1);
        this.stringDataLength = buf.readBits(20);
        this.userDataFixedSize = buf.readBoolean();
        this.userDataSize = this.userDataFixedSize ? buf.readBits(12) : 0;
        this.userDataSizeBits = this.userDataFixedSize ? buf.readBits(4) : 0;
        this.flags = buf.readBits(demo.isNewEngine() ? 2 : 1);
        this.stringData = buf.readBitStream(this.stringDataLength);
    }
    write(buf, demo) {
        buf.writeASCIIString(this.name);
        buf.writeInt16(this.maxEntries);
        buf.writeBits(this.numEntries, Math.log2(this.maxEntries) + 1);
        buf.writeBits(this.stringDataLength, 20);
        buf.writeBoolean(this.userDataFixedSize);
        this.userDataFixedSize && buf.writeBits(this.userDataSize, 12);
        this.userDataFixedSize && buf.writeBits(this.userDataSizeBits, 4);
        buf.writeBits(this.flags, demo.isNewEngine() ? 2 : 1);
        buf.writeBitStream(this.stringData, this.stringDataLength);
    }
}
export class SvcUpdateStringTable extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "tableId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "numChangedEntries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stringDataLength", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stringData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.tableId = buf.readBits(5);
        this.numChangedEntries = buf.readBoolean() ? buf.readInt16() : 1;
        this.stringDataLength = buf.readBits(20);
        this.stringData = buf.readBitStream(this.stringDataLength);
    }
    write(buf) {
        buf.writeBits(this.tableId, 5);
        buf.writeBoolean(this.numChangedEntries !== 1);
        this.numChangedEntries !== 1 && buf.writeInt16(this.numChangedEntries);
        buf.writeBits(this.stringDataLength, 20);
        buf.writeBitStream(this.stringData, this.stringDataLength);
    }
}
export class SvcVoiceInit extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "codec", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "quality", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unk", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.codec = buf.readASCIIString();
        this.quality = buf.readInt8();
        if (this.quality === 255)
            this.unk = buf.readFloat32();
    }
    write(buf) {
        buf.writeASCIIString(this.codec);
        buf.writeInt8(this.quality);
        this.unk !== undefined && buf.writeFloat32(this.unk);
    }
}
export class SvcVoiceData extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "proximity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "voiceDataLength", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "voiceData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.client = buf.readInt8();
        this.proximity = buf.readInt8();
        this.voiceDataLength = buf.readInt16();
        this.voiceData = buf.readBitStream(this.voiceDataLength);
    }
    write(buf) {
        buf.writeInt8(this.client);
        buf.writeInt8(this.proximity);
        buf.writeInt16(this.voiceDataLength);
        buf.writeBitStream(this.voiceData, this.voiceDataLength);
    }
}
export class SvcPrint extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.message = buf.readASCIIString();
    }
    write(buf) {
        buf.writeASCIIString(this.message);
    }
}
export class SvcSounds extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "reliableSound", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "soundsLength", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "soundsDataLength", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "soundsData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sounds", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf, demo) {
        this.reliableSound = buf.readBoolean();
        this.soundsLength = this.reliableSound ? 1 : buf.readBits(8);
        this.soundsDataLength = this.reliableSound ? buf.readBits(8) : buf.readBits(16);
        this.soundsData = buf.readBitStream(this.soundsDataLength);
        this.sounds = [];
        if (demo.demoProtocol === 3) {
            let sounds = this.soundsLength;
            while (sounds--) {
                const sound = new SoundInfo();
                sound.read(this.soundsData);
                this.sounds.push(sound);
            }
        }
    }
    write(buf, demo) {
        buf.writeBoolean(this.reliableSound);
        !this.reliableSound && buf.writeBits(this.soundsLength, 8);
        if (demo.demoProtocol === 3) {
            const data = SourceDemoBuffer.allocateBits(this.soundsData.length);
            this.sounds.forEach((sound) => sound.write(data));
            this.soundsData = data.clone();
        }
        buf.writeBits(this.soundsDataLength, this.reliableSound ? 8 : 16);
        buf.writeBitStream(this.soundsData, this.soundsDataLength);
    }
}
export class SvcSetView extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "entityIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.entityIndex = buf.readBits(11);
    }
    write(buf) {
        buf.writeBits(this.entityIndex, 11);
    }
}
export class SvcFixAngle extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "relative", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "angle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.relative = buf.readBoolean();
        this.angle = [buf.readInt16(), buf.readInt16(), buf.readInt16()];
    }
    write(buf) {
        buf.writeBoolean(this.relative);
        this.angle.forEach((ang) => buf.writeInt16(ang));
    }
}
export class SvcCrosshairAngle extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "angle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.angle = [buf.readInt16(), buf.readInt16(), buf.readInt16()];
    }
    write(buf) {
        this.angle.forEach((ang) => buf.writeInt16(ang));
    }
}
export class SvcBspDecal extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "pos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "decalTextureIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "entityIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lowPriority", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.pos = buf.readVectorCoord();
        this.decalTextureIndex = buf.readBits(9);
        if (buf.readBoolean()) {
            this.entityIndex = buf.readBits(11);
            this.modelIndex = buf.readBits(11);
        }
        this.lowPriority = buf.readBoolean();
    }
    write(buf) {
        buf.writeVectorCoord(this.pos);
        buf.writeBits(this.decalTextureIndex, 9);
        buf.writeBoolean(this.entityIndex !== undefined);
        if (this.entityIndex !== undefined) {
            buf.writeBits(this.entityIndex, 11);
            buf.writeBits(this.modelIndex, 11);
        }
        buf.writeBoolean(this.lowPriority);
    }
}
export class SvcSplitScreen extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "unk", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dataLength", {
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
        this.unk = buf.readBits(1);
        this.dataLength = buf.readBits(11);
        this.data = buf.readBitStream(this.dataLength);
    }
    write(buf) {
        buf.writeBits(this.unk, 1);
        buf.writeBits(this.dataLength, 11);
        buf.writeBitStream(this.data, this.dataLength);
    }
}
export class SvcUserMessage extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "msgType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "msgDataLength", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "msgData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "userMessage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf, demo) {
        this.msgType = buf.readInt8();
        this.msgDataLength = buf.readBits(demo.isNewEngine() ? 12 : 11);
        this.msgData = buf.readBitStream(this.msgDataLength);
        if (demo.isPortal2Engine) {
            const userMessageType = UserMessages.Portal2Engine[this.msgType];
            if (userMessageType) {
                this.userMessage = new userMessageType(this.msgType);
                this.userMessage.read(this.msgData, demo);
            }
        }
    }
    write(buf, demo) {
        buf.writeInt8(this.msgType);
        if (this.userMessage) {
            const data = SourceDemoBuffer.from(this.msgData);
            this.userMessage.write(data, demo);
            this.msgData = data.reset();
        }
        buf.writeBits(this.msgDataLength, demo.isNewEngine() ? 12 : 11);
        buf.writeBitStream(this.msgData, this.msgDataLength);
    }
}
export class SvcEntityMessage extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "entityIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "classId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dataLength", {
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
        this.entityIndex = buf.readBits(11);
        this.classId = buf.readBits(9);
        this.dataLength = buf.readBits(11);
        this.data = buf.readBitStream(this.dataLength);
    }
    write(buf) {
        buf.writeBits(this.entityIndex, 11);
        buf.writeBits(this.classId, 9);
        buf.writeBits(this.dataLength, 11);
        buf.writeBitStream(this.data, this.dataLength);
    }
}
export class SvcGameEvent extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "event", {
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
    read(buf, demo) {
        this.data = buf.readBitStream(buf.readBits(11));
        if (demo.gameEventManager) {
            const data = SourceDemoBuffer.from(this.data);
            this.event = demo.gameEventManager.deserializeEvent(data);
        }
    }
    write(buf, demo) {
        if (demo.gameEventManager) {
            const data = SourceDemoBuffer.from(this.data);
            demo.gameEventManager.serializeEvent(this.event, data);
            this.data = data.reset();
        }
        buf.writeBits(this.data.length, 11);
        buf.writeBitStream(this.data, this.data.length);
    }
}
export class SvcPacketEntities extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "maxEntries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isDelta", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "deltaFrom", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "baseLine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "updatedEntries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "updateBaseline", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dataLength", {
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
        this.maxEntries = buf.readBits(11);
        this.isDelta = buf.readBoolean();
        this.deltaFrom = this.isDelta ? buf.readInt32() : 0;
        this.baseLine = buf.readBoolean();
        this.updatedEntries = buf.readBits(11);
        this.dataLength = buf.readBits(20);
        this.updateBaseline = buf.readBoolean();
        this.data = buf.readBitStream(this.dataLength);
    }
    write(buf) {
        buf.writeBits(this.maxEntries, 11);
        buf.writeBoolean(this.isDelta);
        this.isDelta && buf.writeInt32(this.deltaFrom);
        buf.writeBoolean(this.baseLine);
        buf.writeBits(this.updatedEntries, 11);
        buf.writeBits(this.dataLength, 20);
        buf.writeBoolean(this.updateBaseline);
        buf.writeBitStream(this.data, this.dataLength);
    }
}
export class SvcTempEntities extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "numEntries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dataLength", {
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
        this.numEntries = buf.readInt8();
        this.dataLength = buf.readBits(17);
        this.data = buf.readBitStream(this.dataLength);
    }
    write(buf) {
        buf.writeInt8(this.numEntries);
        buf.writeBits(this.data.length, 17);
        buf.writeBitStream(this.data, this.dataLength);
    }
}
export class SvcPrefetch extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "soundIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.soundIndex = buf.readBits(13);
    }
    write(buf) {
        buf.writeBits(this.soundIndex, 13);
    }
}
export class SvcMenu extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "menuType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dataLength", {
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
        this.menuType = buf.readInt16();
        this.dataLength = buf.readInt32();
        this.data = buf.readBitStream(this.dataLength);
    }
    write(buf) {
        buf.writeInt16(this.menuType);
        buf.writeInt32(this.dataLength);
        buf.writeBitStream(this.data, this.dataLength);
    }
}
export class SvcGameEventList extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "events", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "dataLength", {
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
    read(buf, demo) {
        this.events = buf.readBits(9);
        this.dataLength = buf.readBits(20);
        this.data = buf.readBitStream(this.dataLength);
        const gameEvents = [];
        let events = this.events;
        while (events--) {
            const descriptor = new GameEventDescriptor();
            descriptor.read(this.data);
            gameEvents.push(descriptor);
        }
        demo.gameEventManager = new GameEventManager(gameEvents);
    }
    write(buf, demo) {
        buf.writeBits(this.events, 9);
        const data = SourceDemoBuffer.allocate(this.dataLength);
        demo.gameEventManager.gameEvents.forEach((descriptor) => descriptor.write(data));
        this.data = data.clone();
        buf.writeBits(this.dataLength, 20);
        buf.writeBitStream(this.data, this.dataLength);
    }
}
export class SvcGetCvarValue extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "cookie", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cvarName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.cookie = buf.readInt32();
        this.cvarName = buf.readASCIIString();
    }
    write(buf) {
        buf.writeInt32(this.cookie);
        buf.writeASCIIString(this.cvarName);
    }
}
export class SvcCmdKeyValues extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "buffer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        const length = buf.readInt32();
        this.buffer = buf.readArrayBuffer(length);
    }
    write(buf) {
        buf.writeInt32(this.buffer.byteLength);
        buf.writeArrayBuffer(this.buffer.buffer, this.buffer.byteLength);
    }
}
export class SvcPaintMapData extends NetMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "dataLength", {
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
        this.dataLength = buf.readInt32();
        this.data = buf.readBitStream(this.dataLength);
    }
    write(buf) {
        buf.writeInt32(this.data.length);
        buf.writeBitStream(this.data, this.dataLength);
    }
}
export const NetMessages = {
    Portal2Engine: [
        NetNop, // 0
        NetDisconnect, // 1
        NetFile, // 2
        NetSplitScreenUser, // 3
        NetTick, // 4
        NetStringCmd, // 5
        NetSetConVar, // 6
        NetSignonState, // 7
        SvcServerInfo, // 8
        SvcSendTable, // 9
        SvcClassInfo, // 10
        SvcSetPause, // 11
        SvcCreateStringTable, // 12
        SvcUpdateStringTable, // 13
        SvcVoiceInit, // 14
        SvcVoiceData, // 15
        SvcPrint, // 16
        SvcSounds, // 17
        SvcSetView, // 18
        SvcFixAngle, // 19
        SvcCrosshairAngle, // 20
        SvcBspDecal, // 21
        SvcSplitScreen, // 22
        SvcUserMessage, // 23
        SvcEntityMessage, // 24
        SvcGameEvent, // 25
        SvcPacketEntities, // 26
        SvcTempEntities, // 27
        SvcPrefetch, // 28
        SvcMenu, // 29
        SvcGameEventList, // 30
        SvcGetCvarValue, // 31
        SvcCmdKeyValues, // 32
        SvcPaintMapData, // 33
    ],
    HalfLife2Engine: [
        NetNop, // 0
        NetDisconnect, // 1
        NetFile, // 2
        NetTick, // 3
        NetStringCmd, // 4
        NetSetConVar, // 5
        NetSignonState, // 6
        SvcPrint, // 7
        SvcServerInfo, // 8
        SvcSendTable, // 9
        SvcClassInfo, // 10
        SvcSetPause, // 11
        SvcCreateStringTable, // 12
        SvcUpdateStringTable, // 13
        SvcVoiceInit, // 14
        SvcVoiceData, // 15
        undefined,
        SvcSounds, // 17
        SvcSetView, // 18
        SvcFixAngle, // 19
        SvcCrosshairAngle, // 20
        SvcBspDecal, // 21
        undefined,
        SvcUserMessage, // 23
        SvcEntityMessage, // 24
        SvcGameEvent, // 25
        SvcPacketEntities, // 26
        SvcTempEntities, // 27
        SvcPrefetch, // 28
        SvcMenu, // 29
        SvcGameEventList, // 30
        SvcGetCvarValue, // 31
        SvcCmdKeyValues, // 32
    ],
    NetMessage,
    NetNop,
    NetDisconnect,
    NetFile,
    NetSplitScreenUser,
    NetTick,
    NetStringCmd,
    NetSetConVar,
    NetSignonState,
    SvcServerInfo,
    SvcSendTable,
    SvcClassInfo,
    SvcSetPause,
    SvcCreateStringTable,
    SvcUpdateStringTable,
    SvcVoiceInit,
    SvcVoiceData,
    SvcPrint,
    SvcSounds,
    SvcSetView,
    SvcFixAngle,
    SvcCrosshairAngle,
    SvcBspDecal,
    SvcSplitScreen,
    SvcUserMessage,
    SvcEntityMessage,
    SvcGameEvent,
    SvcPacketEntities,
    SvcTempEntities,
    SvcPrefetch,
    SvcMenu,
    SvcGameEventList,
    SvcGetCvarValue,
    SvcCmdKeyValues,
    SvcPaintMapData,
};
