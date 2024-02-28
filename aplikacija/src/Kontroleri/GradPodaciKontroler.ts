import { Controller, Post, Delete, Get, Res, Param, HttpStatus, Body, UseGuards, Query, Req } from "@nestjs/common";
import { FAVORIT_USPJEŠNO_DODAN, FAVORIT_USPJEŠNO_OBRISAN, FOI_LOKACIJA_DODANA } from "src/Pogreske/PorukeKonstante";
import { ApiOdgovor } from "src/Validacije/HttpOdgovor";
import { Response } from 'express';
import { RukovateljPogreskama } from "src/Pogreske/RukovateljPogreskama";
import { ValidacijaDTOCijev } from "src/Validacije/ValidacijaDTOCijev";
import { ValidacijaIdCijev } from "src/Validacije/ValidacijaIdCijev";
import { AutorizacijaStraza, TrazenaUloga } from "src/Straze/AutorizacijaStraza";
import { VrstaKorisnikaEnum } from "src/Enumeracije/VrstaKorisnikaEnumeracija";
import { GradLokacijeDTO } from "src/DTO/GradLokacijeDTO";
import { GradPodaciServis } from "src/Servisi/GradPodaciServis";
import { GradLokacijePodaciDTO } from "src/DTO/GradLokacijePodaciDTO";
import { GradLokacijeArrayDTO } from "src/DTO/GradLokacijeArrayDTO";
import { dekodirajToken } from "src/Pomocnici/JwtPomocnik";
import { AutentifikacijaStraza } from "src/Straze/AutentifikacijaStraza";

@Controller('/api/gradPodaci')
export class GradPodaciKontroler {

    constructor(private readonly gradPodaciServis: GradPodaciServis) { }

    @Post("/dodajLokaciju")
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    dodajLokaciju(@Body(new ValidacijaDTOCijev()) lokacijeDTO: GradLokacijeDTO, @Res() odgovor: Response) {
        return this.gradPodaciServis.dodajLokaciju(lokacijeDTO).subscribe({
            next: (lokacija) => {
                const odg = new ApiOdgovor([FOI_LOKACIJA_DODANA], lokacija);
                odg.statusniKod = HttpStatus.CREATED
                return odgovor.status(HttpStatus.CREATED).send(odg);
            },
            error: (greskaServis) => {
                console.log(greskaServis)
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        })
    }

    @Get("/dajLokacije")
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    dohvatiLokacije(@Res() odgovor: Response, @Query('stranica') stranica?: number) {
        return this.gradPodaciServis.dohvatiLokacije(stranica).subscribe({
            next: (lokacije) => {
                const odg = new ApiOdgovor([], lokacije);
                odg.statusniKod = HttpStatus.OK
                return odgovor.status(HttpStatus.OK).send(odg);
            }
        })
    }

    @Delete(":id/obrisiLokaciju")
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    obrisiLokaciju(@Param('id', new ValidacijaIdCijev()) id: number, @Res() odgovor: Response) {
        return this.gradPodaciServis.obrisiLokaciju(id).subscribe({
            next: (lokacije) => {
                const odg = new ApiOdgovor([], lokacije);
                odg.statusniKod = HttpStatus.CREATED
                return odgovor.status(HttpStatus.CREATED).send(odg);
            }
        })
    }

    @Post("filtrirajPo")
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    dohvatiPovijestPodataka(@Req() zahtjev: any, @Query('filter') filter: string, @Body(new ValidacijaDTOCijev()) gradLokacija: GradLokacijeDTO, @Res() odgovor: Response, @Query('datum') datum?: string) {
        const korisnikId = dekodirajToken(zahtjev.headers.authorization.split(" ")[1]).id
        this.gradPodaciServis.dajFlitrirano(filter, gradLokacija, korisnikId, datum).subscribe({
            next: (podaci) => {
                const odg = new ApiOdgovor([], podaci);
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

    @Post('dajMaxTrenutno')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    dohvatiNajveceITrenutne(@Body(new ValidacijaDTOCijev()) gradLokacijeDTO: GradLokacijeArrayDTO, @Res() odgovor: Response) {
        return this.gradPodaciServis.dohvatiNajveceITrenutneVrijednosti(gradLokacijeDTO).subscribe(
            {
                next: (mjerenja) => {
                    const odg = new ApiOdgovor([], mjerenja);
                    odg.statusniKod = HttpStatus.OK;
                    return odgovor.status(HttpStatus.OK).send(odg);
                },
                error: (greskaServis) => {
                    console.log(greskaServis)
                    const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                    return odgovor.status(odg.statusniKod).send(odg);
                }
            }
        )
    }

    @Post("prognoza")
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    dohvatiPrognozuZaSljedećihPetDana(@Body(new ValidacijaDTOCijev()) gradLokacijeDTO: GradLokacijeDTO, @Res() odgovor: Response) {
        return this.gradPodaciServis.dohvatiPrognozuZaSestDana(gradLokacijeDTO).subscribe(
            {
                next: (mjerenja) => {
                    const odg = new ApiOdgovor([], mjerenja);
                    odg.statusniKod = HttpStatus.OK;
                    return odgovor.status(HttpStatus.OK).send(odg);
                },
                error: (greskaServis) => {
                    console.log(greskaServis)
                    const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                    return odgovor.status(odg.statusniKod).send(odg);
                }
            }
        )
    }

    @Post("favorit")
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    dodajFavorita(@Body(new ValidacijaDTOCijev()) lokacija: GradLokacijeDTO, @Res() odgovor: Response, @Req() zahtjev: any) {
        const korisnikId = dekodirajToken(zahtjev.headers.authorization.split(" ")[1]).id
        this.gradPodaciServis.dodajFavorita(lokacija, korisnikId).subscribe({
            next: (grad) => {
                const odg = new ApiOdgovor([FAVORIT_USPJEŠNO_DODAN], grad);
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

    @Delete("favorit")
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    obrisiFavorita(@Body(new ValidacijaDTOCijev()) lokacija: GradLokacijeDTO, @Res() odgovor: Response, @Req() zahtjev: any) {
        const korisnikId = dekodirajToken(zahtjev.headers.authorization.split(" ")[1]).id
        this.gradPodaciServis.obrisiFavorita(lokacija, korisnikId).subscribe({
            complete: () => {
                const odg = new ApiOdgovor([FAVORIT_USPJEŠNO_OBRISAN]);
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

    @Get("/favoriti")
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    dohvatiFavorite(@Res() odgovor: Response, @Req() zahtjev: any) {
        const korisnikId = dekodirajToken(zahtjev.headers.authorization.split(" ")[1]).id
        this.gradPodaciServis.dajFavorite(korisnikId).subscribe({
            next: (favoriti) => {
                const odg = new ApiOdgovor([], favoriti);
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