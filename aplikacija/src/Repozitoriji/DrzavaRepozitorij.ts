import { Injectable } from '@nestjs/common/decorators';
import { Drzava } from 'src/Entiteti/DrzavaEntitet';
import { Repository } from 'typeorm';

@Injectable()
export class DrzavaRepozitorij extends Repository<Drzava>{ }