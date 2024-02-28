import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FoiLokacijeDocument = HydratedDocument<FoiLokacije>;

@Schema({collection: "foi_lokacije"})
export class FoiLokacije {
  @Prop({required: true})
  naziv: string;
}

export const FoiLokacijeShema = SchemaFactory.createForClass(FoiLokacije);