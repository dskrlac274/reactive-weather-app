import { IsNumber, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

//dodati kj vec treba dodati i staviti da su svi optional
export class KorisnikAzuriranjeDTO {

    @IsOptional()
    @IsString({ message: "Ime nije u ispravnom formatu." })
    @MaxLength(50, { message: "Najveći dopušteni broj znakova za ime je 50." })
    ime: string;

    @IsOptional()
    @IsString({ message: "Prezime nije u ispravnom formatu." })
    @MaxLength(50, { message: "Najveći dopušteni broj znakova za prezime je 50." })
    prezime: string;

    @IsOptional()
    @IsString({ message: "Lozinka nije u ispravnom formatu." })
    @MaxLength(64, { message: "Najveći dopušteni broj znakova za lozinku je 64." })
    @MinLength(8, { message: "Lozinka mora sadrzavati minimalno 8 znakova." })
    lozinka: string;

    @IsOptional()
    @IsString({ message: "Adresa nije u ispravnom formatu." })
    @MaxLength(200, { message: "Najveći dopušteni broj znakova je 200." })
    adresa: string;

    @IsOptional()
    @IsNumber({}, {message: "Status nije u ispravnom formatu."})
    status: Number;
}
