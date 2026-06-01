// package: holdem.pb
// file: protobuf/holdem/recv_g_support_message.proto

import * as jspb from "google-protobuf";

export class ServerMessageSupportMessage extends jspb.Message {
  getChannel(): string;
  setChannel(value: string): void;

  getClubId(): number;
  setClubId(value: number): void;

  getUserId(): number;
  setUserId(value: number): void;

  getMsgType(): number;
  setMsgType(value: number): void;

  getText(): string;
  setText(value: string): void;

  getUrl(): string;
  setUrl(value: string): void;

  getFileName(): string;
  setFileName(value: string): void;

  getFileSize(): number;
  setFileSize(value: number): void;

  getThumbUrl(): string;
  setThumbUrl(value: string): void;

  getDuration(): number;
  setDuration(value: number): void;

  getLocalTime(): number;
  setLocalTime(value: number): void;

  getTimeToken(): number;
  setTimeToken(value: number): void;

  getUserSend(): boolean;
  setUserSend(value: boolean): void;

  getSupportUserId(): number;
  setSupportUserId(value: number): void;

  getImServiceType(): number;
  setImServiceType(value: number): void;

  getTribeId(): number;
  setTribeId(value: number): void;

  getSubType(): number;
  setSubType(value: number): void;

  getExtra(): string;
  setExtra(value: string): void;

  getSeq(): number;
  setSeq(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ServerMessageSupportMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ServerMessageSupportMessage): ServerMessageSupportMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ServerMessageSupportMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ServerMessageSupportMessage;
  static deserializeBinaryFromReader(message: ServerMessageSupportMessage, reader: jspb.BinaryReader): ServerMessageSupportMessage;
}

export namespace ServerMessageSupportMessage {
  export type AsObject = {
    channel: string,
    clubId: number,
    userId: number,
    msgType: number,
    text: string,
    url: string,
    fileName: string,
    fileSize: number,
    thumbUrl: string,
    duration: number,
    localTime: number,
    timeToken: number,
    userSend: boolean,
    supportUserId: number,
    imServiceType: number,
    tribeId: number,
    subType: number,
    extra: string,
    seq: number,
  }
}

