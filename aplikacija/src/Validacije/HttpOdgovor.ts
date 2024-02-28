import { ValidationError } from 'class-validator';
import { HttpStatus } from '@nestjs/common';

export class ApiOdgovor {
    private poruka: any;
    private podaci?: any;
    private greske: ValidationError[];
    statusniKod: HttpStatus;

    constructor(poruka: any, podaci?: any, greske?: ValidationError[]) {
        this.poruka = poruka;
        this.podaci = podaci;
        this.greske = greske;
    }
}