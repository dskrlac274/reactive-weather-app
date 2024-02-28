import { HttpStatus } from "@nestjs/common";
import { AktivacijskiKodNijeTocanPogreska, EmailSlanjeNijeMogucePogreska, EmailZuzetPogreska, KorisnickiRacunBlokiranAdmin, KorisnickiRacunNeaktiviranPogreska, KorisnickiRacunVecAktiviranPogreska, KorisnickiRacunZakljucan, KorisnickoImeEmailZuzetiPogreska, KorisnickoImeZuzetoPogreska, KorisnikNePostojiPogreska, KorisnikVecPrijavljenPogreska, NemogucnostPovezivanjaSaMailDavateljemUslugePogreska, NetocnaLozinkaPogreska, PrilagodenaValidacijskaPogreska } from "./Pogreske";
import { ZAHTJEV_JE_NEUSPJESAN } from "./PorukeKonstante";
import { ApiOdgovor } from "../Validacije/HttpOdgovor";

export class RukovateljPogreskama {
    static rukujGreskom(greskaServis: any): ApiOdgovor {
        const greske = PrilagodenaValidacijskaPogreska.kreirajPrilagodenuGresku(greskaServis.greske);
        const odg = new ApiOdgovor(ZAHTJEV_JE_NEUSPJESAN, undefined, greske);

        switch (greskaServis.constructor.name) {
            case "KorisnickoImeEmailZuzetiPogreska":
            case "KorisnickoImeZuzetoPogreska":
            case "EmailZuzetPogreska":
            case "FoiLokacijaVecPostojiPogreska":
            case "KorisnickiRacunVecAktiviranPogreska":
            case "ZapisVecPostoji":
            case "RelacijaVećPostoji":
                odg.statusniKod = HttpStatus.CONFLICT;
                break;
            case "EmailSlanjeNijeMogucePogreska":
            case "VanjskiServisGreska":
                odg.statusniKod = HttpStatus.SERVICE_UNAVAILABLE;
                break;
            case "NetocnaLozinkaPogreska":
            case "JwtNijeVazeciPogreska":
            case "FoiApiPravoPristupa":
                odg.statusniKod = HttpStatus.UNAUTHORIZED;
                break;
            case "KorisnickiRacunZakljucan":
                odg.statusniKod = HttpStatus.TOO_MANY_REQUESTS;
                break;
            case "KorisnickiRacunBlokiranAdmin":
            case "KorisnickiRacunNeaktiviranPogreska":
                odg.statusniKod = HttpStatus.FORBIDDEN;
                break;
            case "KorisnikNePostojiPogreska":
            case "AktivacijskiKodNijeTocanPogreska":
            case "GradNePostoji":
            case "DatumNijeIspravan":
                odg.statusniKod = HttpStatus.BAD_REQUEST;
                break;
            case "KorisnikVecPrijavljenPogreska":
            case "FoiLokacijaNePostojiPogreska":
            case "FoiLokacijaNePostojiPogreska":
            case "LokacijaNePostojiPogreska":
            case "FoiLokacijeNePostojePogreska":
            case "FoiLokacijeBezMjerenjaNePostojePogreska":
                odg.statusniKod = HttpStatus.NOT_FOUND;
                break;
            case "EmailSlanjeNijeMogucePogreska":
                odg.statusniKod = HttpStatus.SERVICE_UNAVAILABLE;
                break;
            case "NemogucnostPovezivanjaSaMailDavateljemUslugePogreska":
                odg.statusniKod = HttpStatus.BAD_GATEWAY;
                break;
            case "CsvNijeIspravan":
                odg.statusniKod = HttpStatus.UNSUPPORTED_MEDIA_TYPE
                break;
            case "KorisnikNemaFavorita":
                odg.statusniKod = HttpStatus.OK
                break;
        }
        return odg;
    }
}