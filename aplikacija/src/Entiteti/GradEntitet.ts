import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { GradPodaci } from './GradPodaciEntitet';
import { Korisnik } from './KorisnikEntitet';
import { Drzava } from './DrzavaEntitet';

@Entity()
export class Grad {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;

    @Column({ name: 'ime' })
    ime: string;

    @Column({ name: 'zemljopisna_sirina' })
    zemljopisnaSirina: string;

    @Column({ name: 'zemljopisna_duzina' })
    zemljopisnaDuzina: string;

    @OneToMany(() => GradPodaci, grad => grad.gradId)
    gradPodaci: GradPodaci[];

    @ManyToOne(() => Drzava, drzava => drzava, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "drzava_id" })
    drzavaId: number;

    korisnici: Korisnik[];

    constructor(ime: string, zemljopisnaSirina: string, zemljopisnaDuzina: string, drzavaId: number) {
        this.ime = ime;
        this.zemljopisnaSirina = zemljopisnaSirina;
        this.zemljopisnaDuzina = zemljopisnaDuzina;
        this.drzavaId = drzavaId
    }
}