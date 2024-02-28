import { Injectable, CanActivate, ExecutionContext, HttpStatus, UnauthorizedException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { VrstaKorisnikaEnum } from 'src/Enumeracije/VrstaKorisnikaEnumeracija';
import { JwtNijeVazeciPogreska, PogreskaPredlozak, PrilagodenaValidacijskaPogreska } from 'src/Pogreske/Pogreske';
import { dekodirajToken, kreirajToken, provjeriToken } from 'src/Pomocnici/JwtPomocnik';
import { JWT_NIJE_ISPRAVAN, ZAHTJEV_JE_NEUSPJESAN } from 'src/Pogreske/PorukeKonstante';
import { RukovateljPogreskama } from 'src/Pogreske/RukovateljPogreskama';
import { ApiOdgovor } from 'src/Validacije/HttpOdgovor';

export const TrazenaUloga = (uloga: VrstaKorisnikaEnum[]) => {
    return SetMetadata('uloga', uloga);
};

@Injectable()
export class AutorizacijaStraza implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(kontekst: ExecutionContext) {
        const zahtjev = kontekst.switchToHttp().getRequest();

        const trazeneUloge = this.reflector.get<VrstaKorisnikaEnum[]>('uloga', kontekst.getHandler());
        const jwtPogreska = new PogreskaPredlozak('korime', JWT_NIJE_ISPRAVAN);
        const greske = PrilagodenaValidacijskaPogreska.kreirajPrilagodenuGresku([jwtPogreska]);
        const odg = new ApiOdgovor(ZAHTJEV_JE_NEUSPJESAN, undefined, greske);

        if (!trazeneUloge.length)
            throw new UnauthorizedException(odg);

        const ulogaPrijavljeniKorisnik = dekodirajToken(zahtjev.headers.authorization.split(' ')[1].trim()).uloga

        if (!trazeneUloge.some((uloga) => uloga === ulogaPrijavljeniKorisnik))
            throw new UnauthorizedException(odg);

        return true;
    }
}