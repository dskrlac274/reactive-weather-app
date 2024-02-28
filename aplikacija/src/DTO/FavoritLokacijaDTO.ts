import { IsDefined, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class FavoritLokacijaDTO {

    @IsDefined({message: "Lokacija je obavezna."})
    @IsString({ message: "Lokacija nije u ispravnom formatu." })
    @MaxLength(100, { message: "Najveći dopušteni broj znakova za lokaciju je 100." })
    @IsNotEmpty({ message: "Molim Vas unesite lokaciju." })
    lokacija: string;
}