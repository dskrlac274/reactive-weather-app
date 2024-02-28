import { ValidationError } from "class-validator";

export class Pogreska extends Error {
    constructor(public greske: any) {
        super();
        this.greske = greske;
    }
}

export class JwtNijeVazeciPogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class NetocnaLozinkaPogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class KorisnickiRacunZakljucan extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class KorisnickiRacunBlokiranAdmin extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class AktivacijskiKodFormatPogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class AktivacijskiKodNijeTocanPogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class KorisnickiRacunVecAktiviranPogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class KorisnickoImeEmailZuzetiPogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class GradNePostoji extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class DrzavaNePostoji extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class RelacijaVećPostoji extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class GradPodaciNePostoje extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class VanjskiServisGreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class ZapisVecPostoji extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class EmailZuzetPogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class KorisnickoImeZuzetoPogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class KorisnikNePostojiPogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class KorisnikNemaFavorita extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class KorisnickiRacunNeaktiviranPogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class EmailSlanjeNijeMogucePogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class NemogucnostPovezivanjaSaMailDavateljemUslugePogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class KorisnikVecPrijavljenPogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class FoiLokacijaVecPostojiPogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class LokacijaNePostojiPogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class DatumNijeIspravan extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class CsvNijeIspravan extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class FoiApiPravoPristupa extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class FoiLokacijeBezMjerenjaNePostojePogreska extends Pogreska {
    constructor(public greske: any) {
        super(greske);
    }
}

export class PogreskaPredlozak {
    private _svojstvo: string;
    private _ogranicenja: any;

    constructor(svojstvo: string, ogranicenja: any) {
        this._svojstvo = svojstvo;
        this._ogranicenja = ogranicenja;
    }

    get svojstvo(): string {
        return this._svojstvo;
    }

    get ogranicenja(): any {
        return this._ogranicenja;
    }
}

export class PrilagodenaValidacijskaPogreska {
    static mapirajPrilagodenuGresku(greske: ValidationError[]): ValidationError[] {
        let ogranicenja: any = greske.reduce(
            (acc, Pogreska) => ({
                ...acc,
                [Pogreska.property]: Object.values(Pogreska.constraints).join('')
            }),
            {},
        );
        return ogranicenja;
    }

    static kreirajPrilagodenuGresku(greske: Array<PogreskaPredlozak>) {
        const validacijskePogreske: ValidationError[] = [];
        for (const pogreska of greske) {
            const validacijskaPogreska = new ValidationError();

            validacijskaPogreska.property = pogreska.svojstvo;
            validacijskaPogreska.constraints = pogreska.ogranicenja;

            validacijskePogreske.push(validacijskaPogreska);
        }
        return this.mapirajPrilagodenuGresku(validacijskePogreske);
    }
}