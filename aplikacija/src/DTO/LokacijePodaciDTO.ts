import { IsString, IsNotEmpty, MaxLength, Matches, IsDefined, IsDate } from 'class-validator';

export class LokacijePodaciDTO {

    @IsDefined({ message: "Lokacija je obavezna." })
    @IsString({ message: "Lokacija nije u ispravnom formatu." })
    @MaxLength(50, { message: "Najveći dopušteni broj znakova za lokaciju je 50." })
    @IsNotEmpty({ message: "Molim Vas unesite lokaciju." })
    lokacija: string;

    @IsDefined({ message: "Vrijeme mjerenja je obavezno." })
    @Matches(/^(\d{2}\.\d{2}\.\d{4}\. \d{2}:\d{2}:\d{2})$/, { message: "Datum nije u ispravnom formatu." })
    @IsNotEmpty({ message: "Molim Vas unesite vrijeme mjerenja." })
    vrijemeMjerenja: Date;

    @IsDefined({ message: "Temperatura je obavezna." })
    @IsString({ message: "Temperatura nije u ispravnom formatu." })
    @IsNotEmpty({ message: "Molim Vas unesite temperaturu." })
    temperatura: string;

    @IsDefined({ message: "Tlak je obavezan." })
    @IsString({ message: "Tlak nije u ispravnom formatu." })
    @IsNotEmpty({ message: "Molim Vas unesite tlak." })
    tlak: string;

    @IsDefined({ message: "Vlaga je obavezna." })
    @IsString({ message: "Vlaga nije u ispravnom formatu." })
    @IsNotEmpty({ message: "Molim Vas unesite vlagu." })
    vlaga: string;
}