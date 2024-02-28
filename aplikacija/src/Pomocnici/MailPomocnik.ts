import * as nodemailer from 'nodemailer';
import { catchError, from, Observable, of, race, concatMap, timer, tap, switchMap, map } from 'rxjs';
import { konfiguracija } from 'src/Konfiguracija/VanjskiResursiKonfiguracija';
import { EmailSlanjeNijeMogucePogreska, NemogucnostPovezivanjaSaMailDavateljemUslugePogreska, PogreskaPredlozak } from 'src/Pogreske/Pogreske';
import { EMAIL_SLANJE_NEMOGUCE, NEMOGUCNOST_POVEZIVANJA_SA_DAVATELJEM_MAIL_USLUGE, RACUN_REGISTRIRAN_EMAIL_NEUSPJESAN } from 'src/Pogreske/PorukeKonstante';
import { kreirajNasumicniBroj } from './KriptoPomocnik';
import Handlebars from 'handlebars'
import * as fs from 'fs';
import * as path from 'path';

export function posaljiMail(prima: string, predmet: string, podaci: any): Observable<any> {
    const transporter: nodemailer.Transporter = nodemailer.createTransport(konfiguracija.email.transport);
    const podaciHtml = {
        korime: podaci.korisnik.korime,
        domena: podaci.domena,
    };

    return generirajPredlozak('EmailPredlozak.hbs', podaciHtml).pipe(
        concatMap((html) => {
            const emailSlanje = from(
                transporter.sendMail({
                    from: konfiguracija.email.zadano.from,
                    to: prima,
                    subject: predmet,
                    html: html
                })
            ).pipe(
                catchError(() => {
                    const emailPogreska = new PogreskaPredlozak('email', [NEMOGUCNOST_POVEZIVANJA_SA_DAVATELJEM_MAIL_USLUGE]);
                    throw new NemogucnostPovezivanjaSaMailDavateljemUslugePogreska([emailPogreska])
                })
            );
            const dozvoljenoVrijemeCekanja = timer(5000).pipe(
                tap(() => {
                    const emailPogreska = new PogreskaPredlozak('email', [EMAIL_SLANJE_NEMOGUCE, RACUN_REGISTRIRAN_EMAIL_NEUSPJESAN]);
                    throw new EmailSlanjeNijeMogucePogreska([emailPogreska])
                }))

            return race(emailSlanje, dozvoljenoVrijemeCekanja)
        })
    )
}

export function kreirajAktivacijskiKod() {
    return kreirajNasumicniBroj();
}

function generirajPredlozak(datotekaIme: string, podaci: any): Observable<any> {
    return procitajDatoteku(datotekaIme).pipe(
        map((predlozak) => {
            const predlozakKompajl = Handlebars.compile(predlozak);
            return predlozakKompajl(podaci);
        })
    );
}

function procitajDatoteku(datotekaIme: string) {
    const putanja = path.join(__dirname, '..', 'Predlosci', datotekaIme);
    return from(fs.promises.readFile(putanja, 'utf8')).pipe(
        tap((datoteka) => {
            return datoteka;
        })
    )
}