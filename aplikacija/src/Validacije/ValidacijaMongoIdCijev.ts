import { Injectable, PipeTransform, ArgumentMetadata, UnprocessableEntityException } from '@nestjs/common';
import { PogreskaPredlozak, PrilagodenaValidacijskaPogreska } from 'src/Pogreske/Pogreske';
import { ID_NEISPRAVAN_FORMAT, ZAHTJEV_JE_NEUSPJESAN } from 'src/Pogreske/PorukeKonstante';
import { ApiOdgovor } from './HttpOdgovor';

@Injectable()
export class ValidacijaMongoIdCijev implements PipeTransform {
    transform(vrijednost: any, _: ArgumentMetadata) {
        if (vrijednost.length != 24 || /[^0-9a-f]/.test(vrijednost)) {
            const greska = new PogreskaPredlozak('id', ID_NEISPRAVAN_FORMAT);
            const greske = PrilagodenaValidacijskaPogreska.kreirajPrilagodenuGresku([greska]);

            throw new UnprocessableEntityException(new ApiOdgovor(ZAHTJEV_JE_NEUSPJESAN, undefined, greske));
        }
        return vrijednost;
    }
}