// package: holdem.pb
// file: protobuf/holdem/recv_g_room_change_notify.proto

import * as jspb from "google-protobuf";
import * as protobuf_holdem_define_pb from "../../protobuf/holdem/define_pb";

export class ServerMessageRoomChangeNotify extends jspb.Message {
  hasRoom(): boolean;
  clearRoom(): void;
  getRoom(): protobuf_holdem_define_pb.RoomRecord | undefined;
  setRoom(value?: protobuf_holdem_define_pb.RoomRecord): void;

  getSendTimestamp(): number;
  setSendTimestamp(value: number): void;

  hasRoomChange(): boolean;
  clearRoomChange(): void;
  getRoomChange(): protobuf_holdem_define_pb.RoomChange | undefined;
  setRoomChange(value?: protobuf_holdem_define_pb.RoomChange): void;

  getChangeType(): number;
  setChangeType(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerMessageRoomChangeNotify.AsObject;
  static toObject(includeInstance: boolean, msg: ServerMessageRoomChangeNotify): ServerMessageRoomChangeNotify.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerMessageRoomChangeNotify, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerMessageRoomChangeNotify;
  static deserializeBinaryFromReader(message: ServerMessageRoomChangeNotify, reader: jspb.BinaryReader): ServerMessageRoomChangeNotify;
}

export namespace ServerMessageRoomChangeNotify {
  export type AsObject = {
    room?: protobuf_holdem_define_pb.RoomRecord.AsObject,
    sendTimestamp: number,
    roomChange?: protobuf_holdem_define_pb.RoomChange.AsObject,
    changeType: number,
  }
}

