import { Injectable } from '@nestjs/common';
import { from, map, tap, forkJoin, concatMap, catchError, toArray, Observable, mergeMap } from 'rxjs';
import { LokacijaNePostojiPogreska, FoiLokacijaVecPostojiPogreska, GradNePostoji, KorisnikNePostojiPogreska, PogreskaPredlozak, VanjskiServisGreska, KorisnikNemaFavorita, DrzavaNePostoji } from 'src/Pogreske/Pogreske';
import { LOKACIJA_NE_POSTOJI, FOI_LOKACIJA_POSTOJI, GRAD_NE_POSTOJI, KORISNIK_NE_POSTOJI, SERVIS_NEDOSTUPAN, KORISNIK_FAVORITI, DRZAVA_NE_POSTOJI } from 'src/Pogreske/PorukeKonstante';
import { Korisnik } from 'src/Entiteti/KorisnikEntitet';
import { InjectRepository } from '@nestjs/typeorm';
import { GradPodaciRepozitorij } from 'src/Repozitoriji/GradPodaciRepozitorij';
import { GradLokacijeDTO } from 'src/DTO/GradLokacijeDTO';
import { GradPodaci } from 'src/Entiteti/GradPodaciEntitet';
import { Grad } from 'src/Entiteti/GradEntitet';
import { GradRepozitorij } from 'src/Repozitoriji/GradRepozitorij';
import { KorisnikRepozitorij } from 'src/Repozitoriji/KorisnikRepozitorij';
import { Favoriti } from 'src/Entiteti/FavoritiEntitet';
import { FavoritiRepozitorij } from 'src/Repozitoriji/FavoritiRepozitorij';
import { In } from 'typeorm';
import { GradLokacijeArrayDTO } from 'src/DTO/GradLokacijeArrayDTO';
import { Drzava } from 'src/Entiteti/DrzavaEntitet';
import { DrzavaRepozitorij } from 'src/Repozitoriji/DrzavaRepozitorij';
import { konfiguracija } from 'src/Konfiguracija/VanjskiResursiKonfiguracija';
const moment = require('moment');

@Injectable()
export class GradPodaciServis {

    constructor(@InjectRepository(GradPodaci) private readonly gradPodaciRepozitorij: GradPodaciRepozitorij,
        @InjectRepository(Grad) private readonly gradRepozitorij: GradRepozitorij,
        @InjectRepository(Korisnik) private readonly korisnikRepozitorij: KorisnikRepozitorij,
        @InjectRepository(Favoriti) private readonly favoritiRepozitorij: FavoritiRepozitorij,
        @InjectRepository(Drzava) private readonly drzavaRepozitorij: DrzavaRepozitorij) { }

    dohvatiLokacije(stranica: number): Observable<any> {
        if (stranica == undefined)
            return from(this.gradRepozitorij.find({ relations: ["drzavaId"] })).pipe(
                tap((rez: any) => {
                    rez.forEach(grad => {
                        grad.drzava = grad.drzavaId.oznaka
                    })
                })
            )
        else {
            const PAGE_SIZE = 5
            const offset = (stranica - 1) * PAGE_SIZE;

            return from(this.gradRepozitorij.findAndCount({ relations: ["drzavaId"], take: PAGE_SIZE, skip: offset })).pipe(
                tap((rez: any) => {
                    rez[0].forEach(grad => {
                        grad.drzava = grad.drzavaId.oznaka
                    })
                })
            )
        }
    }

    obrisiLokaciju(id: number) {
        return from(this.gradRepozitorij.findOne({ where: { id: id } })).pipe(
            tap((rezultat) => {
                if (rezultat == null) {
                    const lokacijaPogreska = new PogreskaPredlozak('lokacija', LOKACIJA_NE_POSTOJI);
                    throw new LokacijaNePostojiPogreska([lokacijaPogreska]);
                }
            }),
            concatMap((rezultat) => from(this.gradRepozitorij.delete({ id: rezultat.id })),
            ))
    }

    dodajLokaciju(lokacijeDTO: GradLokacijeDTO) {
        return from(this.drzavaRepozitorij.findOne({ where: { oznaka: lokacijeDTO.drzava } })).pipe(
            concatMap((drzava) => {
                return from(this.gradRepozitorij.findOne({ where: { ime: lokacijeDTO.lokacija, drzavaId: drzava.id == null ? -9999 : drzava.id } })).pipe(
                    tap((lokacija) => {
                        if (lokacija) {
                            const lokacijaPogreska = new PogreskaPredlozak('lokacija', FOI_LOKACIJA_POSTOJI);
                            throw new FoiLokacijaVecPostojiPogreska([lokacijaPogreska]);
                        }
                    }),
                    concatMap(() => {
                        return from(fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${lokacijeDTO.lokacija},${lokacijeDTO.drzava}&appid=${konfiguracija.vanjski_podaci.api_kljuc}`)).pipe(
                            catchError(() => {
                                const vanjskiServisGreska = new PogreskaPredlozak('lokacija', SERVIS_NEDOSTUPAN);
                                throw new VanjskiServisGreska([vanjskiServisGreska]);
                            }),
                        )
                    }),
                    concatMap((rezultat) => rezultat.json()),
                    concatMap(rezultat => {
                        if (rezultat.length == 0) {
                            const gradPogreska = new PogreskaPredlozak('lokacija', GRAD_NE_POSTOJI);
                            throw new GradNePostoji([gradPogreska]);
                        }
                        else {
                            const drzavaObjekt = new Drzava(rezultat[0].country)

                            const grad = new Grad(
                                rezultat[0].name,
                                rezultat[0].lat,
                                rezultat[0].lon,
                                drzava == null ? rezultat[0].country : drzava.id
                            )

                            if (drzava == null) {
                                return from(this.drzavaRepozitorij.save(drzavaObjekt)).pipe(
                                    concatMap(() => from(this.gradRepozitorij.save(grad))),
                                    map(rez => rez)
                                )
                            } else {
                                return from(this.gradRepozitorij.save(grad)).pipe(
                                    map((rez: any) => {
                                        rez.drzava = drzava.oznaka
                                        return rez
                                    })
                                )
                            }
                        }
                    })
                )
            })
        )
    }

    obrisiFavorita(favorit: GradLokacijeDTO, korisnikId: number) {
        return from(this.drzavaRepozitorij.findOne({ where: { oznaka: favorit.drzava } })).pipe(
            concatMap((drzava) => {
                if (drzava == null) {
                    const drzavaPogreska = new PogreskaPredlozak('drzava', DRZAVA_NE_POSTOJI);
                    throw new DrzavaNePostoji([drzavaPogreska]);
                }

                return forkJoin([this.korisnikRepozitorij.findOne({ where: { id: korisnikId } }),
                this.gradRepozitorij.findOne({ where: { ime: favorit.lokacija, drzavaId: drzava.id } })]).pipe(
                    concatMap(([korisnik, grad]) => {
                        if (grad == undefined) {
                            const gradPogreska = new PogreskaPredlozak('grad', GRAD_NE_POSTOJI);
                            throw new GradNePostoji([gradPogreska]);
                        }
                        if (korisnik == undefined) {
                            const korisnikPogreska = new PogreskaPredlozak('korisnik', KORISNIK_NE_POSTOJI);
                            throw new KorisnikNePostojiPogreska([korisnikPogreska]);
                        }

                        const podaci = new Favoriti(korisnik.id, grad.id)
                        return from(this.favoritiRepozitorij.delete(podaci))
                    })
                )
            }),

        )
    }

    dodajFavorita(favorit: GradLokacijeDTO, korisnikId: number) {
        return from(this.drzavaRepozitorij.findOne({ where: { oznaka: favorit.drzava } })).pipe(
            concatMap((drzava: any) => {
                if (drzava == null) {
                    const drzavaPogreska = new PogreskaPredlozak('drzava', DRZAVA_NE_POSTOJI);
                    throw new DrzavaNePostoji([drzavaPogreska]);
                }

                return forkJoin([this.korisnikRepozitorij.findOne({ where: { id: korisnikId } }),
                this.gradRepozitorij.findOne({ where: { ime: favorit.lokacija, drzavaId: drzava.id } })]).pipe(
                    concatMap(([korisnik, grad]) => {
                        if (grad == undefined) {
                            const gradPogreska = new PogreskaPredlozak('grad', GRAD_NE_POSTOJI);
                            throw new GradNePostoji([gradPogreska]);
                        }
                        if (korisnik == undefined) {
                            const korisnikPogreska = new PogreskaPredlozak('korisnik', KORISNIK_NE_POSTOJI);
                            throw new KorisnikNePostojiPogreska([korisnikPogreska]);
                        }

                        const podaci = new Favoriti(korisnik.id, grad.id)
                        return from(this.favoritiRepozitorij.save(podaci)).pipe(
                            map(() => {
                                grad["drzava"] = drzava.oznaka
                                return grad
                            })
                        )
                    })
                )
            })
        )
    }

    dajFavoriteKorisnik = (korisnikId: number) => {
        return from(this.korisnikRepozitorij.findOne({ where: { id: korisnikId } })).pipe(
            tap(rezultat => {
                if (rezultat == undefined) {
                    const korisnikPogreska = new PogreskaPredlozak('korisnik', KORISNIK_NE_POSTOJI);
                    throw new KorisnikNePostojiPogreska([korisnikPogreska]);
                }
            }),
            concatMap(() => {
                return from(this.favoritiRepozitorij.find({ where: { korisnikId: korisnikId } })).pipe(
                    concatMap((podaci) => {
                        if (podaci.length == 0) {
                            const korisnikPogreska = new PogreskaPredlozak('korisnik', KORISNIK_FAVORITI);
                            throw new KorisnikNemaFavorita([korisnikPogreska]);
                        }

                        const gradIds = podaci.map(item => item.gradId);

                        return from(this.gradRepozitorij.createQueryBuilder('grad')
                            .where('grad.id IN (:...ids)', { ids: gradIds })
                            .leftJoinAndSelect('grad.drzavaId', 'drzava')
                            .getMany()).pipe(
                                tap((rez: any) => {
                                    rez.forEach(grad => {
                                        grad.drzava = grad.drzavaId.oznaka
                                    })
                                })
                            )
                    }))
            })
        )
    }

    dohvatiPrognozuZaSestDana(gradLokacijeDTO: GradLokacijeDTO) {
        return from(this.drzavaRepozitorij.findOne({ where: { oznaka: gradLokacijeDTO.drzava } })).pipe(
            concatMap((drzava) => {
                if (drzava == null) {
                    const drzavaPogreska = new PogreskaPredlozak('drzava', DRZAVA_NE_POSTOJI);
                    throw new DrzavaNePostoji([drzavaPogreska]);
                }

                return from(this.gradRepozitorij.findOne({ where: { ime: gradLokacijeDTO.lokacija, drzavaId: drzava.id } })).pipe(
                    tap((grad) => {
                        if (grad == undefined) {
                            const gradPogreska = new PogreskaPredlozak('grad', GRAD_NE_POSTOJI);
                            throw new GradNePostoji([gradPogreska]);
                        }
                    }),
                    concatMap((grad) => {
                        return from(this.gradPodaciRepozitorij
                            .createQueryBuilder('entity')
                            .leftJoinAndSelect('entity.gradId', 'grad')
                            .where('entity.gradId = :idGrad AND entity.prognoza = :prognoza', { idGrad: grad.id, prognoza: true })
                            .orderBy('entity.vrijemeMjerenja', 'ASC')
                            .take(1)
                            .getOne())
                            .pipe(
                                concatMap((rezultat) => {
                                    if (rezultat == null || (new Date(Number(rezultat.vrijemeMjerenja)).getTime() < new Date().getTime()
                                        && new Date(Number(rezultat.vrijemeMjerenja)).getDate() != new Date().getDate())) {
                                        return from(fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=${grad.zemljopisnaSirina}&lon=${grad.zemljopisnaDuzina}&appid=${konfiguracija.vanjski_podaci.api_kljuc}`)).pipe(
                                            catchError(() => {
                                                const vanjskiServisGreska = new PogreskaPredlozak('servis', SERVIS_NEDOSTUPAN);
                                                throw new VanjskiServisGreska([vanjskiServisGreska]);
                                            }),
                                            concatMap(x => x.json()),
                                            tap((x: any) => {
                                                if (x.cod != '200') {
                                                    const gradPogreska = new PogreskaPredlozak('grad', GRAD_NE_POSTOJI);
                                                    throw new GradNePostoji([gradPogreska]);
                                                }
                                            }),
                                            concatMap((x: any) => from(x.list)),
                                            map((rez: any) => {
                                                const gradPodaci = new GradPodaci(
                                                    new Date(Number(rez.dt) * 1000),
                                                    rez.main.temp - 273.15,
                                                    rez.main.humidity,
                                                    rez.main.pressure,
                                                    grad.id,
                                                    1
                                                )
                                                return gradPodaci
                                            }),
                                            toArray(),
                                            mergeMap((noviPodaci) => {
                                                return from(this.gradPodaciRepozitorij.delete({ gradId: grad.id, prognoza: 1 })).pipe(
                                                    concatMap(() => {
                                                        const spremi = noviPodaci.map(gradPodaci => this.gradPodaciRepozitorij.save(gradPodaci));
                                                        return forkJoin(spremi);
                                                    })
                                                );
                                            }),
                                            map((rezultati) => {
                                                return this.grupiraj(rezultati, grad.ime, 'dayOfMonth', drzava.oznaka);
                                            })
                                        )
                                    }
                                    else {
                                        return from(this.gradPodaciRepozitorij
                                            .createQueryBuilder('gradPodaci')
                                            .where('gradPodaci.gradId = :gradId', { gradId: grad.id })
                                            .andWhere('gradPodaci.prognoza = :prognoza', { prognoza: 1 })
                                            .leftJoinAndSelect('gradPodaci.gradId', 'grad')
                                            .getMany()).pipe(
                                                map(rezultati => {
                                                    return this.grupiraj(rezultati, grad.ime, 'dayOfMonth', drzava.oznaka);
                                                })
                                            )
                                    }
                                })
                            )
                    })
                )
            })
        )
    }

    dohvatiNajveceITrenutneVrijednosti(gradLokacijeDTO: GradLokacijeArrayDTO) {
        const locations = gradLokacijeDTO.lokacije.map((lokacija, index) =>
            from(this.drzavaRepozitorij.findOne({ where: { oznaka: gradLokacijeDTO.drzavniKodovi[index] } })).pipe(
                concatMap((drzava) => {
                    if (drzava == null) {
                        const drzavaPogreska = new PogreskaPredlozak('drzava', DRZAVA_NE_POSTOJI);
                        throw new DrzavaNePostoji([drzavaPogreska]);
                    }
                    return from(this.gradRepozitorij.findOne({ where: { ime: lokacija, drzavaId: drzava.id } })).pipe(
                        tap((lokacija) => {
                            if (!lokacija) {
                                const lokacijaPogreska = new PogreskaPredlozak('lokacija', LOKACIJA_NE_POSTOJI);
                                throw new LokacijaNePostojiPogreska([lokacijaPogreska]);
                            }
                        })
                    )
                })
            ))

        return forkJoin(locations).pipe(
            map((lokacije) => {
                const foundLocationIds = lokacije.map((lokacija) => lokacija.id);

                return [foundLocationIds, lokacije];
            }),
            concatMap(([foundLocationIds, lokacije]) => {
                return from(this.gradPodaciRepozitorij
                    .find({
                        relations: ["gradId"],
                        where: { gradId: In([foundLocationIds]) },
                        order: { vrijemeMjerenja: 'DESC' },
                        take: 1
                    })).pipe(
                        map((novoMjerenje: any) => {
                            let mjerenje = novoMjerenje.length != 0 ? novoMjerenje[0].gradId.id : undefined
                            let lokacijaNaziv = Object.values(lokacije)
                                .find((el1: any) => el1.id == mjerenje)

                            if (lokacijaNaziv != undefined)
                                lokacijaNaziv = lokacijaNaziv.ime
                            return ({
                                temperatura: novoMjerenje[0]?.temperatura ?? -999,
                                vlaga: novoMjerenje[0]?.vlaga ?? -999,
                                tlak: novoMjerenje[0]?.tlak ?? -999,
                                lokacija: lokacijaNaziv ? lokacijaNaziv : "/"
                            })
                        }),
                        concatMap((novoMjerenje) => {
                            let lokacijeMaksimalneVrijednosti = []
                            const maxTemperatura = this.gradPodaciRepozitorij
                                .createQueryBuilder('measurement')
                                .leftJoinAndSelect('measurement.gradId', 'grad')
                                .where('measurement.gradId IN (:...foundLocationIds)', { foundLocationIds })
                                .orderBy('measurement.temperatura', 'DESC')
                                .getOne();

                            const maxVlaga = this.gradPodaciRepozitorij
                                .createQueryBuilder('measurement')
                                .leftJoinAndSelect('measurement.gradId', 'grad')
                                .where('measurement.gradId IN (:...foundLocationIds)', { foundLocationIds })
                                .orderBy('measurement.vlaga', 'DESC')
                                .getOne();

                            const maxTlak = this.gradPodaciRepozitorij
                                .createQueryBuilder('measurement')
                                .leftJoinAndSelect('measurement.gradId', 'grad')
                                .where('measurement.gradId IN (:...foundLocationIds)', { foundLocationIds })
                                .orderBy('measurement.tlak', 'DESC')
                                .getOne();

                            return forkJoin([maxTemperatura, maxVlaga, maxTlak]).pipe(
                                map(([maxTemperatura, maxVlaga, maxTlak]) => {
                                    if (maxTemperatura && maxVlaga && maxTlak &&
                                        'gradId' in maxTemperatura &&
                                        'gradId' in maxVlaga &&
                                        'gradId' in maxTlak) {
                                        lokacijeMaksimalneVrijednosti.push((maxTemperatura.gradId as any).id)
                                        lokacijeMaksimalneVrijednosti.push((maxVlaga.gradId as any).id)
                                        lokacijeMaksimalneVrijednosti.push((maxTlak.gradId as any).id)
                                    }

                                    const lokacijeNazivi = lokacijeMaksimalneVrijednosti.map(id => {
                                        const item = Object.values(lokacije).find(item => item.id == id);
                                        return item.ime;
                                    });

                                    return ({
                                        temperatura: maxTemperatura?.temperatura ?? -999,
                                        vlaga: maxVlaga?.vlaga ?? -999,
                                        tlak: maxTlak?.tlak ?? -999,
                                        lokacija: lokacijeNazivi.length > 0 ? lokacijeNazivi : []
                                    })
                                }),
                                map((najveceMjerenje) => ({ novo: novoMjerenje, najvece: najveceMjerenje }))
                            )
                        })
                    )
            })
        )
    }

    dajFavorite(korisnikId: number) {
        return this.dajFavoriteKorisnik(korisnikId)
    }

    dajFlitrirano(filter: string, gradLokacija: GradLokacijeDTO, korisnikId: number, datum?: string) {
        return from(this.drzavaRepozitorij.findOne({ where: { oznaka: gradLokacija.drzava } })).pipe(
            concatMap((drzava) => {
                if (drzava == null) {
                    const drzavaPogreska = new PogreskaPredlozak('drzava', DRZAVA_NE_POSTOJI);
                    throw new DrzavaNePostoji([drzavaPogreska]);
                }

                return from(this.gradRepozitorij.findOne({ where: { ime: gradLokacija.lokacija, drzavaId: drzava.id } })).pipe(
                    tap(() => {
                        if (filter == undefined) {
                            const pogreska = new PogreskaPredlozak('grad', []);
                            throw new GradNePostoji([pogreska]);
                        }
                    }),
                    tap((grad) => {
                        if (grad == undefined) {
                            const gradPogreska = new PogreskaPredlozak('grad', GRAD_NE_POSTOJI);
                            throw new GradNePostoji([gradPogreska]);
                        }
                    }),
                    concatMap((lokacija) => {
                        switch (filter) {
                            case "sat": {
                                const today = new Date();
                                const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
                                const gradId = lokacija.id

                                return from(this.gradPodaciRepozitorij
                                    .createQueryBuilder('measurement')
                                    .leftJoinAndSelect('measurement.gradId', 'grad')
                                    .where('prognoza = false AND grad.id = :gradId AND measurement.vrijemeMjerenja >= :startOfDay AND measurement.vrijemeMjerenja < :endOfDay', {
                                        gradId: gradId,
                                        startOfDay: startDate,
                                        endOfDay: endDate,
                                    })
                                    .orderBy('measurement.vrijemeMjerenja', 'ASC')
                                    .getMany()).pipe(
                                        map(rezultat => {
                                            return this.grupiraj(rezultat, lokacija.ime, 'hour', drzava.oznaka)
                                        })
                                    )
                            }
                            case "dan": {
                                const targetDate = new Date();
                                const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
                                const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);
                                const gradId = lokacija.id;
                                return from(
                                    this.gradPodaciRepozitorij
                                        .createQueryBuilder('measurement')
                                        .leftJoinAndSelect('measurement.gradId', 'grad')
                                        .where('prognoza = false AND grad.id = :gradId AND measurement.vrijemeMjerenja >= :startOfDay AND measurement.vrijemeMjerenja < :endOfDay', {
                                            gradId: gradId,
                                            startOfDay: startDate,
                                            endOfDay: endDate,
                                        })
                                        .orderBy('measurement.vrijemeMjerenja', 'ASC')
                                        .getMany()
                                ).pipe(
                                    map((rezultat) => {
                                        return this.grupiraj(rezultat, lokacija.ime, 'dayOfMonth', drzava.oznaka);
                                    })
                                );
                            }
                            case "mjesec": {
                                const targetDate = new Date();
                                const currentYear = targetDate.getFullYear();

                                const startDate = new Date(currentYear, 0, 1);
                                const endDate = new Date(currentYear + 1, 0, 1);

                                const gradId = lokacija.id;

                                return from(
                                    this.gradPodaciRepozitorij
                                        .createQueryBuilder('measurement')
                                        .leftJoinAndSelect('measurement.gradId', 'grad')
                                        .where('prognoza = false AND grad.id = :gradId AND measurement.vrijemeMjerenja >= :startOfDay AND measurement.vrijemeMjerenja < :endOfDay', {
                                            gradId: gradId,
                                            startOfDay: startDate,
                                            endOfDay: endDate,
                                        })
                                        .orderBy('measurement.vrijemeMjerenja', 'ASC')
                                        .getMany()
                                ).pipe(
                                    map((rezultat) => {
                                        return this.grupiraj(rezultat, lokacija.ime, 'month', drzava.oznaka);
                                    })
                                );
                            }
                            case "godina": {
                                const gradId = lokacija.id;

                                return from(
                                    this.gradPodaciRepozitorij
                                        .createQueryBuilder('measurement')
                                        .leftJoinAndSelect('measurement.gradId', 'grad')
                                        .where('prognoza = false AND grad.id = :gradId', {
                                            gradId: gradId,
                                        })
                                        .orderBy('measurement.vrijemeMjerenja', 'ASC')
                                        .getMany()
                                ).pipe(
                                    map((rezultat) => {
                                        return this.grupiraj(rezultat, lokacija.ime, 'year', drzava.oznaka);
                                    })
                                );
                            }
                            case "odabraniDatum": {
                                const targetDate = new Date(datum);
                                const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
                                const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

                                const gradId = lokacija.id;

                                return from(
                                    this.gradPodaciRepozitorij
                                        .createQueryBuilder('measurement')
                                        .leftJoinAndSelect('measurement.gradId', 'grad')
                                        .where('prognoza = false AND grad.id = :gradId  AND measurement.vrijemeMjerenja >= :startOfDay AND measurement.vrijemeMjerenja < :endOfDay', {
                                            gradId: gradId,
                                            startOfDay: startDate,
                                            endOfDay: endDate,
                                        })
                                        .orderBy('measurement.vrijemeMjerenja', 'ASC')
                                        .getMany()
                                ).pipe(
                                    map((rezultat) => {
                                        return this.grupiraj(rezultat, lokacija.ime, 'hour', drzava.oznaka);
                                    })
                                );
                            }
                        }
                    })
                )
            })
        )
    }

    grupiraj(data, lokacija, groupBy, drzava) {
        const groupedData = {};

        data.forEach((entry) => {
            const groupKey = this.dohvatiKljucZaGrupiranje(entry, groupBy);
            const locationName = lokacija;

            if (!groupedData[locationName]) {
                groupedData[locationName] = {};
            }

            if (!groupedData[locationName][groupKey]) {
                groupedData[locationName][groupKey] = [];
            }

            groupedData[locationName][groupKey].push(entry);
        });

        const finalResult = {};
        for (const locationName in groupedData) {
            finalResult[locationName] = [];

            for (const groupKey in groupedData[locationName]) {
                const dayData = groupedData[locationName][groupKey];
                const meanValue = this.izracunajSrednju(dayData);

                finalResult[locationName].push({
                    temperatura: meanValue.temperatura,
                    vlaga: meanValue.vlaga,
                    tlak: meanValue.tlak,
                    vrijemeMjerenja: groupBy == 'hour' ?
                        (new Date(dayData[0].vrijemeMjerenja).setHours(Number(groupKey), 0, 0)) : dayData[0].vrijemeMjerenja,
                    [groupBy]: groupKey,
                    lokacija: locationName,
                    drzava: drzava,
                });
            }
        }

        return finalResult;
    }

    izracunajSrednju(data) {
        const totalTemperatura = data.reduce((sum, entry) => sum + parseFloat(entry.temperatura), 0);
        const totalTlak = data.reduce((sum, entry) => sum + parseFloat(entry.tlak), 0);
        const totalVlaga = data.reduce((sum, entry) => sum + parseFloat(entry.vlaga), 0);

        const temperatura = totalTemperatura / data.length;
        const tlak = totalTlak / data.length;
        const vlaga = totalVlaga / data.length;

        return { temperatura, tlak, vlaga };
    }

    dohvatiKljucZaGrupiranje(entry, groupBy) {
        if (groupBy === 'hour') {
            return moment(entry.vrijemeMjerenja).format('H');
        } else if (groupBy === 'dayOfMonth') {
            return moment(entry.vrijemeMjerenja).format('D');
        }
        else if (groupBy === 'month') {
            return moment(entry.vrijemeMjerenja).format('M');
        }
        else if (groupBy === 'year') {
            return moment(entry.vrijemeMjerenja).format('Y');
        }
        else {
            throw new Error("");
        }
    }
}