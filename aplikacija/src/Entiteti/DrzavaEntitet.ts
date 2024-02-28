import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Grad } from './GradEntitet';

@Entity()
export class Drzava {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;

    @Column({ name: 'oznaka' })
    oznaka: string;

    @OneToMany(() => Grad, grad => grad.drzavaId)
    gradovi: Grad[];

    constructor(oznaka: string) {
        this.oznaka = oznaka;
    }
}