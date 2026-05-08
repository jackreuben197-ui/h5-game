// package: holdem.pb
// file: protobuf/holdem/recv_g_user_gold_change.proto

import * as jspb from "google-protobuf";

export class ServerMessageUserGoldChange extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): void;

  getGold(): number;
  setGold(value: number): void;

  getGoldLock(): number;
  setGoldLock(value: number): void;

  getClubId(): number;
  setClubId(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerMessageUserGoldChange.AsObject;
  static toObject(includeInstance: boolean, msg: ServerMessageUserGoldChange): ServerMessageUserGoldChange.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerMessageUserGoldChange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerMessageUserGoldChange;
  static deserializeBinaryFromReader(message: ServerMessageUserGoldChange, reader: jspb.BinaryReader): ServerMessageUserGoldChange;
}

export namespace ServerMessageUserGoldChange {
  export type AsObject = {
    userId: number,
    gold: number,
    goldLock: number,
    clubId: number,
  }
}

