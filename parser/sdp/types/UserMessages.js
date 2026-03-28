// Copyright (c) 2023-2024, NeKz
// SPDX-License-Identifier: MIT
export class UserMessage {
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
    as() {
        return this;
    }
}
export class Geiger extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "geigerRange", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.geigerRange = buf.readUint8();
    }
    write(buf) {
        buf.writeUint8(this.geigerRange);
    }
}
export class Train extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "pos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.pos = buf.readUint8();
    }
    write(buf) {
        buf.writeUint8(this.pos);
    }
}
export class HudText extends UserMessage {
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
export class SayText extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "text", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "wantsToChat", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.client = buf.readUint8();
        this.text = buf.readASCIIString();
        this.wantsToChat = buf.readUint8();
    }
    write(buf) {
        buf.writeUint8(this.client);
        buf.writeASCIIString(this.text);
        buf.writeUint8(this.wantsToChat);
    }
}
export class SayText2 extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "text", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "wantsToChat", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "messageText", {
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
    }
    read(buf) {
        this.client = buf.readUint8();
        this.text = buf.readASCIIString();
        this.wantsToChat = buf.readUint8();
        this.messageText = buf.readASCIIString();
        this.messages = [
            buf.readASCIIString(),
            buf.readASCIIString(),
            buf.readASCIIString(),
            buf.readASCIIString(),
        ];
    }
    write(buf) {
        buf.writeUint8(this.client);
        buf.writeASCIIString(this.text);
        buf.writeUint8(this.wantsToChat);
        buf.writeASCIIString(this.messageText);
        for (const message of this.messages.values()) {
            buf.writeASCIIString(message);
        }
    }
}
export var HudPrint;
(function (HudPrint) {
    HudPrint[HudPrint["Notify"] = 1] = "Notify";
    HudPrint[HudPrint["Console"] = 2] = "Console";
    HudPrint[HudPrint["Talk"] = 3] = "Talk";
    HudPrint[HudPrint["Center"] = 4] = "Center";
})(HudPrint || (HudPrint = {}));
export class TextMsg extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "msgDest", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "output", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.msgDest = buf.readUint8();
        this.output = ['', '', '', '', ''];
        for (let i = 0; i < 5; ++i) {
            this.output[i] = buf.readASCIIString();
        }
    }
    write(buf) {
        buf.writeUint8(this.msgDest);
        for (const str of this.output.values() ?? []) {
            buf.writeASCIIString(str);
        }
    }
}
export class HudMsg extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "textParms", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.textParms = {
            channel: buf.readUint8(),
            x: buf.readFloat32(),
            y: buf.readFloat32(),
            r1: buf.readUint8(),
            g1: buf.readUint8(),
            b1: buf.readUint8(),
            a1: buf.readUint8(),
            r2: buf.readUint8(),
            g2: buf.readUint8(),
            b2: buf.readUint8(),
            a2: buf.readUint8(),
            effect: buf.readFloat32(),
            fadeinTime: buf.readFloat32(),
            fadeoutTime: buf.readFloat32(),
            holdTime: buf.readFloat32(),
            fxTime: buf.readFloat32(),
        };
        this.message = buf.readASCIIString();
    }
    write(buf) {
        buf.writeUint8(this.textParms.channel);
        buf.writeFloat32(this.textParms.x);
        buf.writeFloat32(this.textParms.y);
        buf.writeUint8(this.textParms.r1);
        buf.writeUint8(this.textParms.g1);
        buf.writeUint8(this.textParms.b1);
        buf.writeUint8(this.textParms.a1);
        buf.writeUint8(this.textParms.r2);
        buf.writeUint8(this.textParms.g2);
        buf.writeUint8(this.textParms.b2);
        buf.writeUint8(this.textParms.a2);
        buf.writeFloat32(this.textParms.effect);
        buf.writeFloat32(this.textParms.fadeinTime);
        buf.writeFloat32(this.textParms.fadeoutTime);
        buf.writeFloat32(this.textParms.holdTime);
        buf.writeFloat32(this.textParms.fxTime);
        buf.writeASCIIString(this.message);
    }
}
export class ResetHUD extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "reset", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.reset = buf.readUint8();
    }
    write(buf) {
        buf.writeUint8(this.reset);
    }
}
export class GameTitle extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
export class ItemPickup extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.name = buf.readASCIIString();
    }
    write(buf) {
        buf.writeASCIIString(this.name);
    }
}
// NOTE: Unused
export class ShowMenu extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
export var ShakeCommand;
(function (ShakeCommand) {
    ShakeCommand[ShakeCommand["Start"] = 0] = "Start";
    ShakeCommand[ShakeCommand["Stop"] = 1] = "Stop";
    ShakeCommand[ShakeCommand["Amplitude"] = 2] = "Amplitude";
    ShakeCommand[ShakeCommand["Frequency"] = 3] = "Frequency";
    ShakeCommand[ShakeCommand["StartRumbleOnly"] = 4] = "StartRumbleOnly";
    ShakeCommand[ShakeCommand["StartNoRumble"] = 5] = "StartNoRumble";
})(ShakeCommand || (ShakeCommand = {}));
export class Shake extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "command", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "amplitude", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "frequency", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "duration", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.command = buf.readUint8();
        this.amplitude = buf.readFloat32();
        this.frequency = buf.readFloat32();
        this.duration = buf.readFloat32();
    }
    write(buf) {
        buf.writeUint8(this.command);
        buf.writeFloat32(this.amplitude);
        buf.writeFloat32(this.frequency);
        buf.writeFloat32(this.duration);
    }
}
export class Tilt extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "command", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "easeInOut", {
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
        Object.defineProperty(this, "duration", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "time", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.command = buf.readUint8();
        this.easeInOut = buf.readUint8();
        this.angle = buf.readQAngle();
        this.duration = buf.readFloat32();
        this.time = buf.readFloat32();
    }
    write(buf) {
        buf.writeUint8(this.command);
        buf.writeUint8(this.easeInOut);
        buf.writeQAngle(this.angle);
        buf.writeFloat32(this.duration);
        buf.writeFloat32(this.time);
    }
}
export class Fade extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "duration", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "holdTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fadeFlags", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fade", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.duration = buf.readUint16();
        this.holdTime = buf.readUint16();
        this.fadeFlags = buf.readUint16();
        this.fade = {
            r: buf.readUint8(),
            g: buf.readUint8(),
            b: buf.readUint8(),
            a: buf.readUint8(),
        };
    }
    write(buf) {
        buf.writeUint16(this.duration);
        buf.writeUint16(this.holdTime);
        buf.writeUint16(this.fadeFlags);
        buf.writeUint8(this.fade.r);
        buf.writeUint8(this.fade.g);
        buf.writeUint8(this.fade.b);
        buf.writeUint8(this.fade.a);
    }
}
export class VGUIMenu extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "show", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "size", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "keyValues", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.name = buf.readASCIIString();
        this.show = buf.readUint8();
        this.size = buf.readUint8();
        this.keyValues = [];
        for (let i = 0; i < this.size; ++i) {
            this.keyValues.push({
                key: buf.readASCIIString(),
                value: buf.readASCIIString(),
            });
        }
    }
    write(buf) {
        buf.writeASCIIString(this.name);
        buf.writeUint8(this.show);
        buf.writeUint8(this.size);
        this.keyValues.forEach(({ key, value }) => {
            buf.writeASCIIString(key);
            buf.writeASCIIString(value);
        });
    }
}
export class Rumble extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "index", {
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
        Object.defineProperty(this, "flags", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.index = buf.readUint8();
        this.data = buf.readUint8();
        this.flags = buf.readUint8();
    }
    write(buf) {
        buf.writeUint8(this.index);
        buf.writeUint8(this.data);
        buf.writeUint8(this.flags);
    }
}
export class Battery extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "battery", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.battery = buf.readUint16();
    }
    write(buf) {
        buf.writeUint16(this.battery);
    }
}
// NOTE: Unused
export class Damage extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
export class VoiceMask extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "audiblePlayers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serverBannedPlayers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serverModEnabled", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        const VOICE_MAX_PLAYERS_DW = 2;
        this.audiblePlayers = [0, 0];
        this.serverBannedPlayers = [0, 0];
        for (let index = 0; index < VOICE_MAX_PLAYERS_DW; ++index) {
            this.audiblePlayers[index] = buf.readUint32();
            this.serverBannedPlayers[index] = buf.readUint32();
        }
        this.serverModEnabled = buf.readUint8();
    }
    write(buf) {
        const VOICE_MAX_PLAYERS_DW = 2;
        for (let index = 0; index < VOICE_MAX_PLAYERS_DW; ++index) {
            buf.writeUint32(this.audiblePlayers[index]);
            buf.writeUint32(this.serverBannedPlayers[index]);
        }
        buf.writeUint8(this.serverModEnabled);
    }
}
export class RequestState extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
export class CloseCaption extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "hash", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "duration", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fromPlayer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.hash = buf.readUint32();
        this.duration = buf.readBits(15, false);
        this.fromPlayer = buf.readBoolean();
    }
    write(buf) {
        buf.writeUint32(this.hash);
        buf.writeBits(this.duration, 15);
        buf.writeBoolean(this.fromPlayer);
    }
}
export class CloseCaptionDirect extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "hash", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "duration", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fromPlayer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.hash = buf.readUint32();
        this.duration = buf.readBits(15, false);
        this.fromPlayer = buf.readBoolean();
    }
    write(buf) {
        buf.writeUint32(this.hash);
        buf.writeBits(this.duration, 15);
        buf.writeBoolean(this.fromPlayer);
    }
}
export class HintText extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "hintString", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.hintString = buf.readASCIIString();
    }
    write(buf) {
        buf.writeASCIIString(this.hintString);
    }
}
export class KeyHintText extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "messages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.messages = buf.readUint8();
        this.message = buf.readASCIIString();
    }
    write(buf) {
        buf.writeUint8(this.messages);
        buf.writeASCIIString(this.message);
    }
}
// NOTE: Unused
export class SquadMemberDied extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
// NOTE: Unused
export class AmmoDenied extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "ammo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(_buf) {
        // this.ammo = buf.readUint16();
    }
    write(_buf) {
        // buf.writeUint16(this.ammo);
    }
}
export var CreditsType;
(function (CreditsType) {
    CreditsType[CreditsType["Logo"] = 1] = "Logo";
    CreditsType[CreditsType["Intro"] = 2] = "Intro";
    CreditsType[CreditsType["Outro"] = 3] = "Outro";
})(CreditsType || (CreditsType = {}));
export class CreditsMsg extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "creditsType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.creditsType = buf.readUint8();
    }
    write(buf) {
        buf.writeUint8(this.creditsType);
    }
}
export class LogoTimeMsg extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "time", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.time = buf.readFloat32();
    }
    write(buf) {
        buf.writeFloat32(this.time);
    }
}
// NOTE: Unused
export class AchievementEvent extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "achievementId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(_buf) {
        // this.achievementId = buf.readUint16();
    }
    write(_buf) {
        // buf.writeUint16(this.achievementId);
    }
}
export class UpdateJalopyRadar extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
export class CurrentTimescale extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
export var GameTimescaleInterpolators;
(function (GameTimescaleInterpolators) {
    GameTimescaleInterpolators[GameTimescaleInterpolators["Linear"] = 0] = "Linear";
    GameTimescaleInterpolators[GameTimescaleInterpolators["Accel"] = 1] = "Accel";
    GameTimescaleInterpolators[GameTimescaleInterpolators["DeAccel"] = 2] = "DeAccel";
    GameTimescaleInterpolators[GameTimescaleInterpolators["EaseInOut"] = 3] = "EaseInOut";
})(GameTimescaleInterpolators || (GameTimescaleInterpolators = {}));
export class DesiredTimescale extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "desiredTimescale", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "durationRealTimeSeconds", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "interpolationType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "startBlendTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.desiredTimescale = buf.readFloat32();
        this.durationRealTimeSeconds = buf.readFloat32();
        this.interpolationType = buf.readUint8();
        this.startBlendTime = buf.readFloat32();
    }
    write(buf) {
        buf.writeFloat32(this.desiredTimescale);
        buf.writeFloat32(this.durationRealTimeSeconds);
        buf.writeUint8(this.interpolationType);
        buf.writeFloat32(this.startBlendTime);
    }
}
export var PortalCreditsType;
(function (PortalCreditsType) {
    PortalCreditsType[PortalCreditsType["Logo"] = 1] = "Logo";
    PortalCreditsType[PortalCreditsType["Intro"] = 2] = "Intro";
    PortalCreditsType[PortalCreditsType["Outro"] = 3] = "Outro";
    PortalCreditsType[PortalCreditsType["OutroPortal"] = 4] = "OutroPortal";
})(PortalCreditsType || (PortalCreditsType = {}));
export class CreditsPortalMsg extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "creditsType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.creditsType = buf.readUint8();
    }
    write(buf) {
        buf.writeUint8(this.creditsType);
    }
}
// NOTE: Unused
export class InventoryFlash extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
// NOTE: Unused
export class IndicatorFlash extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
// NOTE: Unused
export class ControlHelperAnimate extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
// NOTE: Unused
export class TakePhoto extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
// NOTE: Unused
export class Flash extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
export class HudPingIndicator extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "position", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.position = buf.readVector();
    }
    write(buf) {
        buf.writeVector(this.position);
    }
}
// NOTE: Unused
export class OpenRadialMenu extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
// TODO
export class AddLocator extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "playerIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "entityHandle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "displayTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "position", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "normal", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "iconName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(_buf) {
        // this.playerIndex = buf.readUint16();
        // this.entityHandle = buf.readUint32();
        // this.displayTime = buf.readFloat32();
        // this.position = buf.readVectorCoord();
        // this.normal = buf.readVector();
        // this.iconName = buf.readASCIIString();
    }
    write(_buf) {
        // buf.writeUint16(this.playerIndex!);
        // buf.writeUint32(this.entityHandle!);
        // buf.writeFloat32(this.displayTime!);
        // buf.writeVectorCoord(this.position!);
        // buf.writeVector(this.normal!);
        // buf.writeASCIIString(this.iconName!);
    }
}
export class MPMapCompleted extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "branch", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "level", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.branch = buf.readUint8();
        this.level = buf.readUint8();
    }
    write(buf) {
        buf.writeUint8(this.branch);
        buf.writeUint8(this.level);
    }
}
export class MPMapIncomplete extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "branch", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "level", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.branch = buf.readUint8();
        this.level = buf.readUint8();
    }
    write(buf) {
        buf.writeUint8(this.branch);
        buf.writeUint8(this.level);
    }
}
// TODO
export class MPMapCompletedData extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "levelCompletions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(_buf) {
        // const MAX_PORTAL2_COOP_BRANCHES = 6;
        // const MAX_PORTAL2_COOP_LEVELS_PER_BRANCH = 16;
        // const numBits = 2 * MAX_PORTAL2_COOP_BRANCHES * MAX_PORTAL2_COOP_LEVELS_PER_BRANCH;
        // const buffer = buf.readArrayBuffer(numBits / 8);
        // let current = 0;
        // let mask = 0x01;
        // this.levelCompletions = [];
        // for (let player = 0; player < 2; ++player) {
        //     this.levelCompletions[player] = [];
        //     for (let branch = 0; branch < MAX_PORTAL2_COOP_BRANCHES; ++branch) {
        //         this.levelCompletions[player]![branch] = [];
        //         for (let level = 0; level < MAX_PORTAL2_COOP_LEVELS_PER_BRANCH; ++level) {
        //             if ((buffer.at(current)! & mask) !== 0) {
        //                 this.levelCompletions![player]![branch]![level] = true;
        //             }
        //             mask <<= 1;
        //             if (mask > 0x100) {
        //                 ++current;
        //                 mask = 0x01;
        //             }
        //         }
        //     }
        // }
    }
    write(_buf) {
        // const MAX_PORTAL2_COOP_BRANCHES = 6;
        // const MAX_PORTAL2_COOP_LEVELS_PER_BRANCH = 16;
        // const numBits = 2 * MAX_PORTAL2_COOP_BRANCHES * MAX_PORTAL2_COOP_LEVELS_PER_BRANCH;
        // const buffer = new Uint8Array(8 + numBits / 8);
        // let current = 0;
        // let mask = 0x01;
        // this.levelCompletions = [];
        // for (let player = 0; player < 2; ++player) {
        //     this.levelCompletions[player] = [];
        //     for (let branch = 0; branch < MAX_PORTAL2_COOP_BRANCHES; ++branch) {
        //         this.levelCompletions[player]![branch] = [];
        //         for (let level = 0; level < MAX_PORTAL2_COOP_LEVELS_PER_BRANCH; ++level) {
        //             const completed = this.levelCompletions![player]![branch]![level];
        //             buffer.set(new Uint8Array([completed ? mask : 0x00]), current);
        //             mask <<= 1;
        //             if (mask > 0x100) {
        //                 ++current;
        //                 mask = 0x01;
        //             }
        //         }
        //     }
        // }
        // buf.writeArrayBuffer(buffer, buffer.byteLength);
    }
}
export class MPTauntEarned extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "taunt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "awardSilently", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.taunt = buf.readASCIIString();
        this.awardSilently = buf.readBoolean();
    }
    write(buf) {
        buf.writeASCIIString(this.taunt);
        buf.writeBoolean(this.awardSilently);
    }
}
export class MPTauntUnlocked extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "taunt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.taunt = buf.readASCIIString();
    }
    write(buf) {
        buf.writeASCIIString(this.taunt);
    }
}
export class MPTauntLocked extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "taunt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.taunt = buf.readASCIIString();
    }
    write(buf) {
        buf.writeASCIIString(this.taunt);
    }
}
export class MPAllTauntsLocked extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
export var PortalFizzleType;
(function (PortalFizzleType) {
    PortalFizzleType[PortalFizzleType["Success"] = 0] = "Success";
    PortalFizzleType[PortalFizzleType["CantFit"] = 1] = "CantFit";
    PortalFizzleType[PortalFizzleType["OverlappedLinked"] = 2] = "OverlappedLinked";
    PortalFizzleType[PortalFizzleType["BadVolume"] = 3] = "BadVolume";
    PortalFizzleType[PortalFizzleType["BadSurface"] = 4] = "BadSurface";
    PortalFizzleType[PortalFizzleType["Killed"] = 5] = "Killed";
    PortalFizzleType[PortalFizzleType["Cleanser"] = 6] = "Cleanser";
    PortalFizzleType[PortalFizzleType["Close"] = 7] = "Close";
    PortalFizzleType[PortalFizzleType["NearBlue"] = 8] = "NearBlue";
    PortalFizzleType[PortalFizzleType["NearRed"] = 9] = "NearRed";
    PortalFizzleType[PortalFizzleType["None"] = 10] = "None";
})(PortalFizzleType || (PortalFizzleType = {}));
// TODO: vector coord is incorrect :>
export class PortalFX_Surface extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "entIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "playerEntIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "team", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "portalNum", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "effect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "vecOrigin", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "angles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(_buf) {
        // this.entIndex = buf.readInt16();
        // this.playerEntIndex = buf.readInt16();
        // this.team = buf.readInt8();
        // this.portalNum = buf.readInt8();
        // this.effect = buf.readInt8();
        // this.vecOrigin = buf.readVectorCoord();
        // this.angles = buf.readAngles();
    }
    write(_buf) {
        // buf.writeInt16(this.entIndex!);
        // buf.writeInt16(this.playerEntIndex!);
        // buf.writeInt8(this.team!);
        // buf.writeInt8(this.portalNum!);
        // buf.writeInt8(this.effect!);
        // buf.writeVectorCoord(this.vecOrigin!);
        // buf.writeAngles(this.angles!);
    }
}
// TODO
export class PaintWorld extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "unk1", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unk2", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unk3", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unk4", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unk5", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(_buf) {
        // this.unk1 = buf.readUint8();
        // this.unk2 = buf.readUint32();
        // this.unk3 = buf.readFloat32();
        // this.unk4 = buf.readFloat32();
        // this.unk5 = buf.readUint8();
    }
    write(_buf) {
        // buf.writeUint8(this.unk1!);
        // buf.writeUint32(this.unk2!);
        // buf.writeFloat32(this.unk3!);
        // buf.writeFloat32(this.unk4!);
        // buf.writeUint8(this.unk5!);
    }
}
// TODO
export class PaintEntity extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "unk1", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unk2", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unk3", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unk4", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unk5", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(_buf) {
        // this.unk1 = buf.readUint32();
        // this.unk2 = buf.readUint8();
        // this.unk3 = buf.readFloat32();
        // this.unk4 = buf.readFloat32();
        // this.unk5 = buf.readFloat32();
    }
    write(_buf) {
        // buf.writeUint32(this.unk1!);
        // buf.writeUint8(this.unk2!);
        // buf.writeFloat32(this.unk3!);
        // buf.writeFloat32(this.unk4!);
        // buf.writeFloat32(this.unk5!);
    }
}
// TODO
export class ChangePaintColor extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "unk1", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unk2", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(_buf) {
        // this.unk1 = buf.readUint32();
        // this.unk2 = buf.readUint8();
    }
    write(_buf) {
        // buf.writeUint32(this.unk1!);
        // buf.writeUint8(this.unk2!);
    }
}
// NOTE: Unused
export class PaintBombExplode extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
export class RemoveAllPaint extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
// NOTE: Unused
export class PaintAllSurfaces extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
export class RemovePaint extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
// NOTE: Unused
export class StartSurvey extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "handle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.handle = buf.readUint32();
    }
    write(buf) {
        buf.writeUint32(this.handle);
    }
}
// TODO
export class ApplyHitBoxDamageEffect extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "entityHandle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "effectIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "hits", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(_buf) {
        // this.entityHandle = buf.readUint32();
        // this.effectIndex = buf.readUint8();
        // this.hits = buf.readUint8();
    }
    write(_buf) {
        // buf.writeUint32(this.entityHandle!);
        // buf.writeUint8(this.effectIndex!);
        // buf.writeUint8(this.hits!);
    }
}
export class SetMixLayerTriggerFactor extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "layer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "group", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "factor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.layer = buf.readASCIIString();
        this.group = buf.readASCIIString();
        this.factor = buf.readFloat32();
    }
    write(buf) {
        buf.writeASCIIString(this.layer);
        buf.writeASCIIString(this.group);
        buf.writeFloat32(this.factor);
    }
}
export class TransitionFade extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "fade", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.fade = buf.readFloat32();
    }
    write(buf) {
        buf.writeFloat32(this.fade);
    }
}
export class ScoreboardTempUpdate extends UserMessage {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "portalScore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "timeScore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    read(buf) {
        this.portalScore = buf.readUint32();
        this.timeScore = buf.readUint32();
    }
    write(buf) {
        buf.writeUint32(this.portalScore);
        buf.writeUint32(this.timeScore);
    }
}
export class ChallengeModeCheatSession extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
export class ChallengeModeCloseAllUI extends UserMessage {
    read(_buf) { }
    write(_buf) { }
}
export const UserMessages = {
    Portal2Engine: [
        Geiger, // 0
        Train, // 1
        HudText, // 2
        SayText, // 3
        SayText2, // 4
        TextMsg, // 5
        HudMsg, // 6
        ResetHUD, // 7
        GameTitle, // 8
        ItemPickup, // 9
        ShowMenu, // 10
        Shake, // 11
        Tilt, // 12
        Fade, // 13
        VGUIMenu, // 14
        Rumble, // 15
        Battery, // 16
        Damage, // 17
        VoiceMask, // 18
        RequestState, // 19
        CloseCaption, // 20
        CloseCaptionDirect, // 21
        HintText, // 22
        KeyHintText, // 23
        SquadMemberDied, // 24
        AmmoDenied, // 25
        CreditsMsg, // 26
        LogoTimeMsg, // 27
        AchievementEvent, // 28
        UpdateJalopyRadar, // 29
        CurrentTimescale, // 30
        DesiredTimescale, // 31
        CreditsPortalMsg, // 32
        InventoryFlash, // 33
        IndicatorFlash, // 34
        ControlHelperAnimate, // 35
        TakePhoto, // 36
        Flash, // 37
        HudPingIndicator, // 38
        OpenRadialMenu, // 39
        AddLocator, // 40
        MPMapCompleted, // 41
        MPMapIncomplete, // 42
        MPMapCompletedData, // 43
        MPTauntEarned, // 44
        MPTauntUnlocked, // 45
        MPTauntLocked, // 46
        MPAllTauntsLocked, // 47
        PortalFX_Surface, // 48
        PaintWorld, // 49
        PaintEntity, // 50
        ChangePaintColor, // 51
        PaintBombExplode, // 52
        RemoveAllPaint, // 53
        PaintAllSurfaces, // 54
        RemovePaint, // 55
        StartSurvey, // 56
        ApplyHitBoxDamageEffect, // 57
        SetMixLayerTriggerFactor, // 58
        TransitionFade, // 59
        ScoreboardTempUpdate, // 60
        ChallengeModeCheatSession, // 61
        ChallengeModeCloseAllUI, // 62
        // not registered:
        //      VoiceSubtitle { client: i8, menu: i8, item: i8 }
        //      StatsCrawlMsg {}
        //      creditsMsg {}
        //      MPVSGameOver { unk: i8 }
        //      MPVSRoundEnd { unk: i8 }
        //      MPVSGameStart { unk: i8 }
    ],
};
