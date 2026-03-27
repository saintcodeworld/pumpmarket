declare module 'crypto-js' {
  export interface CipherParams {
    ciphertext: any;
    key: any;
    iv: any;
    salt: any;
    algorithm: any;
    mode: any;
    padding: any;
    blockSize: any;
    formatter: any;
  }

  export interface WordArray {
    words: number[];
    sigBytes: number;
    clone(): WordArray;
    toString(encoder?: any): string;
    concat(wordArray: WordArray): WordArray;
  }

  export interface WordArrayStatic extends WordArray {
    random(nBytes: number): WordArray;
  }

  export interface Hash {
    reset(): Hash;
    update(messageUpdate: WordArray | string): Hash;
    finalize(messageUpdate?: WordArray | string): WordArray;
  }

  export interface Cipher {
    encrypt(message: WordArray | string, key: WordArray | string, cfg?: any): CipherParams;
    decrypt(ciphertext: CipherParams | string, key: WordArray | string, cfg?: any): WordArray;
  }

  export interface BlockCipher extends Cipher {
    blockSize: number;
    _doReset(): void;
    _doProcessBlock(words: number[], offset: number): void;
    _doFinalBlock(): void;
  }

  export interface StreamCipher extends Cipher {}

  export const AES: {
    encrypt(message: WordArray | string, key: WordArray | string, cfg?: any): CipherParams;
    decrypt(ciphertext: CipherParams | string, key: WordArray | string, cfg?: any): WordArray;
  };

  export const SHA256: {
    (message: WordArray | string): WordArray;
    hash(message: WordArray | string): WordArray;
  };

  export const SHA512: {
    hash(message: WordArray | string): WordArray;
  };

  export const MD5: {
    hash(message: WordArray | string): WordArray;
  };

  export const HmacSHA256: {
    hash(message: WordArray | string, key: WordArray | string): WordArray;
  };

  export const HmacSHA512: {
    hash(message: WordArray | string, key: WordArray | string): WordArray;
  };

  export const enc: {
    Hex: {
      stringify(wordArray: WordArray): string;
      parse(hexStr: string): WordArray;
    };
    Utf8: {
      stringify(wordArray: WordArray): string;
      parse(utf8Str: string): WordArray;
    };
    Base64: {
      stringify(wordArray: WordArray): string;
      parse(base64Str: string): WordArray;
    };
    Latin1: {
      stringify(wordArray: WordArray): string;
      parse(latin1Str: string): WordArray;
    };
    Utf16: {
      stringify(wordArray: WordArray): string;
      parse(utf16Str: string): WordArray;
    };
    Utf16LE: {
      stringify(wordArray: WordArray): string;
      parse(utf16LEStr: string): WordArray;
    };
  };

  export const lib: {
    WordArray: WordArrayStatic;
    CipherParams: CipherParams;
    Cipher: Cipher;
    BlockCipher: BlockCipher;
    StreamCipher: StreamCipher;
    Hash: Hash;
  };

  export const mode: {
    CBC: any;
    CFB: any;
    CTR: any;
    ECB: any;
    OFB: any;
  };

  export const pad: {
    Pkcs7: any;
    AnsiX923: any;
    Iso10126: any;
    Iso97971: any;
    ZeroPadding: any;
    NoPadding: any;
  };

  export const format: {
    OpenSSL: any;
    Hex: any;
    Base64: any;
  };

  export const algo: {
    AES: any;
    DES: any;
    TripleDES: any;
    Rabbit: any;
    RC4: any;
    RC4Drop: any;
  };

  export const kdf: {
    OpenSSL: any;
    EvpKDF: any;
  };

  export const x64: {
    Word: any;
    WordArray: any;
  };

  export default {
    AES,
    SHA256,
    SHA512,
    MD5,
    HmacSHA256,
    HmacSHA512,
    enc,
    lib,
    mode,
    pad,
    format,
    algo,
    kdf,
    x64
  };
}
