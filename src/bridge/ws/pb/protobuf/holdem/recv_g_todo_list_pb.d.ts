// package: holdem.pb
// file: protobuf/holdem/recv_g_todo_list.proto

import * as jspb from "google-protobuf";

export class ServerMessageTodoList extends jspb.Message {
  getNum(): number;
  setNum(value: number): void;

  getType(): number;
  setType(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerMessageTodoList.AsObject;
  static toObject(includeInstance: boolean, msg: ServerMessageTodoList): ServerMessageTodoList.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerMessageTodoList, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerMessageTodoList;
  static deserializeBinaryFromReader(message: ServerMessageTodoList, reader: jspb.BinaryReader): ServerMessageTodoList;
}

export namespace ServerMessageTodoList {
  export type AsObject = {
    num: number,
    type: number,
  }
}

