import { IsString, IsNotEmpty, MaxLength, IsDefined } from 'class-validator';

export class LokacijaDTO {

    @IsDefined({ message: "Lokacija je obavezna." })
    @IsString({ message: "Lokacija nije u ispravnom formatu." })
    @MaxLength(50, { message: "Najveći dopušteni broj znakova za lokaciju je 50." })
    @IsNotEmpty({ message: "Molim Vas unesite lokaciju." })
    lokacija: string;
}

export class LokacijeArrayDTO {

    @IsDefined({ message: "Lokacije su obavezne." })
    @IsNotEmpty({ message: "Unesite lokaciju." })
    lokacije: Array<string>;
}