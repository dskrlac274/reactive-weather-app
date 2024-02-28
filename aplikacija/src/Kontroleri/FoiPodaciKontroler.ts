import { Controller, Post, Delete, Get, Res, Param, HttpStatus, Body, UseGuards, Query, Put, UploadedFile, UseInterceptors } from "@nestjs/common";
import { LokacijaDTO as LokacijaDTO, LokacijeArrayDTO } from "src/DTO/LokacijaArrayDTO";
import { FOI_LOKACIJA_AŽURIRANA, FOI_LOKACIJA_DODANA, FOI_LOKACIJA_OBRISANA, FOI_LOKACIJE_PODACI_DODANI, FOI_lOKACIJE_BEZ_MJERENJA_OBRISANE } from "src/Pogreske/PorukeKonstante";
import { FoiPodaciServis } from "src/Servisi/FoiPodaciServis";
import { ApiOdgovor } from "src/Validacije/HttpOdgovor";
import { Response } from 'express';
import { RukovateljPogreskama } from "src/Pogreske/RukovateljPogreskama";
import { ValidacijaDTOCijev } from "src/Validacije/ValidacijaDTOCijev";
import { ValidacijaMongoIdCijev } from "src/Validacije/ValidacijaMongoIdCijev";
import { LokacijePodaciDTO } from "src/DTO/LokacijePodaciDTO";
import { AutorizacijaStraza, TrazenaUloga } from "src/Straze/AutorizacijaStraza";
import { VrstaKorisnikaEnum } from "src/Enumeracije/VrstaKorisnikaEnumeracija";
import { ValidacijaApiKljuc } from "src/Validacije/ValidacijaApiKljucCijev";
import { debounceTime } from "rxjs";
import { FileInterceptor } from "@nestjs/platform-express";
import { LokacijeTjedanStranicenje } from "src/DTO/LokacijeTjedanStranicenjeDTO";
import { AutentifikacijaStraza } from "src/Straze/AutentifikacijaStraza";

@Controller('/api/foiPodaci')
export class FoiPodaciKontroler {

    constructor(private readonly foiPodaciServis: FoiPodaciServis) { }

    @Post('')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    public dodavanjeLokacije(@Body(new ValidacijaDTOCijev()) foiLokacijeDTO: LokacijaDTO, @Res() odgovor: Response) {
        return this.foiPodaciServis.dodajLokaciju(foiLokacijeDTO).subscribe({
            next: (lokacija) => {
                const odg = new ApiOdgovor([FOI_LOKACIJA_DODANA], lokacija);
                odg.statusniKod = HttpStatus.CREATED
                return odgovor.status(HttpStatus.CREATED).send(odg);
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        })
    }

    @Delete(':id/obrisi')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    public brisanjeLokacije(@Param('id', new ValidacijaMongoIdCijev()) id: string, @Res() odgovor: Response) {
        return this.foiPodaciServis.obrisiLokaciju(id).subscribe({
            complete: () => {
                const odg = new ApiOdgovor([FOI_LOKACIJA_OBRISANA]);
                odg.statusniKod = HttpStatus.OK
                return odgovor.status(HttpStatus.OK).send(odg);
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        })
    }

    @Put(':id/azuriraj')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    public azuriranjeLokacije(@Body(new ValidacijaDTOCijev()) foiLokacijeDTO: LokacijaDTO, @Param('id', new ValidacijaMongoIdCijev()) id: string, @Res() odgovor: Response) {
        return this.foiPodaciServis.azurirajLokaciju(id, foiLokacijeDTO).subscribe({
            complete: () => {
                const odg = new ApiOdgovor([FOI_LOKACIJA_AŽURIRANA]);
                odg.statusniKod = HttpStatus.OK
                return odgovor.status(HttpStatus.OK).send(odg);
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        })
    }

    @Delete('nePostoje')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    public brisanjeLokacijaZaKojeNePostojiMjerenje(@Res() odgovor: Response) {
        return this.foiPodaciServis.obrisiLokacijeZaKojeNePostojiMjerenje().subscribe({
            complete: () => {
                const odg = new ApiOdgovor([FOI_lOKACIJE_BEZ_MJERENJA_OBRISANE]);
                odg.statusniKod = HttpStatus.OK
                odgovor.status(HttpStatus.OK).send(odg);
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        })
    }

    @Get('')
    // @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK, VrstaKorisnikaEnum.PROFESOR])
    // @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    public dohvacanjeLokacija(@Res() odgovor: Response) {
        return this.foiPodaciServis.dohvatiLokacije().subscribe({
            next: (lokacije) => {
                const odg = new ApiOdgovor([], lokacije);
                odg.statusniKod = HttpStatus.OK
                return odgovor.status(HttpStatus.CREATED).send(odg);
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        })
    }

    @Get('nePostoje')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    public dohvacanjeLokacijaZaKojeNePostojiMjerenje(@Res() odgovor: Response) {
        return this.foiPodaciServis.dohvatiLokacijeZaKojeNePostojiMjerenje().subscribe({
            next: (lokacije) => {
                const odg = new ApiOdgovor([], lokacije);
                return odgovor.status(HttpStatus.CREATED).send(odg);
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        })
    }

    @Get(':id/dohvatiLokaciju')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    public dohvacanjeLokacije(@Param('id', new ValidacijaMongoIdCijev()) id: string, @Res() odgovor: Response) {
        return this.foiPodaciServis.dohvatiLokaciju(id).subscribe({
            next: (lokacija) => {
                const odg = new ApiOdgovor([], lokacija);
                return odgovor.status(HttpStatus.CREATED).send(odg);
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        })
    }

    @Post('dodajPodatak')
    public dodavanjeRezultataMjerenja(@Body(new ValidacijaDTOCijev()) foiLokacijePodaciDTO: LokacijePodaciDTO,
        @Query('apiKljuc', new ValidacijaApiKljuc()) apiKljuc: string, @Res() odgovor: Response) {
        return this.foiPodaciServis.dodajPodatkeMjerenja(apiKljuc, foiLokacijePodaciDTO)
            .subscribe({
                complete: () => {
                    const odg = new ApiOdgovor([FOI_LOKACIJE_PODACI_DODANI]);
                    return odgovor.status(HttpStatus.CREATED).send(odg);
                },
                error: (greskaServis) => {
                    const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                    return odgovor.status(odg.statusniKod).send(odg);
                }
            })
    }

    @Post('dajMaxTrenutno')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    dohvatiNajveceITrenutne(@Body(new ValidacijaDTOCijev()) foiLokacijeDTO: LokacijeArrayDTO, @Res() odgovor: Response) {
        return this.foiPodaciServis.dohvatiNajveceITrenutneVrijednosti(foiLokacijeDTO).subscribe(
            {
                next: (mjerenja) => {
                    const odg = new ApiOdgovor([], mjerenja);
                    odg.statusniKod = HttpStatus.OK;
                    return odgovor.status(HttpStatus.OK).send(odg);
                },
                error: (greskaServis) => {
                    const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                    return odgovor.status(odg.statusniKod).send(odg);
                }
            }
        )
    }

    @Post("filtrirajPo")
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    dohvatiPodatkeFiltriranjePo(@Query('filter') filter: string, @Body(new ValidacijaDTOCijev()) foiLokacijeDTO: LokacijaDTO, @Res() odgovor: Response, @Query('datum') datum?: string) {
        return this.foiPodaciServis.dohvatiPodatkeFiltriranjePo(filter, foiLokacijeDTO, datum).subscribe({
            next: (mjerenja) => {
                const odg = new ApiOdgovor([], mjerenja);
                odg.statusniKod = HttpStatus.OK;
                return odgovor.status(HttpStatus.OK).send(odg);
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        })
    }

    @Post("ucitajDatoteku")
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    @UseInterceptors(FileInterceptor('file'))
    spremiCSVPodatke(@UploadedFile() datoteka: any, @Res() odgovor: Response) {
        this.foiPodaciServis.spremiPodatkeDatoteke(datoteka).subscribe({
            complete: () => {
                const odg = new ApiOdgovor([], []);
                odg.statusniKod = HttpStatus.OK;
                return odgovor.status(HttpStatus.OK).send(odg);
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        })
    }

    @Post("tjedan")
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    dohvatiTjedanPodataka(@Body(new ValidacijaDTOCijev()) podaci: LokacijeTjedanStranicenje, @Res() odgovor: Response) {
        this.foiPodaciServis.dohvatiTjedanPodataka(podaci).subscribe({
            next: (rezultat) => {
                const odg = new ApiOdgovor([], rezultat);
                odg.statusniKod = HttpStatus.OK;
                return odgovor.status(HttpStatus.OK).send(odg);
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        })
    }

    @Post("dani")
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.KORISNIK, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    dohvatiDaneMjerenjaLoakcije(@Body(new ValidacijaDTOCijev()) podaci: LokacijaDTO, @Res() odgovor: Response) {
        this.foiPodaciServis.dohvatiDane(podaci).subscribe({
            next: (rezultat) => {
                const odg = new ApiOdgovor([], rezultat);
                odg.statusniKod = HttpStatus.OK;
                return odgovor.status(HttpStatus.OK).send(odg);
            },
            error: (greskaServis) => {
                const odg = RukovateljPogreskama.rukujGreskom(greskaServis);
                return odgovor.status(odg.statusniKod).send(odg);
            }
        })
    }
}