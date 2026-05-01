// package: holdem.pb
// file: protobuf/holdem/recv_g_user_mtt_change_notify.proto

import * as jspb from "google-protobuf";
import * as protobuf_holdem_define_pb from "../../protobuf/holdem/define_pb";

export class ServerMessageUserMttChangeNotify extends jspb.Message {
  hasMtt(): boolean;
  clearMtt(): void;
  getMtt(): protobuf_holdem_define_pb.UserMttRecord | undefined;
  setMtt(value?: protobuf_holdem_define_pb.UserMttRecord): void;

  getSendTimestamp(): number;
  setSendTimestamp(value: number): void;

  hasMttChange(): boolean;
  clearMttChange(): void;
  getMttChange(): protobuf_holdem_define_pb.UserMttRecordChange | undefined;
  setMttChange(value?: protobuf_holdem_define_pb.UserMttRecordChange): void;

  getChangeType(): number;
  setChangeType(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerMessageUserMttChangeNotify.AsObject;
  static toObject(includeInstance: boolean, msg: ServerMessageUserMttChangeNotify): ServerMessageUserMttChangeNotify.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerMessageUserMttChangeNotify, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerMessageUserMttChangeNotify;
  static deserializeBinaryFromReader(message: ServerMessageUserMttChangeNotify, reader: jspb.BinaryReader): ServerMessageUserMttChangeNotify;
}

export namespace ServerMessageUserMttChangeNotify {
  export type AsObject = {
    mtt?: protobuf_holdem_define_pb.UserMttRecord.AsObject,
    sendTimestamp: number,
    mttChange?: protobuf_holdem_define_pb.UserMttRecordChange.AsObject,
    changeType: number,
  }
}

