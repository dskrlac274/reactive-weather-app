import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Observable, from, map, tap, EMPTY, forkJoin, concatMap } from 'rxjs';
import { LokacijaDTO, LokacijeArrayDTO } from 'src/DTO/LokacijaArrayDTO';
import { CsvNijeIspravan, FoiApiPravoPristupa, LokacijaNePostojiPogreska, FoiLokacijaVecPostojiPogreska, PogreskaPredlozak, DatumNijeIspravan } from 'src/Pogreske/Pogreske';
import { CSV_NIJE_ISPRAVAN, LOKACIJA_NE_POSTOJI, FOI_LOKACIJA_POSTOJI, FOI_LOKACIJE_BEZ_MJERENJA_NE_POSTOJE, FOI_LOKACIJE_NE_POSTOJE, PRISTUP_FOI_API_NIJE_DOZVOLJEN, DATUM_NIJE_ISPRAVAN } from 'src/Pogreske/PorukeKonstante';
import { FoiLokacije } from 'src/Sheme/FoiLokacijeShema';
import { FoiLokacijePodaci } from 'src/Sheme/FoiLokacijePodaciShema';
import { LokacijePodaciDTO } from 'src/DTO/LokacijePodaciDTO';
import { KorisnikServis } from './KorisnikServis';
import { Korisnik } from 'src/Entiteti/KorisnikEntitet';
import { VrstaKorisnikaEnum } from 'src/Enumeracije/VrstaKorisnikaEnumeracija';
import { TipKorisnika } from 'src/Entiteti/TipKorisnikaEntitet';
import { Readable } from 'typeorm/platform/PlatformTools';
import { LokacijeTjedanStranicenje } from 'src/DTO/LokacijeTjedanStranicenjeDTO';
const papa = require('papaparse')
const moment = require('moment');

@Injectable()
export class FoiPodaciServis {

    constructor(@InjectModel(FoiLokacijePodaci.name) private foiLokacijePodaciModel: Model<FoiLokacijePodaci>,
        @InjectModel(FoiLokacije.name) private foiLokacijeModel: Model<FoiLokacije>,
        private korisnikServis: KorisnikServis) { }

    dodajLokaciju(foiPodaciLokacijeDTO: LokacijaDTO): Observable<any> {
        return from(this.foiLokacijeModel.findOne({ naziv: foiPodaciLokacijeDTO.lokacija }).exec()).pipe(
            concatMap((lokacija: any) => {
                this.provjeraLokacijaPostoji(lokacija)
                const novaLokacija = new this.foiLokacijeModel({ naziv: foiPodaciLokacijeDTO.lokacija });
                return from(novaLokacija.save());
            }),
            map((novaLokacija: any) => ({ _id: novaLokacija._id, naziv: novaLokacija.naziv }))
        )
    }

    obrisiLokaciju(id: string): Observable<any> {
        return from(this.foiLokacijeModel.findOne({ _id: id.toString() }).exec()).pipe(
            concatMap((lokacija: any) => {
                this.provjeraLokacijaNePostoji(lokacija);
                return from(this.foiLokacijeModel.deleteOne({ _id: lokacija.id }).exec());
            })
        )
    }

    azurirajLokaciju(id: string, lokacijaAzuriranje: LokacijaDTO): Observable<any> {
        return from(this.foiLokacijeModel.findOne({ _id: id.toString() }).exec()).pipe(
            tap((lokacija: any) => {
                this.provjeraLokacijaNePostoji(lokacija);
            }),
            concatMap(() => {
                return from(this.foiLokacijeModel.findOne({ naziv: lokacijaAzuriranje.lokacija }).exec())
            }),
            tap((lokacija: any) => {
                this.provjeraLokacijaPostoji(lokacija);
            }),
            concatMap(() => {
                return from(this.foiLokacijeModel.updateOne({ _id: id }, { naziv: lokacijaAzuriranje.lokacija }).exec());
            })
        )
    }

    obrisiLokacijeZaKojeNePostojiMjerenje(): Observable<any> {
        return this.dohvatiLokacijeZaKojeNePostojiMjerenje().pipe(
            concatMap((lokacije: any[]) => {
                return forkJoin(
                    lokacije.map((lokacija) =>
                        from(this.foiLokacijeModel.deleteOne({ _id: lokacija._id }).exec())
                    )
                );
            }))
    }

    dohvatiLokacijeZaKojeNePostojiMjerenje() {
        return from(this.foiLokacijeModel.aggregate([
            {
                $lookup: {
                    from: "foi_lokacije_podaci",
                    localField: "_id",
                    foreignField: "lokacija",
                    as: "zapisi"
                }
            },
            {
                $match: {
                    zapisi: { $size: 0 }
                }
            },
            {
                $project: {
                    __v: 0,
                    zapisi: 0
                }
            }
        ]).exec()).pipe(
            tap((lokacije: any) => {
                if (lokacije.length == 0) {
                    const lokacijaPogreska = new PogreskaPredlozak('lokacija', FOI_LOKACIJE_BEZ_MJERENJA_NE_POSTOJE);
                    throw new LokacijaNePostojiPogreska([lokacijaPogreska]);
                }
            })
        )
    }

    dohvatiLokacije(): Observable<any> {
        return from(this.foiLokacijeModel.find().select('-__v').exec()).pipe(
            map((lokacije: any[]) => {
                this.provjeraLokacijeNePostoje(lokacije)
                return lokacije;
            })
        );
    }

    dohvatiLokaciju(id: string): Observable<any> {
        return from(this.foiLokacijeModel.findOne({ _id: id }).select('-__v').exec()).pipe(
            map((lokacija: any) => {
                this.provjeraLokacijaNePostoji(lokacija)
                return lokacija;
            })
        );
    }

    private dodajRezultateMjerenja(foiLokacijePodaciDTO: LokacijePodaciDTO): Observable<any> {
        return from(this.foiLokacijeModel.findOne({ naziv: foiLokacijePodaciDTO.lokacija }).exec()).pipe(
            concatMap((lokacija: any) => {
                this.provjeraLokacijaNePostoji(lokacija)
                const datum = moment(foiLokacijePodaciDTO.vrijemeMjerenja, "DD.MM.YYYY. HH:mm:ss");
                const noviLokacijePodaci = new this.foiLokacijePodaciModel({
                    lokacija: lokacija._id, vrijemeMjerenja: datum,
                    temperatura: foiLokacijePodaciDTO.temperatura, tlak: foiLokacijePodaciDTO.tlak,
                    vlaga: foiLokacijePodaciDTO.vlaga
                });
                return from(noviLokacijePodaci.save())
            })
        )
    }

    private provjeriApiKljuc(korisnik: Korisnik): boolean {
        this.korisnikServis.provjeriAkoKorisnikPostoji(korisnik);
        return (korisnik.tipKorisnikaId as unknown as TipKorisnika).id == VrstaKorisnikaEnum.PROFESOR ||
            (korisnik.tipKorisnikaId as unknown as TipKorisnika).id == VrstaKorisnikaEnum.ADMIN ? true :
            (function () {
                const ulogaKorisnikaPogreska = new PogreskaPredlozak('uloga', PRISTUP_FOI_API_NIJE_DOZVOLJEN);
                throw new FoiApiPravoPristupa([ulogaKorisnikaPogreska]);
            }())
    }

    dodajPodatkeMjerenja(apiKljuc: string, foiLokacijePodaciDTO: LokacijePodaciDTO): Observable<any> {
        return this.korisnikServis.dohvatiKorisnika({
            where: { ['apiKljuc']: apiKljuc },
            relations: ['tipKorisnikaId']
        }).pipe(
            concatMap((korisnik: Korisnik) => {
                this.provjeriApiKljuc(korisnik);
                return this.dodajRezultateMjerenja(foiLokacijePodaciDTO)
            })
        )
    }

    dohvatiNajveceITrenutneVrijednosti(foiLokacijeDTO: LokacijeArrayDTO) {
        const lokacije = foiLokacijeDTO.lokacije.map((lokacija: any) =>
            from(this.foiLokacijeModel.findOne({ naziv: lokacija }).exec()).pipe(
                tap((lokacija) => {
                    this.provjeraLokacijaNePostoji(lokacija)
                })
            )
        );

        return forkJoin(lokacije).pipe(
            map((lokacije: any[]) => {
                const foundLocationIds = lokacije.map((lokacija) => lokacija._id);
                return [foundLocationIds, lokacije];
            }),
            concatMap(([foundLocationIds, lokacije]) => {
                return from(
                    this.foiLokacijePodaciModel.find({ lokacija: { $in: foundLocationIds } }).sort({ vrijemeMjerenja: -1 }).limit(1)
                ).pipe(
                    map((novoMjerenje: any) => {
                        let mjerenje = novoMjerenje.length != 0 ? novoMjerenje[0].lokacija.toString() : undefined

                        let lokacijaNaziv = lokacije
                            .find((el1: any) => el1._id.toString() == mjerenje)

                        if (lokacijaNaziv != undefined)
                            lokacijaNaziv = lokacijaNaziv.naziv

                        return ({
                            temperatura: novoMjerenje[0]?.temperatura ?? -999,
                            vlaga: novoMjerenje[0]?.vlaga ?? -999,
                            tlak: novoMjerenje[0]?.tlak ?? -999,
                            lokacija: lokacijaNaziv ? lokacijaNaziv : ""
                        })
                    }),
                    concatMap((novoMjerenje) => {
                        let lokacijeMaksimalneVrijednosti = []
                        const maxTemperatura = this.foiLokacijePodaciModel
                            .findOne({ lokacija: { $in: foundLocationIds } }, { temperatura: 1, lokacija: 1 })
                            .sort({ temperatura: -1 });

                        const maxVlaga = this.foiLokacijePodaciModel
                            .findOne({ lokacija: { $in: foundLocationIds } }, { vlaga: 1, lokacija: 1 })
                            .sort({ vlaga: -1 });

                        const maxTlak = this.foiLokacijePodaciModel
                            .findOne({ lokacija: { $in: foundLocationIds } }, { tlak: 1, lokacija: 1 })
                            .sort({ tlak: -1 });

                        return forkJoin([maxTemperatura, maxVlaga, maxTlak]).pipe(
                            map(([maxTemperatura, maxVlaga, maxTlak]) => {
                                if (maxTemperatura && maxVlaga && maxTlak &&
                                    'lokacija' in maxTemperatura &&
                                    'lokacija' in maxVlaga
                                    && 'lokacija' in maxTlak) {
                                    lokacijeMaksimalneVrijednosti.push(maxTemperatura.lokacija)
                                    lokacijeMaksimalneVrijednosti.push(maxVlaga.lokacija)
                                    lokacijeMaksimalneVrijednosti.push(maxTlak.lokacija)
                                }

                                const lokacijeNazivi = lokacijeMaksimalneVrijednosti.map(id => {
                                    const item = Object.values(lokacije).find(item => id.toString() == item._id.toString());
                                    return item.naziv;
                                });

                                return ({
                                    temperatura: maxTemperatura?.temperatura ?? -999,
                                    vlaga: maxVlaga?.vlaga ?? -999,
                                    tlak: maxTlak?.tlak ?? -999,
                                    lokacija: lokacijeNazivi.length > 0 ? lokacijeNazivi : []
                                })
                            }),
                            map((najveceMjerenje) => ({ novo: novoMjerenje, najvece: najveceMjerenje })),
                        );
                    }),
                );
            }),
        );
    }

    dohvatiPodatkeFiltriranjePo(filter: string, foiLokacijeDTO: LokacijaDTO, datum?: string) {
        return from(this.foiLokacijeModel.findOne({ naziv: foiLokacijeDTO.lokacija }).exec()).pipe(
            tap((lokacija) => {
                this.provjeraLokacijaNePostoji(lokacija)
            }),
            concatMap((lokacija) => {
                switch (filter) {
                    case "sat": {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const endOfDay = new Date();
                        endOfDay.setHours(23, 59, 59, 999);

                        const query: any[] = [
                            {
                                $match: {
                                    lokacija: lokacija._id,
                                    vrijemeMjerenja: {
                                        $gte: today,
                                        $lt: endOfDay
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: {
                                        hour: { $hour: { date: "$vrijemeMjerenja", timezone: "Europe/Zagreb" } }
                                    },
                                    data: { $push: "$$ROOT" },
                                },
                            },
                            {
                                $sort: {
                                    "_id.hour": 1,
                                },
                            },
                        ];

                        return from(this.foiLokacijePodaciModel.aggregate(query)).pipe(
                            map((result) => {
                                const finalResult = {};
                                finalResult[lokacija.naziv] = []

                                result.forEach((entry) => {
                                    const hourData = entry.data;
                                    const meanValue = this.calculateMeanValue(hourData);
                                    const hour = entry._id.hour;
                                    const currentDate = new Date();
                                    currentDate.setHours(hour, 0, 0, 0);

                                    finalResult[lokacija.naziv].push({
                                        temperatura: meanValue.temperatura,
                                        vlaga: meanValue.vlaga,
                                        tlak: meanValue.tlak,
                                        vrijemeMjerenja: currentDate,
                                        lokacija: lokacija.naziv
                                    })
                                });

                                return finalResult;
                            })
                        );
                    }
                    case "dan": {
                        const currentDate = new Date();
                        const currentMonth = currentDate.getMonth() + 1;

                        const query: any[] = [
                            {
                                $match: {
                                    lokacija: lokacija._id,
                                    $expr: { $eq: [{ $month: { date: "$vrijemeMjerenja", timezone: "Europe/Zagreb" } }, currentMonth] },
                                },
                            },
                            {
                                $group: {
                                    _id: {
                                        day: { $dayOfMonth: { date: "$vrijemeMjerenja", timezone: "Europe/Zagreb" } },
                                    },
                                    data: { $push: "$$ROOT" },
                                },
                            },
                            {
                                $sort: {
                                    "_id.day": 1,
                                },
                            },
                        ];

                        return from(this.foiLokacijePodaciModel.aggregate(query)).pipe(
                            map((result) => {
                                const finalResult = {};
                                finalResult[lokacija.naziv] = [];

                                result.forEach((entry) => {
                                    const day = entry._id.day;
                                    const dayData = entry.data;
                                    const meanValue = this.calculateMeanValue(dayData);

                                    const currentDate = new Date();
                                    currentDate.setDate(day);
                                    currentDate.setHours(0);
                                    currentDate.setMinutes(0)
                                    currentDate.setSeconds(0)


                                    finalResult[lokacija.naziv].push({
                                        temperatura: meanValue.temperatura,
                                        vlaga: meanValue.vlaga,
                                        tlak: meanValue.tlak,
                                        vrijemeMjerenja: currentDate,
                                        lokacija: lokacija.naziv,
                                    });
                                });

                                return finalResult;
                            })
                        )
                    }
                    case "mjesec": {
                        const currentDate = new Date();
                        const currentYear = currentDate.getFullYear();

                        const query: any[] = [
                            {
                                $match: {
                                    lokacija: lokacija._id,
                                    $expr: { $eq: [{ $year: { date: "$vrijemeMjerenja", timezone: "Europe/Zagreb" } }, currentYear] },
                                },
                            },
                            {
                                $group: {
                                    _id: {
                                        month: { $month: { date: "$vrijemeMjerenja", timezone: "Europe/Zagreb" } },
                                    },
                                    data: { $push: "$$ROOT" },
                                },
                            },
                            {
                                $sort: {
                                    "_id.month": 1,
                                },
                            },
                        ];

                        return from(this.foiLokacijePodaciModel.aggregate(query)).pipe(
                            map((result) => {
                                const finalResult = {};
                                finalResult[lokacija.naziv] = [];

                                result.forEach((entry) => {
                                    const month = entry._id.month;
                                    const dayData = entry.data;
                                    const meanValue = this.calculateMeanValue(dayData);

                                    const currentDate = new Date();
                                    currentDate.setFullYear(currentYear);
                                    currentDate.setMonth(month);
                                    currentDate.setDate(1);
                                    currentDate.setHours(0, 0, 0, 0);

                                    finalResult[lokacija.naziv].push({
                                        temperatura: meanValue.temperatura,
                                        vlaga: meanValue.vlaga,
                                        tlak: meanValue.tlak,
                                        vrijemeMjerenja: currentDate,
                                        lokacija: lokacija.naziv,
                                    });
                                });

                                return finalResult;
                            })
                        )
                    }
                    case "godina": {
                        const currentDate = new Date();
                        const currentYear = currentDate.getFullYear();

                        const query: any[] = [
                            {
                                $match: {
                                    lokacija: lokacija._id,
                                    $expr: { $eq: [{ $year: { date: "$vrijemeMjerenja", timezone: "Europe/Zagreb" } }, currentYear] },
                                },
                            },
                            {
                                $group: {
                                    _id: {
                                        year: { $year: { date: "$vrijemeMjerenja", timezone: "Europe/Zagreb" } },
                                    },
                                    data: { $push: "$$ROOT" },
                                },
                            },
                            {
                                $sort: {
                                    "_id.year": 1,
                                },
                            },
                        ];


                        return from(this.foiLokacijePodaciModel.aggregate(query)).pipe(
                            map((result) => {
                                const finalResult = {};
                                finalResult[lokacija.naziv] = [];

                                result.forEach((entry) => {
                                    const year = entry._id.year;
                                    const dayData = entry.data;
                                    const meanValue = this.calculateMeanValue(dayData);

                                    const currentDate = new Date();
                                    currentDate.setFullYear(year);
                                    currentDate.setMonth(1);
                                    currentDate.setDate(1);
                                    currentDate.setHours(0, 0, 0, 0);

                                    finalResult[lokacija.naziv].push({
                                        temperatura: meanValue.temperatura,
                                        vlaga: meanValue.vlaga,
                                        tlak: meanValue.tlak,
                                        vrijemeMjerenja: currentDate,
                                        lokacija: lokacija.naziv,
                                    });
                                });

                                return finalResult;
                            })
                        )
                    }
                    case "odabraniDatum": {
                        const trazeniDatum = new Date(datum);
                        const year = trazeniDatum.getFullYear()
                        const month = trazeniDatum.getMonth() + 1
                        const day = trazeniDatum.getDate()

                        const query: any[] = [
                            {
                                $match: {
                                    lokacija: lokacija._id,
                                    $expr: {
                                        $and: [
                                            { $eq: [{ $year: { date: "$vrijemeMjerenja", timezone: "Europe/Zagreb" } }, year] },
                                            { $eq: [{ $month: { date: "$vrijemeMjerenja", timezone: "Europe/Zagreb" } }, month] },
                                            { $eq: [{ $dayOfMonth: { date: "$vrijemeMjerenja", timezone: "Europe/Zagreb" } }, day] },
                                        ],
                                    },
                                },
                            },
                            {
                                $group: {
                                    _id: {
                                        hour: { $hour: { date: "$vrijemeMjerenja", timezone: "Europe/Zagreb" } },
                                    },
                                    data: { $push: "$$ROOT" },
                                },
                            },
                            {
                                $sort: {
                                    "_id.hour": 1,
                                },
                            },
                        ];

                        return from(this.foiLokacijePodaciModel.aggregate(query)).pipe(
                            map((result) => {
                                const finalResult = {};
                                finalResult[lokacija.naziv] = [];

                                result.forEach((entry) => {
                                    const hour = entry._id.hour;
                                    const dayData = entry.data;
                                    const meanValue = this.calculateMeanValue(dayData);

                                    const currentDate = new Date();
                                    currentDate.setHours(hour, 0, 0, 0);

                                    finalResult[lokacija.naziv].push({
                                        temperatura: meanValue.temperatura,
                                        vlaga: meanValue.vlaga,
                                        tlak: meanValue.tlak,
                                        vrijemeMjerenja: currentDate,
                                        lokacija: lokacija.naziv,
                                    });
                                });

                                return finalResult;
                            })
                        )
                    }
                }
            })
        )
    }

    dohvatiDane(podaci: LokacijaDTO) {
        return from(this.foiLokacijeModel.findOne({ naziv: podaci.lokacija }).exec()).pipe(
            concatMap((lokacija) => {
                this.provjeraLokacijaNePostoji(lokacija);

                return from(
                    this.foiLokacijePodaciModel.aggregate([
                        {
                            $match: {
                                lokacija: lokacija._id,
                            },
                        },
                        {
                            $group: {
                                _id: {
                                    lokacija: "$lokacija",
                                    date: {
                                        $dateToString: {
                                            format: "%Y-%m-%d",
                                            date: "$vrijemeMjerenja",
                                            timezone: "Europe/Zagreb"
                                        }
                                    },
                                }
                            }
                        },
                        {
                            $group: {
                                _id: "$_id.lokacija",
                                distinctDays: { $push: { $dateFromString: { dateString: "$_id.date", timezone: "Europe/Zagreb" } } },
                            },
                        },
                        {
                            $unwind: "$distinctDays"
                        },
                        {
                            $sort: {
                                "distinctDays": -1
                            }
                        },
                        {
                            $group: {
                                _id: "$_id",
                                distinctDays: { $push: "$distinctDays" }
                            }
                        }
                    ])
                )
            }),
            map(rezultat => {
                if (rezultat.length == 0)
                    return EMPTY
                return rezultat[0].distinctDays
            })
        );
    }

    dohvatiTjedanPodataka(podaci: LokacijeTjedanStranicenje) {
        const datumFormat = moment(podaci.datum, "DD.MM.YYYY.").toDate()

        const krajDatum = new Date(datumFormat);
        krajDatum.setDate(datumFormat.getDate() + 7);

        return from(this.foiLokacijeModel.findOne({ naziv: podaci.lokacija }).exec()).pipe(
            concatMap((lokacija) => {
                this.provjeraLokacijaNePostoji(lokacija);

                const finalResult = {};
                finalResult[lokacija.naziv] = [];

                const query: any[] = [
                    {
                        $match: {
                            lokacija: lokacija._id,
                            vrijemeMjerenja: { $gte: datumFormat, $lte: krajDatum }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                day: { $dayOfMonth: { date: "$vrijemeMjerenja", timezone: "Europe/Zagreb" } },
                                month: { $month: { date: "$vrijemeMjerenja", timezone: "Europe/Zagreb" } },
                                year: { $year: { date: "$vrijemeMjerenja", timezone: "Europe/Zagreb" } }
                            },
                            data: { $push: "$$ROOT" }
                        }
                    },
                    {
                        $sort: {
                            "_id.year": 1,
                            "_id.month": 1,
                            "_id.day": 1
                        }
                    }
                ];

                return from(this.foiLokacijePodaciModel.aggregate(query).exec()).pipe(
                    map((result) => {
                        result.forEach((entry) => {
                            const dayData = entry.data;
                            const meanValue = this.calculateMeanValue(dayData);

                            finalResult[lokacija.naziv].push({
                                temperatura: meanValue.temperatura,
                                vlaga: meanValue.vlaga,
                                tlak: meanValue.tlak,
                                vrijemeMjerenja: entry.data[0].vrijemeMjerenja,
                                lokacija: lokacija.naziv,
                            });
                        });

                        return finalResult;
                    })
                );
            })
        );
    }

    calculateMeanValue(data) {
        const totalTemperatura = data.reduce((sum, entry) => sum + parseFloat(entry.temperatura), 0);
        const totalTlak = data.reduce((sum, entry) => sum + parseFloat(entry.tlak), 0);
        const totalVlaga = data.reduce((sum, entry) => sum + parseFloat(entry.vlaga), 0);

        const temperatura = totalTemperatura / data.length;
        const tlak = totalTlak / data.length;
        const vlaga = totalVlaga / data.length;

        return { temperatura, tlak, vlaga };
    }

    spremiPodatkeDatoteke(podaci: any) {
        const stream = Readable.from(podaci.buffer);

        function parsirajCSV(stream) {
            return new Observable(observer => {
                let headers = [];
                let objekt = [];
                let i = 0;

                papa.parse(stream, {
                    header: false,
                    worker: true,
                    delimiter: ",",
                    step: function (row) {
                        if (i == 0) {
                            if (!row.data.includes("lokacija") ||
                                !row.data.includes("vrijemeMjerenja") ||
                                !row.data.includes("temperatura") ||
                                !row.data.includes("tlak") ||
                                !row.data.includes("vlaga") ||
                                row.data.length != 5 ||
                                podaci.mimetype !== 'text/csv') {
                                const csvPogreska = new PogreskaPredlozak('datoteka', CSV_NIJE_ISPRAVAN);
                                observer.error(new CsvNijeIspravan([csvPogreska]));
                            }
                            headers = row.data;
                        } else {
                            let obj = {};
                            row.data.forEach((value, index) => {
                                if (value == undefined) {
                                    const csvPogreska = new PogreskaPredlozak('datoteka', CSV_NIJE_ISPRAVAN);
                                    observer.error(new CsvNijeIspravan([csvPogreska]));
                                }
                                obj[headers[index]] = value;
                            });
                            objekt.push(obj);
                        }
                        i++;
                    },
                    complete: function () {
                        observer.next(objekt);
                        observer.complete();
                    },
                    error: function (error) {
                        observer.error(error);
                    }
                });
            });
        }

        return parsirajCSV(stream).pipe(
            concatMap((objektArray: any) => from(objektArray)),
            tap((objekt: any) => {
                let datum = moment(objekt.vrijemeMjerenja, "DD.MM.YYYY. HH:mm:ss")

                if (datum.isValid() == false) {
                    const datumPogreska = new PogreskaPredlozak('datum', DATUM_NIJE_ISPRAVAN);
                    throw new DatumNijeIspravan([datumPogreska])
                }

                const daniDatum = datum.toDate().getTime()
                const trenutniDatum = new Date().getTime()

                if (daniDatum > trenutniDatum) {
                    const datumPogreska = new PogreskaPredlozak('datum', DATUM_NIJE_ISPRAVAN);
                    throw new DatumNijeIspravan([datumPogreska])
                }
            }),
            concatMap(objekt => this.dodajRezultateMjerenja(objekt as LokacijePodaciDTO))
        )
    }

    provjeraLokacijeNePostoje(lokacije: any[]) {
        if (lokacije.length == 0) {
            const lokacijaPogreska = new PogreskaPredlozak('lokacija', FOI_LOKACIJE_NE_POSTOJE);
            throw new LokacijaNePostojiPogreska([lokacijaPogreska]);
        }
    }

    provjeraLokacijaNePostoji(lokacija: any | any[]) {
        if (!lokacija || lokacija.length == 0) {
            const lokacijaPogreska = new PogreskaPredlozak('lokacija', LOKACIJA_NE_POSTOJI);
            throw new LokacijaNePostojiPogreska([lokacijaPogreska]);
        }
    }

    provjeraLokacijaPostoji(lokacija: any) {
        if (lokacija) {
            const lokacijaPogreska = new PogreskaPredlozak('lokacija', FOI_LOKACIJA_POSTOJI);
            throw new FoiLokacijaVecPostojiPogreska([lokacijaPogreska]);
        }
    }
}