window.addEventListener('load', function() {
    let korisnikPodaci
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
    posaljiZahtjevSaTokenom("/api/korisnici/prijavljeniKorisnik", "GET", undefined).pipe(
        rxjs.tap(x => {
            korisnikPodaci = x.podaci
            document.getElementById("korisnik-ime").textContent += x.podaci.ime
            document.getElementById("korisnik-prezime").textContent += x.podaci.prezime
            document.getElementById("korisnik-korime").textContent += x.podaci.korime
            document.getElementById("korisnik-email").textContent += x.podaci.email
            document.getElementById("korisnik-adresa").textContent += x.podaci.adresa

        })
    ).subscribe()

    const input1 = rxjs.fromEvent(document.getElementById("korisnik-ime-azuriraj"), 'keyup').pipe(
        rxjs.map((event) => event.target.value),
        rxjs.map((value) => value !== korisnikPodaci.ime),
        rxjs.startWith(false)
    );

    const input2 = rxjs.fromEvent(document.getElementById("korisnik-prezime-azuriraj"), 'keyup').pipe(
        rxjs.map((event) => event.target.value),
        rxjs.map((value) => value !== korisnikPodaci.prezime),
        rxjs.startWith(false)
    );

    const input3 = rxjs.fromEvent(document.getElementById("korisnik-adresa-azuriraj"), 'keyup').pipe(
        rxjs.map((event) => event.target.value),
        rxjs.map((value) => value !== korisnikPodaci.adresa),
        rxjs.startWith(false)
    );

    const input4 = rxjs.fromEvent(document.getElementById("korisnik-lozinka-azuriraj"), 'keyup').pipe(
        rxjs.map((event) => event.target.value),
        rxjs.map((value) => !!value),
        rxjs.startWith(false)
    );

    rxjs.fromEvent(document.getElementById("azuriraj-profil"), 'click').pipe(
        rxjs.tap(() => {
            document.getElementById("korisnik-ime-azuriraj").value = korisnikPodaci.ime
            document.getElementById("korisnik-prezime-azuriraj").value = korisnikPodaci.prezime
            document.getElementById("korisnik-adresa-azuriraj").value = korisnikPodaci.adresa

            rxjs.combineLatest(input1, input2, input3, input4).subscribe(([input1Value, input2Value, input3Value, input4Value]) => {
                document.getElementById("azuriraj-profil-gumb").disabled = !(input1Value || input2Value || input3Value || input4Value);
            })
        }),
    ).subscribe()

    rxjs.fromEvent(document.getElementById("azuriraj-profil-gumb"), 'click').pipe(
        rxjs.tap(() => {
            //zapocni sa spinnerom, onemoguci izlazak
            document.getElementById("spinner-azuriranje-profil").hidden = false;
            document.getElementById("azuriraj-profil-gumb").disabled = true
            document.getElementById("odustani-gumb-azuriranje-profil").disabled = true;

            document.getElementById("ime-greska").hidden = true
            document.getElementById("ime-greska").textContent = ""
            document.getElementById("korisnik-ime-azuriraj").classList.remove("is-invalid");

            document.getElementById("prezime-greska").hidden = true
            document.getElementById("prezime-greska").textContent = ""
            document.getElementById("korisnik-prezime-azuriraj").classList.remove("is-invalid");

            document.getElementById("lozinka-greska").hidden = true
            document.getElementById("lozinka-greska").textContent = ""
            document.getElementById("korisnik-lozinka-azuriraj").classList.remove("is-invalid");

            document.getElementById("adresa-greska").hidden = true
            document.getElementById("adresa-greska").textContent = ""
            document.getElementById("korisnik-adresa-azuriraj").classList.remove("is-invalid");
        }),
        rxjs.mergeMap(() => {
            const updatedData = {
                ...(document.getElementById("korisnik-ime-azuriraj").value != "" || document.getElementById("korisnik-ime-azuriraj").value != korisnikPodaci.ime ? { ime: document.getElementById("korisnik-ime-azuriraj").value } : {}),
                ...(document.getElementById("korisnik-prezime-azuriraj").value != "" || document.getElementById("korisnik-prezime-azuriraj").value != korisnikPodaci.prezime ? { prezime: document.getElementById("korisnik-prezime-azuriraj").value } : {}),
                ...(document.getElementById("korisnik-adresa-azuriraj").value != "" || document.getElementById("korisnik-adresa-azuriraj").value != korisnikPodaci.adresa ? { adresa: document.getElementById("korisnik-adresa-azuriraj").value } : {}),
                ...(document.getElementById("korisnik-lozinka-azuriraj").value != "" ? { lozinka: document.getElementById("korisnik-lozinka-azuriraj").value } : {})
            };
            return posaljiZahtjevSaTokenom("/api/korisnici/" + korisnikPodaci.id, "PUT", updatedData)
        }),
        rxjs.tap((odgovor) => {
            odgovor.statusniKod == 200 ?
                function () {
                    document.getElementById("obavijest-azuriranje-profil").textContent = odgovor.poruka

                    rxjs.timer(600).pipe(
                        rxjs.tap(() => document.getElementById("spinner-azuriranje-profil").hidden = true),
                        rxjs.concatMap(() => rxjs.timer(1000)),
                        rxjs.tap(() => {
                            //ocisti input, makni poruku, makni moral-element, ocisti input, stavi input vidljiv 
                            document.getElementById("spinner-azuriranje-profil").hidden = true
                            $('#azurirajprofilModal').modal('hide');

                            document.getElementById("odustani-gumb-azuriranje-profil").disabled = false;

                            korisnikPodaci = odgovor.podaci
                            document.getElementById("korisnik-ime-azuriraj").value = korisnikPodaci.ime
                            document.getElementById("korisnik-prezime-azuriraj").value = korisnikPodaci.prezime
                            document.getElementById("korisnik-adresa-azuriraj").value = korisnikPodaci.adresa
                            document.getElementById("korisnik-lozinka-azuriraj").value = ""

                            document.getElementById("korisnik-ime").textContent = "Ime: " + korisnikPodaci.ime
                            document.getElementById("korisnik-prezime").textContent = "Prezime: " + korisnikPodaci.prezime
                            document.getElementById("korisnik-adresa").textContent = "Adresa: " + korisnikPodaci.adresa
                        })
                    ).subscribe()
                }() :
                function () {
                    const greske = odgovor.greske
                    document.getElementById("obavijest-azuriranje-profil").textContent = Object.values(odgovor.greske).join('\n');
                    document.getElementById("spinner-azuriranje-profil").hidden = true
     
                    document.getElementById("odustani-gumb-azuriranje-profil").disabled = false;

                    if (greske.hasOwnProperty("ime")) {
                        document.getElementById("ime-greska").hidden = false
                        document.getElementById("ime-greska").textContent = greske["ime"]
                        document.getElementById("korisnik-ime-azuriraj").classList.add("is-invalid");
                    }
                    if (greske.hasOwnProperty("prezime")) {
                        document.getElementById("prezime-greska").hidden = false
                        document.getElementById("prezime-greska").textContent = greske["prezime"]
                        document.getElementById("korisnik-prezime-azuriraj").classList.add("is-invalid");
                    }
                    if (greske.hasOwnProperty("lozinka")) {
                        document.getElementById("lozinka-greska").hidden = false
                        document.getElementById("lozinka-greska").textContent = greske["lozinka"]
                        document.getElementById("korisnik-lozinka-azuriraj").classList.add("is-invalid");
                    }
                    if (greske.hasOwnProperty("adresa")) {
                        document.getElementById("adresa-greska").hidden = false
                        document.getElementById("adresa-greska").textContent = greske["adresa"]
                        document.getElementById("korisnik-adresa-azuriraj").classList.add("is-invalid");
                    }
                }()
        }),
    ).subscribe()
})