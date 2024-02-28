import { JwtService } from '@nestjs/jwt';
import { catchError, from, Observable } from 'rxjs';
import { konfiguracija } from 'src/Konfiguracija/VanjskiResursiKonfiguracija';
import { JwtNijeVazeciPogreska, PogreskaPredlozak } from 'src/Pogreske/Pogreske';
import { JWT_NIJE_ISPRAVAN } from 'src/Pogreske/PorukeKonstante';
const jwtServis = new JwtService();

export function kreirajToken(podaci: any) {
    return from(jwtServis.signAsync({ id: podaci.id, korime: podaci.korime, uloga: podaci.uloga.id },
        { expiresIn: 15, secret: konfiguracija.aut.jwt_kljuc }));
}

export function provjeriToken(token: string): Observable<any> {
    return from(jwtServis.verifyAsync(token, { secret: konfiguracija.aut.jwt_kljuc })).pipe(
        catchError(() => {
            const jwtPogreska = new PogreskaPredlozak('korime', JWT_NIJE_ISPRAVAN);
            throw new JwtNijeVazeciPogreska([jwtPogreska]);
        })
    );
}

export function dekodirajToken(token: string): any {
    return jwtServis.decode(token);
}

