import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne, ManyToMany, JoinTable } from 'typeorm';
import { StatusKorisnika } from './StatusKorisnikaEntitet';
import { TipKorisnika } from './TipKorisnikaEntitet';
import { Grad } from './GradEntitet';

@Entity()
export class Korisnik {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;

    @Column({ name: 'ime' })
    ime: string;

    @Column({ name: 'prezime' })
    prezime: string;

    @Column({ name: 'lozinka' })
    lozinka: string;

    @Column({ name: 'korime' })
    korime: string;

    @Column({ name: 'email' })
    email: string;

    @Column({ name: 'aktivacijski_kod' })
    aktivacijskiKod: number;

    @Column({ name: 'adresa', nullable: true })
    adresa: string;

    @Column({ name: 'api_kljuc' })
    apiKljuc: string;

    @ManyToOne(() => StatusKorisnika, statusKorisnika => statusKorisnika.korisnici)
    @JoinColumn({ name: "status_korisnika_id" })
    statusKorisnikaId: number;

    @ManyToOne(() => TipKorisnika, tipKorisnika => tipKorisnika.korisnici)
    @JoinColumn({ name: "tip_korisnika_id" })
    tipKorisnikaId: number;

    gradovi: Grad[];

    constructor(ime: string, prezime: string, lozinka: string, korime: string, email: string, aktivacijskiKod: number,
        adresa: string, apiKljuc: string, statusKorisnika: number, tipKorisnika: number) {
        this.ime = ime;
        this.prezime = prezime;
        this.lozinka = lozinka;
        this.korime = korime;
        this.email = email;
        this.adresa = adresa;
        this.apiKljuc = apiKljuc;
        this.aktivacijskiKod = aktivacijskiKod;
        this.statusKorisnikaId = statusKorisnika;
        this.tipKorisnikaId = tipKorisnika;
    }
}