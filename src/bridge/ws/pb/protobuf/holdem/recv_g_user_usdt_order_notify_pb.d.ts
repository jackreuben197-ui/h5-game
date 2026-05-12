// package: holdem.pb
// file: protobuf/holdem/recv_g_user_usdt_order_notify.proto

import * as jspb from "google-protobuf";

export class ServerMessageUserUsdtOrderNotify extends jspb.Message {
  getOrderNo(): string;
  setOrderNo(value: string): void;

  getStatus(): number;
  setStatus(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerMessageUserUsdtOrderNotify.AsObject;
  static toObject(includeInstance: boolean, msg: ServerMessageUserUsdtOrderNotify): ServerMessageUserUsdtOrderNotify.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerMessageUserUsdtOrderNotify, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerMessageUserUsdtOrderNotify;
  static deserializeBinaryFromReader(message: ServerMessageUserUsdtOrderNotify, reader: jspb.BinaryReader): ServerMessageUserUsdtOrderNotify;
}

export namespace ServerMessageUserUsdtOrderNotify {
  export type AsObject = {
    orderNo: string,
    status: number,
  }
}

