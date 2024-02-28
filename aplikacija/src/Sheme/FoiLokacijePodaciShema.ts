import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FoiLokacijePodaciDocument = HydratedDocument<FoiLokacijePodaci>;

@Schema({collection: "foi_lokacije_podaci"})
export class FoiLokacijePodaci {
  @Prop({type: Types.ObjectId, ref: "foi_lokacije",required: true})
  lokacija: FoiLokacijePodaciDocument;

  @Prop({name: "vrijeme_mjerenja", required: true})
  vrijemeMjerenja: Date;

  @Prop({required: true})
  temperatura: string;

  @Prop({required: true})
  tlak: string;

  @Prop({required: true})
  vlaga: string;
}

export const FoiLokacijePodaciShema = SchemaFactory.createForClass(FoiLokacijePodaci);