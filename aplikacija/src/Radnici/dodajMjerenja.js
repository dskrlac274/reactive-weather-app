const mysql = require('mysql2/promise');
const rxjs = require('rxjs');

const API_KEY = '57b8f40f9a8b0c79e8fd92aaf974cd5d';

function dodaj() {

    const podaci = {
        host: 'localhost',
        user: 'root',
        password: '2805',
        database: 'zavrsni',
        port: 3306
    }
    const pool = mysql.createPool(podaci);

    function findDrzavaByOznaka(oznaka) {
        return rxjs.from(pool.execute('SELECT * FROM drzava WHERE oznaka = ?', [oznaka]))
            .pipe(
                rxjs.map((rows) => rows[0]),
                rxjs.map(drzava => {
                    if (Object.values(drzava).length == 0) {
                        return -999
                    }
                    return drzava
                })
            );
    }

    function findGradByImeAndDrzavaId(ime, drzavaId) {
        return rxjs.from(pool.execute('SELECT * FROM grad WHERE ime = ? AND drzava_id = ?', [ime, drzavaId]))
            .pipe(
                rxjs.map((rows) => rows[0]),
                rxjs.map(grad => {
                    if (Object.values(grad).length == 0) {
                        return -999
                    }
                    return grad
                })
            );
    }

    function findGradPodaciByVrijemeMjerenjaAndGradId(vrijemeMjerenja, gradId) {
        return rxjs.from(pool.execute('SELECT * FROM grad_podaci WHERE vrijeme_mjerenja = ? AND grad_id = ?', [vrijemeMjerenja, gradId]))
            .pipe(
                rxjs.map((rows) => rows[0]),
                rxjs.tap((rez) => {
                    if (Object.values(rez).length > 0) {
                        console.log("Zapis već postoji")
                        return -999
                    }
                    return rez
                })
            );
    }

    rxjs.from(mysql.createConnection(podaci)).pipe(
        rxjs.concatMap(connection => rxjs.from(connection.query('SELECT * FROM grad')).pipe(
            rxjs.map(results => Array.from(JSON.parse(JSON.stringify(results))[0])),
            rxjs.filter(x => Object.values(x).length > 0),
            rxjs.concatMap((locations) => { return rxjs.from(Object.values(locations)) }),
            rxjs.concatMap((location) => {
                return rxjs.from(fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.zemljopisna_sirina}&lon=${location.zemljopisna_duzina}&appid=${API_KEY}`)).pipe(
                    rxjs.concatMap(response => rxjs.from(response.json())),
                    rxjs.concatMap((podaci) => {
                        const weatherInfo = {
                            grad_id: location.id,
                            vrijeme_mjerenja: new Date(podaci.dt * 1000),
                            temperatura: podaci.main.temp - 273.15,
                            tlak: podaci.main.pressure,
                            vlaga: podaci.main.humidity,
                            prognoza: 0,
                        };

                        return findDrzavaByOznaka(podaci.sys.country)
                            .pipe(
                                rxjs.filter(x => x != -999),
                                rxjs.concatMap(drzava => findGradByImeAndDrzavaId(location.ime, drzava[0].id)),
                                rxjs.filter(x => x != -999),
                                rxjs.concatMap(grad => findGradPodaciByVrijemeMjerenjaAndGradId(weatherInfo.vrijeme_mjerenja, grad[0].id)),
                                rxjs.filter(x => x != -999),
                                rxjs.tap(() => {
                                    const insertQuery = `
                            INSERT INTO grad_podaci (grad_id, vrijeme_mjerenja, temperatura, vlaga, tlak, prognoza)
                            VALUES (?, ?, ?, ?, ?, ?)`;

                                    return rxjs.from(connection.query(insertQuery, [
                                        location.id,
                                        weatherInfo.vrijeme_mjerenja,
                                        weatherInfo.temperatura,
                                        weatherInfo.vlaga,
                                        weatherInfo.tlak,
                                        weatherInfo.prognoza
                                    ])).pipe(
                                        rxjs.catchError(error => {
                                            console.error('Greska:', error.message);
                                            return rxjs.EMPTY;
                                        })
                                    );
                                })
                            );
                    })
                )
            }),
            rxjs.catchError(error => {
                console.error('Greska:', error.message);
                return rxjs.EMPTY;
            }),
            rxjs.finalize(() => {
                connection.release();
            })
        ))
    ).subscribe({
        complete: () => {
            console.log('Gotovo.');
        },
        error: (greska) => {
            console.log("Greska:", greska)
        }
    });
}

setInterval(dodaj, 5 * 60 * 1000)
