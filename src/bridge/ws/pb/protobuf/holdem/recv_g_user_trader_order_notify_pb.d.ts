// package: holdem.pb
// file: protobuf/holdem/recv_g_user_trader_order_notify.proto

import * as jspb from "google-protobuf";

export class ServerMessageUserTraderOrderNotify extends jspb.Message {
  getOrderNo(): string;
  setOrderNo(value: string): void;

  getStatus(): number;
  setStatus(value: number): void;

  getRejectReason(): string;
  setRejectReason(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerMessageUserTraderOrderNotify.AsObject;
  static toObject(includeInstance: boolean, msg: ServerMessageUserTraderOrderNotify): ServerMessageUserTraderOrderNotify.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerMessageUserTraderOrderNotify, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerMessageUserTraderOrderNotify;
  static deserializeBinaryFromReader(message: ServerMessageUserTraderOrderNotify, reader: jspb.BinaryReader): ServerMessageUserTraderOrderNotify;
}

export namespace ServerMessageUserTraderOrderNotify {
  export type AsObject = {
    orderNo: string,
    status: number,
    rejectReason: string,
  }
}

