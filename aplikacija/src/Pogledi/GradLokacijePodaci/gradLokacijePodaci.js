window.addEventListener('load', function () {
    let zadnjePritisnutiGumb = this.document.getElementById("filtriraj-sat")

    class Graf {
        #trenutniGraf
        #grafVrijednosti = {}

        constructor() { }

        dajGrafVrijednosti() {
            return this.#grafVrijednosti
        }

        dajtrenutniGraf() {
            return this.#trenutniGraf
        }

        odrediReprezentacijuDatuma = (vrijemeDate) => {
            if (zadnjePritisnutiGumb == document.getElementById("filtriraj-dan"))
                return vrijemeDate.getDate() + "." + (vrijemeDate.getMonth() + 1) + "." + vrijemeDate.getFullYear() + "."
            if (zadnjePritisnutiGumb == document.getElementById("filtriraj-mjesec"))
                return (vrijemeDate.getMonth() + 1) + "." + vrijemeDate.getFullYear() + "."
            if (zadnjePritisnutiGumb == document.getElementById("filtriraj-godina"))
                return vrijemeDate.getFullYear() + "."
            else
                return vrijemeDate.getHours() + "h " + vrijemeDate.getMinutes() + "m " + vrijemeDate.getSeconds() + "s"
        }

        dajNasumicnuBoju = () => {
            const nasumicnaBoja = () => Math.floor(Math.random() * 256);
            const crvena = nasumicnaBoja();
            const zelena = nasumicnaBoja();
            const plava = nasumicnaBoja();

            return `rgb(${crvena}, ${zelena}, ${plava})`;
        }

        resetirajGrafVrijednost = () => {
            this.#grafVrijednosti = {}
        }

        mapirajEmitiraneVrijednosti = (poljeObjekata, oznaka) => {
            poljeObjekata.forEach(objekt => {
                if (!this.#grafVrijednosti[objekt.lokacija]) {
                    this.#grafVrijednosti[objekt.lokacija] = { [oznaka]: [], vrijemeMjerenja: [], drzava: objekt.drzava };
                }
                if (this.#grafVrijednosti[objekt.lokacija])
                    this.#grafVrijednosti[objekt.lokacija][oznaka].push(objekt[oznaka]);
                this.#grafVrijednosti[objekt.lokacija].vrijemeMjerenja.push(new Date(objekt.vrijemeMjerenja).getTime());
            })
        };

        odrediPostavkeMjerenja = (poljeObjekata) => {
            const selectedValue = document.getElementById("select-prikaz-mjerenja")
                .options[document.getElementById("select-prikaz-mjerenja").selectedIndex].text.toLowerCase();

            switch (selectedValue) {
                case 'temperatura':
                    this.mapirajEmitiraneVrijednosti(poljeObjekata, selectedValue);
                    break;
                case 'tlak':
                    this.mapirajEmitiraneVrijednosti(poljeObjekata, selectedValue);
                    break;
                case 'vlaga':
                    this.mapirajEmitiraneVrijednosti(poljeObjekata, selectedValue);
                    break;
            }

            Object.keys(this.#grafVrijednosti).forEach(objektNaziv => {
                this.dodajUGraf(this.#grafVrijednosti[objektNaziv][selectedValue],
                    this.#grafVrijednosti[objektNaziv].vrijemeMjerenja, objektNaziv + "," + this.#grafVrijednosti[objektNaziv].drzava);
            })
        }

        obrisiPodatkeGradaUGrafu = (lokacijaKljuc, drzavaKljuc) => {
            if (lokacijaKljuc in this.#grafVrijednosti &&
                this.#grafVrijednosti[lokacijaKljuc].drzava == drzavaKljuc) {
                delete this.#grafVrijednosti[lokacijaKljuc];
            }
        }

        generirajNovuLinijuUGrafu = (objekt) => {
            const color = this.dajNasumicnuBoju()
            const dataset = {
                label: objekt.ime + "," + objekt.drzava,
                data: [],
                borderColor: color,
            };

            this.#trenutniGraf.data.datasets.push(dataset)
            this.#trenutniGraf.update()
        }

        izbrisiLinijuIzGrafa = (naslov) => {
            const datasetIndex = this.#trenutniGraf.data.datasets.findIndex(dataset => dataset.label == naslov);

            if (datasetIndex !== -1) {
                this.#trenutniGraf.data.datasets.splice(datasetIndex, 1);
                this.#trenutniGraf.update();
            }
        }

        kreirajPrazniGraf = () => {
            if (this.#trenutniGraf != undefined)
                this.#trenutniGraf.destroy()

            this.#trenutniGraf = new Chart(document.getElementById('graf'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    scales: {
                        x: {
                            ticks: {
                                color: "black",
                                fontSize: 10,
                                beginAtZero: true
                            }
                        },
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            this.#trenutniGraf.update()
        }

        dodajUGraf = (podaci, vremenaMjerenja, naslovGrafa) => {
            const distinktnoSortiranoPolje = [...new Set(
                Object.values(this.#grafVrijednosti)
                    .map(el => el.vrijemeMjerenja).flat().sort((a, b) => {
                        return a - b
                    }).map(vrijeme => {
                        return this.odrediReprezentacijuDatuma(new Date(vrijeme))
                    }))]

            vremenaMjerenja = vremenaMjerenja.map(vrijeme => {
                return this.odrediReprezentacijuDatuma(new Date(vrijeme))
            })

            const mapiraneVrijednosti = vremenaMjerenja.map(vrijemeMjerenja => {
                const vrijemeOdređeneLinijeGrafa = distinktnoSortiranoPolje.find(value => value == vrijemeMjerenja)
                const indeksVremena = vremenaMjerenja.indexOf(vrijemeMjerenja)

                return { x: vrijemeOdređeneLinijeGrafa, y: podaci[indeksVremena] };
            });

            const datasetIndex = this.#trenutniGraf.data.datasets.findIndex(dataset => dataset.label == naslovGrafa);

            this.#trenutniGraf.data.labels = distinktnoSortiranoPolje
            this.#trenutniGraf.data.datasets[datasetIndex].data = mapiraneVrijednosti;
            this.#trenutniGraf.update();
        }

        azurirajGraf = () => {
            const distinktnoSortiranoPolje = [...new Set(
                Object.values(this.#grafVrijednosti)
                    .map(el => el.vrijemeMjerenja).flat().sort((a, b) => {
                        return a - b
                    }).map(vrijeme => {
                        return this.odrediReprezentacijuDatuma(new Date(vrijeme))
                    }))]

            this.#trenutniGraf.data.labels = distinktnoSortiranoPolje
            this.#trenutniGraf.update();
        }
    }

    class GradLokacijePodaci {
        #odabraneLokacije = []
        #gradLokacijePrognoza = []
        #gradFavoriti = []

        #graf
        #gumbi = [
            document.getElementById("filtriraj-sat"),
            document.getElementById("filtriraj-dan"),
            document.getElementById("filtriraj-mjesec"),
            document.getElementById("filtriraj-godina")
        ]

        constructor(graf) {
            this.#graf = graf
        }

        dohvatiOdabraneLokacije() {
            return this.#odabraneLokacije
        }

        resetirajOdabraneLokacije() {
            let prvi = this.#odabraneLokacije[0]
            if (prvi == undefined)
                this.#odabraneLokacije = []
            else
                this.#odabraneLokacije = [this.#odabraneLokacije.shift()];
        }

        #kreirajPromatračeNaGumbZaFiltriranje = () => {
            return this.#gumbi.map(button =>
                rxjs.fromEvent(button, 'click').pipe(
                    rxjs.map(event => {
                        zadnjePritisnutiGumb = event.target;
                        return event.target
                    }),
                )
            );
        }

        provjeriStanjePromatračaGumbaZaFiltriranje = () => {
            rxjs.merge(...this.#kreirajPromatračeNaGumbZaFiltriranje()).subscribe(clickedButton => {
                this.#gumbi.forEach(button => {
                    button.disabled = (button === clickedButton);
                });
            })
        }

        filtirajPodatkePo = (filter, datum) => {
            let el = this.#odabraneLokacije.filter((value) => !Object.keys(this.#graf.dajGrafVrijednosti()).includes(value.ime));

            return rxjs.from(el).pipe(
                rxjs.mergeMap((lok) => {
                    const putanja = datum == undefined ? `/api/gradPodaci/filtrirajPo?filter=${filter}` :
                        `/api/gradPodaci/filtrirajPo?filter=${filter}&datum=${datum}`;
                    return posaljiZahtjevSaTokenom(putanja, "POST", { lokacija: lok.ime, drzava: lok.drzava });
                }),
                rxjs.filter(x => x.podaci != undefined && x.statusniKod < 400 && Object.keys(x.podaci).length != 0),
                rxjs.map((x) => x.podaci),
                rxjs.tap((mjerenja) => {
                    let elements = []
                    Object.keys(mjerenja).forEach((key) => {
                        for (let i = 0; i < mjerenja[key].length; i++) {
                            const obj = mjerenja[key][i];
                            elements.push(obj)
                        }
                    });
                    this.#graf.odrediPostavkeMjerenja(elements);
                })
            )
        }

        provjeriOdabraniFiltrirajGumb = () => {
            if (this.#odabraneLokacije.length == 0)
                return
            if (zadnjePritisnutiGumb == document.getElementById("filtriraj-sat")) {
                this.filtirajPodatkePo("sat").subscribe();
            }
            else if (zadnjePritisnutiGumb == document.getElementById("filtriraj-dan")) {
                this.filtirajPodatkePo("dan").subscribe();
            }
            else if (zadnjePritisnutiGumb == document.getElementById("filtriraj-mjesec")) {
                this.filtirajPodatkePo("mjesec").subscribe();
            }
            else if (zadnjePritisnutiGumb == document.getElementById("filtriraj-godina")) {
                this.filtirajPodatkePo("godina").subscribe();
            }
            else {
                this.filtirajPodatkePo("odabraniDatum").subscribe();
            }
        }

        promjenaPromjenePrikazaMjerenja = () =>
            rxjs.fromEvent(document.getElementById("select-prikaz-mjerenja"), 'change').pipe(
                rxjs.map((event) => event.target.value),
                rxjs.tap(() => {
                    this.#graf.resetirajGrafVrijednost()
                    this.provjeriOdabraniFiltrirajGumb()
                })).subscribe()

        resetirajVremenskuPrognozuSucelje = () => {
            document.getElementById("stranicenje-naslov").textContent = "Prognoza vremena - "
            Array.from(document.getElementsByClassName("mapirano-stranicenje")).forEach(item => item.remove())
        }

        dohvatiGradFavoriti = () => {
            const selectPostavkePrikaza = document.getElementById("select-postavke-prikaza")
            return rxjs.fromEvent(selectPostavkePrikaza, "change").pipe(
                rxjs.concatMap(() => {
                    const vrijednost = selectPostavkePrikaza.options[selectPostavkePrikaza.selectedIndex].textContent
                    const foiLokacijeDropdown = document.getElementById("foi-lokacije-dropdown-lista-popis")
                    foiLokacijeDropdown.innerHTML = ""

                    switch (vrijednost) {
                        case "Moji favoriti": {
                            return posaljiZahtjevSaTokenom("/api/gradPodaci/favoriti", "GET").pipe(
                                rxjs.tap(() => {
                                    this.#gradFavoriti = []
                                    this.#odabraneLokacije = []
                                    this.#gradLokacijePrognoza = []

                                    this.#graf.resetirajGrafVrijednost()

                                    this.resetirajVremenskuPrognozuSucelje()

                                    this.#graf.kreirajPrazniGraf()
                                }),
                                rxjs.filter(x => x.podaci != undefined && x.statusniKod < 400 && x.podaci.length != 0),
                                rxjs.map(x => x.podaci),
                                rxjs.tap(lokacije => {

                                    this.#gradFavoriti = lokacije
                                    this.#odabraneLokacije[0] = { ime: lokacije[0].ime, drzava: lokacije[0].drzava }

                                    this.dohvatiPrognozuVremena({ ime: lokacije[0].ime, drzava: lokacije[0].drzava })
                                        .subscribe(_ => {
                                            this.mapirajPocetnuPrognozuVremena()
                                        })


                                    this.#graf.generirajNovuLinijuUGrafu(this.#odabraneLokacije[0])
                                    this.provjeriOdabraniFiltrirajGumb()

                                    return lokacije
                                }),
                                rxjs.mergeMap((lokacije) =>
                                    this.mapirajGradLokacijePadajuciIzbornik(lokacije)),
                            )
                        }
                        case "Svi gradovi": {
                            return this.dohvatiGradLokacije()
                        }
                    }
                })
            )
        }

        promjenaFilteraGrafa(filter, odabraniDatum) {
            this.#graf.resetirajGrafVrijednost()
            this.#graf.kreirajPrazniGraf()

            if (this.#odabraneLokacije.length == 0)
                return

            this.#odabraneLokacije.forEach(el => this.#graf.generirajNovuLinijuUGrafu(el));

            if (odabraniDatum) {
                this.filtirajPodatkePo("odabraniDatum", odabraniDatum).subscribe();
            } else {
                this.filtirajPodatkePo(filter).subscribe();
            }
        }

        zapocniSaSlusanjemFiltriranja = () => {
            rxjs.fromEvent(document.getElementById("filtriraj-sat"), 'click').pipe(
                rxjs.filter(() => this.#odabraneLokacije.length > 0),
                rxjs.tap(() => this.promjenaFilteraGrafa("sat"))
            ).subscribe();

            rxjs.fromEvent(document.getElementById("filtriraj-dan"), 'click').pipe(
                rxjs.filter(() => this.#odabraneLokacije.length > 0),
                rxjs.tap(() => this.promjenaFilteraGrafa("dan"))
            ).subscribe();

            rxjs.fromEvent(document.getElementById("filtriraj-mjesec"), 'click').pipe(
                rxjs.filter(() => this.#odabraneLokacije.length > 0),
                rxjs.tap(() => this.promjenaFilteraGrafa("mjesec"))
            ).subscribe();

            rxjs.fromEvent(document.getElementById("filtriraj-godina"), 'click').pipe(
                rxjs.filter(() => this.#odabraneLokacije.length > 0),
                rxjs.tap(() => this.promjenaFilteraGrafa("godina"))
            ).subscribe();

            rxjs.fromEvent(document.getElementById("filtriraj-datum"), 'input').pipe(
                rxjs.filter(() => this.#odabraneLokacije.length > 0),
                rxjs.tap((event) => {
                    zadnjePritisnutiGumb = document.getElementById("filtriraj-datum");
                    this.#gumbi.forEach(item => item.disabled = false)
                    this.promjenaFilteraGrafa("odabraniDatum", event.target.value);
                    event.target.value = ""
                })
            ).subscribe();
        }

        mapirajGradLokacijePadajuciIzbornik = (lokacije) => {
            const foiLokacijeDropdown = document.getElementById("foi-lokacije-dropdown-lista-popis")
            foiLokacijeDropdown.innerHTML = ""

            return rxjs.from(lokacije).pipe(
                rxjs.map(lokacija =>
                    `<li class="grad-lokacije-popis"><a class="dropdown-item">${lokacija.ime + "," + lokacija.drzava}</a></li>`),
                rxjs.reduce((acc, item) => acc + item, ''),
                rxjs.tap(htmlListaPopis => {
                    foiLokacijeDropdown.insertAdjacentHTML("beforeend", htmlListaPopis)
                })
            )
        }

        dohvatiGradLokacije = () => {
            return posaljiZahtjevSaTokenom("/api/gradPodaci/dajLokacije", "GET").pipe(
                rxjs.tap(() => {
                    this.#odabraneLokacije = []
                    this.#gradLokacijePrognoza = []

                    this.#graf.resetirajGrafVrijednost()

                    this.resetirajVremenskuPrognozuSucelje()

                    this.#graf.kreirajPrazniGraf()
                }),
                rxjs.filter(x => x.podaci != undefined && x.statusniKod < 400 && Object.keys(x.podaci).length != 0),
                rxjs.map(x => x.podaci),
                rxjs.tap(lokacije => {
                    this.#odabraneLokacije[0] = { ime: lokacije[0].ime, drzava: lokacije[0].drzava }

                    this.deaktivirajOvisneKomponenteOPrognoziVremena()
                    this.dohvatiPrognozuVremena({ ime: lokacije[0].ime, drzava: lokacije[0].drzava })
                        .subscribe(_ => {
                            this.aktivirajOvisneKomponenteOPrognoziVremena()
                            this.mapirajPocetnuPrognozuVremena()
                        })

                    this.#graf.kreirajPrazniGraf()
                    this.#graf.generirajNovuLinijuUGrafu(this.#odabraneLokacije[0])
                    this.provjeriOdabraniFiltrirajGumb()
                }),
                rxjs.mergeMap((lokacije) =>
                    this.mapirajGradLokacijePadajuciIzbornik(lokacije)),
            )
        }

        azurirajStanjeTrenutnihINajvecihPodataka = () => {
            const stanjeRezultat = Array.from(document.getElementsByClassName("stanje-rezultat"))
            const spinnerStanja = Array.from(document.getElementsByClassName("spinner-stanja"))

            stanjeRezultat.forEach(item => { item.textContent = "" })
            spinnerStanja.forEach(item => { item.hidden = false })

            if (document.getElementById("temperatura-trenutno") == undefined) {
                return rxjs.of({})
            }

            return posaljiZahtjevSaTokenom("/api/gradPodaci/dajMaxTrenutno", "POST", {
                lokacije: Object.values(this.#odabraneLokacije).map(item => item.ime),
                drzavniKodovi: Object.values(this.#odabraneLokacije).map(item => item.drzava)
            }).pipe(
                rxjs.delay(400),
                rxjs.filter(x => x.podaci != undefined && x.statusniKod < 400 && Object.keys(x.podaci).length != 0),
                rxjs.tap(mjerenja => {
                    const podaci = mjerenja.podaci

                    spinnerStanja.forEach(item => { item.hidden = true })
                    document.getElementById("temperatura-trenutno").textContent =
                        Number(podaci.novo.temperatura).toFixed(1).toString() + "°C"
                    document.getElementById("tlak-trenutno").textContent =
                        Number(podaci.novo.tlak).toFixed(1).toString() + " hPa"
                    document.getElementById("vlaga-trenutno").textContent =
                        Number(podaci.novo.vlaga).toFixed(1).toString() + " %"

                    document.getElementById("temperatura-najvece").textContent =
                        Number(podaci.najvece.temperatura).toFixed(1).toString() + "°C"
                    document.getElementById("tlak-najvece").textContent =
                        Number(podaci.najvece.tlak).toFixed(1).toString() + " hPa"
                    document.getElementById("vlaga-najvece").textContent =
                        Number(podaci.najvece.vlaga).toFixed(1).toString() + " %"

                    document.getElementById("najvece-temperatura").textContent = podaci.najvece.lokacija[0]
                    document.getElementById("najvece-vlaga").textContent = podaci.najvece.lokacija[1]
                    document.getElementById("najvece-tlak").textContent = podaci.najvece.lokacija[2]

                    document.getElementById("zadnje-lokacija").textContent = podaci.novo.lokacija
                })
            )
        }

        periodičnoAzurirajStanjeTrenutnihINajvecihPodataka = () => {
            window["gradLokacijePodaciIntervalObservable"] = rxjs.interval(60000).subscribe(() => {
                if (this.#odabraneLokacije.length > 0) {
                    this.azurirajStanjeTrenutnihINajvecihPodataka().subscribe();
                }
            })
        }

        izbrisiLokacijuIzOdabira = (naslov) => {
            const index = this.#odabraneLokacije.map(item => item.ime + "," + item.drzava).findIndex(el => el == naslov);

            if (index !== -1) {
                this.#odabraneLokacije.splice(index, 1);
            }
        }

        izbrisiLokacijuIzPrognoza = (lokacijaKljuc, drzavaKljuc) => {
            if (lokacijaKljuc in this.#gradLokacijePrognoza) {
                const obj = this.#gradLokacijePrognoza[lokacijaKljuc];
                if (drzavaKljuc in obj) {
                    delete this.#gradLokacijePrognoza[lokacijaKljuc];
                }
            }
        }

        mapirajPrognozuVremena = (prognozaVremena) => {
            document.getElementById("stranicenje-naslov").textContent =
                "Prognoza vremena - " + prognozaVremena[0].lokacija;

            Array.from(document.getElementsByClassName("mapirano-stranicenje")).forEach(item => item.remove());

            rxjs.from(prognozaVremena).pipe(
                rxjs.map((element, i) => {
                    let slika = "";

                    if (element.vlaga >= 70) slika = "kisovito.png";
                    else if ((element.vlaga < 70 && element.vlaga >= 30) || element.temperatura < 20)
                        slika = "oblacno.png";
                    else slika = "suncano.png";

                    const datum = new Date(element.vrijemeMjerenja);
                    const datumPrikaz =
                        datum.getDate() + "." + (datum.getMonth() + 1) + "." + datum.getFullYear() + ".";

                    return `<div class="mapirano-stranicenje"
                        style="background-color: #0d6efd;grid-row: ${i + 3};border: 1px solid black;color:
                        white;border-radius: 6px;display: grid;grid-template-columns: 65px 100px auto 120px;
                        margin-right: 10px;margin-left: 10px;grid-template-rows: 0px;">
                        <img src="./staticno/Slike/${slika}" style="grid-column: 1;width: 65px;">
                        <p
                            style="display: flex;justify-content: center;align-items: center;margin:
                            0px;grid-column: 2;font-size: 20px;height: 60px;font-family: cursive;">
                            ${Number(element.temperatura).toFixed(1)} °C</p>
                        <div
                            style="grid-column: 3;display: flex;justify-content: center;height:60px;
                            flex-direction: column;margin-left: 10px;">
                            <p style="font-family: cursive;margin: 0px;">Tlak (hPa):
                            ${Number(element.tlak).toFixed(1)}</p>
                            <p style="font-family: cursive;margin: 0px;">Vlaga (%):
                            ${Number(element.vlaga).toFixed(1)}</p>
                        </div>
                        <p style="font-family: cursive;height: 60px;">${datumPrikaz}</p>
                        </div>`;
                }),
                rxjs.tap((html) => {
                    document.getElementById("parent-stranicenje").insertAdjacentHTML("beforeend", html);
                }),
                rxjs.toArray()
            ).subscribe();
        };

        ocistiIntervalPrognoza = () => {
            if (window["intervalPrognoze"] != undefined) {
                window["intervalPrognoze"].unsubscribe()
                window["intervalPrognoze"] = undefined
            }
        }

        ocistiEmitiranjePrognoza = () => {
            if (window["promjenaPrognoza"] != undefined) {
                window["promjenaPrognoza"].unsubscribe()
                window["promjenaPrognoza"] = undefined
            }
        }

        mapirajPocetnuPrognozuVremena = () => {
            const grad = Object.keys(this.#gradLokacijePrognoza)[0]
            const drzava = Object.keys(this.#gradLokacijePrognoza[grad])[0]

            this.mapirajPrognozuVremena(Object.values(this.#gradLokacijePrognoza[grad][drzava]))
        }

        pokreniEmitiranjePrognozeVremenaPrviPut = () => {
            window["promjenaPrognoza"] = rxjs.from(Object.keys(this.#gradLokacijePrognoza)).pipe(
                rxjs.concatMap((grad) => {
                    if (grad in this.#gradLokacijePrognoza) {
                        const drzava = Object.keys(this.#gradLokacijePrognoza[grad])[0];
                        if (document.getElementById("stranicenje-naslov").textContent != "Prognoza vremena - " + grad)
                            this.mapirajPrognozuVremena(Object.values(this.#gradLokacijePrognoza[grad][drzava]));

                        return rxjs.timer(4000)
                    }
                    return rxjs.of({})
                }),
                rxjs.toArray()
            ).subscribe();
        }

        periodicnoEmitirajPrognozuVremena = () => {
            this.ocistiIntervalPrognoza()
            this.ocistiEmitiranjePrognoza()

            this.pokreniEmitiranjePrognozeVremenaPrviPut()

            window["intervalPrognoze"] = rxjs.interval(4000 * Object.keys(this.#gradLokacijePrognoza).length - 1)
                .subscribe(() => this.pokreniEmitiranjePrognozeVremenaPrviPut());
        }

        deaktivirajOvisneKomponenteOPrognoziVremena = () => {
            document.getElementById("obrisi-favorita").disabled = true
        }

        aktivirajOvisneKomponenteOPrognoziVremena = () => {
            document.getElementById("obrisi-favorita").disabled = false
        }

        dohvatiPrognozuVremena = (potrebnoZaDohvatiti) => {
            return posaljiZahtjevSaTokenom("/api/gradPodaci/prognoza", "POST", {
                lokacija: potrebnoZaDohvatiti.ime,
                drzava: potrebnoZaDohvatiti.drzava,
            }).pipe(
                rxjs.filter(x => x.podaci != undefined && x.statusniKod < 400 && Object.keys(x.podaci).length != 0),
                rxjs.tap(x => {
                    let drzava = x.podaci[Object.keys(x.podaci)[0]][0].drzava;
                    const gradLokacija = Object.keys(x.podaci)[0];

                    this.#gradLokacijePrognoza[gradLokacija] = {};
                    this.#gradLokacijePrognoza[gradLokacija][drzava] = x.podaci[gradLokacija];
                })
            )
        }

        promjenaOdabranihLokacija = () => {
            return rxjs.fromEvent(document.getElementById("grad-lokacije-dropdown-gumb"), 'click').pipe(
                rxjs.filter(() => this.#odabraneLokacije.length > 0),
                rxjs.tap(() => {
                    Array.from(document.getElementsByClassName("grad-lokacije-popis")).forEach(item => {
                        let rez = item.textContent.split(",");
                        if (this.#odabraneLokacije.map(el => el.ime).includes(rez[0]))
                            item.style.backgroundColor = "lightblue"
                        else
                            item.style.backgroundColor = ""
                    })
                }),
                rxjs.switchMap(() => {
                    const elements = Array.from(document.getElementsByClassName("grad-lokacije-popis"));
                    return rxjs.from(elements).pipe(
                        rxjs.mergeMap(element => {
                            return rxjs.fromEvent(element, 'click')
                        })
                    );
                }),
                rxjs.map(event => event.target),
                rxjs.tap((element) => {
                    let rez = element.textContent.split(",")

                    if (this.#odabraneLokacije.map(item => item.ime + "," + item.drzava).includes(element.textContent) &&
                        this.#odabraneLokacije.length > 1) {
                        this.#graf.izbrisiLinijuIzGrafa(element.textContent)
                        this.#graf.obrisiPodatkeGradaUGrafu(rez[0], rez[1])

                        this.izbrisiLokacijuIzOdabira(element.textContent)
                        this.izbrisiLokacijuIzPrognoza(rez[0], rez[1])

                        if (this.#odabraneLokacije.length > 1)
                            this.periodicnoEmitirajPrognozuVremena()
                        else
                            this.mapirajPocetnuPrognozuVremena();
                    }
                    else {
                        if (!this.#odabraneLokacije.map(item => item.ime + "," + item.drzava).includes(element.textContent)) {
                            this.#odabraneLokacije.push({ ime: rez[0], drzava: rez[1] })

                            this.deaktivirajOvisneKomponenteOPrognoziVremena()
                            this.dohvatiPrognozuVremena({ ime: rez[0], drzava: rez[1] }).subscribe(_ => {
                                this.aktivirajOvisneKomponenteOPrognoziVremena()
                                this.resetirajVremenskuPrognozuSucelje()
                                this.periodicnoEmitirajPrognozuVremena()
                            })

                            this.#graf.generirajNovuLinijuUGrafu({ ime: rez[0], drzava: rez[1] })
                        }
                    }

                    this.provjeriOdabraniFiltrirajGumb()
                    this.azurirajStanjeTrenutnihINajvecihPodataka().subscribe()
                    this.#graf.azurirajGraf()
                })
            )
        }

        upravljanjeFavoritimaGumb = () => {
            rxjs.fromEvent(document.getElementById('dodaj-favorita'), 'click')
                .pipe(
                    rxjs.concatMap(() => rxjs.fromEvent(document.getElementById('select-favoriti'), 'change').pipe(
                        rxjs.map((event) => event.target.value),
                        rxjs.map((value) => !!value && document.getElementById('select-favoriti').options[document.getElementById('select-favoriti').selectedIndex].text != "Odaberite favorita"),
                        rxjs.startWith(false))
                    )
                ).subscribe(vrijednost => document.getElementById('dodaj-favorita-gumb').disabled = !vrijednost)

            rxjs.fromEvent(document.getElementById('obrisi-favorita'), 'click')
                .pipe(
                    rxjs.concatMap(() => rxjs.fromEvent(document.getElementById('select-favoriti-brisanje'), 'change').pipe(
                        rxjs.map((event) => event.target.value),
                        rxjs.map((value) => !!value && document.getElementById('select-favoriti-brisanje').options[document.getElementById('select-favoriti-brisanje').selectedIndex].text != "Odaberite favorita"),
                        rxjs.startWith(false))
                    )
                ).subscribe(vrijednost => document.getElementById('obrisi-favorita-gumb').disabled = !vrijednost)

            rxjs.fromEvent(document.getElementById('odustani-gumb-favoriti'), 'click').pipe(
                rxjs.tap(() => {
                    document.getElementById("select-favoriti").value = "default";
                    document.getElementById("obavijest-favoriti").hidden = true
                })
            ).subscribe()

            rxjs.fromEvent(document.getElementById('odustani-gumb-favoriti-brisanje'), 'click').pipe(
                rxjs.tap(() => {
                    document.getElementById("select-favoriti-brisanje").value = "default";
                    document.getElementById("obavijest-favoriti-brisanje").hidden = true
                })
            ).subscribe()
        }

        mapirajFoiLokacijeSelectFavoriti = (lokacije, select) => {
            const selectElement = document.getElementById(select);
            while (selectElement.children.length > 1) selectElement.removeChild(selectElement.lastChild);

            return rxjs.from(lokacije).pipe(
                rxjs.map((lokacija) => `<option class="dropdown-ogranicenje" value="1">${lokacija.ime + "," + lokacija.drzava}</option>`),
                rxjs.reduce((acc, item) => acc + item, ''),
                rxjs.tap(htmlListaPopis => {
                    document.getElementById(select).insertAdjacentHTML("beforeend", htmlListaPopis)
                })
            )
        }

        upravljanjeFavoritimaBrisanje = () => {
            let favoriti = []
            let gradLokacije = []
            let odabrani
            rxjs.fromEvent(document.getElementById("obrisi-favorita"), "click").pipe(
                rxjs.concatMap(() => {
                    const favoriti = posaljiZahtjevSaTokenom("/api/gradPodaci/favoriti", "GET")
                    const gradovi = posaljiZahtjevSaTokenom("/api/gradPodaci/dajLokacije", "GET")
                    return rxjs.forkJoin([favoriti, gradovi])
                }),
                rxjs.filter(obj => Object.values(obj).every(item => item.statusniKod < 400)),
                rxjs.map(x => {
                    if (x[0].hasOwnProperty("podaci"))
                        favoriti = x[0].podaci

                    if (x[1].hasOwnProperty("podaci"))
                        gradLokacije = x[1].podaci

                    let jesuFavoriti = Object.values(gradLokacije).filter((value) =>
                        Object.values(favoriti).map(data => data.ime).includes(value.ime));

                    return jesuFavoriti
                }),
                rxjs.concatMap((jesuFavoriti) => {
                    return this.mapirajFoiLokacijeSelectFavoriti(jesuFavoriti, "select-favoriti-brisanje")
                })
            ).subscribe()

            return rxjs.fromEvent(document.getElementById("obrisi-favorita-gumb"), "click").pipe(
                rxjs.concatMap(() => {
                    document.getElementById("spinner-favoriti-brisanje").hidden = false

                    let rez = document.getElementById('select-favoriti-brisanje').options[document.getElementById("select-favoriti-brisanje").selectedIndex].textContent.split(",")

                    odabrani = Object.values(gradLokacije).find((value) => value.ime == rez[0] && value.drzava == rez[1]);

                    return posaljiZahtjevSaTokenom("/api/gradPodaci/favorit", "DELETE", {
                        lokacija: rez[0],
                        drzava: rez[1]
                    })
                }),
                rxjs.tap(odgovor => {
                    document.getElementById("obavijest-favoriti-brisanje").hidden = false
                    document.getElementById("odustani-gumb-favoriti-brisanje").disabled = true
                    document.getElementById("obrisi-favorita-gumb").disabled = true

                    let that = this
                    odgovor.statusniKod == 200 ?
                        function () {
                            document.getElementById("obavijest-favoriti-brisanje").textContent = odgovor.poruka

                            rxjs.timer(400).pipe(
                                rxjs.tap(() => document.getElementById("spinner-favoriti-brisanje").hidden = true),
                                rxjs.map(() => {
                                    const selectPostavkePrikaza = document.getElementById("select-postavke-prikaza")
                                    const vrijednost = selectPostavkePrikaza.options[selectPostavkePrikaza.selectedIndex].textContent

                                    const favoritiFiltrirani = Object.values(favoriti).filter(obj => obj.id != odabrani.id);

                                    const index = favoriti.findIndex(el => el.id == odabrani.id);
                                    if (index != -1)
                                        favoriti.splice(index, 1)

                                    that.mapirajFoiLokacijeSelectFavoriti(favoritiFiltrirani, "select-favoriti-brisanje").subscribe()

                                    document.getElementById("odustani-gumb-favoriti-brisanje").disabled = false;
                                    document.getElementById("obrisi-favorita-gumb").disabled = true
                                    document.getElementById("select-favoriti-brisanje").value = "default";
                                    document.getElementById("obavijest-favoriti-brisanje").hidden = true

                                    return vrijednost
                                }),
                                rxjs.filter(vrijednost => vrijednost == "Moji favoriti"),
                                rxjs.tap(() => {
                                    const index = that.#gradFavoriti.findIndex(el => el.id == odabrani.id);
                                    if (index != -1) {
                                        that.#gradFavoriti.splice(index, 1)
                                    }

                                    const jeLiOdabranVecPrije = that.#odabraneLokacije.find(item => item.ime == odabrani.ime
                                        && item.drzava == odabrani.drzava)

                                    that.mapirajGradLokacijePadajuciIzbornik(that.#gradFavoriti).subscribe()
                                    if (jeLiOdabranVecPrije != undefined) {
                                        that.izbrisiLokacijuIzOdabira(jeLiOdabranVecPrije.ime + "," + jeLiOdabranVecPrije.drzava)
                                        that.izbrisiLokacijuIzPrognoza(jeLiOdabranVecPrije.ime, jeLiOdabranVecPrije.drzava)

                                        that.#graf.izbrisiLinijuIzGrafa(jeLiOdabranVecPrije.ime + "," + jeLiOdabranVecPrije.drzava)
                                        that.#graf.obrisiPodatkeGradaUGrafu(jeLiOdabranVecPrije.ime, jeLiOdabranVecPrije.drzava)

                                        that.azurirajStanjeTrenutnihINajvecihPodataka().subscribe()
                                    }

                                    if (that.#odabraneLokacije.length == 0 && that.#gradFavoriti.length == 0) {
                                        that.#graf.kreirajPrazniGraf()
                                        that.resetirajVremenskuPrognozuSucelje()
                                    }

                                    if (that.#odabraneLokacije.length == 1 &&
                                        that.#gradFavoriti.length > 0) {
                                        that.ocistiIntervalPrognoza()
                                        that.ocistiEmitiranjePrognoza()

                                        that.dohvatiPrognozuVremena({ ime: that.#gradFavoriti[0].ime, drzava: that.#gradFavoriti[0].drzava })
                                            .subscribe(_ => {
                                                that.resetirajVremenskuPrognozuSucelje()
                                                that.mapirajPocetnuPrognozuVremena()
                                            })
                                    }

                                    if (that.#odabraneLokacije.length == 0 && that.#gradFavoriti.length > 0) {
                                        that.#odabraneLokacije[0] = { ime: that.#gradFavoriti[0].ime, drzava: that.#gradFavoriti[0].drzava }
                                        that.dohvatiPrognozuVremena({ ime: that.#gradFavoriti[0].ime, drzava: that.#gradFavoriti[0].drzava })
                                            .subscribe(_ => {
                                                that.resetirajVremenskuPrognozuSucelje()
                                                that.mapirajPocetnuPrognozuVremena()
                                            })

                                        that.#graf.generirajNovuLinijuUGrafu({ ime: that.#gradFavoriti[0].ime, drzava: that.#gradFavoriti[0].drzava })
                                    }

                                    if (that.#odabraneLokacije.length > 1 &&
                                        that.#gradFavoriti.length > 0) {
                                        that.dohvatiPrognozuVremena({ ime: that.#gradFavoriti[0].ime, drzava: that.#gradFavoriti[0].drzava })
                                            .subscribe(_ => {
                                                that.resetirajVremenskuPrognozuSucelje()
                                                that.periodicnoEmitirajPrognozuVremena()
                                            })
                                    }

                                    that.provjeriOdabraniFiltrirajGumb()
                                })
                            ).subscribe()
                        }() :
                        function () {
                            document.getElementById("obavijest-favoriti-brisanje").textContent = Object.values(odgovor.greske).join('\n');
                            rxjs.timer(400).pipe(
                                rxjs.tap(() => document.getElementById("spinner-favoriti-brisanje").hidden = true),
                                rxjs.concatMap(() => rxjs.timer(800)),
                                rxjs.tap(() => {
                                    document.getElementById("select-favoriti-brisanje").value = "default";
                                    document.getElementById("odustani-gumb-favoriti-brisanje").disabled = false;
                                })).subscribe()
                        }()
                })
            )
        }

        upravljanjeFavoritimaDodavanje = () => {
            let favoriti = []
            let gradLokacije = []
            let odabrani
            rxjs.fromEvent(document.getElementById("dodaj-favorita"), "click").pipe(
                rxjs.concatMap(() => {
                    const favoriti = posaljiZahtjevSaTokenom("/api/gradPodaci/favoriti", "GET")
                    const gradovi = posaljiZahtjevSaTokenom("/api/gradPodaci/dajLokacije", "GET")
                    return rxjs.forkJoin([favoriti, gradovi])
                }),
                rxjs.filter(obj => Object.values(obj).every(item => item.statusniKod < 400)),
                rxjs.map(x => {
                    if (x[0].hasOwnProperty("podaci"))
                        favoriti = x[0].podaci

                    if (x[1].hasOwnProperty("podaci"))
                        gradLokacije = x[1].podaci

                    let nisuFavoriti = gradLokacije.filter(item1 => !favoriti.some(item2 => item2.id === item1.id));

                    return nisuFavoriti
                }),
                rxjs.concatMap((nisuFavoriti) => {
                    return this.mapirajFoiLokacijeSelectFavoriti(nisuFavoriti, "select-favoriti")
                })
            ).subscribe()

            return rxjs.fromEvent(document.getElementById("dodaj-favorita-gumb"), "click").pipe(
                rxjs.concatMap(() => {
                    document.getElementById("spinner-favoriti").hidden = false
                    document.getElementById("odustani-gumb-favoriti").disabled = true
                    document.getElementById("dodaj-favorita-gumb").disabled = true

                    let rez = document.getElementById('select-favoriti').options[document.getElementById("select-favoriti").selectedIndex].textContent.split(",")
                    odabrani = { ime: rez[0], drzava: rez[1] }

                    return posaljiZahtjevSaTokenom("/api/gradPodaci/favorit", "POST", {
                        lokacija: rez[0],
                        drzava: rez[1]
                    })
                }),
                rxjs.tap(odgovor => {
                    document.getElementById("obavijest-favoriti").hidden = false
                    let that = this
                    odgovor.statusniKod == 200 ?
                        function () {
                            document.getElementById("obavijest-favoriti").textContent = odgovor.poruka

                            rxjs.timer(400).pipe(
                                rxjs.tap(() => document.getElementById("spinner-favoriti").hidden = true),
                                rxjs.concatMap(() => rxjs.timer(1000)),
                                rxjs.map(() => {
                                    const selectPostavkePrikaza = document.getElementById("select-postavke-prikaza")
                                    const vrijednost = selectPostavkePrikaza.options[selectPostavkePrikaza.selectedIndex].textContent

                                    favoriti.push(odabrani)

                                    let nisuFavoriti = Object.values(gradLokacije).filter((value) =>
                                        !Object.values(favoriti).map(data => data.ime).includes(value.ime));

                                    that.mapirajFoiLokacijeSelectFavoriti(nisuFavoriti, "select-favoriti").subscribe()

                                    document.getElementById("dodaj-favorita-gumb").disabled = true
                                    document.getElementById("select-favoriti").value = "default";
                                    document.getElementById("obavijest-favoriti").hidden = true
                                    document.getElementById("select-favoriti").value = "default";
                                    document.getElementById("odustani-gumb-favoriti").disabled = false;

                                    return vrijednost;
                                }),
                                rxjs.filter(vrijednost => vrijednost == "Moji favoriti"),
                                rxjs.tap(() => {
                                    that.#gradFavoriti.push(odgovor.podaci)

                                    document.getElementById("foi-lokacije-dropdown-lista-popis").insertAdjacentHTML("beforeend",
                                        `<li class="grad-lokacije-popis"><a class="dropdown-item">${odgovor.podaci.ime + "," + odgovor.podaci.drzava}</a></li>`)

                                    if (that.#odabraneLokacije.length == 0) {
                                        that.#odabraneLokacije[0] = { ime: odabrani.ime, drzava: odabrani.drzava }
                                        that.#graf.generirajNovuLinijuUGrafu(that.#odabraneLokacije[0])
                                        that.provjeriOdabraniFiltrirajGumb()

                                        that.dohvatiPrognozuVremena({ ime: odabrani.ime, drzava: odabrani.drzava })
                                            .subscribe(_ => {
                                                that.resetirajVremenskuPrognozuSucelje()
                                                that.mapirajPocetnuPrognozuVremena()
                                            })
                                        that.azurirajStanjeTrenutnihINajvecihPodataka().subscribe()
                                    }
                                })
                            ).subscribe()
                        }() :
                        function () {
                            document.getElementById("obavijest-favoriti").textContent = Object.values(odgovor.greske).join('\n');
                            rxjs.timer(400).pipe(
                                rxjs.tap(() => document.getElementById("spinner-favoriti").hidden = true),
                                rxjs.concatMap(() => rxjs.timer(800)),
                                rxjs.tap(() => {
                                    document.getElementById("select-favoriti").value = "default";
                                    document.getElementById("odustani-gumb-favoriti").disabled = false;
                                })).subscribe()
                        }()
                })
            )
        }
    }
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

    function main() {
        const graf = new Graf()
        const gradLokacijePodaci = new GradLokacijePodaci(graf)

        gradLokacijePodaci.dohvatiGradLokacije().pipe(
            rxjs.concatMap(() => gradLokacijePodaci.azurirajStanjeTrenutnihINajvecihPodataka()),
        ).subscribe()

        gradLokacijePodaci.dohvatiGradFavoriti().subscribe()
        gradLokacijePodaci.promjenaOdabranihLokacija().subscribe()
        gradLokacijePodaci.periodičnoAzurirajStanjeTrenutnihINajvecihPodataka()
        gradLokacijePodaci.provjeriStanjePromatračaGumbaZaFiltriranje()
        gradLokacijePodaci.zapocniSaSlusanjemFiltriranja()
        gradLokacijePodaci.promjenaPromjenePrikazaMjerenja()
        gradLokacijePodaci.upravljanjeFavoritimaGumb()
        gradLokacijePodaci.upravljanjeFavoritimaDodavanje().subscribe()
        gradLokacijePodaci.upravljanjeFavoritimaBrisanje().subscribe()

        return 0
    }
    main()
})