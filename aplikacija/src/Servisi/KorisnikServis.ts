import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { concatMap, EMPTY, forkJoin, from, map, Observable, of, switchMap } from 'rxjs';
import { KorisnikAzuriranjeDTO } from 'src/DTO/KorisnikAzuriranjeDTO';
import { KorisnikPrijavaDTO } from 'src/DTO/KorisnikPrijavaDTO';
import { KorisnikRegistracijaDTO } from 'src/DTO/KorisnikRegistracijaDTO';
import { Korisnik } from 'src/Entiteti/KorisnikEntitet';
import { konfiguracija } from 'src/Konfiguracija/VanjskiResursiKonfiguracija';
import { AktivacijskiKodNijeTocanPogreska, EmailZuzetPogreska, KorisnickiRacunBlokiranAdmin, KorisnickiRacunNeaktiviranPogreska, KorisnickiRacunVecAktiviranPogreska, KorisnickoImeEmailZuzetiPogreska, KorisnickoImeZuzetoPogreska, KorisnikNePostojiPogreska, NetocnaLozinkaPogreska, PogreskaPredlozak } from 'src/Pogreske/Pogreske';
import { kreirajApiKljuc, kreirajHash } from 'src/Pomocnici/KriptoPomocnik';
import { kreirajAktivacijskiKod, posaljiMail } from 'src/Pomocnici/MailPomocnik';
import { AKTIVACIJSKI_KOD_NIJE_ISPRAVAN, EMAIL_ZAUZET, KORISNICKI_RACUN_BLOKIRAN_ADMIN, KORISNICKI_RACUN_NIJE_AKTIVIRAN, KORISNICKI_RACUN_VEC_AKTIVIRAN, KORISNICKO_ZAUZETO, KORISNIK_NE_POSTOJI, LOZINKA_NIJE_ISPRAVNA } from 'src/Pogreske/PorukeKonstante';
import { StatusKorisnika } from 'src/Entiteti/StatusKorisnikaEntitet';
import { StatusKorisnikaEnum } from 'src/Enumeracije/StatusKorisnikaEnumeracija';
import { KorisnikRepozitorij } from 'src/Repozitoriji/KorisnikRepozitorij';
import { VrstaKorisnikaEnum } from 'src/Enumeracije/VrstaKorisnikaEnumeracija';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { KorisniciStranicenje } from 'src/DTO/KorisniciStranicenjeDTO';

@Injectable()
export class KorisnikServis {

    constructor(@InjectRepository(Korisnik) private readonly korisnikRepozitorij: KorisnikRepozitorij) { }

    registrirajKorisnika(korisnikDTO: KorisnikRegistracijaDTO): Observable<any> {
        const emailPostojanje = from(this.korisnikRepozitorij.findOneBy({ email: korisnikDTO.email }));
        const korimePostojanje = from(this.korisnikRepozitorij.findOneBy({ korime: korisnikDTO.korime }));

        return forkJoin([emailPostojanje, korimePostojanje]).pipe(
            concatMap(([emailPostojanje, korimePostojanje]) => {
                if (emailPostojanje && korimePostojanje) {
                    const emailPogreska = new PogreskaPredlozak('email', EMAIL_ZAUZET);
                    const korimePogreska = new PogreskaPredlozak('korime', KORISNICKO_ZAUZETO);

                    throw new KorisnickoImeEmailZuzetiPogreska([emailPogreska, korimePogreska]);
                } else if (emailPostojanje) {
                    const emailPogreska = new PogreskaPredlozak('email', EMAIL_ZAUZET);

                    throw new EmailZuzetPogreska([emailPogreska]);

                } else if (korimePostojanje) {
                    const korimePogreska = new PogreskaPredlozak('korime', KORISNICKO_ZAUZETO);

                    throw new KorisnickoImeZuzetoPogreska([korimePogreska]);
                } else {
                    const aktivacijskiKod = kreirajAktivacijskiKod();
                    const hashiranaLozinka = kreirajHash(korisnikDTO.lozinka + korisnikDTO.korime);
                    const korisnik = new Korisnik(korisnikDTO.ime, korisnikDTO.prezime, hashiranaLozinka,
                        korisnikDTO.korime.toLocaleLowerCase(), korisnikDTO.email, aktivacijskiKod, korisnikDTO.adresa,
                        kreirajApiKljuc(korisnikDTO.korime), StatusKorisnikaEnum.NEAKTIVIRAN, VrstaKorisnikaEnum.KORISNIK);

                    return from(this.korisnikRepozitorij.save(korisnik)).pipe(
                        switchMap(() => {
                            return this.posaljiMailKorisniku(korisnik);
                        })
                    )
                }
            })
        );
    }

    posaljiMailKorisniku(korisnik: Korisnik) {
        const domena = konfiguracija.server.domain + ":" + 
        konfiguracija.server.port + `/api/korisnici/${korisnik.id}/aktivacija?token=` + korisnik.aktivacijskiKod;
        const predmet = "Aktivacija korisničkog računa: " + korisnik.korime;
        const prima = korisnik.email;
        return posaljiMail(prima, predmet, { domena: domena, korisnik: korisnik })
    }

    prijaviKorisnika(korisnikDTO: KorisnikPrijavaDTO) {
        return from(this.korisnikRepozitorij
            .createQueryBuilder('korisnik')
            .where({ korime: korisnikDTO.korime.toLowerCase() })
            .leftJoinAndSelect('korisnik.statusKorisnikaId', 'status_Korisnika')
            .getOne())
            .pipe(
                concatMap((korisnik: Korisnik) => {
                    this.provjeriAkoKorisnikPostoji(korisnik);

                    const statusKorisnika = (korisnik.statusKorisnikaId as unknown as StatusKorisnika).id;

                    switch (statusKorisnika) {
                        case StatusKorisnikaEnum.NEAKTIVIRAN: {
                            const racunNeaktiviranPogreska = new PogreskaPredlozak('korime', KORISNICKI_RACUN_NIJE_AKTIVIRAN);

                            throw new KorisnickiRacunNeaktiviranPogreska([racunNeaktiviranPogreska]);
                        }
                        case StatusKorisnikaEnum.BLOKIRAN: {
                            const racunBlokiranPogreska = new PogreskaPredlozak('korime', KORISNICKI_RACUN_BLOKIRAN_ADMIN);

                            throw new KorisnickiRacunBlokiranAdmin([racunBlokiranPogreska]);
                        }
                    }

                    if (korisnik.lozinka !== kreirajHash(korisnikDTO.lozinka + korisnikDTO.korime)) {
                        const lozinkaPogreska = new PogreskaPredlozak('korime', LOZINKA_NIJE_ISPRAVNA);

                        throw new NetocnaLozinkaPogreska([lozinkaPogreska]);
                    }

                    return EMPTY;
                })
            );
    }

    provjeriAkoKorisnikPostoji(korisnik: Korisnik) {
        if (!korisnik) {
            const korimePogreska = new PogreskaPredlozak('korime', KORISNIK_NE_POSTOJI);

            throw new KorisnikNePostojiPogreska([korimePogreska]);
        }
    }

    provjeriIspravnostLozinkeKorisnika(korisnik: Korisnik, korisnikDTO: KorisnikPrijavaDTO, sesija: any) {
        if (korisnik.lozinka !== kreirajHash(korisnikDTO.lozinka + korisnikDTO.korime)) {
            const lozinkaPogreska = new PogreskaPredlozak('lozinka', LOZINKA_NIJE_ISPRAVNA);

            sesija.brojNeuspjesnihPokusajaPrijave++;

            throw new NetocnaLozinkaPogreska([lozinkaPogreska]);
        }
    }

    dohvatiKorisnika(options: any): Observable<any> {
        return from(this.korisnikRepozitorij.findOne(options)).pipe(
            switchMap((korisnik) => {
                this.provjeriAkoKorisnikPostoji(korisnik);
                return of(korisnik);
            })
        )
    }

    dohvatiKorisnike(korisniciStranicenje: KorisniciStranicenje) {
        const PAGE_SIZE = 5
        const offset = (korisniciStranicenje.stranica - 1) * PAGE_SIZE;
        const queryBuilder = this.korisnikRepozitorij.createQueryBuilder('korisnik');

        return from(queryBuilder
            .select([
                'korisnik.id',
                'korisnik.ime',
                'korisnik.prezime',
                'korisnik.email',
                'korisnik.adresa',
                'korisnik.statusKorisnikaId',
                'statusKorisnika.id'
            ])
            .leftJoin('korisnik.statusKorisnikaId', 'statusKorisnika')
            .where('korisnik.tipKorisnikaId IN (:...desiredStatusKorisnikaIds)', { desiredStatusKorisnikaIds: [2, 3] })
            .skip(offset)
            .take(PAGE_SIZE)
            .getManyAndCount()
        ).pipe(
            map(([korisnici, totalCount]) => ({ korisnici, totalCount }))
        );
    }

    odblokirajIliAktivirajKorisnika(korisnik: Korisnik) {
        korisnik.statusKorisnikaId = StatusKorisnikaEnum.AKTIVIRAN;
        return from(this.korisnikRepozitorij.save(korisnik));
    }

    provjeriAktivacijskiKod(atribut: string, vrijednost: any, token: number) {
        return this.dohvatiKorisnika({
            where: { [atribut]: vrijednost },
            relations: ['statusKorisnikaId']
        }).pipe(
            switchMap((korisnik) => {
                if ((korisnik.statusKorisnikaId as unknown as StatusKorisnika).id == StatusKorisnikaEnum.AKTIVIRAN) {
                    const racunVecAktiviranPogreska = new PogreskaPredlozak('korime', KORISNICKI_RACUN_VEC_AKTIVIRAN);
                    throw new KorisnickiRacunVecAktiviranPogreska([racunVecAktiviranPogreska]);
                }

                if (korisnik.aktivacijskiKod == token) {
                    return this.odblokirajIliAktivirajKorisnika(korisnik);
                }
                else {
                    const aktivacijskiKodPogreska = new PogreskaPredlozak('korime', AKTIVACIJSKI_KOD_NIJE_ISPRAVAN);
                    throw new AktivacijskiKodNijeTocanPogreska([aktivacijskiKodPogreska]);
                }
            })
        )
    }

    obrisiKorisnika(atribut: string, vrijednost: any) {
        return from(this.korisnikRepozitorij.findOneBy({ [atribut]: vrijednost.toLowerCase() })).pipe(
            concatMap((korisnik) => {
                this.provjeriAkoKorisnikPostoji(korisnik)

                return from(this.korisnikRepozitorij.delete({ id: korisnik.id }));
            })
        );
    }

    azurirajKorisnika(atribut: string, vrijednost: any, korisnikAzurirajDTO: KorisnikAzuriranjeDTO) {
        return from(this.korisnikRepozitorij.findOneBy({ [atribut]: vrijednost })).pipe(
            switchMap((korisnik) => {
                this.provjeriAkoKorisnikPostoji(korisnik)

                const azuriraneVrijednosti = this.filtrirajPodatkeKojiNisuJednakiKaoUBaziPodataka(korisnik,
                    korisnikAzurirajDTO)

                if (Object.keys(azuriraneVrijednosti).length === 0)
                    return of(this.konvertirajKorisnikUObjektIFiltrirajVrijednosti(korisnik));

                const vrijednostiZaAzuriranje: any = plainToInstance(KorisnikAzuriranjeDTO, azuriraneVrijednosti);

                if (Object.keys(vrijednostiZaAzuriranje).length === 0)
                    return of(this.konvertirajKorisnikUObjektIFiltrirajVrijednosti(korisnik));

                if (korisnikAzurirajDTO.hasOwnProperty('lozinka'))
                    vrijednostiZaAzuriranje.lozinka = kreirajHash(vrijednostiZaAzuriranje.lozinka + korisnik.korime);

                if (korisnikAzurirajDTO.hasOwnProperty('status')) {
                    vrijednostiZaAzuriranje.statusKorisnikaId = korisnikAzurirajDTO.status
                    delete vrijednostiZaAzuriranje.status
                }

                return from(this.korisnikRepozitorij
                    .createQueryBuilder('korisnik')
                    .update(Korisnik)
                    .set(vrijednostiZaAzuriranje)
                    .where({ [atribut]: vrijednost })
                    .execute())
                    .pipe(
                        switchMap(() => {
                            return from(this.dohvatiKorisnika({
                                where: { [atribut]: vrijednost }, select: ['id', 'korime', 'email', 'ime',
                                    'prezime', 'adresa']
                            }));
                        })
                    );
            })
        )
    }

    filtrirajPodatkeKojiNisuJednakiKaoUBaziPodataka(enitetBaza: any, dtoObjekt: any) {
        return Object.keys(dtoObjekt).reduce((akumulator, kljuc) => {
            if (enitetBaza[kljuc] !== dtoObjekt[kljuc]) {
                akumulator[kljuc] = dtoObjekt[kljuc];
            }
            return akumulator;
        }, {})
    }

    konvertirajKorisnikUObjektIFiltrirajVrijednosti(korisnik: Korisnik) {
        const korisnikIzBaze = instanceToPlain(korisnik)

        delete korisnikIzBaze.tipKorisnikaId;
        delete korisnikIzBaze.statusKorisnikaId;
        delete korisnikIzBaze.lozinka;
        delete korisnikIzBaze.aktivacijskiKod;

        return korisnikIzBaze;
    }
}