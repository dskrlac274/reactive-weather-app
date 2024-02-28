import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { konfiguracija } from 'src/Konfiguracija/VanjskiResursiKonfiguracija';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: konfiguracija.bp.tip_baze,
            host: konfiguracija.bp.domacin,
            port: konfiguracija.bp.otvor,
            username: konfiguracija.bp.korisnico_ime,
            password: konfiguracija.bp.lozinka,
            database: konfiguracija.bp.ime_baze,
            autoLoadEntities: konfiguracija.bp.automatsko_ucitavanje_entiteta,
            synchronize: konfiguracija.bp.sinkronizacija,
            retryAttempts: konfiguracija.bp.broj_ponovnih_pokusaja,
            cache: konfiguracija.bp.predmemoriranje
        })],
    controllers: [],
    providers: [],
})
export class BazaPodatakaModul { }