import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { of, switchMap, catchError } from 'rxjs';
import { PogreskaPredlozak, PrilagodenaValidacijskaPogreska } from 'src/Pogreske/Pogreske';
import { provjeriToken } from 'src/Pomocnici/JwtPomocnik';
import { JWT_NIJE_ISPRAVAN, ZAHTJEV_JE_NEUSPJESAN } from 'src/Pogreske/PorukeKonstante';
import { ApiOdgovor } from 'src/Validacije/HttpOdgovor';

@Injectable()
export class AutentifikacijaStraza implements CanActivate {
    canActivate(kontekst: ExecutionContext) {
        const zahtjev = kontekst.switchToHttp().getRequest();

        const jwtPogreska = new PogreskaPredlozak('korime', JWT_NIJE_ISPRAVAN);
        const greske = PrilagodenaValidacijskaPogreska.kreirajPrilagodenuGresku([jwtPogreska]);
        const odg = new ApiOdgovor(ZAHTJEV_JE_NEUSPJESAN, undefined, greske);

        if (zahtjev.headers['authorization']) {
            const token = zahtjev.headers.authorization.split(' ')[1].trim();

            return provjeriToken(token).pipe(
                switchMap(() => {
                    return of(true);
                }),
                catchError(() => {
                    console.log("PRISTUP!")
                    throw new UnauthorizedException(odg);
                })
            );
        } else
            throw new UnauthorizedException(odg);
    }
}