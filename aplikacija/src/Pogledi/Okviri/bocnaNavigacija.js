window.addEventListener('load', function () {
    const posaljiHttpZahtjev = (url, metoda, body, token) => {
        let konfig;
        if (body instanceof FormData) {
            konfig = {
                method: metoda,
                body: body,
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ""
                }
            }
        } else {
            konfig = {
                method: metoda,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ""
                },
                body: body ? JSON.stringify(body) : undefined,
            };
        }

        return rxjs.from(fetch(url, konfig))
            .pipe(
                rxjs.mergeMap(response => rxjs.from(response.text())),
                rxjs.map(data => {
                    return data ? function () {
                        try {
                            return JSON.parse(data)
                        }
                        catch {
                            document.documentElement.innerHTML = '';

                            document.open();
                            document.write(data);
                            document.close();
                        }
                    }() : undefined
                })
            );
    }

    const dajToken = () => {
        return posaljiHttpZahtjev("/api/korisnici/dajToken", "GET").pipe(
            rxjs.map(odgovor => odgovor.podaci),
        )
    }

    const posaljiZahtjevSaTokenom = (url, metoda, body) => {
        return dajToken().pipe(
            rxjs.mergeMap((token) => {
                pocisti()
                return posaljiHttpZahtjev(url, metoda, body, token)
            })
        )
    }

    if (document.getElementById("otvori-prijava")) {
        rxjs.fromEvent(document.getElementById("otvori-prijava"), 'click').pipe(
            rxjs.mergeMap(() => {
                return posaljiHttpZahtjev("http://localhost:3000/prijava", "GET", undefined)
            })
        ).subscribe()
    }
    if (document.getElementById("otvori-registracija")) {
        rxjs.fromEvent(document.getElementById("otvori-registracija"), 'click').pipe(
            rxjs.mergeMap(() => {
                return posaljiZahtjevSaTokenom("http://localhost:3000/registracija", "GET", undefined)
            })
        ).subscribe()

    }
    if (document.getElementById("otvori-pocetna")) {
        rxjs.fromEvent(document.getElementById("otvori-pocetna"), 'click').pipe(
            rxjs.mergeMap(() => {
                return posaljiZahtjevSaTokenom("http://localhost:3000/pocetna", "GET", undefined)
            })
        ).subscribe()
    }
    if (document.getElementById("otvori-foi-bocna")) {
        rxjs.fromEvent(document.getElementById("otvori-foi-bocna"), 'click').pipe(
            rxjs.mergeMap(() => {
                return posaljiZahtjevSaTokenom("http://localhost:3000/foi-lokacije", "GET", undefined)
            })
        ).subscribe()

    }
    if (document.getElementById("otvori-lokacije")) {
        rxjs.fromEvent(document.getElementById("otvori-lokacije"), 'click').pipe(
            rxjs.mergeMap(() => {
                return posaljiZahtjevSaTokenom("http://localhost:3000/lokacije", "GET", undefined)
            })
        ).subscribe()
    }
    if (document.getElementById("otvori-svijet-bocna")) {
        rxjs.fromEvent(document.getElementById("otvori-svijet-bocna"), 'click').pipe(
            rxjs.mergeMap(() => {
                return posaljiZahtjevSaTokenom("http://localhost:3000/grad-lokacije", "GET", undefined)
            })
        ).subscribe()
    }
    if (document.getElementById("otvori-korisnici")) {
        rxjs.fromEvent(document.getElementById("otvori-korisnici"), 'click').pipe(
            rxjs.mergeMap(() => {
                return posaljiZahtjevSaTokenom("http://localhost:3000/korisnici", "GET", undefined)
            })
        ).subscribe()

    }
    if (document.getElementById("otvori-profil")) {
        rxjs.fromEvent(document.getElementById("otvori-profil"), 'click').pipe(
            rxjs.mergeMap(() => {
                return posaljiZahtjevSaTokenom("http://localhost:3000/profil", "GET", undefined)
            })
        ).subscribe()
    }
    if (document.getElementById("otvori-dokumentacija")) {
        rxjs.fromEvent(document.getElementById("otvori-dokumentacija"), 'click').pipe(
            rxjs.mergeMap(() => {
                return posaljiZahtjevSaTokenom("http://localhost:3000/dokumentacija", "GET", undefined)
            })
        ).subscribe()

    }
    if (document.getElementById("otvori-odjava")) {
        rxjs.fromEvent(document.getElementById("otvori-odjava"), 'click').pipe(
            rxjs.mergeMap(() => {
                return posaljiZahtjevSaTokenom("http://localhost:3000/api/korisnici/odjava", "GET", undefined)
            }),
            rxjs.mergeMap(() => {
                return posaljiZahtjevSaTokenom("http://localhost:3000/", "GET", undefined)
            }),
        ).subscribe()
    }

    const pocisti = () => {
        if (window['gradLokacijePodaciIntervalObservable'] != undefined) {
            window['gradLokacijePodaciIntervalObservable'].unsubscribe()
            window['gradLokacijePodaciIntervalObservable'] = undefined
        }
        if (window['foiLokacijePodaciIntervalObservable'] != undefined) {
            window['foiLokacijePodaciIntervalObservable'].unsubscribe()
            window['foiLokacijePodaciIntervalObservable'] = undefined
        }
        if (window["intervalPrognoze"] != undefined) {
            window["intervalPrognoze"].unsubscribe()
            window["intervalPrognoze"] = undefined
        }
    }
})