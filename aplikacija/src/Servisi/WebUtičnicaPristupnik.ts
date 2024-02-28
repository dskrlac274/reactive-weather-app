import { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { WebUtičnicaServis } from './WebUtičnicaServis';
import { KorisnikServis } from './KorisnikServis';

@WebSocketGateway(3001, { transports: ['websocket', 'polling'] })
export class WebUtičnicaPistupnik
    implements OnApplicationShutdown, OnModuleInit {

    constructor(private readonly webUtičnicaServis: WebUtičnicaServis, private readonly korisnikServis: KorisnikServis) { }

    onModuleInit() {
        this.webUtičnicaServis.zapocniSPromjenomToka()
    }

    onApplicationShutdown() {
        if (this.webUtičnicaServis.promjenaToka !== undefined)
            this.webUtičnicaServis.promjenaToka.removeAllListeners('change')
    }

    @SubscribeMessage('klijent-registracija')
    dodavanjeKlijenta(@MessageBody() tijelo: any, @ConnectedSocket() klijent: Socket) {
        tijelo = JSON.parse(tijelo)

        let promjenaPovratnaFunkcija = this.webUtičnicaServis.slusaciKlijenata.get(Number(tijelo.kljuc))

        if (promjenaPovratnaFunkcija != undefined)
            this.webUtičnicaServis.slusaciKlijenata.delete(Number(tijelo.kljuc))

        this.webUtičnicaServis.dohvatiKorisnika(tijelo).subscribe({
            complete: () => {
                this.webUtičnicaServis.emitirajPromjenuToka(klijent, tijelo)
            },
            error: (pogreska) => {
                klijent.emit('error', pogreska);
            },
        })
    }

    @SubscribeMessage('klijent-deregistracija')
    uklanjanjeKlijenta(@MessageBody() kljuc: number) {
        let promjenaPovratnaFunkcija = this.webUtičnicaServis.slusaciKlijenata.get(Number(kljuc))

        if (promjenaPovratnaFunkcija != undefined) {
            this.webUtičnicaServis.slusaciKlijenata.delete(Number(kljuc))
            this.webUtičnicaServis.promjenaToka.removeListener('change', promjenaPovratnaFunkcija)
        }
    }
}