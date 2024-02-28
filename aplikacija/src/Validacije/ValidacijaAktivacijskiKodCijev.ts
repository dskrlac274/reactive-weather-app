import { Injectable, PipeTransform, ArgumentMetadata, UnprocessableEntityException } from '@nestjs/common';
import { PogreskaPredlozak, PrilagodenaValidacijskaPogreska } from 'src/Pogreske/Pogreske';
import { AKTIVACIJSKI_KOD_NESIPRAVAN_FORMAT, ZAHTJEV_JE_NEUSPJESAN } from 'src/Pogreske/PorukeKonstante';
import { ApiOdgovor } from './HttpOdgovor';

@Injectable()
export class ValidacijaAktivacijskiKod implements PipeTransform {
    transform(vrijednost: any, metadata: ArgumentMetadata) {
        const {data} = metadata;
        const aktivacijskiKodBroj = parseInt(vrijednost);

        if (!/\d{5,}/.test(vrijednost) || isNaN(aktivacijskiKodBroj) || data != 'token') {
            const greska = new PogreskaPredlozak('aktivacijski_kod', AKTIVACIJSKI_KOD_NESIPRAVAN_FORMAT);
            const greske = PrilagodenaValidacijskaPogreska.kreirajPrilagodenuGresku([greska]);

            throw new UnprocessableEntityException(new ApiOdgovor(ZAHTJEV_JE_NEUSPJESAN, undefined, greske));
        }
        return vrijednost;
    }
}