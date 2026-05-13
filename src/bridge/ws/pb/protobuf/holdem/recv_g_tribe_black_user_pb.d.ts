// package: holdem.pb
// file: protobuf/holdem/recv_g_tribe_black_user.proto

import * as jspb from "google-protobuf";

export class ServerMessageTribeBlackUser extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getUserId(): number;
  setUserId(value: number): void;

  getUserRandomId(): number;
  setUserRandomId(value: number): void;

  getUserName(): string;
  setUserName(value: string): void;

  getUserAvatar(): string;
  setUserAvatar(value: string): void;

  getTribeId(): number;
  setTribeId(value: number): void;

  getStatus(): number;
  setStatus(value: number): void;

  getReason(): string;
  setReason(value: string): void;

  getPublicReason(): string;
  setPublicReason(value: string): void;

  getJoinStatus(): number;
  setJoinStatus(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerMessageTribeBlackUser.AsObject;
  static toObject(includeInstance: boolean, msg: ServerMessageTribeBlackUser): ServerMessageTribeBlackUser.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerMessageTribeBlackUser, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerMessageTribeBlackUser;
  static deserializeBinaryFromReader(message: ServerMessageTribeBlackUser, reader: jspb.BinaryReader): ServerMessageTribeBlackUser;
}

export namespace ServerMessageTribeBlackUser {
  export type AsObject = {
    id: number,
    userId: number,
    userRandomId: number,
    userName: string,
    userAvatar: string,
    tribeId: number,
    status: number,
    reason: string,
    publicReason: string,
    joinStatus: number,
  }
}

