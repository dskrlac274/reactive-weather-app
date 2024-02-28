
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Grad } from './GradEntitet';

@Entity()
export class GradPodaci {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;

    @Column({ name: 'vrijeme_mjerenja' })
    vrijemeMjerenja: Date;

    @Column({ name: 'temperatura' })
    temperatura: number

    @Column({ name: 'vlaga' })
    vlaga: number

    @Column({ name: 'tlak' })
    tlak: number

    @Column({ name: 'prognoza' })
    prognoza: number

    @ManyToOne(() => Grad, grad => grad.gradPodaci, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "grad_id" })
    gradId: number

    constructor(vrijemeMjerenja: Date, temperatura: number, vlaga: number, tlak: number, gradId: number, prognoza: number) {
        this.vrijemeMjerenja = vrijemeMjerenja;
        this.temperatura = temperatura;
        this.vlaga = vlaga;
        this.tlak = tlak;
        this.gradId = gradId;
        this.prognoza = prognoza
    }
}