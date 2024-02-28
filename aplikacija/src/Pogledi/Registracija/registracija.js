window.addEventListener('load', function() {
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

    const registrirajSe = () => {
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

        const input3 = rxjs.fromEvent(document.getElementById("validationServerName"), 'keyup').pipe(
            rxjs.map((event) => event.target.value),
            rxjs.map((value) => !!value),
            rxjs.startWith(false)
        );

        const input4 = rxjs.fromEvent(document.getElementById("validationServerSurname"), 'keyup').pipe(
            rxjs.map((event) => event.target.value),
            rxjs.map((value) => !!value),
            rxjs.startWith(false)
        );

        const input5 = rxjs.fromEvent(document.getElementById("validationServerEmail"), 'keyup').pipe(
            rxjs.map((event) => event.target.value),
            rxjs.map((value) => !!value),
            rxjs.startWith(false)
        );

        const input6 = rxjs.fromEvent(document.getElementById("validationServerAddress"), 'keyup').pipe(
            rxjs.map((event) => event.target.value),
            rxjs.map((value) => !!value),
            rxjs.startWith(false)
        );

        rxjs.combineLatest(input1, input2, input3, input4, input5, input6).subscribe(([input1Value, input2Value, input3Value, input4Value, input5Value, input6Value]) => {
            document.getElementById("registriraj-se").disabled = !(input1Value && input2Value && input3Value && input4Value && input5Value && input6Value);
        })

        rxjs.fromEvent(document.getElementById("registriraj-se"), 'click').pipe(
            rxjs.tap((event) => event.preventDefault),
            rxjs.mergeMap(() => {
                document.getElementById("registriraj-se").innerHTML = `<div id="spinner-aktivacija" class="spinner-border" role="status"
                style="margin-left: auto;margin-right: auto;display: flex;"></div>`

                const ime = document.getElementById("validationServerName").value
                const prezime = document.getElementById("validationServerSurname").value
                const korime = document.getElementById("validationServerUsername").value
                const lozinka = document.getElementById("validationServerPassword").value
                const email = document.getElementById("validationServerEmail").value
                const adresa = document.getElementById("validationServerAddress").value

                return posaljiHttpZahtjev("api/korisnici/registracija", "POST", {
                    ime: ime,
                    prezime: prezime,
                    korime: korime,
                    lozinka: lozinka,
                    email: email,
                    adresa: adresa
                })
            }),
            rxjs.tap(x => {
                const greske = x.greske;
                
                document.getElementById("ime-greska").hidden = true
                document.getElementById("ime-greska").textContent = ""
                document.getElementById("validationServerName").classList.remove("is-invalid");

                document.getElementById("prezime-greska").hidden = true
                document.getElementById("prezime-greska").textContent = ""
                document.getElementById("validationServerSurname").classList.remove("is-invalid");

                document.getElementById("korime-greska").hidden = true
                document.getElementById("korime-greska").textContent = ""
                document.getElementById("validationServerUsername").classList.remove("is-invalid");

                document.getElementById("lozinka-greska").hidden = true
                document.getElementById("lozinka-greska").textContent = ""
                document.getElementById("validationServerPassword").classList.remove("is-invalid");

                document.getElementById("email-greska").hidden = true
                document.getElementById("email-greska").textContent = ""
                document.getElementById("validationServerEmail").classList.remove("is-invalid");

                document.getElementById("adresa-greska").hidden = true
                document.getElementById("adresa-greska").textContent = ""
                document.getElementById("validationServerAddress").classList.remove("is-invalid");

                if (x.statusniKod >= 400) {
                    document.getElementById("spinner-aktivacija").hidden = true;
                    document.getElementById("registriraj-se").innerHTML = "Registriraj se"

                    if (greske.hasOwnProperty("ime")) {
                        document.getElementById("ime-greska").hidden = false
                        document.getElementById("ime-greska").textContent = greske["ime"]
                        document.getElementById("validationServerName").classList.add("is-invalid");
                    }
                    if (greske.hasOwnProperty("prezime")) {
                        document.getElementById("prezime-greska").hidden = false
                        document.getElementById("prezime-greska").textContent = greske["prezime"]
                        document.getElementById("validationServerSurname").classList.add("is-invalid");
                    }
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
                    if (greske.hasOwnProperty("email")) {
                        document.getElementById("email-greska").hidden = false
                        document.getElementById("email-greska").textContent = greske["email"]
                        document.getElementById("validationServerEmail").classList.add("is-invalid");
                    }
                    if (greske.hasOwnProperty("adresa")) {
                        document.getElementById("adresa-greska").hidden = false
                        document.getElementById("adresa-greska").textContent = greske["adresa"]
                        document.getElementById("validationServerAddress").classList.add("is-invalid");
                    }
                }
                else {
                    $('#prikaziAktivaciju').modal('show')

                    document.getElementById("obavijest-radnja-aktivacija").hidden = false
                    document.getElementById("obavijest-radnja-aktivacija").textContent = x.poruka
                    document.getElementById("spinner-aktivacija").hidden = true;
                    document.getElementById("registriraj-se").innerHTML = "Registriraj se"

                    document.getElementById("ok-gumb-aktivacija").disabled = false

                    rxjs.fromEvent(document.getElementById('ok-gumb-aktivacija'), 'click').pipe(
                        rxjs.mergeMap(() => {
                            document.getElementById("obavijest-radnja-aktivacija").textContent = "";
                            document.getElementById("obavijest-radnja-aktivacija").hidden = true
                            return dajToken().pipe(
                                rxjs.mergeMap(token => {
                                    return posaljiHttpZahtjev("http://localhost:3000/", "GET", undefined, token);
                                })
                            )
                        })
                    ).subscribe()
                }
            })
        ).subscribe()
    }
    registrirajSe()
})