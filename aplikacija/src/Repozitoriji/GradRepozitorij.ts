import { Injectable } from '@nestjs/common/decorators';
import { Grad } from 'src/Entiteti/GradEntitet';
import { Repository } from 'typeorm';

@Injectable()
export class GradRepozitorij extends Repository<Grad>{ }