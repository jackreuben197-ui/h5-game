// package: holdem.pb
// file: protobuf/holdem/recv_g_user_order_audit.proto

import * as jspb from "google-protobuf";

export class ServerMessageUserOrderAudit extends jspb.Message {
  getOrderNo(): string;
  setOrderNo(value: string): void;

  getStatus(): number;
  setStatus(value: number): void;

  getOrderCategory(): number;
  setOrderCategory(value: number): void;

  getOrderType(): number;
  setOrderType(value: number): void;

  getCloseChat(): boolean;
  setCloseChat(value: boolean): void;

  getDelay(): number;
  setDelay(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerMessageUserOrderAudit.AsObject;
  static toObject(includeInstance: boolean, msg: ServerMessageUserOrderAudit): ServerMessageUserOrderAudit.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerMessageUserOrderAudit, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerMessageUserOrderAudit;
  static deserializeBinaryFromReader(message: ServerMessageUserOrderAudit, reader: jspb.BinaryReader): ServerMessageUserOrderAudit;
}

export namespace ServerMessageUserOrderAudit {
  export type AsObject = {
    orderNo: string,
    status: number,
    orderCategory: number,
    orderType: number,
    closeChat: boolean,
    delay: number,
  }
}

