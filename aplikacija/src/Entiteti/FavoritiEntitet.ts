import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Korisnik } from './KorisnikEntitet';
import { Grad } from './GradEntitet';

@Entity()
export class Favoriti {
    @PrimaryColumn({ name: 'korisnik_id' })
    korisnikId: number;

    @PrimaryColumn({ name: 'grad_id' })
    gradId: number;

    @ManyToOne(
        () => Grad,
        grad => grad.korisnici, { onDelete: 'CASCADE' }
    )
    @JoinColumn([{ name: 'grad_id', referencedColumnName: 'id' }])
    gradovi: Grad[];

    @ManyToOne(
        () => Korisnik,
        korisnik => korisnik.gradovi, { onDelete: 'CASCADE' }
    )
    @JoinColumn([{ name: 'korisnik_id', referencedColumnName: 'id' }])
    korisnici: Korisnik[];

    constructor(korisnikId: number, gradId: number) {
        this.korisnikId = korisnikId;
        this.gradId = gradId;
    }
}