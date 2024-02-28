import { OmitType } from '@nestjs/mapped-types';
import { KorisnikRegistracijaDTO } from './KorisnikRegistracijaDTO';

export class KorisnikPrijavaDTO extends OmitType(
    KorisnikRegistracijaDTO, ['adresa', 'email', 'ime', 'prezime']
) { }