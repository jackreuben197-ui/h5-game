// package: holdem.pb
// file: protobuf/holdem/recv_g_mtt_series_notify.proto

import * as jspb from "google-protobuf";
import * as protobuf_holdem_define_pb from "../../protobuf/holdem/define_pb";

export class ServerMessageMttSeriesNotify extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getName(): string;
  setName(value: string): void;

  getType(): protobuf_holdem_define_pb.Def.SeriesListTypeMap[keyof protobuf_holdem_define_pb.Def.SeriesListTypeMap];
  setType(value: protobuf_holdem_define_pb.Def.SeriesListTypeMap[keyof protobuf_holdem_define_pb.Def.SeriesListTypeMap]): void;

  getTribeId(): number;
  setTribeId(value: number): void;

  getCreateTime(): number;
  setCreateTime(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerMessageMttSeriesNotify.AsObject;
  static toObject(includeInstance: boolean, msg: ServerMessageMttSeriesNotify): ServerMessageMttSeriesNotify.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerMessageMttSeriesNotify, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerMessageMttSeriesNotify;
  static deserializeBinaryFromReader(message: ServerMessageMttSeriesNotify, reader: jspb.BinaryReader): ServerMessageMttSeriesNotify;
}

export namespace ServerMessageMttSeriesNotify {
  export type AsObject = {
    id: number,
    name: string,
    type: protobuf_holdem_define_pb.Def.SeriesListTypeMap[keyof protobuf_holdem_define_pb.Def.SeriesListTypeMap],
    tribeId: number,
    createTime: number,
  }
}

