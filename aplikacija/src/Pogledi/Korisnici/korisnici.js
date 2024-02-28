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

    let currentPage = 1;
    let totalItems;
    const PAGE_SIZE = 5

    const prevButton = document.getElementById('prevBtn');
    const nextButton = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    const dohvatiKorisnikePoStranici = () => {
        posaljiZahtjevSaTokenom("/api/korisnici?stranica=" + currentPage, "GET").subscribe(odgovor => {
            const korisnici = odgovor.podaci.korisnici
            totalItems = odgovor.podaci.totalCount

            azurirajGumbove();

            document.getElementById("parent-okvir").innerHTML = ""

            rxjs.from(korisnici).pipe(
                rxjs.tap((korisnik) => {
                    let status
                    let html = `
                    <ul class="user-list" id="korisnik${korisnik.id}">
                    <li class="user-item">
                        <img class="user-avatar" src="/staticno/Slike/icon.png" alt="User Avatar${korisnik.id}">
                        <div class="user-details">
                            <div class="user-name">${korisnik.ime}</div>
                            <div class="user-email">${korisnik.email}</div>
                        </div>
                        <div class="user-actions">
                            <button id="azuriraj-profil${korisnik.id}" type="button" class="btn btn-primary" data-bs-toggle="modal"
                                data-toggle="modal" data-bs-target="#azurirajProfilModal${korisnik.id}">Ažuriraj profil</button>
                            <button id="blokiraj-profil${korisnik.id}" type="button" data-bs-toggle="modal" data-toggle="modal"
                                data-bs-target="#blokirajProfilModal${korisnik.id}" class="btn">Blokiraj</button>

                            <button id="obrisi-profil${korisnik.id}" type="button" data-bs-toggle="modal" data-toggle="modal"
                            data-bs-target="#obrisiProfilModal${korisnik.id}" class="btn btn-danger">Obriši</button>


                            <div class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false"
                                id="obrisiProfilModal${korisnik.id}" tabindex="-1" aria-labelledby="exampleModalLabel"
                                aria-hidden="true">
                                <div class="modal-dialog modal-dialog-centered">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title" id="exampleModalLabelObrisi${korisnik.id}">Blokiraj/Odblokiraj profil</h5>
                                        </div>
                                        <div class="modal-body">
                                            <p id="obavijest-radnja-brisanje${korisnik.id}">Korisnik ${korisnik.ime} ${korisnik.prezime} će biti obrisan. Jeste li sigurni?</p>
                                        </div>
                                        <div class="modal-footer">
                                            <button id="odustani-obrisi-gumb${korisnik.id}" type="button" class="btn btn-secondary"
                                                data-bs-dismiss="modal">Odustani</button>
                                            <button id="obrisi-gumb${korisnik.id}" type="button" 
                                             class="btn btn-danger">Obriši</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

        
                            <div class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false"
                                id="azurirajProfilModal${korisnik.id}" tabindex="-1" aria-labelledby="exampleModalLabel"
                                aria-hidden="true">
                                <div class="modal-dialog modal-dialog-centered">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title" id="exampleModalLabel${korisnik.id}">Ažuriraj korisnika</h5>
                                        </div>
                                            <div class="modal-body">
                                            <form style="margin-top: 10px;">
                                                <label for="korisnik-ime-azuriraj${korisnik.id}">Ime</label>
                                                <input id="korisnik-ime-azuriraj${korisnik.id}" type="text" class="form-control"
                                                    style="margin-bottom: 10px;">
                                                <div class="invalid-feedback" id="ime-greska${korisnik.id}" hidden></div>

                                                <label for="korisnik-prezime-azuriraj${korisnik.id}">Prezime</label>
                                                <input id="korisnik-prezime-azuriraj${korisnik.id}" type="text" class="form-control"
                                                    style="margin-bottom: 10px;">
                                                <div class="invalid-feedback" id="prezime-greska${korisnik.id}" hidden></div>

                                                <label for="korisnik-adresa-azuriraj${korisnik.id}">Adresa</label>
                                                <input id="korisnik-adresa-azuriraj${korisnik.id}" type="text" class="form-control"
                                                    style="margin-bottom: 10px;">
                                                <div class="invalid-feedback" id="adresa-greska${korisnik.id}" hidden></div>

                                                <label for="korisnik-lozinka-azuriraj${korisnik.id}">Lozinka</label>
                                                <input id="korisnik-lozinka-azuriraj${korisnik.id}" type="password" class="form-control"
                                                    style="margin-bottom: 10px;" placeholder="Unesite novu lozinku">
                                                <div class="invalid-feedback" id="lozinka-greska${korisnik.id}" hidden></div>
                                            </form>
                                            <div id="spinner-azuriranje-korisnik${korisnik.id}" class="spinner-border" role="status"
                                        style="margin-left: auto;margin-right: auto;display: flex;" hidden>
                                        </div>
                                        </div>
                                        <div class="modal-footer">
                                            <button id="odustani-gumb-azuriranje${korisnik.id}" type="button" class="btn btn-secondary"
                                                data-bs-dismiss="modal">Odustani</button>
                                            <button id="ažuriraj-gumb${korisnik.id}" type="button"
                                                class="btn btn-primary">Ažuriraj</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
        
                            <div class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false"
                                id="blokirajProfilModal${korisnik.id}" tabindex="-1" aria-labelledby="exampleModalLabel"
                                aria-hidden="true">
                                <div class="modal-dialog modal-dialog-centered">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title" id="exampleModalLabel${korisnik.id}">Blokiraj/Odblokiraj profil</h5>
                                        </div>
                                        <div class="modal-body">
                                            
                                            <p id="obavijest-radnja-blokiranje${korisnik.id}">Korisnik ${korisnik.ime} ${korisnik.prezime} će biti blokiran. Jeste li sigurni?</p>
                                        </div>
                                        <div class="modal-footer">
                                            <button id="odustani-blokiraj-gumb${korisnik.id}" type="button" class="btn btn-secondary"
                                                data-bs-dismiss="modal">Odustani</button>
                                            <button id="blokiraj-gumb${korisnik.id}" type="button" 
                                             class="btn">Blokiraj/Odblokiraj</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                    </ul>`

                    document.getElementById("parent-okvir").insertAdjacentHTML("beforeend", html)

                    if (korisnik.statusKorisnikaId.id == 1) {
                        document.getElementById(`blokiraj-profil${korisnik.id}`).textContent = "Blokiraj"
                        document.getElementById(`blokiraj-profil${korisnik.id}`).classList.add("btn-danger")
                        document.getElementById(`blokiraj-gumb${korisnik.id}`).classList.add("btn-danger")
                        document.getElementById(`obavijest-radnja-blokiranje${korisnik.id}`).textContent = `Korisnik ${korisnik.ime} ${korisnik.prezime} će biti blokiran. Jeste li sigurni?`
                        status = 3
                    }
                    else if (korisnik.statusKorisnikaId.id == 3) {
                        document.getElementById(`blokiraj-profil${korisnik.id}`).textContent = "Odblokiraj"
                        document.getElementById(`blokiraj-profil${korisnik.id}`).classList.add("btn-primary")
                        document.getElementById(`blokiraj-gumb${korisnik.id}`).classList.add("btn-primary")
                        document.getElementById(`obavijest-radnja-blokiranje${korisnik.id}`).textContent = `Korisnik ${korisnik.ime} ${korisnik.prezime} će biti odblokiran. Jeste li sigurni?`

                        status = 1
                    }
                    else {
                        document.getElementById(`blokiraj-profil${korisnik.id}`).textContent = "Nije aktiviran"
                        document.getElementById(`blokiraj-profil${korisnik.id}`).classList.add("btn-danger")
                        document.getElementById(`blokiraj-profil${korisnik.id}`).disabled = true
                        document.getElementById(`blokiraj-gumb${korisnik.id}`).classList.add("btn-danger")
                    }

                    const input1 = rxjs.fromEvent(document.getElementById(`korisnik-ime-azuriraj${korisnik.id}`), 'keyup').pipe(
                        rxjs.map((event) => event.target.value),
                        rxjs.map((value) => value !== korisnik.ime),
                        rxjs.startWith(false)
                    );

                    const input2 = rxjs.fromEvent(document.getElementById(`korisnik-prezime-azuriraj${korisnik.id}`), 'keyup').pipe(
                        rxjs.map((event) => event.target.value),
                        rxjs.map((value) => value !== korisnik.prezime),
                        rxjs.startWith(false)
                    );

                    const input3 = rxjs.fromEvent(document.getElementById(`korisnik-adresa-azuriraj${korisnik.id}`), 'keyup').pipe(
                        rxjs.map((event) => event.target.value),
                        rxjs.map((value) => value !== korisnik.adresa),
                        rxjs.startWith(false)
                    );

                    const input4 = rxjs.fromEvent(document.getElementById(`korisnik-lozinka-azuriraj${korisnik.id}`), 'keyup').pipe(
                        rxjs.map((event) => event.target.value),
                        rxjs.map((value) => !!value),
                        rxjs.startWith(false)
                    );

                    rxjs.fromEvent(document.getElementById(`azuriraj-profil${korisnik.id}`), "click").pipe(
                        rxjs.tap(() => {
                            document.getElementById(`korisnik-ime-azuriraj${korisnik.id}`).value = korisnik.ime
                            document.getElementById(`korisnik-prezime-azuriraj${korisnik.id}`).value = korisnik.prezime
                            document.getElementById(`korisnik-adresa-azuriraj${korisnik.id}`).value = korisnik.adresa

                            rxjs.combineLatest(input1, input2, input3, input4).subscribe(([input1Value, input2Value, input3Value, input4Value]) => {
                                document.getElementById(`ažuriraj-gumb${korisnik.id}`).disabled = !(input1Value || input2Value || input3Value || input4Value);
                            })
                        })
                    ).subscribe()

                    rxjs.fromEvent(document.getElementById(`ažuriraj-gumb${korisnik.id}`), 'click').pipe(
                        rxjs.tap(() => {
                            document.getElementById(`spinner-azuriranje-korisnik${korisnik.id}`).hidden = false;
                            document.getElementById(`ažuriraj-gumb${korisnik.id}`).disabled = true
                            document.getElementById(`ažuriraj-gumb${korisnik.id}`).disabled = true;

                            document.getElementById(`ime-greska${korisnik.id}`).hidden = true
                            document.getElementById(`ime-greska${korisnik.id}`).textContent = ""
                            document.getElementById(`korisnik-ime-azuriraj${korisnik.id}`).classList.remove("is-invalid");

                            document.getElementById(`prezime-greska${korisnik.id}`).hidden = true
                            document.getElementById(`prezime-greska${korisnik.id}`).textContent = ""
                            document.getElementById(`korisnik-prezime-azuriraj${korisnik.id}`).classList.remove("is-invalid");

                            document.getElementById(`lozinka-greska${korisnik.id}`).hidden = true
                            document.getElementById(`lozinka-greska${korisnik.id}`).textContent = ""
                            document.getElementById(`korisnik-lozinka-azuriraj${korisnik.id}`).classList.remove("is-invalid");

                            document.getElementById(`adresa-greska${korisnik.id}`).hidden = true
                            document.getElementById(`adresa-greska${korisnik.id}`).textContent = ""
                            document.getElementById(`korisnik-adresa-azuriraj${korisnik.id}`).classList.remove("is-invalid");
                        }),
                        rxjs.mergeMap(() => {
                            const updatedData = {
                                ...(document.getElementById(`korisnik-ime-azuriraj${korisnik.id}`).value != "" || document.getElementById(`korisnik-ime-azuriraj${korisnik.id}`).value != korisnik.ime ? { ime: document.getElementById(`korisnik-ime-azuriraj${korisnik.id}`).value } : {}),
                                ...(document.getElementById(`korisnik-prezime-azuriraj${korisnik.id}`).value != "" || document.getElementById(`korisnik-prezime-azuriraj${korisnik.id}`).value != korisnik.prezime ? { prezime: document.getElementById(`korisnik-prezime-azuriraj${korisnik.id}`).value } : {}),
                                ...(document.getElementById(`korisnik-adresa-azuriraj${korisnik.id}`).value != "" || document.getElementById(`korisnik-adresa-azuriraj${korisnik.id}`).value != korisnik.adresa ? { adresa: document.getElementById(`korisnik-adresa-azuriraj${korisnik.id}`).value } : {}),
                                ...(document.getElementById(`korisnik-lozinka-azuriraj${korisnik.id}`).value != "" ? { lozinka: document.getElementById(`korisnik-lozinka-azuriraj${korisnik.id}`).value } : {})
                            };
                            return posaljiZahtjevSaTokenom("/api/korisnici/" + korisnik.id, "PUT", updatedData)
                        }),
                        rxjs.tap((odgovor) => {
                            odgovor.statusniKod == 200 ?
                                function () {
                                    rxjs.timer(600).pipe(
                                        rxjs.tap(() => document.getElementById(`spinner-azuriranje-korisnik${korisnik.id}`).hidden = true),
                                        rxjs.concatMap(() => rxjs.timer(1000)),
                                        rxjs.tap(() => {
                                            document.getElementById(`spinner-azuriranje-korisnik${korisnik.id}`).hidden = true
                                            $(`#azurirajProfilModal${korisnik.id}`).modal('hide');

                                            document.getElementById(`odustani-gumb-azuriranje${korisnik.id}`).disabled = false;

                                            korisnik = odgovor.podaci
                                            document.getElementById(`korisnik-ime-azuriraj${korisnik.id}`).value = korisnik.ime
                                            document.getElementById(`korisnik-prezime-azuriraj${korisnik.id}`).value = korisnik.prezime
                                            document.getElementById(`korisnik-adresa-azuriraj${korisnik.id}`).value = korisnik.adresa
                                            document.getElementById(`korisnik-lozinka-azuriraj${korisnik.id}`).value = ""
                                        })
                                    ).subscribe()
                                }() :
                                function () {
                                    const greske = odgovor.greske
                                    document.getElementById(`spinner-azuriranje-korisnik${korisnik.id}`).hidden = true

                                    document.getElementById(`odustani-gumb-azuriranje${korisnik.id}`).disabled = false;

                                    if (greske.hasOwnProperty("ime")) {
                                        document.getElementById(`ime-greska${korisnik.id}`).hidden = false
                                        document.getElementById(`ime-greska${korisnik.id}`).textContent = greske["ime"]
                                        document.getElementById(`korisnik-ime-azuriraj${korisnik.id}`).classList.add("is-invalid");
                                    }
                                    if (greske.hasOwnProperty("prezime")) {
                                        document.getElementById(`prezime-greska${korisnik.id}`).hidden = false
                                        document.getElementById(`prezime-greska${korisnik.id}`).textContent = greske["prezime"]
                                        document.getElementById(`korisnik-prezime-azuriraj${korisnik.id}`).classList.add("is-invalid");
                                    }
                                    if (greske.hasOwnProperty("lozinka")) {
                                        document.getElementById(`lozinka-greska${korisnik.id}`).hidden = false
                                        document.getElementById(`lozinka-greska${korisnik.id}`).textContent = greske["lozinka"]
                                        document.getElementById(`korisnik-lozinka-azuriraj${korisnik.id}`).classList.add("is-invalid");
                                    }
                                    if (greske.hasOwnProperty("adresa")) {
                                        document.getElementById(`adresa-greska${korisnik.id}`).hidden = false
                                        document.getElementById(`adresa-greska${korisnik.id}`).textContent = greske["adresa"]
                                        document.getElementById(`korisnik-adresa-azuriraj${korisnik.id}`).classList.add("is-invalid");
                                    }
                                }()
                        }),
                    ).subscribe()

                    rxjs.fromEvent(document.getElementById(`blokiraj-gumb${korisnik.id}`), "click").pipe(
                        rxjs.mergeMap(() => {
                            document.getElementById(`blokiraj-gumb${korisnik.id}`).innerHTML = `<div id="spinner-blokiranje-korisnik${korisnik.id}" class="spinner-border" role="status"
                            style="margin-left: auto;margin-right: auto;display: flex;">`
                            return posaljiZahtjevSaTokenom("/api/korisnici/" + korisnik.id, "PUT", {
                                status: status
                            })
                        }),
                        rxjs.tap(() => {
                            if (status == 1) {
                                document.getElementById(`blokiraj-profil${korisnik.id}`).textContent = "Blokiraj"
                                document.getElementById(`blokiraj-profil${korisnik.id}`).classList.remove("btn-primary")
                                document.getElementById(`blokiraj-profil${korisnik.id}`).classList.add("btn-danger")
                                document.getElementById(`blokiraj-gumb${korisnik.id}`).classList.remove("btn-primary")
                                document.getElementById(`blokiraj-gumb${korisnik.id}`).classList.add("btn-danger")
                                document.getElementById(`obavijest-radnja-blokiranje${korisnik.id}`).textContent = `Korisnik ${korisnik.ime} ${korisnik.prezime} će biti blokiran. Jeste li sigurni?`
                                status = 3
                            }
                            else if (status == 3) {
                                document.getElementById(`blokiraj-profil${korisnik.id}`).textContent = "Odblokiraj"
                                document.getElementById(`blokiraj-profil${korisnik.id}`).classList.remove("btn-danger")
                                document.getElementById(`blokiraj-profil${korisnik.id}`).classList.add("btn-primary")
                                document.getElementById(`blokiraj-gumb${korisnik.id}`).classList.remove("btn-danger")
                                document.getElementById(`blokiraj-gumb${korisnik.id}`).classList.add("btn-primary")
                                document.getElementById(`obavijest-radnja-blokiranje${korisnik.id}`).textContent = `Korisnik ${korisnik.ime} ${korisnik.prezime} će biti odblokiran. Jeste li sigurni?`
                                status = 1
                            }

                            document.getElementById(`blokiraj-gumb${korisnik.id}`).innerHTML = "Blokiraj/Odblokiraj " + `<div id="spinner-blokiranje-korisnik${korisnik.id}" class="spinner-border" role="status"
                            style="margin-left: auto;margin-right: auto;display: flex;" hidden>`

                            $(`#blokirajProfilModal${korisnik.id}`).modal('hide');
                        })
                    ).subscribe();

                    rxjs.fromEvent(document.getElementById(`obrisi-gumb${korisnik.id}`), "click").pipe(
                        rxjs.mergeMap(() => {
                            document.getElementById(`obrisi-gumb${korisnik.id}`).innerHTML = `<div id="spinner-brisanje-korisnik${korisnik.id}" class="spinner-border" role="status"
                            style="margin-left: auto;margin-right: auto;display: flex;">`
                            return posaljiZahtjevSaTokenom("/api/korisnici/" + korisnik.id, "DELETE")
                        }),
                        rxjs.tap(() => {
                            $(`#obrisiProfilModal${korisnik.id}`).modal('hide');

                            document.getElementById(`korisnik${korisnik.id}`).remove()
                            dohvatiKorisnikePoStranici()

                        })
                    ).subscribe()

                })
            ).subscribe()
        })
    }

    const azurirajGumbove = () => {
        pageInfo.innerText = `Stranica ${currentPage}`;
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === Math.ceil(totalItems / PAGE_SIZE);
    }

    rxjs.fromEvent(prevButton, 'click').pipe(
        rxjs.tap(() => {
            if (currentPage > 1) {
                currentPage--;
                azurirajGumbove();
                dohvatiKorisnikePoStranici()
            }
        })
    ).subscribe()

    rxjs.fromEvent(nextButton, 'click').pipe(
        rxjs.tap(() => {
            if (currentPage < Math.ceil(totalItems / PAGE_SIZE)) {
                currentPage++;
                azurirajGumbove();
                dohvatiKorisnikePoStranici();
            }
        })
    ).subscribe()

    dohvatiKorisnikePoStranici()
})