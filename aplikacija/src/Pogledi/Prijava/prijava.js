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

    const prijaviSe = () => {
        const input1 = rxjs.fromEvent(document.getElementById("validationServerUsername"), 'keyup').pipe(
            rxjs.map((event) => event.target.value),
            rxjs.map((value) => !!value),
            rxjs.startWith(false)
        );

        const input2 = rxjs.fromEvent(document.getElementById("validationServerPassword"), 'keyup').pipe(
            rxjs.map((event) => event.target.value),
            rxjs.map((value) => !!value),
            rxjs.startWith(false)
        );

        rxjs.combineLatest(input1, input2).subscribe(([input1Value, input2Value]) => {
            document.getElementById("prijavi-se").disabled = !(input1Value && input2Value);
        })

        rxjs.fromEvent(document.getElementById("prijavi-se"), 'click').pipe(
            rxjs.mergeMap(() => {
                const korime = document.getElementById("validationServerUsername").value
                const lozinka = document.getElementById("validationServerPassword").value

                return posaljiHttpZahtjev("api/korisnici/prijava", "POST", {
                    korime: korime,
                    lozinka: lozinka
                })
            }),
            rxjs.tap(x => {
                const greske = x.greske;

                document.getElementById("korime-greska").hidden = true
                document.getElementById("korime-greska").textContent = ""
                document.getElementById("validationServerUsername").classList.remove("is-invalid");

                document.getElementById("lozinka-greska").hidden = true
                document.getElementById("lozinka-greska").textContent = ""
                document.getElementById("validationServerPassword").classList.remove("is-invalid");

                if (x.statusniKod == 422 || x.statusniKod == 400 || x.statusniKod == 401 || x.statusniKod == 403) {
                    if (greske.hasOwnProperty("korime")) {
                        document.getElementById("korime-greska").hidden = false
                        document.getElementById("korime-greska").textContent = greske["korime"]
                        document.getElementById("validationServerUsername").classList.add("is-invalid");
                    }
                    if (greske.hasOwnProperty("lozinka")) {
                        document.getElementById("lozinka-greska").hidden = false
                        document.getElementById("lozinka-greska").textContent = greske["lozinka"]
                        document.getElementById("validationServerPassword").classList.add("is-invalid");
                    }
                }
                else {
                    return posaljiHttpZahtjev("http://localhost:3000/", "GET").subscribe()
                }
            })
        ).subscribe()
    }
    prijaviSe()
})