import { Controller, Post, Delete, Get, Res, Param, HttpStatus, Body, UseGuards, Query, Req } from "@nestjs/common";
import { Response } from 'express';
import { foiLokacije, podnozje, zaglavlje, testiranje, prijava, pocetna, bocnaNavigacijaKorisnik, bocnaNavigacijaAdmin, bocnaNavigacijaGost, pravoPristupa, registracija, main, docs, profil, korisnici, gradLokacije, lokacije, profesor, profesorUcitavanje, bocnaNavigacijaProfesor } from '../Pogledi/stranice';
import { dekodirajToken } from "src/Pomocnici/JwtPomocnik";
import { VrstaKorisnikaEnum } from "src/Enumeracije/VrstaKorisnikaEnumeracija";
import { AutorizacijaStraza, TrazenaUloga } from "src/Straze/AutorizacijaStraza";
import { AutentifikacijaStraza } from "src/Straze/AutentifikacijaStraza";

@Controller('/')
export class PoglediKontroler {
    constructor() { }

    @Get('')
    posluziMain(@Res() odgovor: Response) {
        odgovor.send(main)
    }

    @Get('prijava')
    posluziPrijavu(@Res() odgovor: Response, @Req() zahtjev: any) {
        let prijavaStranica = ""
        prijavaStranica = this.dajPoUlogama(zahtjev, prijava)
        prijavaStranica = prijavaStranica.replace("{{Zaglavlje}}", zaglavlje);
        prijavaStranica = prijavaStranica.replace("{{Podnozje}}", podnozje);

        odgovor.send(prijavaStranica)
    }

    @Get('registracija')
    posluziRegistraciju(@Res() odgovor: Response, @Req() zahtjev: any) {
        let registracijaStranica = ""
        registracijaStranica = this.dajPoUlogama(zahtjev, registracija)
        registracijaStranica = registracijaStranica.replace("{{Zaglavlje}}", zaglavlje);
        registracijaStranica = registracijaStranica.replace("{{Podnozje}}", podnozje);

        odgovor.send(registracijaStranica)
    }

    @Get('pocetna')
    posluziPocetnu(@Res() odgovor: Response, @Req() zahtjev: any) {
        let pocetnaStranica = ""
        pocetnaStranica = this.dajPoUlogama(zahtjev, pocetna)
        pocetnaStranica = pocetnaStranica.replace("{{Zaglavlje}}", zaglavlje);
        pocetnaStranica = pocetnaStranica.replace("{{Podnozje}}", podnozje);

        odgovor.send(pocetnaStranica)
    }

    @Get('foi-lokacije')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.PROFESOR, VrstaKorisnikaEnum.KORISNIK])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    posluziFoiLokacije(@Res() odgovor: Response, @Req() zahtjev: any) {
        let foiLokacijeStranica = ""
        foiLokacijeStranica = this.dajPoUlogama(zahtjev, foiLokacije)
        foiLokacijeStranica = foiLokacijeStranica.replace("{{Zaglavlje}}", zaglavlje);
        foiLokacijeStranica = foiLokacijeStranica.replace("{{Podnozje}}", podnozje);

        odgovor.send(foiLokacijeStranica)
    }

    @Get('grad-lokacije')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.PROFESOR, VrstaKorisnikaEnum.KORISNIK])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    posluziSvijetLokacije(@Res() odgovor: Response, @Req() zahtjev: any) {
        let gradLokacijeStranica = ""
        gradLokacijeStranica = this.dajPoUlogama(zahtjev, gradLokacije)
        gradLokacijeStranica = gradLokacijeStranica.replace("{{Zaglavlje}}", zaglavlje);
        gradLokacijeStranica = gradLokacijeStranica.replace("{{Podnozje}}", podnozje);

        odgovor.send(gradLokacijeStranica)
    }

    @Get('dokumentacija')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.PROFESOR])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    posluziDokumentaciju(@Res() odgovor: Response, @Req() zahtjev: any) {
        let dokumentacijaStranica = ""
        dokumentacijaStranica = this.dajPoUlogama(zahtjev, docs)
        dokumentacijaStranica = dokumentacijaStranica.replace("{{Zaglavlje}}", zaglavlje);
        dokumentacijaStranica = dokumentacijaStranica.replace("{{Podnozje}}", podnozje);

        odgovor.send(dokumentacijaStranica)
    }

    @Get('profil')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN, VrstaKorisnikaEnum.PROFESOR, VrstaKorisnikaEnum.KORISNIK])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    posluziProfil(@Res() odgovor: Response, @Req() zahtjev: any) {
        let profilStranica = ""
        profilStranica = this.dajPoUlogama(zahtjev, profil)
        profilStranica = profilStranica.replace("{{Zaglavlje}}", zaglavlje);
        profilStranica = profilStranica.replace("{{Podnozje}}", podnozje);

        odgovor.send(profilStranica)
    }

    @Get('korisnici')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    posluziKorisnici(@Res() odgovor: Response, @Req() zahtjev: any) {
        let korisniciStranica = ""
        korisniciStranica = this.dajPoUlogama(zahtjev, korisnici)
        korisniciStranica = korisniciStranica.replace("{{Zaglavlje}}", zaglavlje);
        korisniciStranica = korisniciStranica.replace("{{Podnozje}}", podnozje);

        odgovor.send(korisniciStranica)
    }

    @Get('lokacije')
    @TrazenaUloga([VrstaKorisnikaEnum.ADMIN])
    @UseGuards(AutentifikacijaStraza, AutorizacijaStraza)
    posluziLokacije(@Res() odgovor: Response, @Req() zahtjev: any) {
        let lokacijeStranica = ""
        lokacijeStranica = this.dajPoUlogama(zahtjev, lokacije)
        lokacijeStranica = lokacijeStranica.replace("{{Zaglavlje}}", zaglavlje);
        lokacijeStranica = lokacijeStranica.replace("{{Podnozje}}", podnozje);

        odgovor.send(lokacijeStranica)
    }

    @Get('testiraj')
    testiraj(@Res() odgovor: Response) {
        odgovor.send(testiranje)
    }

    dajPoUlogama = (zahtjev, stranica) => {
        if (zahtjev.headers['authorization']) {
            let ulogaPrijavljeniKorisnik
            let korisnik = dekodirajToken(zahtjev.session.token)
            if (korisnik.id == undefined)
                ulogaPrijavljeniKorisnik = VrstaKorisnikaEnum.GOST;
            else
                ulogaPrijavljeniKorisnik = korisnik.uloga
                
            if (ulogaPrijavljeniKorisnik == VrstaKorisnikaEnum.PROFESOR ||
                ulogaPrijavljeniKorisnik == VrstaKorisnikaEnum.ADMIN) {
                stranica = stranica.replace("{{Profesor}}", profesor);
                stranica = stranica.replace("{{Profesor ucitavanje}}", profesorUcitavanje);
            }
            else {
                stranica = stranica.replace("{{Profesor}}", "")
                stranica = stranica.replace("{{Profesor ucitavanje}}", "");
            }

            if (ulogaPrijavljeniKorisnik == VrstaKorisnikaEnum.KORISNIK)
                return stranica = stranica.replace("{{Bocna navigacija}}", bocnaNavigacijaKorisnik);
            else if (ulogaPrijavljeniKorisnik == VrstaKorisnikaEnum.PROFESOR)
                return stranica = stranica.replace("{{Bocna navigacija}}", bocnaNavigacijaProfesor);
            else
                return stranica = stranica.replace("{{Bocna navigacija}}", bocnaNavigacijaAdmin);
        }
        else if (stranica == registracija || stranica == prijava || stranica == pocetna)
            return stranica = stranica.replace("{{Bocna navigacija}}", bocnaNavigacijaGost);
        else
            return pravoPristupa
    }
}