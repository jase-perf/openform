import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { numericEnumValues } from '@utils'

export enum AttachmentStatusEnum {
  PUBLIC = 1,
  DELETED
}

export interface AttachmentFile {
  filename: string
  url: string
  size: number
}

@Schema()
export class AttachmentModel extends Document {
  @Prop({ required: true, index: true })
  formId: string

  @Prop({ required: true })
  filename: string

  @Prop({ required: true })
  url: string

  @Prop({ required: true })
  size: number

  @Prop({
    type: Number,
    required: true,
    enum: numericEnumValues(AttachmentStatusEnum),
    default: AttachmentStatusEnum.PUBLIC
  })
  status: AttachmentStatusEnum
}

export const AttachmentSchema = SchemaFactory.createForClass(AttachmentModel)
