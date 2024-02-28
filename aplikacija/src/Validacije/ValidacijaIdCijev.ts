import { Injectable, PipeTransform, ArgumentMetadata, UnprocessableEntityException } from '@nestjs/common';
import { PogreskaPredlozak, PrilagodenaValidacijskaPogreska } from 'src/Pogreske/Pogreske';
import { KORISNIK_ID_NEISPRAVAN_FORMAT, ZAHTJEV_JE_NEUSPJESAN } from 'src/Pogreske/PorukeKonstante';
import { ApiOdgovor } from './HttpOdgovor';

@Injectable()
export class ValidacijaIdCijev implements PipeTransform {
    transform(vrijednost: any, _: ArgumentMetadata) {
        const korisnikId = parseInt(vrijednost);

        if (!/^[0-9]+$/.test(vrijednost) || isNaN(korisnikId)) {
            const greska = new PogreskaPredlozak('id', KORISNIK_ID_NEISPRAVAN_FORMAT);
            const greske = PrilagodenaValidacijskaPogreska.kreirajPrilagodenuGresku([greska]);
            const odg = new ApiOdgovor(ZAHTJEV_JE_NEUSPJESAN, undefined, greske);

            throw new UnprocessableEntityException(odg);
        }
        return vrijednost;
    }
}