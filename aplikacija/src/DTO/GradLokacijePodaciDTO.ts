import { IsNotEmpty, MaxLength, IsDefined, IsDate } from 'class-validator';

export class GradLokacijePodaciDTO {
    
    @IsDefined({message: "Lokacija je obavezna."})
    @MaxLength(50, { message: "Najveći dopušteni broj znakova za lokaciju je 50." })
    @IsNotEmpty({ message: "Molim Vas unesite lokaciju." })
    lokacija: string;

    @IsDefined({message: "Vrijeme mjerenja je obavezno."})
    @IsNotEmpty({ message: "Molim Vas unesite vrijeme mjerenja." })
    vrijemeMjerenja: Date;

    @IsDefined({message: "Temperatura je obavezna."})
    @IsNotEmpty({ message: "Molim Vas unesite temperaturu." })
    temperatura: number;

    @IsDefined({message: "Tlak je obavezan."})
    @IsNotEmpty({ message: "Molim Vas unesite tlak." })
    tlak: number;

    @IsDefined({message: "Vlaga je obavezna."})
    @IsNotEmpty({ message: "Molim Vas unesite vlagu." })
    vlaga: number;

    @IsDefined({message: "Drzavni kod je obavezan."})
    @MaxLength(10, { message: "Najveći dopušteni broj znakova za drzava je 10." })
    @IsNotEmpty({ message: "Molim Vas unesite drzavni kod." })
    drzava: string;
}