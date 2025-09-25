/**
 * MIT License
 *
 * Copyright (c) 2020, bit-buffer developers
 * Copyright (c) 2023-2024, NeKz
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 *
 * Modified version of: https://github.com/inolen/bit-buffer
 *
 * Changes:
 *      - Converted to TypeScript
 *      - Replaced prototype definitions with class properties, methods, getters
 *        and setters
 *      - Replaced `var` with `const`/`let`
 *      - Removed multiple assignment expressions
 *      - Replaced `function` definitions with ES6 arrow functions
 *      - Inlined a bunch of module scoped functions
 *      - Removed references to NodeJs Buffer
 */
/**
 * BitView
 *
 * BitView provides a similar interface to the standard
 * DataView, but with support for bit-level reads / writes.
 */
export class BitView {
    constructor(source, byteOffset, byteLength) {
        Object.defineProperty(this, "_view", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "bigEndian", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Used to massage fp values so we can operate on them
        // at the bit level.
        Object.defineProperty(this, "_scratch", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new DataView(new ArrayBuffer(8))
        });
        const isBuffer = source instanceof ArrayBuffer;
        if (!isBuffer) {
            throw new Error('Must specify a valid ArrayBuffer or Buffer.');
        }
        byteOffset = byteOffset || 0;
        byteLength = byteLength || source.byteLength;
        this._view = new Uint8Array(source, byteOffset, byteLength);
        this.bigEndian = false;
    }
    get buffer() {
        return this._view.buffer;
    }
    get byteLength() {
        return this._view.length;
    }
    _setBit(offset, on) {
        if (on) {
            this._view[offset >> 3] |= 1 << (offset & 7);
        }
        else {
            this._view[offset >> 3] &= ~(1 << (offset & 7));
        }
    }
    getBits(offset, bits, signed) {
        const available = this._view.length * 8 - offset;
        if (bits > available) {
            throw new Error(`Cannot get ${bits} bit(s) from offset ${offset}, ${available} available`);
        }
        let value = 0;
        for (let i = 0; i < bits;) {
            const remaining = bits - i;
            const bitOffset = offset & 7;
            const currentByte = this._view[offset >> 3];
            // the max number of bits we can read from the current byte
            const read = Math.min(remaining, 8 - bitOffset);
            if (this.bigEndian) {
                // create a mask with the correct bit width
                const mask = ~(0xff << read);
                // shift the bits we want to the start of the byte and mask of the rest
                const readBits = (currentByte >> (8 - read - bitOffset)) & mask;
                value <<= read;
                value |= readBits;
            }
            else {
                // create a mask with the correct bit width
                const mask = ~(0xff << read);
                // shift the bits we want to the start of the byte and mask off the rest
                const readBits = (currentByte >> bitOffset) & mask;
                value |= readBits << i;
            }
            offset += read;
            i += read;
        }
        if (signed) {
            // If we're not working with a full 32 bits, check the
            // imaginary MSB for this bit count and convert to a
            // valid 32-bit signed value if set.
            if (bits !== 32 && value & (1 << (bits - 1))) {
                value |= -1 ^ ((1 << bits) - 1);
            }
            return value;
        }
        return value >>> 0;
    }
    setBits(offset, value, bits) {
        const available = this._view.length * 8 - offset;
        if (bits > available) {
            throw new Error(`Cannot set ${bits} bit(s) from offset ${offset}, ${available} available`);
        }
        for (let i = 0; i < bits;) {
            const remaining = bits - i;
            const bitOffset = offset & 7;
            const byteOffset = offset >> 3;
            const wrote = Math.min(remaining, 8 - bitOffset);
            if (this.bigEndian) {
                // create a mask with the correct bit width
                const mask = ~(~0 << wrote);
                // shift the bits we want to the start of the byte and mask of the rest
                const writeBits = (value >> (bits - i - wrote)) & mask;
                const destShift = 8 - bitOffset - wrote;
                // destination mask to zero all the bits we're changing first
                const destMask = ~(mask << destShift);
                this._view[byteOffset] = (this._view[byteOffset] & destMask) | (writeBits << destShift);
            }
            else {
                // create a mask with the correct bit width
                const mask = ~(0xff << wrote);
                // shift the bits we want to the start of the byte and mask of the rest
                const writeBits = value & mask;
                value >>= wrote;
                // destination mask to zero all the bits we're changing first
                const destMask = ~(mask << bitOffset);
                this._view[byteOffset] = (this._view[byteOffset] & destMask) | (writeBits << bitOffset);
            }
            offset += wrote;
            i += wrote;
        }
    }
    getBoolean(offset) {
        return this.getBits(offset, 1, false) !== 0;
    }
    getInt8(offset) {
        return this.getBits(offset, 8, true);
    }
    getUint8(offset) {
        return this.getBits(offset, 8, false);
    }
    getInt16(offset) {
        return this.getBits(offset, 16, true);
    }
    getUint16(offset) {
        return this.getBits(offset, 16, false);
    }
    getInt32(offset) {
        return this.getBits(offset, 32, true);
    }
    getUint32(offset) {
        return this.getBits(offset, 32, false);
    }
    getFloat32(offset) {
        this._scratch.setUint32(0, this.getUint32(offset));
        return this._scratch.getFloat32(0);
    }
    getFloat64(offset) {
        this._scratch.setUint32(0, this.getUint32(offset));
        // DataView offset is in bytes.
        this._scratch.setUint32(4, this.getUint32(offset + 32));
        return this._scratch.getFloat64(0);
    }
    setBoolean(offset, value) {
        this.setBits(offset, value ? 1 : 0, 1);
    }
    setInt8(offset, value) {
        this.setBits(offset, value, 8);
    }
    setUint8(offset, value) {
        this.setBits(offset, value, 8);
    }
    setInt16(offset, value) {
        this.setBits(offset, value, 16);
    }
    setUint16(offset, value) {
        this.setBits(offset, value, 16);
    }
    setInt32(offset, value) {
        this.setBits(offset, value, 32);
    }
    setUint32(offset, value) {
        this.setBits(offset, value, 32);
    }
    setFloat32(offset, value) {
        this._scratch.setFloat32(0, value);
        this.setBits(offset, this._scratch.getUint32(0), 32);
    }
    setFloat64(offset, value) {
        this._scratch.setFloat64(0, value);
        this.setBits(offset, this._scratch.getUint32(0), 32);
        this.setBits(offset + 32, this._scratch.getUint32(4), 32);
    }
    getArrayBuffer(offset, byteLength) {
        const buffer = new Uint8Array(byteLength);
        for (let i = 0; i < byteLength; ++i) {
            buffer[i] = this.getUint8(offset + i * 8);
        }
        return buffer;
    }
}
const stringToByteArray = (str) => {
    // https://gist.github.com/volodymyr-mykhailyk/2923227
    const b = [];
    for (let i = 0; i < str.length; ++i) {
        const unicode = str.charCodeAt(i);
        // 0x00000000 - 0x0000007f -> 0xxxxxxx
        if (unicode <= 0x7f) {
            b.push(unicode);
            // 0x00000080 - 0x000007ff -> 110xxxxx 10xxxxxx
        }
        else if (unicode <= 0x7ff) {
            b.push((unicode >> 6) | 0xc0);
            b.push((unicode & 0x3f) | 0x80);
            // 0x00000800 - 0x0000ffff -> 1110xxxx 10xxxxxx 10xxxxxx
        }
        else if (unicode <= 0xffff) {
            b.push((unicode >> 12) | 0xe0);
            b.push(((unicode >> 6) & 0x3f) | 0x80);
            b.push((unicode & 0x3f) | 0x80);
            // 0x00010000 - 0x001fffff -> 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
        }
        else {
            b.push((unicode >> 18) | 0xf0);
            b.push(((unicode >> 12) & 0x3f) | 0x80);
            b.push(((unicode >> 6) & 0x3f) | 0x80);
            b.push((unicode & 0x3f) | 0x80);
        }
    }
    return b;
};
/**
 * BitStream
 *
 * Small wrapper for a BitView to maintain your position,
 * as well as to handle reading / writing of string data
 * to the underlying buffer.
 */
export class BitStream {
    constructor(source, byteOffset, byteLength) {
        Object.defineProperty(this, "_view", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_index", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_startIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_length", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "readBoolean", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.reader('getBoolean', 1)
        });
        Object.defineProperty(this, "readInt8", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.reader('getInt8', 8)
        });
        Object.defineProperty(this, "readUint8", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.reader('getUint8', 8)
        });
        Object.defineProperty(this, "readInt16", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.reader('getInt16', 16)
        });
        Object.defineProperty(this, "readUint16", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.reader('getUint16', 16)
        });
        Object.defineProperty(this, "readInt32", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.reader('getInt32', 32)
        });
        Object.defineProperty(this, "readUint32", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.reader('getUint32', 32)
        });
        Object.defineProperty(this, "readFloat32", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.reader('getFloat32', 32)
        });
        Object.defineProperty(this, "readFloat64", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.reader('getFloat64', 64)
        });
        Object.defineProperty(this, "writeBoolean", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.writer('setBoolean', 1)
        });
        Object.defineProperty(this, "writeInt8", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.writer('setInt8', 8)
        });
        Object.defineProperty(this, "writeUint8", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.writer('setUint8', 8)
        });
        Object.defineProperty(this, "writeInt16", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.writer('setInt16', 16)
        });
        Object.defineProperty(this, "writeUint16", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.writer('setUint16', 16)
        });
        Object.defineProperty(this, "writeInt32", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.writer('setInt32', 32)
        });
        Object.defineProperty(this, "writeUint32", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.writer('setUint32', 32)
        });
        Object.defineProperty(this, "writeFloat32", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.writer('setFloat32', 32)
        });
        Object.defineProperty(this, "writeFloat64", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.writer('setFloat64', 64)
        });
        const isBuffer = source instanceof ArrayBuffer;
        if (!(source instanceof BitView) && !isBuffer) {
            throw new Error('Must specify a valid BitView or ArrayBuffer');
        }
        if (isBuffer) {
            this._view = new BitView(source, byteOffset, byteLength);
        }
        else {
            this._view = source;
        }
        this._index = 0;
        this._startIndex = 0;
        this._length = this._view.byteLength * 8;
    }
    get offset() {
        return this._index;
    }
    get index() {
        return this._index - this._startIndex;
    }
    set index(val) {
        this._index = val + this._startIndex;
    }
    get length() {
        return this._length - this._startIndex;
    }
    set length(val) {
        this._length = val + this._startIndex;
    }
    get bitsLeft() {
        return this._length - this._index;
    }
    // Ceil the returned value, over compensating for the amount of
    // bits written to the stream.
    get byteIndex() {
        return Math.ceil(this._index / 8);
    }
    set byteIndex(val) {
        this._index = val * 8;
    }
    get buffer() {
        return this._view.buffer;
    }
    get view() {
        return this._view;
    }
    get bigEndian() {
        return this._view.bigEndian;
    }
    set bigEndian(val) {
        this._view.bigEndian = val;
    }
    reader(name, size) {
        return () => {
            if (this._index + size > this._length) {
                throw new Error('Trying to read past the end of the stream');
            }
            const val = this._view[name](this._index);
            this._index += size;
            return val;
        };
    }
    writer(name, size) {
        return (value) => {
            this._view[name](this._index, value);
            this._index += size;
        };
    }
    readString(bytes, utf8) {
        if (bytes === 0) {
            return '';
        }
        let i = 0;
        const chars = [];
        let append = true;
        const fixedLength = !!bytes;
        if (!bytes) {
            bytes = Math.floor((this._length - this._index) / 8);
        }
        // Read while we still have space available, or until we've
        // hit the fixed byte length passed in.
        while (i < bytes) {
            const c = this.readUint8();
            // Stop appending chars once we hit 0x00
            if (c === 0x00) {
                append = false;
                // If we don't have a fixed length to read, break out now.
                if (!fixedLength) {
                    break;
                }
            }
            if (append) {
                chars.push(c);
            }
            ++i;
        }
        const string = String.fromCharCode.apply(null, chars);
        if (utf8) {
            try {
                return decodeURIComponent(escape(string)); // https://stackoverflow.com/a/17192845
            }
            catch (_e) {
                return string;
            }
        }
        else {
            return string;
        }
    }
    readBits(bits, signed) {
        const val = this._view.getBits(this._index, bits, signed);
        this._index += bits;
        return val;
    }
    peakBits(offset, bits, signed) {
        const val = this._view.getBits(offset, bits, signed);
        return val;
    }
    writeBits(value, bits) {
        this._view.setBits(this._index, value, bits);
        this._index += bits;
    }
    readASCIIString(bytes) {
        return this.readString(bytes, false);
    }
    readUTF8String(bytes) {
        return this.readString(bytes, true);
    }
    writeASCIIString(string, bytes) {
        const length = bytes || string.length + 1; // + 1 for NULL
        for (let i = 0; i < length; ++i) {
            this.writeUint8(i < string.length ? string.charCodeAt(i) : 0x00);
        }
    }
    writeUTF8String(string, bytes) {
        const byteArray = stringToByteArray(string);
        const length = bytes || byteArray.length + 1; // + 1 for NULL
        for (let i = 0; i < length; ++i) {
            this.writeUint8(i < byteArray.length ? byteArray[i] : 0x00);
        }
    }
    readBitStream(bitLength) {
        const slice = new BitStream(this._view);
        slice._startIndex = this._index;
        slice._index = this._index;
        slice.length = bitLength;
        this._index += bitLength;
        return slice;
    }
    writeBitStream(stream, length) {
        if (!length) {
            length = stream.bitsLeft;
        }
        let bitsToWrite = 0;
        while (length > 0) {
            bitsToWrite = Math.min(length, 32);
            this.writeBits(stream.readBits(bitsToWrite, false), bitsToWrite);
            length -= bitsToWrite;
        }
    }
    readArrayBuffer(byteLength) {
        const buffer = this._view.getArrayBuffer(this._index, byteLength);
        this._index += byteLength * 8;
        return buffer;
    }
    writeArrayBuffer(buffer, byteLength) {
        this.writeBitStream(new BitStream(buffer), byteLength * 8);
    }
}
