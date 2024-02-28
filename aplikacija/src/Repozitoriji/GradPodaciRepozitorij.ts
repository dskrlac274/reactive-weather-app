import { Injectable } from '@nestjs/common/decorators';
import { GradPodaci } from 'src/Entiteti/GradPodaciEntitet';
import { Repository } from 'typeorm';

@Injectable()
export class GradPodaciRepozitorij extends Repository<GradPodaci>{ }