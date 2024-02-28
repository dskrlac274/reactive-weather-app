import { IsDefined, IsNotEmpty, MaxLength } from "class-validator";

export class LokacijeStranicenjeDTO {

    @IsDefined({message: "Drzavni kod je obavezam."})
    @MaxLength(10, { message: "Najveći dopušteni broj znakova za lokaciju je 10." })
    @IsNotEmpty({ message: "Molim Vas unesite drzavni kod." })
    stranica: number;
}