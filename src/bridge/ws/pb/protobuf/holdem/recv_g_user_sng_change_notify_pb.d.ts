// package: holdem.pb
// file: protobuf/holdem/recv_g_user_sng_change_notify.proto

import * as jspb from "google-protobuf";
import * as protobuf_holdem_define_pb from "../../protobuf/holdem/define_pb";

export class ServerMessageUserSngChangeNotify extends jspb.Message {
  hasSng(): boolean;
  clearSng(): void;
  getSng(): protobuf_holdem_define_pb.UserSNGRecord | undefined;
  setSng(value?: protobuf_holdem_define_pb.UserSNGRecord): void;

  getSendTimestamp(): number;
  setSendTimestamp(value: number): void;

  hasSngChange(): boolean;
  clearSngChange(): void;
  getSngChange(): protobuf_holdem_define_pb.UserSNGRecordChange | undefined;
  setSngChange(value?: protobuf_holdem_define_pb.UserSNGRecordChange): void;

  getChangeType(): number;
  setChangeType(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerMessageUserSngChangeNotify.AsObject;
  static toObject(includeInstance: boolean, msg: ServerMessageUserSngChangeNotify): ServerMessageUserSngChangeNotify.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerMessageUserSngChangeNotify, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerMessageUserSngChangeNotify;
  static deserializeBinaryFromReader(message: ServerMessageUserSngChangeNotify, reader: jspb.BinaryReader): ServerMessageUserSngChangeNotify;
}

export namespace ServerMessageUserSngChangeNotify {
  export type AsObject = {
    sng?: protobuf_holdem_define_pb.UserSNGRecord.AsObject,
    sendTimestamp: number,
    sngChange?: protobuf_holdem_define_pb.UserSNGRecordChange.AsObject,
    changeType: number,
  }
}

