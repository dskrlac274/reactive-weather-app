import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Korisnik } from './KorisnikEntitet';

@Entity({name: "tip_korisnika"})
export class TipKorisnika {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;

    @Column({ name: 'naziv' })
    naziv: string;

    @Column({ name: 'opis' })
    opis: string;

    @OneToMany(() => Korisnik, korisnik => korisnik.tipKorisnikaId)
    korisnici: Korisnik[];
}