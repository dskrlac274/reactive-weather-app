import { Body, Controller, HttpStatus, Post, Res, Req, Get, Query, Param } from '@nestjs/common';
import { KorisnikRegistracijaDTO } from 'src/DTO/KorisnikRegistracijaDTO';
import { KorisnikServis } from 'src/Servisi/KorisnikServis';
import { ApiOdgovor } from 'src/Validacije/HttpOdgovor';
import { ValidacijaDTOCijev } from 'src/Validacije/ValidacijaDTOCijev';
import { Response } from 'express';
import { KorisnikPrijavaDTO } from 'src/DTO/KorisnikPrijavaDTO';
import { AKTIVACIJA_RACUNA, EMAIL_POSLAN, KORISNICKI_RACUN_USPJESNO_AZURIRAN, KORISNICKI_RACUN_USPJESNO_DOHVACEN, ODJAVA, PRIJAVA_USPJESNA, TOKEN_KREIRAN, ZAHTJEV_JE_NEUSPJESAN } from 'src/Pogreske/PorukeKonstante';
import { dekodirajToken, kreirajToken } from 'src/Pomocnici/JwtPomocnik';
import { Korisnik } from 'src/Entiteti/KorisnikEntitet';
import { ValidacijaAktivacijskiKod } from 'src/Validacije/ValidacijaAktivacijskiKodCijev';
import { ValidacijaIdCijev } from 'src/Validacije/ValidacijaIdCijev';
import { Delete, Put, UseGuards } from '@nestjs/common/decorators';
import { KorisnikAzuriranjeDTO } from 'src/DTO/KorisnikAzuriranjeDTO';
import { RukovateljPogreskama } from 'src/Pogreske/RukovateljPogreskama';
import { AutentifikacijaStraza } from 'src/Straze/AutentifikacijaStraza';
import { AutorizacijaStraza, TrazenaUloga } from 'src/Straze/AutorizacijaStraza';
import { VrstaKorisnikaEnum } from 'src/Enumeracije/VrstaKorisnikaEnumeracija';
import { aktivacija } from 'src/Pogledi/stranice';
import { KorisniciStranicenje } from 'src/DTO/KorisniciStranicenjeDTO';

@Controller('/api/korisnici')
export class KorisnikKontroler {

    constructor(private readonly korisnikServis: KorisnikServis) { }

    @Post('registracija')
    public registracija(@Body(new ValidacijaDTOCijev()) korisnikRegistracijaDTO: KorisnikRegistracijaDTO, @Res() odgovor: Response) {
        return this.korisnikServis.registrirajKorisnika(korisnikRegistracijaDTO).subscribe({
            complete: () => {
                const odg = new ApiOdgovor([EMAIL_POSLAN, AKTIVACIJA_RACUNA]);
                odg.statusniKod = HttpStatus.OK
                return odgovor.status(HttpStatus.OK).send(odg);
            },
            error: (greskaServis) => {
                console.log(greskaServis)
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        });
    }

    @Post('prijava')
    public prijava(@Body(new ValidacijaDTOCijev()) korisnikPrijavaDTO: KorisnikPrijavaDTO, @Res() odgovor: Response,
        @Req() zahtjev: any) {
        return this.korisnikServis.prijaviKorisnika(korisnikPrijavaDTO).subscribe({
            complete: () => {
                this.korisnikServis.dohvatiKorisnika({
                    where: { ['korime']: korisnikPrijavaDTO.korime.toLowerCase() },
                    relations: ['tipKorisnikaId']
                }).subscribe(
                    (korisnik: Korisnik) => {
                        kreirajToken({ id: korisnik.id, korime: korisnik.korime, uloga: korisnik.tipKorisnikaId })
                            .subscribe(
                                (token: any) => {
                                    zahtjev.session.token = token;

                                    const odg = new ApiOdgovor(PRIJAVA_USPJESNA, zahtjev.session.token, []);
                                    odg.statusniKod = HttpStatus.OK
                                    return odgovor.status(HttpStatus.OK).send(odg);
                                });
                    });
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        });
    }

    @Get('odjava')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    odjaviSe(@Res() odgovor: Response, @Req() zahtjev: any) {
        zahtjev.session.token = undefined
        const odg = new ApiOdgovor([ODJAVA]);
        odg.statusniKod = HttpStatus.OK
        return odgovor.status(HttpStatus.OK).send(odg);
    }

    @Get('dajToken')
    public dajJwtToken(@Res() odgovor: Response, @Req() zahtjev: any) {
        if (zahtjev.session && zahtjev.session.token) {
            const korime = dekodirajToken(zahtjev.session.token.trim()).korime
            this.korisnikServis.dohvatiKorisnika({
                where: { ['korime']: korime.toLowerCase() },
                relations: ['tipKorisnikaId']
            }).subscribe({
                next: (korisnik: Korisnik) => {
                    kreirajToken({ id: korisnik.id, korime: korisnik.korime, uloga: korisnik.tipKorisnikaId })
                        .subscribe(
                            (token: any) => {
                                zahtjev.session.token = token;

                                const odg = new ApiOdgovor(TOKEN_KREIRAN, zahtjev.session.token);

                                return odgovor.status(HttpStatus.OK).send(odg);
                            });
                },
                error: (greskaServis) => {
                    const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                    return odgovor.status(odg.statusniKod).send(odg);
                }
            });
        }
        else {
            const odg = new ApiOdgovor([ZAHTJEV_JE_NEUSPJESAN], "");
            odg.statusniKod = HttpStatus.UNAUTHORIZED
            return odgovor.status(odg.statusniKod).send(odg);
        }
    }

    @Get('prijavljeniKorisnik')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    public dohvatiPrijavljenogKorisnika(@Res() odgovor: Response, @Req() zahtjev: any) {
        let id = dekodirajToken(zahtjev.headers.authorization.split(" ")[1]).id;

        return this.korisnikServis.dohvatiKorisnika({
            where: { ['id']: id }, select: ['id', 'korime', 'email', 'ime',
                'prezime', 'adresa', 'apiKljuc']
        }).subscribe({
            next: (korisnik) => {
                const odg = new ApiOdgovor(KORISNICKI_RACUN_USPJESNO_DOHVACEN, korisnik);
                return odgovor.status(HttpStatus.OK).send(odg);
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        });
    }

    @Get("")
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    dohvatiKorisnike(@Query(new ValidacijaDTOCijev()) korisniciStranicenje: KorisniciStranicenje, @Res() odgovor: Response) {
        return this.korisnikServis.dohvatiKorisnike(korisniciStranicenje).subscribe({
            next: (korisnici) => {
                const odg = new ApiOdgovor([], korisnici);
                odg.statusniKod = HttpStatus.OK
                return odgovor.status(HttpStatus.OK).send(odg);
            },
            error: (greskaServis) => {
                console.log(greskaServis)
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        });
    }

    @Get(':id/aktivacija')
    public aktivacija(@Param('id', new ValidacijaIdCijev()) id: number, @Query('token', new ValidacijaAktivacijskiKod()) token: number, @Res() odgovor: Response) {
        return this.korisnikServis.provjeriAktivacijskiKod('id', id, token).subscribe({
            complete: () => {
                return odgovor.send(aktivacija);
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        });
    }

    @Delete(':id')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    public obrisiKorisnika(@Param('id', new ValidacijaIdCijev()) id: string, @Res() odgovor: Response) {
        return this.korisnikServis.obrisiKorisnika('id', id).subscribe({
            complete: () => {
                return odgovor.status(HttpStatus.NO_CONTENT).send();
            },
            error: (greskaServis) => {
                console.log(greskaServis)
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        });
    }

    @Get(':id')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    public dohvatiKorisnika(@Param('id', new ValidacijaIdCijev()) id: number, @Res() odgovor: Response) {
        return this.korisnikServis.dohvatiKorisnika({
            where: { ['id']: id }, select: ['id', 'korime', 'email', 'ime',
                'prezime', 'adresa']
        }).subscribe({
            next: (korisnik) => {
                const odg = new ApiOdgovor(KORISNICKI_RACUN_USPJESNO_DOHVACEN, korisnik);
                return odgovor.status(HttpStatus.OK).send(odg);
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        });
    }

    @Put(':id')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    public azurirajKorisnika(@Body(new ValidacijaDTOCijev()) korisnikAzuriranjeDTO: KorisnikAzuriranjeDTO, @Param('id', new ValidacijaIdCijev()) id: number, @Res() odgovor: Response) {
        return this.korisnikServis.azurirajKorisnika('id', id, korisnikAzuriranjeDTO).subscribe({
            next: (korisnik) => {
                const odg = new ApiOdgovor(KORISNICKI_RACUN_USPJESNO_AZURIRAN, korisnik);
                odg.statusniKod = HttpStatus.OK
                return odgovor.status(HttpStatus.OK).send(odg);
            },
            error: (greskaServis) => {
                console.log(greskaServis)
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        })
    }
}