import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebUtičnicaPistupnik } from 'src/Servisi/WebUtičnicaPristupnik';
import { WebUtičnicaServis } from 'src/Servisi/WebUtičnicaServis';
import { FoiLokacijePodaci, FoiLokacijePodaciShema } from 'src/Sheme/FoiLokacijePodaciShema';
import { FoiPodaciModul } from './FoiPodaciModul';
import { KorisnikModul } from './KorisnikModul';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: FoiLokacijePodaci.name, schema: FoiLokacijePodaciShema }]),
        FoiPodaciModul,
        KorisnikModul,
    ],
    providers: [WebUtičnicaServis, WebUtičnicaPistupnik],
    exports: [WebUtičnicaServis],
})
export class WebUtičnicaModul { }