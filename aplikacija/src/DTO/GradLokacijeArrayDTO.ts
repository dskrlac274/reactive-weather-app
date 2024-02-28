import { ArrayNotEmpty, IsDefined } from "class-validator";

export class GradLokacijeArrayDTO {

    @IsDefined({ message: "Lokacije su obavezne." })
    @ArrayNotEmpty({message: "Unesite lokaciju."})
    lokacije: Array<string>;


    @IsDefined({ message: "Drzavni kodovi su obavezni." })
    @ArrayNotEmpty({message: "Unesite drzavne kod."})
    drzavniKodovi: Array<string>;
}
