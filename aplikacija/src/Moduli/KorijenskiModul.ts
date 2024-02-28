import { Module } from '@nestjs/common';
import { BazaPodatakaModul } from './BazaPodatakaModul';
import { KorisnikModul } from './KorisnikModul';
import { MongoBazaPodatakaModul } from './MongoBazaPodatakaModul';
import { FoiPodaciModul } from './FoiPodaciModul';
import { WebUtičnicaModul } from './WebUtičnicaModul';
import { PoglediKontroler } from 'src/Kontroleri/PoglediKontroler';
import { GradPodaciModul } from './GradPodaciModul';

@Module({
  imports: [BazaPodatakaModul, MongoBazaPodatakaModul, KorisnikModul, WebUtičnicaModul, FoiPodaciModul, GradPodaciModul],
  controllers: [PoglediKontroler],
  providers: [
    /*{
    provide: APP_PIPE,
    useClass: ValidacijaDTOCijev,
  }*/],
})
export class KorijenskiModul { }
