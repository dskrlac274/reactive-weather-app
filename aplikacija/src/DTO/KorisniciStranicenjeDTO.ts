
import { IsNotEmpty, IsDefined } from "class-validator";

export class KorisniciStranicenje {

    @IsDefined({ message: "Stranica je obavezna." })
    @IsNotEmpty({ message: "Molim Vas unesite stranicu." })
    stranica: number;
}