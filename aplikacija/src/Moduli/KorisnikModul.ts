import { KorisnikKontroler } from '../Kontroleri/KorisnikKontroler';
import { KorisnikServis } from '../Servisi/KorisnikServis';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Korisnik } from 'src/Entiteti/KorisnikEntitet';
import { KorisnikRepozitorij } from 'src/Repozitoriji/KorisnikRepozitorij';
import { TipKorisnika } from 'src/Entiteti/TipKorisnikaEntitet';
import { Module } from '@nestjs/common';
import { StatusKorisnika } from 'src/Entiteti/StatusKorisnikaEntitet';

@Module({
  imports: [TypeOrmModule.forFeature([Korisnik, TipKorisnika, StatusKorisnika])],
  controllers: [KorisnikKontroler],
  providers: [KorisnikServis, KorisnikRepozitorij],
  exports: [KorisnikServis, KorisnikRepozitorij]
})
export class KorisnikModul { }