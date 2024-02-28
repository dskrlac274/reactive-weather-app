import * as crypto from 'crypto';
import { konfiguracija } from 'src/Konfiguracija/VanjskiResursiKonfiguracija';


export function kreirajHash(vrijednost: string) {
    const hash = crypto.createHash('sha256');

    hash.update(vrijednost);

    return hash.digest('hex');
}

export function kreirajRandomSol() {
    const sol = crypto.randomBytes(16).toString('hex');

    return sol;
}

export function kreirajNasumicniBroj(min = 10000, max = 99999) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min) + min);
}

export function kreirajApiKljuc(korime: string) {
    const hmac = crypto.createHmac('sha256', korime + konfiguracija.aut.jwt_kljuc);
    const randomBytes = crypto.randomBytes(256);
    hmac.update(randomBytes);
    return hmac.digest('hex');
}