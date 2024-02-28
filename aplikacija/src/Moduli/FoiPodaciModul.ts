import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FoiPodaciKontroler } from 'src/Kontroleri/FoiPodaciKontroler';
import { FoiPodaciServis } from 'src/Servisi/FoiPodaciServis';
import { FoiLokacije, FoiLokacijeShema } from 'src/Sheme/FoiLokacijeShema';
import { FoiLokacijePodaci, FoiLokacijePodaciShema } from 'src/Sheme/FoiLokacijePodaciShema';
import { KorisnikModul } from './KorisnikModul';

@Module({
  imports: [MongooseModule.forFeature([{ name: FoiLokacije.name, schema: FoiLokacijeShema },
  { name: FoiLokacijePodaci.name, schema: FoiLokacijePodaciShema }]), KorisnikModul],
  controllers: [FoiPodaciKontroler],
  providers: [FoiPodaciServis],
  exports: [FoiPodaciServis]
})
export class FoiPodaciModul { }