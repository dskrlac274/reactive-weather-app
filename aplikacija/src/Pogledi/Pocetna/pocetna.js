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
                return posaljiHttpZahtjev(url, metoda, body, token)
            })
        )
    }

    rxjs.fromEvent(document.getElementById("otvori-foi"), 'click').pipe(
        rxjs.mergeMap(() => {
            return posaljiZahtjevSaTokenom("http://localhost:3000/foi-lokacije", "GET", undefined)
        })
    ).subscribe()

    rxjs.fromEvent(document.getElementById("otvori-svijet"), 'click').pipe(
        rxjs.mergeMap(() => {
            return posaljiZahtjevSaTokenom("http://localhost:3000/grad-lokacije", "GET")
        })
    ).subscribe()
})