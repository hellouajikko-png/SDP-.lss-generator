// Copyright (c) 2018-2024, NeKz
// SPDX-License-Identifier: MIT
import { DataTable, DemoMessages, Message, Packet, SyncTick } from './messages.js';
import { SendTable, ServerClassInfo } from './types/DataTables.js';
import { NetMessage, NetMessages } from './types/NetMessages.js';
import { StringTable } from './types/StringTables.js';
import { UserCmd } from './types/UserCmd.js';
import { SourceDemoBuffer } from './buffer.js';
import { SourceGames } from './speedrun/games/mod.js';
export const Portal2EngineGameMods = [
    'portal2',
    'TWTM',
    'aperturetag',
    'portal_stories',
    'portalreloaded',
    'Portal 2 Speedrun Mod',
];
export class SourceDemo {
    constructor() {
        Object.defineProperty(this, "demoFileStamp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "demoProtocol", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "networkProtocol", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serverName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "clientName", {
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
        Object.defineProperty(this, "gameDirectory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "playbackTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "playbackTicks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "playbackFrames", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "signOnLength", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "messages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "game", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "gameEventManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isPortal2Engine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
    }
    static default() {
        return new this();
    }
    isNewEngine() {
        return this.demoProtocol === 4;
    }
    findMessage(type) {
        const byType = type.prototype instanceof Message
            ? (msg) => msg instanceof type
            : (msg) => type(msg);
        return (this.messages ?? []).find(byType);
    }
    findMessages(type) {
        const byType = type.prototype instanceof Message
            ? (msg) => msg instanceof type
            : (msg) => type(msg);
        return (this.messages ?? []).filter(byType);
    }
    findPacket(type) {
        const byType = type.prototype instanceof NetMessage
            ? (packet) => packet instanceof type
            : (packet) => type(packet);
        for (const msg of this.messages ?? []) {
            if (msg instanceof Packet) {
                const packet = (msg.packets ?? []).find(byType);
                if (packet) {
                    return packet;
                }
            }
        }
    }
    findPackets(type) {
        const isType = type.prototype instanceof NetMessage
            ? (packet) => packet instanceof type
            : (packet) => type(packet);
        const packets = [];
        for (const msg of this.messages ?? []) {
            if (msg instanceof Packet) {
                for (const packet of msg.packets ?? []) {
                    if (isType(packet)) {
                        packets.push(packet);
                    }
                }
            }
        }
        return packets;
    }
    readHeader(buf) {
        this.demoFileStamp = buf.readASCIIString(8);
        if (this.demoFileStamp !== 'HL2DEMO') {
            throw new Error(`Invalid demo file stamp: ${this.demoFileStamp}`);
        }
        this.demoProtocol = buf.readInt32();
        this.networkProtocol = buf.readInt32();
        this.serverName = buf.readASCIIString(260);
        this.clientName = buf.readASCIIString(260);
        this.mapName = buf.readASCIIString(260);
        this.gameDirectory = buf.readASCIIString(260);
        this.playbackTime = buf.readFloat32();
        this.playbackTicks = buf.readInt32();
        this.playbackFrames = buf.readInt32();
        this.signOnLength = buf.readInt32();
        this.messages = [];
        this.isPortal2Engine = Portal2EngineGameMods.includes(this.gameDirectory);
        return this;
    }
    writeHeader(buf) {
        buf.writeASCIIString(this.demoFileStamp);
        buf.writeInt32(this.demoProtocol);
        buf.writeInt32(this.networkProtocol);
        buf.writeASCIIString(this.serverName, 260);
        buf.writeASCIIString(this.clientName, 260);
        buf.writeASCIIString(this.mapName, 260);
        buf.writeASCIIString(this.gameDirectory, 260);
        buf.writeFloat32(this.playbackTime);
        buf.writeInt32(this.playbackTicks);
        buf.writeInt32(this.playbackFrames);
        buf.writeInt32(this.signOnLength);
        return this;
    }
    readMessages(buf) {
        if (!this.messages) {
            this.messages = [];
        }
        const readSlot = this.isNewEngine();
        const demoMessages = readSlot ? DemoMessages.NewEngine : DemoMessages.OldEngine;
        while (buf.bitsLeft > 8) {
            const type = buf.readInt8();
            const messageType = demoMessages[type];
            if (messageType) {
                const message = messageType.default(type).setTick(buf.readInt32());
                if (readSlot) {
                    message.setSlot(buf.readInt8());
                }
                this.messages.push(message.read(buf, this));
            }
            else {
                throw new Error(`Unknown demo message type: ${type}`);
            }
        }
        return this;
    }
    writeMessages(buf) {
        (this.messages ?? []).forEach((message) => {
            buf.writeInt8(message.type);
            buf.writeInt32(message.tick);
            if (message.slot !== undefined) {
                buf.writeInt8(message.slot);
            }
            message.write(buf, this);
        });
    }
    readUserCmds() {
        for (const message of this.messages ?? []) {
            if (message instanceof DemoMessages.UserCmd) {
                const data = SourceDemoBuffer.from(message.data);
                const cmd = new UserCmd();
                cmd.read(data);
                message.userCmd = cmd;
                if (data.bitsLeft) {
                    message.restData = data.readBitStream(data.bitsLeft);
                }
            }
        }
        return this;
    }
    writeUserCmds() {
        for (const message of this.messages ?? []) {
            if (message instanceof DemoMessages.UserCmd && message.userCmd) {
                const data = SourceDemoBuffer.allocateBits(message.data.length);
                message.userCmd.write(data);
                if (message.restData) {
                    data.writeBitStream(message.restData, message.restData.bitsLeft);
                }
                message.data = data.clone();
            }
        }
        return this;
    }
    readStringTables() {
        for (const message of this.messages ?? []) {
            if (message instanceof DemoMessages.StringTable) {
                const stringTables = [];
                const data = SourceDemoBuffer.from(message.data);
                let tables = data.readInt8() ?? 0;
                while (tables--) {
                    const table = new StringTable();
                    table.read(data, this);
                    stringTables.push(table);
                }
                if (data.bitsLeft) {
                    message.restData = data.readBitStream(data.bitsLeft);
                }
                message.stringTables = stringTables;
            }
        }
        return this;
    }
    writeStringTables() {
        for (const message of this.messages ?? []) {
            if (message instanceof DemoMessages.StringTable && message.stringTables) {
                const data = SourceDemoBuffer.allocateBits(message.data.length);
                data.writeInt8(message.stringTables.length);
                message.stringTables.forEach((stringTable) => {
                    stringTable.write(data, this);
                });
                if (message.restData) {
                    data.writeBitStream(message.restData, message.restData.bitsLeft);
                }
                message.data = data.clone();
            }
        }
        return this;
    }
    readDataTables() {
        for (const message of this.messages ?? []) {
            if (message instanceof DataTable) {
                const dataTable = {
                    tables: [],
                    serverClasses: [],
                    restData: undefined,
                };
                const data = SourceDemoBuffer.from(message.data);
                while (data.readBoolean()) {
                    const dt = new SendTable();
                    dt.read(data, this);
                    dataTable.tables.push(dt);
                }
                let classes = data.readInt16() ?? 0;
                while (classes--) {
                    const sc = new ServerClassInfo();
                    sc.read(data);
                    dataTable.serverClasses.push(sc);
                }
                if (data.bitsLeft) {
                    dataTable.restData = data.readBitStream(data.bitsLeft);
                }
                message.dataTable = dataTable;
            }
        }
        return this;
    }
    writeDataTables() {
        for (const message of this.messages ?? []) {
            if (message instanceof DataTable && message.dataTable) {
                const data = SourceDemoBuffer.allocateBits(message.data.length);
                message.dataTable.tables.forEach((dt) => {
                    data.writeBoolean(true);
                    dt.write(data, this);
                });
                data.writeBoolean(false);
                data.writeInt16(message.dataTable.serverClasses.length);
                message.dataTable.serverClasses.forEach((sc) => {
                    sc.write(data);
                });
                if (message.dataTable.restData) {
                    data.writeBitStream(message.dataTable.restData, message.dataTable.restData.bitsLeft);
                }
                message.data = data.clone();
            }
        }
        return this;
    }
    readPackets(netMessages) {
        netMessages = netMessages ??
            (this.isNewEngine() ? NetMessages.Portal2Engine : NetMessages.HalfLife2Engine);
        for (const message of this.messages ?? []) {
            if (message instanceof Packet) {
                const packets = [];
                const data = SourceDemoBuffer.from(message.data);
                while ((data.bitsLeft ?? 0) > 6) {
                    const type = data.readBits(6) ?? -1;
                    const NetMessage = netMessages.at(type);
                    if (NetMessage) {
                        const packet = new NetMessage(type);
                        packet.read(data, this);
                        packets.push(packet);
                    }
                    else {
                        throw new Error(`Net message type ${type} unknown!`);
                    }
                }
                if (data.bitsLeft) {
                    message.restData = data.readBitStream(data.bitsLeft);
                }
                message.packets = packets;
            }
        }
        return this;
    }
    writePackets() {
        for (const message of this.messages ?? []) {
            if (message instanceof Packet && message.packets) {
                const data = SourceDemoBuffer.allocateBits(message.data.length);
                message.packets.forEach((packet) => {
                    data.writeBits(packet.type, 6);
                    packet.write(data, this);
                });
                if (message.restData) {
                    data.writeBitStream(message.restData, message.restData.bitsLeft);
                }
                message.data = data.clone();
            }
        }
        return this;
    }
    detectGame(sourceGames = SourceGames) {
        this.game = sourceGames.find((game) => game.directory === this.gameDirectory);
        return this;
    }
    getIntervalPerTick() {
        if (this.playbackTicks === undefined || this.playbackTime === undefined) {
            throw new Error('Cannot find tickrate without parsing the header.');
        }
        if (this.playbackTicks === 0) {
            if (this.game !== undefined) {
                return 1 / this.game.tickrate;
            }
            throw new Error('Cannot find ipt of null tick demo.');
        }
        return this.playbackTime / this.playbackTicks;
    }
    getTickrate() {
        if (this.playbackTicks === undefined || this.playbackTime === undefined) {
            throw new Error('Cannot find tickrate without parsing the header.');
        }
        if (this.playbackTime === 0) {
            if (this.game !== undefined) {
                return this.game.tickrate;
            }
            throw new Error('Cannot find tickrate of null tick demo.');
        }
        return this.playbackTicks / this.playbackTime;
    }
    adjustTicks() {
        if (!this.messages?.length) {
            throw new Error('Cannot adjust ticks without parsed messages.');
        }
        let synced = false;
        let last = 0;
        for (const message of this.messages) {
            if (message instanceof SyncTick) {
                synced = true;
            }
            if (!synced) {
                message.tick = 0;
            }
            else if (message.tick < 0) {
                message.tick = last;
            }
            last = message.tick;
        }
        return this;
    }
    adjustRange(endTick = 0, startTick = 0, tickrate = undefined) {
        if (!this.messages?.length) {
            throw new Error('Cannot adjust range without parsed messages.');
        }
        if (endTick < 1) {
            const packets = this.findMessages(Packet);
            const lastPacket = packets[packets.length - 1];
            if (!lastPacket) {
                throw new Error('Cannot adjust range without parsed packets.');
            }
            endTick = lastPacket.tick;
        }
        const delta = endTick - startTick;
        if (delta < 0) {
            throw new Error('Start tick is greater than end tick.');
        }
        const ipt = tickrate === undefined ? this.getIntervalPerTick() : 1 / tickrate;
        this.playbackTicks = delta;
        this.playbackTime = ipt * delta;
        return this;
    }
    rebaseFrom(tick) {
        if (!this.messages?.length) {
            throw new Error('Cannot adjust ticks without parsed messages.');
        }
        let synced = false;
        let last = 0;
        for (const message of this.messages) {
            if (message.tick === tick) {
                synced = true;
            }
            if (!synced) {
                message.tick = 0;
            }
            else if (message.tick < 0) {
                message.tick = last;
            }
            else {
                message.tick -= tick;
            }
            last = message.tick;
        }
        return this;
    }
    getSyncedTicks(demo, viewTolerance = 1, splitScreenIndex = 0) {
        if (!this.messages?.length || !demo.messages?.length) {
            throw new Error('Cannot adjust ticks without parsed messages.');
        }
        const syncedTicks = [];
        for (const message of this.messages) {
            if (message instanceof Packet) {
                const view = message.cmdInfo?.at(splitScreenIndex)?.viewOrigin;
                const result = demo.messages.find((msg) => {
                    if (!(msg instanceof Packet)) {
                        return false;
                    }
                    const match = msg.cmdInfo?.at(splitScreenIndex)?.viewOrigin;
                    return (Math.abs((match?.x ?? 0) - (view?.x ?? 0)) <= viewTolerance &&
                        Math.abs((match?.y ?? 0) - (view?.y ?? 0)) <= viewTolerance &&
                        Math.abs((match?.z ?? 0) - (view?.z ?? 0)) <= viewTolerance);
                });
                if (result !== undefined) {
                    syncedTicks.push({
                        source: message.tick,
                        destination: result.tick,
                        delta: Math.abs((message.tick ?? 0) - result.tick),
                        x: message.cmdInfo?.at(splitScreenIndex)?.viewOrigin?.x,
                        y: message.cmdInfo?.at(splitScreenIndex)?.viewOrigin?.y,
                        z: message.cmdInfo?.at(splitScreenIndex)?.viewOrigin?.z,
                    });
                }
            }
        }
        return syncedTicks;
    }
}
