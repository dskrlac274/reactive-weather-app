import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { from, tap } from 'rxjs';
import { FoiLokacijePodaci } from 'src/Sheme/FoiLokacijePodaciShema';
import { Socket } from 'socket.io';
import { FoiPodaciServis } from './FoiPodaciServis';
import { KorisnikServis } from './KorisnikServis';

@Injectable()
export class WebUtičnicaServis {

    promjenaToka: any;
    slusaciKlijenata: Map<number, any>

    constructor(@InjectModel(FoiLokacijePodaci.name) private foiLokacijePodaciModel: Model<FoiLokacijePodaci>,
        private readonly foiPodaciServis: FoiPodaciServis,
        private readonly korisnikServis: KorisnikServis) {
        this.slusaciKlijenata = new Map<number, any>;
    }

    zapocniSPromjenomToka(): void {
        this.promjenaToka = this.foiLokacijePodaciModel.watch();
    }

    emitirajPromjenuToka(server: Socket, data: any): void {
        const slusacDogadaja = (promjena: any) => {
            const podaci = promjena.fullDocument;

            from(this.foiPodaciServis.dohvatiLokaciju(podaci.lokacija))
                .pipe(
                    tap(() => {
                        const trenutniDatum = new Date().getTime()
                        const poslaniDatum = new Date(podaci.vrijemeMjerenja.toString()).getTime()

                        if (trenutniDatum < poslaniDatum && (trenutniDatum - poslaniDatum) > 60000) {
                            server.emit('error', "Podaci nisu ispravni.")
                        }
                    })
                ).subscribe({
                    complete: () => {
                        server.emit('message', promjena)
                    },
                    error: () => {
                        server.emit('error', "Podaci nisu traženi.")
                    }
                })
        }

        this.promjenaToka.on('change', slusacDogadaja);
        this.slusaciKlijenata.set(Number(data.kljuc), slusacDogadaja);
    }

    dohvatiKorisnika(tijelo: any) {
        return this.korisnikServis.dohvatiKorisnika({
            where: { ['id']: tijelo.kljuc }, select: ['id']
        })
    }
}