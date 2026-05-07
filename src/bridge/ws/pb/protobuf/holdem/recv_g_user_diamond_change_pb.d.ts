// package: holdem.pb
// file: protobuf/holdem/recv_g_user_diamond_change.proto

import * as jspb from "google-protobuf";

export class ServerMessageUserDiamondChange extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): void;

  getDiamonds(): number;
  setDiamonds(value: number): void;

  getDiamondsLock(): number;
  setDiamondsLock(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerMessageUserDiamondChange.AsObject;
  static toObject(includeInstance: boolean, msg: ServerMessageUserDiamondChange): ServerMessageUserDiamondChange.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerMessageUserDiamondChange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerMessageUserDiamondChange;
  static deserializeBinaryFromReader(message: ServerMessageUserDiamondChange, reader: jspb.BinaryReader): ServerMessageUserDiamondChange;
}

export namespace ServerMessageUserDiamondChange {
  export type AsObject = {
    userId: number,
    diamonds: number,
    diamondsLock: number,
  }
}

