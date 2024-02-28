import { Injectable, PipeTransform, ArgumentMetadata, UnprocessableEntityException } from '@nestjs/common';
import { PogreskaPredlozak, PrilagodenaValidacijskaPogreska } from 'src/Pogreske/Pogreske';
import { API_KLJUC_NESIPRAVAN, ZAHTJEV_JE_NEUSPJESAN } from 'src/Pogreske/PorukeKonstante';
import { ApiOdgovor } from './HttpOdgovor';

@Injectable()
export class ValidacijaApiKljuc implements PipeTransform {
    transform(vrijednost: any, metadata: ArgumentMetadata) {
        const { data } = metadata;
        
        if (data != 'apiKljuc' || vrijednost.length != 64) {
            const greska = new PogreskaPredlozak('aktivacijski_kod', API_KLJUC_NESIPRAVAN);
            const greske = PrilagodenaValidacijskaPogreska.kreirajPrilagodenuGresku([greska]);

            throw new UnprocessableEntityException(new ApiOdgovor(ZAHTJEV_JE_NEUSPJESAN, undefined, greske));
        }
        return vrijednost;
    }
}