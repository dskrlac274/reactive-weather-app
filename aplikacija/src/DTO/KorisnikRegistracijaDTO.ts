import { IsNotEmpty, MinLength, MaxLength, IsOptional, IsEmail } from 'class-validator';

export class KorisnikRegistracijaDTO {

    @MaxLength(50, { message: "Najveći dopušteni broj znakova za ime je 50." })
    @IsNotEmpty({ message: "Molim Vas unesite ime." })
    ime: string;

    @MaxLength(50, { message: "Najveći dopušteni broj znakova za prezime je 50." })
    @IsNotEmpty({ message: "Molim Vas unesite ime." })
    prezime: string;

    @MaxLength(20, { message: "Najveći dopušteni broj znakova za korisničko ime je 20." })
    @IsNotEmpty({ message: "Molim Vas unesite korisničko ime." })
    korime: string;

    @MaxLength(64, { message: "Najveći dopušteni broj znakova za lozinku je 64." })
    @IsNotEmpty({ message: "Molim Vas unesite lozinku." })
    @MinLength(6, { message: "Lozinka mora sadrzavati minimalno 8 znakova." })
    lozinka: string;

    @IsEmail({}, { message: "Molim Vas unesite validan email." })
    @MaxLength(100, { message: "Najveći dopušteni broj znakova za email je 100." })
    @IsNotEmpty({ message: "Molim Vas unesite email." })
    email: string;

    @MaxLength(200, { message: "Najveći dopušteni broj znakova je 200." })
    @IsOptional()
    adresa?: string;
}