declare module 'tweetnacl' {
  export namespace sign {
    export function detached(message: Uint8Array, secretKey: Uint8Array): Uint8Array;
  }
}