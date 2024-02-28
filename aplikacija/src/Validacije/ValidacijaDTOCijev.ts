import { PipeTransform, Injectable, ArgumentMetadata, HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ApiOdgovor } from './HttpOdgovor';
import { PrilagodenaValidacijskaPogreska } from 'src/Pogreske/Pogreske';

@Injectable()
export class ValidacijaDTOCijev implements PipeTransform<any>{
    async transform(value: any, { metatype }: ArgumentMetadata) {
        if (!metatype || !this.potvrditi(metatype)) {
            return value;
        }
        const object = plainToClass(metatype, value);
        const greskeNestjs = await Promise.all(await validate(object));
        if (greskeNestjs.length > 0) {
            const greske = PrilagodenaValidacijskaPogreska.mapirajPrilagodenuGresku(greskeNestjs);
            const apiOdgovor = new ApiOdgovor('Zahtjev je neuspješan', undefined, greske)
            apiOdgovor.statusniKod = HttpStatus.UNPROCESSABLE_ENTITY
            throw new UnprocessableEntityException(apiOdgovor);
        }

        return value;
    }

    private potvrditi(metatype: Function): boolean {
        const types: Function[] = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }
}