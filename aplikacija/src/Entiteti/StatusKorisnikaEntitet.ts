import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Korisnik } from './KorisnikEntitet';

@Entity()
export class StatusKorisnika {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    naziv: string;

    @Column()
    opis: string;

    @OneToMany(() => Korisnik, korisnik => korisnik.statusKorisnikaId)
    korisnici: Korisnik[];
}