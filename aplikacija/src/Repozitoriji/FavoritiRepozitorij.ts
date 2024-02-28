import { Injectable } from '@nestjs/common/decorators';
import { Favoriti } from 'src/Entiteti/FavoritiEntitet';
import { Repository } from 'typeorm';

@Injectable()
export class FavoritiRepozitorij extends Repository<Favoriti>{ }