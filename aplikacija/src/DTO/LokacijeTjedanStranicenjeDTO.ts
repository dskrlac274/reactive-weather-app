import { IsString, IsNotEmpty, MaxLength, IsDefined } from 'class-validator';

export class LokacijeTjedanStranicenje {

    @IsDefined({ message: "Lokacija je obavezna." })
    @IsString({ message: "Lokacija nije u ispravnom formatu." })
    @MaxLength(50, { message: "Najveći dopušteni broj znakova za lokaciju je 50." })
    @IsNotEmpty({ message: "Molim Vas unesite lokaciju." })
    lokacija: string;

    @IsDefined({ message: "Datum je obavezan." })
    @IsNotEmpty({ message: "Molim Vas unesite datum." })
    datum: string;
}