import { IsString, IsNotEmpty, MaxLength, IsDefined } from 'class-validator';

export class PrognozaDTO {

    @IsDefined({message: "Lokacija je obavezna."})
    @IsString({ message: "Lokacija nije u ispravnom formatu." })
    @MaxLength(100, { message: "Najveći dopušteni broj znakova za lokaciju je 100." })
    @IsNotEmpty({ message: "Molim Vas unesite lokaciju." })
    lokacija: string;

    @IsDefined({message: "Drzavni kod je obavezam."})
    @MaxLength(10, { message: "Najveći dopušteni broj znakova za lokaciju je 10." })
    @IsNotEmpty({ message: "Molim Vas unesite drzavni kod." })
    drzava: string;
}