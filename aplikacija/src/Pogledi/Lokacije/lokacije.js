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
    let totalItems = 0;
    const PAGE_SIZE = 5

    let lokacije = []
    const prevButton = document.getElementById('prevBtn');
    const nextButton = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');


    const mapirajLokacije = () => {
        rxjs.from(lokacije).pipe(
            rxjs.tap((lokacija) => {
                let html = `
                <ul class="user-list" id="lokacija${lokacija.id}">
                <li class="user-item">
                    <img class="user-avatar" src="/staticno/Slike/lokacija.png" alt="User Avatar${lokacija.id}">
                    <div class="user-details">
                        <div class="user-name">${lokacija.ime}</div>
                        <div class="user-email">${lokacija.drzava}</div>
                    </div>
                    <div class="user-actions">

                        <button id="pretrazi-profil${lokacija.id}" type="button" data-bs-toggle="modal" data-toggle="modal"
                        data-bs-target="#pretraziLokacijuModal${lokacija.id}" class="btn btn-danger">Obriši</button>


                        <div class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false"
                            id="pretraziLokacijuModal${lokacija.id}" tabindex="-1" aria-labelledby="exampleModalLabel"
                            aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabelObrisi${lokacija.id}">Blokiraj/Odblokiraj profil</h5>
                                    </div>
                                    <div class="modal-body">
                                        <p id="obavijest-radnja-brisanje${lokacija.id}">Lokacija ${lokacija.ime}, ${lokacija.drzava} će biti obrisana. Jeste li sigurni?</p>
                                    </div>
                                    <div class="modal-footer">
                                        <button id="odustani-pretrazi-gumb${lokacija.id}" type="button" class="btn btn-secondary"
                                            data-bs-dismiss="modal">Odustani</button>
                                        <button id="pretrazi-gumb${lokacija.id}" type="button" 
                                         class="btn btn-danger">Obriši</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
                </ul>`

                document.getElementById("parent-okvir").insertAdjacentHTML("beforeend", html)

                rxjs.fromEvent(document.getElementById(`pretrazi-gumb${lokacija.id}`), "click").pipe(
                    rxjs.mergeMap(() => {
                        document.getElementById(`pretrazi-gumb${lokacija.id}`).innerHTML = `<div id="spinner-brisanje-lokacija${lokacija.id}" class="spinner-border" role="status"
                        style="margin-left: auto;margin-right: auto;display: flex;">`
                        return posaljiZahtjevSaTokenom(`/api/gradPodaci/${lokacija.id}/obrisiLokaciju`, "DELETE")
                    }),
                    rxjs.tap(() => {
                        $(`#pretraziLokacijuModal${lokacija.id}`).modal('hide');

                        document.getElementById(`lokacija${lokacija.id}`).remove()
                        dohvatiLokacijePoStranici()
                    })
                ).subscribe()
            })
        ).subscribe()
    }

    const azurirajGumbove = () => {
        pageInfo.innerText = `Stranica ${currentPage}`;
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === Math.ceil(totalItems / PAGE_SIZE);
    }

    const dohvatiLokacijePoStranici = () => {
        posaljiZahtjevSaTokenom("/api/gradPodaci/dajLokacije?stranica=" + currentPage, "GET").subscribe(odgovor => {
            lokacije = odgovor.podaci[0]
            totalItems = odgovor.podaci[1]

            azurirajGumbove()

            document.getElementById("parent-okvir").innerHTML = ""

            mapirajLokacije()
        })
    }

    rxjs.fromEvent(document.getElementById('pretrazi-lokaciju'), 'keyup').pipe(
        rxjs.map((event) => event.target.value),
        rxjs.map((value) => !!value),
        rxjs.startWith(false)
    ).subscribe(vrijednost => document.getElementById('pretrazi-gumb').disabled = !vrijednost)


    rxjs.fromEvent(document.getElementById('pretrazi-gumb'), 'click').pipe(
        rxjs.map(() => {
            const pretraga = this.document.getElementById("pretrazi-lokaciju").value
            return pretraga.split(",")
        }),
        rxjs.filter(podaci => podaci.length == 2),
        rxjs.concatMap((podaci) => {
            return posaljiZahtjevSaTokenom("/api/gradPodaci/dodajLokaciju", "POST", {
                lokacija: podaci[0],
                drzava: podaci[1]
            })
        }),
        rxjs.tap((x) => {
            const greske = x.greske;
            document.getElementById("pretraga-greska").hidden = true
            document.getElementById("pretraga-greska").textContent = ""
            document.getElementById("pretrazi-lokaciju").classList.remove("is-invalid");


            if (x.statusniKod >= 400) {
                if (greske.hasOwnProperty("lokacija")) {
                    document.getElementById("pretraga-greska").hidden = false
                    document.getElementById("pretraga-greska").textContent = greske["lokacija"]
                    document.getElementById("pretrazi-lokaciju").classList.add("is-invalid");
                }
            } else {
                document.getElementById("pretrazi-lokaciju").classList.add("is-valid");
                lokacije.push(x.podaci)
                dohvatiLokacijePoStranici()
            }

        })
    ).subscribe()

    rxjs.fromEvent(prevButton, 'click').pipe(
        rxjs.tap(() => {
            if (currentPage > 1) {
                currentPage--;
                azurirajGumbove();
                dohvatiLokacijePoStranici()
            }
        })
    ).subscribe()

    rxjs.fromEvent(nextButton, 'click').pipe(
        rxjs.tap(() => {
            if (currentPage < Math.ceil(totalItems / PAGE_SIZE)) {
                currentPage++;
                azurirajGumbove();
                dohvatiLokacijePoStranici();
            }
        })
    ).subscribe()

    dohvatiLokacijePoStranici()
})