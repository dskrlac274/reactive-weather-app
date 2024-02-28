import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradPodaciKontroler } from 'src/Kontroleri/GradPodaciKontroler';
import { GradPodaciServis } from 'src/Servisi/GradPodaciServis';
import { GradPodaciRepozitorij } from 'src/Repozitoriji/GradPodaciRepozitorij';
import { Grad } from 'src/Entiteti/GradEntitet';
import { GradPodaci } from 'src/Entiteti/GradPodaciEntitet';
import { Korisnik } from 'src/Entiteti/KorisnikEntitet';
import { GradRepozitorij } from 'src/Repozitoriji/GradRepozitorij';
import { KorisnikRepozitorij } from 'src/Repozitoriji/KorisnikRepozitorij';
import { Favoriti } from 'src/Entiteti/FavoritiEntitet';
import { FavoritiRepozitorij } from 'src/Repozitoriji/FavoritiRepozitorij';
import { Drzava } from 'src/Entiteti/DrzavaEntitet';
import { DrzavaRepozitorij } from 'src/Repozitoriji/DrzavaRepozitorij';

@Module({
    imports: [TypeOrmModule.forFeature([Grad, GradPodaci, Favoriti, Korisnik, Drzava])],
    controllers: [GradPodaciKontroler],
    providers: [GradPodaciServis, GradPodaciRepozitorij, GradRepozitorij, KorisnikRepozitorij, FavoritiRepozitorij, DrzavaRepozitorij],
    exports: []
})
export class GradPodaciModul { }