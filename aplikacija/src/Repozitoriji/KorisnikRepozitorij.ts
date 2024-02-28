import { Injectable } from '@nestjs/common/decorators';
import { Korisnik } from 'src/Entiteti/KorisnikEntitet';
import { Repository } from 'typeorm';

@Injectable()
export class KorisnikRepozitorij extends Repository<Korisnik>{ }