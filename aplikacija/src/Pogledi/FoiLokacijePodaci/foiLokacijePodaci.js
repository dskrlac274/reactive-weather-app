window.addEventListener('load', function () {
  let foiLokacije = []
  let trenutniGraf
  let odabraneLokacije = []
  let odabranaLokacija
  let grafVrijednosti = {}
  let zadnjePritisnutiGumb = document.getElementById("pracenje-uzivo-gumb");
  let korisnikKljuc

  const buttons = [
    document.getElementById("pracenje-uzivo-gumb"),
    document.getElementById("filtriraj-sat"),
    document.getElementById("filtriraj-dan"),
    document.getElementById("filtriraj-mjesec"),
    document.getElementById("filtriraj-godina"),
  ]

  let socket = io("localhost:3001", { 'transports': ['websocket', 'polling'] });

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

  const odrediReprezentacijuDatuma = (vrijemeDate) => {
    if (zadnjePritisnutiGumb == document.getElementById("filtriraj-dan"))
      return vrijemeDate.getDate() + "." + (vrijemeDate.getMonth() + 1) + "." + vrijemeDate.getFullYear() + "."
    if (zadnjePritisnutiGumb == document.getElementById("filtriraj-mjesec"))
      return (vrijemeDate.getMonth()) + "." + vrijemeDate.getFullYear() + "."
    if (zadnjePritisnutiGumb == document.getElementById("filtriraj-godina"))
      return vrijemeDate.getFullYear() + "."
    else
      return vrijemeDate.getHours() + "h " + vrijemeDate.getMinutes() + "m " + vrijemeDate.getSeconds() + "s"
  }

  const dodajUGraf = (podaci, vremenaMjerenja, naslovGrafa) => {
    const distinktnoSortiranoPolje = [...new Set(
      Object.values(grafVrijednosti)
        .map(el => el.vrijemeMjerenja).flat().sort((a, b) => {
          return a - b
        }).map(vrijeme => {
          return odrediReprezentacijuDatuma(new Date(vrijeme))
        }))]

    vremenaMjerenja = vremenaMjerenja.map(vrijeme => {
      return odrediReprezentacijuDatuma(new Date(vrijeme))
    })

    const mapiraneVrijednosti = vremenaMjerenja.map(vrijemeMjerenja => {
      const vrijemeOdređeneLinijeGrafa = distinktnoSortiranoPolje.find(value => value == vrijemeMjerenja)
      const indeksVremena = vremenaMjerenja.indexOf(vrijemeMjerenja)

      return { x: vrijemeOdređeneLinijeGrafa, y: podaci[indeksVremena] };
    });

    const datasetIndex = trenutniGraf.data.datasets.findIndex(dataset => dataset.label == naslovGrafa);

    trenutniGraf.data.labels = distinktnoSortiranoPolje
    trenutniGraf.data.datasets[datasetIndex].data = mapiraneVrijednosti;
    trenutniGraf.update();
  }

  const azurirajGraf = () => {
    const distinktnoSortiranoPolje = [...new Set(
      Object.values(grafVrijednosti)
        .map(el => el.vrijemeMjerenja).flat().sort((a, b) => {
          return a - b
        }).map(vrijeme => {
          return odrediReprezentacijuDatuma(new Date(vrijeme))
        }))]

    trenutniGraf.data.labels = distinktnoSortiranoPolje
    trenutniGraf.update();
  }

  const kreirajPrazniGraf = () => {
    if (trenutniGraf !== undefined)
      trenutniGraf.destroy()

    trenutniGraf = new Chart(document.getElementById('graf'), {
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

    trenutniGraf.update()
  }

  function dohvatiNasumicnuBoju() {
    const randomColor = () => Math.floor(Math.random() * 256);
    const red = randomColor();
    const green = randomColor();
    const blue = randomColor();

    return `rgb(${red}, ${green}, ${blue})`;
  }

  function generirajNovuLinijuUGrafu(naslov) {
    const color = dohvatiNasumicnuBoju()
    const dataset = {
      label: naslov,
      data: [],
      borderColor: color,
    };

    trenutniGraf.data.datasets.push(dataset)

    trenutniGraf.update()
  }

  function izbrisiLinijuIzGrafa(naslov) {
    const datasetIndex = trenutniGraf.data.datasets.findIndex(dataset => dataset.label == naslov);

    if (datasetIndex !== -1) {
      trenutniGraf.data.datasets.splice(datasetIndex, 1);
      trenutniGraf.update();
    }
  }

  function izbrisiLokacijuIzOdabira(naslov) {
    const index = odabraneLokacije.findIndex(el => el === naslov);

    if (index !== -1) {
      odabraneLokacije.splice(index, 1);
    }
  }

  const mapirajEmitiraneVrijednosti = (poljeObjekata, oznaka) => {
    let polje
    if (Array.isArray(poljeObjekata))
      polje = poljeObjekata
    else polje = [poljeObjekata]

    polje.forEach(objekt => {

      if (!grafVrijednosti[objekt.lokacija]) {
        grafVrijednosti[objekt.lokacija] = { [oznaka]: [], vrijemeMjerenja: [] };
      }
      if (grafVrijednosti[objekt.lokacija])
        grafVrijednosti[objekt.lokacija][oznaka].push(objekt[oznaka]);
      grafVrijednosti[objekt.lokacija].vrijemeMjerenja.push(new Date(objekt.vrijemeMjerenja).getTime());
    })

  };

  const obrisiEmitiraneVrijednosti = (kljuc) => {
    if (grafVrijednosti.hasOwnProperty(kljuc)) {
      delete grafVrijednosti[kljuc];
    }
  };

  const dajMaxITrenutno = () => {
    Array.from(document.getElementsByClassName("stanje-rezultat")).forEach(item => { item.textContent = "" })
    Array.from(document.getElementsByClassName("spinner-stanja")).forEach(item => { item.hidden = false })

    if (document.getElementById("temperatura-trenutno") == undefined) {
      return rxjs.of({})
    }

    return posaljiZahtjevSaTokenom("/api/foiPodaci/dajMaxTrenutno", "POST", {
      lokacije: odabraneLokacije
    }).pipe(
      rxjs.delay(400),
      rxjs.filter(objekt => objekt.statusniKod !== 404),
      rxjs.tap(mjerenja => {
        const podaci = mjerenja.podaci
        Array.from(document.getElementsByClassName("spinner-stanja")).forEach(item => { item.hidden = true })

        document.getElementById("temperatura-trenutno").textContent = Number(podaci.novo.temperatura).toFixed(1).toString() + "°C"
        document.getElementById("tlak-trenutno").textContent = Number(podaci.novo.tlak).toFixed(1).toString() + " hPa"
        document.getElementById("vlaga-trenutno").textContent = Number(podaci.novo.vlaga).toFixed(1).toString() + " %"

        document.getElementById("temperatura-najvece").textContent = Number(podaci.najvece.temperatura).toFixed(1).toString() + "°C"
        document.getElementById("tlak-najvece").textContent = Number(podaci.najvece.tlak).toFixed(1).toString() + " hPa"
        document.getElementById("vlaga-najvece").textContent = Number(podaci.najvece.vlaga).toFixed(1).toString() + " %"

        document.getElementById("najvece-temperatura").textContent = podaci.najvece.lokacija[0]
        document.getElementById("najvece-vlaga").textContent = podaci.najvece.lokacija[1]
        document.getElementById("najvece-tlak").textContent = podaci.najvece.lokacija[2]

        document.getElementById("zadnje-lokacija").textContent = podaci.novo.lokacija
      })
    )
  }

  const periodicnoAzurirajMaxITrenutno = () => {
    foiLokacijePodaciIntervalObservable = rxjs.interval(60000).subscribe(() => {
      if (odabraneLokacije.length > 0)
        dajMaxITrenutno().subscribe();
    })
  }

  const odrediPostavkeMjerenja = (poljeObjekata) => {
    const selectedValue = document.getElementById("select-prikaz-mjerenja")
      .options[document.getElementById("select-prikaz-mjerenja").selectedIndex].text.toLowerCase();

    if (trenutniGraf.data.labels.length > 15) {
      for (const kljuc in grafVrijednosti) {
        grafVrijednosti[kljuc].vrijemeMjerenja = []
        grafVrijednosti[kljuc].selectedValue = []
      }

      trenutniGraf.data.labels = []
      trenutniGraf.data.datasets.forEach(element => element.data = []);
      trenutniGraf.update();
    }

    switch (selectedValue) {
      case 'temperatura':
        mapirajEmitiraneVrijednosti(poljeObjekata, selectedValue);
        break;
      case 'tlak':
        mapirajEmitiraneVrijednosti(poljeObjekata, selectedValue);
        break;
      case 'vlaga':
        mapirajEmitiraneVrijednosti(poljeObjekata, selectedValue);
        break;
    }

    Object.keys(grafVrijednosti).forEach(objektNaziv => {
      dodajUGraf(grafVrijednosti[objektNaziv][selectedValue],
        grafVrijednosti[objektNaziv].vrijemeMjerenja, objektNaziv);
    })
  }

  const filtirajPodatkePo = (filter, datum) => {
    let el = odabraneLokacije.filter((value) => !Object.keys(grafVrijednosti).includes(value));

    return rxjs.from(el).pipe(
      rxjs.mergeMap((lok) => {
        const putanja = datum == undefined ? `/api/foiPodaci/filtrirajPo?filter=${filter}` :
          `/api/foiPodaci/filtrirajPo?filter=${filter}&datum=${datum}`;
        return posaljiZahtjevSaTokenom(putanja, "POST", { lokacija: lok });
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

        odrediPostavkeMjerenja(elements);
      })
    )
  }

  const promjenaFilteraGrafa = (filter, odabraniDatum) => {
    if (odabraneLokacije.length == 0)
      return

    grafVrijednosti = {}

    kreirajPrazniGraf()
    odabraneLokacije.forEach(el => generirajNovuLinijuUGrafu(el));

    if (odabraniDatum) {
      filtirajPodatkePo("odabraniDatum", odabraniDatum).subscribe()
    } else {
      filtirajPodatkePo(filter).subscribe();
    }
  }

  const zapocniSaSlusanjemFiltriranja = () => {
    rxjs.fromEvent(document.getElementById("filtriraj-sat"), 'click').pipe(
      rxjs.tap(() => ponistiSlusanje()),
      rxjs.filter(() => odabraneLokacije.length > 0),
      rxjs.tap(() => promjenaFilteraGrafa("sat"))
    ).subscribe();

    rxjs.fromEvent(document.getElementById("filtriraj-dan"), 'click').pipe(
      rxjs.tap(() => ponistiSlusanje()),
      rxjs.filter(() => odabraneLokacije.length > 0),
      rxjs.tap(() => promjenaFilteraGrafa("dan"))
    ).subscribe();

    rxjs.fromEvent(document.getElementById("filtriraj-mjesec"), 'click').pipe(
      rxjs.tap(() => ponistiSlusanje()),
      rxjs.filter(() => odabraneLokacije.length > 0),
      rxjs.tap(() => promjenaFilteraGrafa("mjesec"))
    ).subscribe();

    rxjs.fromEvent(document.getElementById("filtriraj-godina"), 'click').pipe(
      rxjs.tap(() => ponistiSlusanje()),
      rxjs.filter(() => odabraneLokacije.length > 0),
      rxjs.tap(() => promjenaFilteraGrafa("godina"))
    ).subscribe();

    rxjs.fromEvent(document.getElementById("filtriraj-datum"), 'input').pipe(
      rxjs.tap(() => ponistiSlusanje()),
      rxjs.filter(() => odabraneLokacije.length > 0),
      rxjs.tap((event) => {
        zadnjePritisnutiGumb = document.getElementById("filtriraj-datum");
        buttons.forEach(item => item.disabled = false)
        promjenaFilteraGrafa("odabraniDatum", event.target.value);
        event.target.value = ""
      })
    ).subscribe();
  }

  rxjs.fromEvent(document.getElementById('pracenje-uzivo-gumb'), 'click').pipe(
    rxjs.filter(() => odabraneLokacije.length > 0),
    rxjs.tap(() => {
      grafVrijednosti = {}
      kreirajPrazniGraf()
      if (odabraneLokacije.length == 0)
        return

      odabraneLokacije.forEach(el => generirajNovuLinijuUGrafu(el));
      registrirajSeNaSlusanje()
    })
  ).subscribe()

  const registrirajSeNaSlusanje = () => {
    socket.emit('klijent-registracija', JSON.stringify({ lokacije: odabraneLokacije, kljuc: korisnikKljuc }))
  }

  const ponistiSlusanje = () => {
    socket.emit('klijent-deregistracija', JSON.stringify(korisnikKljuc))
  }

  const pratiWebUtičnicu = () => {
    return rxjs.fromEvent(socket, 'message').pipe(
      rxjs.debounceTime(500),
      rxjs.map(podaci => podaci.fullDocument),
      rxjs.mergeMap((podaci) => {
        return posaljiZahtjevSaTokenom("/api/foiPodaci/" + podaci.lokacija + "/dohvatiLokaciju", "GET").pipe(
          rxjs.map(objekt => {
            podaci.lokacija = objekt.podaci.naziv;

            return podaci;
          })
        )
      }),
      rxjs.filter(objekt => {
        const trenutniDatum = new Date().getTime()
        const poslaniDatum = new Date(objekt.vrijemeMjerenja).getTime()

        return (odabraneLokacije.includes(objekt.lokacija) && trenutniDatum > poslaniDatum && (trenutniDatum - poslaniDatum) <= 60000)
      })
    ).subscribe(odrediPostavkeMjerenja)
  }

  const buttonClicks = buttons.map(button =>
    rxjs.fromEvent(button, 'click').pipe(
      rxjs.map(event => {
        zadnjePritisnutiGumb = event.target;
        return event.target
      }),
    )
  );

  const pratiStanjeGumba = () =>
    rxjs.merge(...buttonClicks).subscribe(clickedButton => {
      buttons.forEach(button => {
        button.disabled = (button === clickedButton);
      });
    });

  const usporediStanje = () => {
    if (odabraneLokacije.length == 0 || zadnjePritisnutiGumb == document.getElementById("pracenje-uzivo-gumb"))
      return
    if (zadnjePritisnutiGumb == document.getElementById("filtriraj-sat")) {
      filtirajPodatkePo("sat").subscribe();
    }
    else if (zadnjePritisnutiGumb == document.getElementById("filtriraj-dan")) {
      filtirajPodatkePo("dan").subscribe();
    }
    else if (zadnjePritisnutiGumb == document.getElementById("filtriraj-mjesec")) {
      filtirajPodatkePo("mjesec").subscribe();
    }
    else if (zadnjePritisnutiGumb == document.getElementById("filtriraj-godina")) {
      filtirajPodatkePo("godina").subscribe();
    }
    else {
      filtirajPodatkePo("odabraniDatum").subscribe();
    }
  }

  const promjenaOdabranihLokacija = () => {
    if (trenutniGraf == undefined)
      kreirajPrazniGraf()

    rxjs.fromEvent(document.getElementById("foi-lokacije-dropdown-gumb"), 'click').pipe(
      rxjs.filter(() => odabraneLokacije.length > 0),
      rxjs.tap(() => {
        Array.from(document.getElementsByClassName("foi-lokacije-popis")).forEach(item => {
          if (odabraneLokacije.includes(item.textContent))
            item.style.backgroundColor = "lightblue"
          else
            item.style.backgroundColor = ""
        })
      }),
      rxjs.switchMap(() => {
        const elements = Array.from(document.getElementsByClassName("foi-lokacije-popis"));
        return rxjs.from(elements).pipe(
          rxjs.mergeMap(element => {
            return rxjs.fromEvent(element, 'click')
          })
        );
      }),
      rxjs.map(event => event.target),
      rxjs.tap((element) => {
        if (odabraneLokacije.includes(element.textContent) && odabraneLokacije.length > 1) {
          izbrisiLokacijuIzOdabira(element.textContent)
          izbrisiLinijuIzGrafa(element.textContent)
          obrisiEmitiraneVrijednosti(element.textContent)
        }
        else {
          if (!odabraneLokacije.includes(element.textContent)) {
            odabraneLokacije.push(element.textContent)
            generirajNovuLinijuUGrafu(element.textContent)
          }
        }

        mapirajFoiLokacijeStranicenjeDropDown(odabraneLokacije)

        usporediStanje()
        dajMaxITrenutno().subscribe()
        azurirajGraf()
      })
    ).subscribe()
  }

  const promjenaPromjenePrikazaMjerenja = () => {
    rxjs.fromEvent(document.getElementById("select-prikaz-mjerenja"), 'change').pipe(
      rxjs.map((event) => event.target.value),
      rxjs.tap(() => {
        grafVrijednosti = {}
        usporediStanje()
      })).subscribe()
  }

  const mapirajFoiLokacijeDropDown = (lokacije) => {
    document.getElementById("foi-lokacije-dropdown-lista-popis").innerHTML = ""
    return rxjs.from(lokacije).pipe(
      rxjs.map(lokacija => `<li class="foi-lokacije-popis"><a class="dropdown-item">${lokacija.naziv}</a></li>`),
      rxjs.reduce((acc, item) => acc + item, ''),
      rxjs.tap(htmlListaPopis => {
        document.getElementById("foi-lokacije-dropdown-lista-popis").insertAdjacentHTML("beforeend", htmlListaPopis)
      }))
  }

  const mapirajFoiLokacijeStranicenjeDropDown = (lokacije) => {
    document.getElementById("popis-odabranih-lokacija-stranicenje").innerHTML = ""
    rxjs.from(lokacije).pipe(
      rxjs.map(lokacija => `<li class="foi-odabrane-lokacije-popis-stranicenje"><a class="dropdown-item">${lokacija}</a></li>`),
      rxjs.reduce((acc, item) => acc + item, ''),
      rxjs.tap(htmlListaPopis => {
        document.getElementById("popis-odabranih-lokacija-stranicenje").insertAdjacentHTML("beforeend", htmlListaPopis)
      })
    ).subscribe()
  }

  const postaviPregledTjednaZaOdabranuLokaciju = () => {
    rxjs.fromEvent(document.getElementById("dropdown-stranicenje-lokacija"), 'click').pipe(
      rxjs.filter(() => odabraneLokacije.length > 0),
      rxjs.switchMap(() => {
        const elementi = Array.from(document.getElementsByClassName("foi-odabrane-lokacije-popis-stranicenje"));
        return rxjs.from(elementi).pipe(
          rxjs.mergeMap(element => {
            return rxjs.fromEvent(element, 'click')
          }))
      }),
      rxjs.map(event => event.target),
      rxjs.tap((element) => {
        odabranaLokacija = element.textContent
        document.getElementById("stranicenje-naslov").textContent = "Povijest vremena - " + odabranaLokacija

        dohvatiDane().subscribe()
      })
    ).subscribe()
  }

  const mapirajFoiLokacijeSelectBrisanje = (lokacije) => {
    const selectElement = document.getElementById("select-obrisi");
    while (selectElement.children.length > 1) selectElement.removeChild(selectElement.lastChild);

    return rxjs.from(lokacije).pipe(
      rxjs.map((lokacija) => `<option class="dropdown-ogranicenje" value="1">${lokacija.naziv}</option>`),
      rxjs.reduce((acc, item) => acc + item, ''),
      rxjs.tap(htmlListaPopis => {
        document.getElementById("select-obrisi").insertAdjacentHTML("beforeend", htmlListaPopis)
      })
    )
  }

  const dohvatiKorisnika = () => {
    return posaljiZahtjevSaTokenom("http://localhost:3000/api/korisnici/prijavljeniKorisnik", "GET").pipe(

      rxjs.filter(x => x.podaci != undefined),
      rxjs.tap((odgovor) => korisnikKljuc = odgovor.podaci.id)
    )
  }

  const mapirajFoiLokacijeSelectAzuriranje = (lokacije) => {
    const selectElement = document.getElementById("select-azuriraj");
    while (selectElement.children.length > 1) selectElement.removeChild(selectElement.lastChild);

    return rxjs.from(lokacije).pipe(
      rxjs.map((lokacija) => `<option class="dropdown-ogranicenje" value="1">${lokacija.naziv}</option>`),
      rxjs.reduce((acc, item) => acc + item, ''),
      rxjs.tap(htmlListaPopis => {
        document.getElementById("select-azuriraj").insertAdjacentHTML("beforeend", htmlListaPopis)
      })
    )
  }

  const postaviStranicenje = (daniDatum) => {
    document.getElementById("stranicenje-naslov").textContent = "Povijest vremena - " + odabranaLokacija
    const elements = document.getElementsByClassName("mapirano-stranicenje")
    Array.from(elements).forEach((element) => document.getElementById("parent-stranicenje").removeChild(element));

    posaljiZahtjevSaTokenom("/api/foiPodaci/tjedan", "POST", {
      lokacija: odabranaLokacija,
      datum: daniDatum,
    }).pipe(
      rxjs.filter(x => x.podaci != undefined),
      rxjs.tap(x => {
        for (let i = 0; i < x.podaci[odabranaLokacija].length; i++) {
          let slika = ""
          if (x.podaci[odabranaLokacija][i].vlaga >= 70) {
            slika = "kisovito.png"
          }
          else if (x.podaci[odabranaLokacija][i].temperatura < 20 || (x.podaci[odabranaLokacija][i].vlaga < 70 && x.podaci[odabranaLokacija][i].vlaga >= 30)) {
            slika = "oblacno.png"
          }
          else slika = "suncano.png"

          const datum = new Date(x.podaci[odabranaLokacija][i].vrijemeMjerenja)

          const dan = String(datum.getDate()).padStart(2, '0');
          const mjesec = String(datum.getMonth() + 1).padStart(2, '0');
          const godina = datum.getFullYear();
          const datumPrikaz = `${dan}.${mjesec}.${godina}.`;

          let html = `<div class="mapirano-stranicenje"
          style="background-color: #0d6efd;grid-row: ${i + 3};border: 1px solid black;color: white;border-radius: 6px;display: grid;grid-template-columns: 65px 100px auto 120px;margin-right: 10px;margin-left: 10px;grid-template-rows: 0px;">
          <img src="./staticno/Slike/${slika}" style="grid-column: 1;width: 65px;">
          <p
              style="display: flex;justify-content: center;align-items: center;margin: 0px;grid-column: 2;font-size: 20px;height: 60px;font-family: cursive;">
              ${Number(x.podaci[odabranaLokacija][i].temperatura).toFixed(1)} °C</p>
          <div
              style="grid-column: 3;display: flex;justify-content: center;height: 60px;flex-direction: column;margin-left: 10px;">
              <p style="font-family: cursive;margin: 0px;">Tlak (hPa): ${Number(x.podaci[odabranaLokacija][i].tlak).toFixed(1)}</p>
              <p style="font-family: cursive;margin: 0px;">Vlaga (%): ${Number(x.podaci[odabranaLokacija][i].vlaga).toFixed(1)}</p>
          </div>
          <p style="font-family: cursive;height: 60px;">${datumPrikaz}</p>
          </div>`
          document.getElementById("parent-stranicenje").insertAdjacentHTML("beforeend", html)
        }
      }
      )
    ).subscribe()
  }

  const pripremiKlikNaSat = () => {
    rxjs.fromEvent(document.getElementById("dropdown-stranicenje"), 'click').pipe(
      rxjs.switchMap(() => {
        const elementi = Array.from(document.getElementsByClassName("foi-lokacije-popis-stranicenje"));
        return rxjs.from(elementi).pipe(
          rxjs.mergeMap(element => {
            return rxjs.fromEvent(element, 'click')
          }))
      }),
      rxjs.map(event => event.target),
      rxjs.tap((x) => {

        const datum = x.textContent
        postaviStranicenje(datum)
      })
    ).subscribe()
  }

  const mapirajFoiLokacijeSelectDani = (lokacije) => {
    document.getElementById("foi-lokacije-dropdown-lista-popis-stranicenje").innerHTML = ""
    return rxjs.from(lokacije).pipe(
      rxjs.map(lokacija => `<li class="foi-lokacije-popis-stranicenje"><a class="dropdown-item datumi-podataka" style="text-align: center;">${lokacija}</a></li>`),
      rxjs.reduce((acc, item) => acc + item, ''),
      rxjs.tap(htmlListaPopis => {
        document.getElementById("foi-lokacije-dropdown-lista-popis-stranicenje").insertAdjacentHTML("beforeend", htmlListaPopis)
      }))
  }

  const dohvatiDane = () => {
    document.getElementById("stranicenje-naslov").textContent = "Povijest vremena - " + odabranaLokacija
    const elements = document.getElementsByClassName("mapirano-stranicenje")
    Array.from(elements).forEach((element) => document.getElementById("parent-stranicenje").removeChild(element));

    return posaljiZahtjevSaTokenom("/api/foiPodaci/dani", "POST", {
      lokacija: odabranaLokacija,
    }).pipe(
      rxjs.filter(x => x.podaci != undefined && x.statusniKod < 400 && x.podaci.length != 0 && Object.keys(x.podaci).length != 0),
      rxjs.tap((podaci) => {
        const lokacije = podaci.podaci.map((dateString) => {
          const datum = new Date(dateString);

          const dan = String(datum.getDate()).padStart(2, '0');
          const mjesec = String(datum.getMonth() + 1).padStart(2, '0');
          const godina = datum.getFullYear();

          return `${dan}.${mjesec}.${godina}.`;
        });

        mapirajFoiLokacijeSelectDani(lokacije).subscribe()
        postaviStranicenje(lokacije[0])
      })
    )
  }

  const osvjeziPovijestLokacija = () => {
    rxjs.fromEvent(document.getElementById("btn-osvjezi-povijest"), 'click').pipe(
      rxjs.filter(() => odabranaLokacija != undefined),
      rxjs.tap(() => {
        dohvatiDane().subscribe()
      })
    ).subscribe()
  }

  const mapirajFoiLokacijeUDropDownListu = () =>
    posaljiZahtjevSaTokenom("/api/foiPodaci", "GET").pipe(
      rxjs.tap(() => {
        kreirajPrazniGraf()
      }),
      rxjs.filter(x => x.podaci != undefined && x.statusniKod < 400),
      rxjs.mergeMap((lokacije) => {
        foiLokacije = lokacije.podaci;
        odabraneLokacije[0] = foiLokacije[0].naziv;

        odabranaLokacija = odabraneLokacije[0]

        generirajNovuLinijuUGrafu(odabraneLokacije[0])
        return mapirajFoiLokacijeDropDown(foiLokacije)
      })
    );

  const resetirajPregledPoTjednuSucelje = () => {
    document.getElementById("popis-odabranih-lokacija-stranicenje").innerHTML = ""
    document.getElementById("foi-lokacije-dropdown-lista-popis-stranicenje").innerHTML = ""
    document.getElementById("stranicenje-naslov").textContent = "Povijest vremena - "
    Array.from(document.getElementsByClassName("mapirano-stranicenje")).forEach(item => item.remove())
  }

  const dodajLokaciju = () => {
    if (document.getElementById('dodaj-lokaciju') == undefined)
      return

    rxjs.fromEvent(document.getElementById('dodaj-lokaciju'), 'click')
      .pipe(
        rxjs.concatMap(() => rxjs.fromEvent(document.getElementById('naziv-nove-lokacije'), 'keyup').pipe(
          rxjs.map((event) => event.target.value),
          rxjs.map((value) => !!value),
          rxjs.startWith(false))
        )).subscribe(vrijednost => document.getElementById('dodaj-lokaciju-gumb').disabled = !vrijednost)

    rxjs.fromEvent(document.getElementById('dodaj-lokaciju-gumb'), 'click').pipe(
      rxjs.tap(() => {
        document.getElementById("spinner").hidden = false;
        document.getElementById("dodaj-lokaciju-gumb").disabled = true
        document.getElementById("odustani-gumb").disabled = true;
      }),
      rxjs.concatMap(() => posaljiZahtjevSaTokenom("/api/foiPodaci", "POST", {
        lokacija:
          document.getElementById("naziv-nove-lokacije").value
      })),
      rxjs.tap(odgovor => {
        document.getElementById("naziv-nove-lokacije").hidden = true;
        document.getElementById("obavijest-radnja").hidden = false
        odgovor.statusniKod === 201 ?
          function () {
            document.getElementById("obavijest-radnja").textContent = odgovor.poruka

            rxjs.timer(400).pipe(
              rxjs.tap(() => document.getElementById("spinner").hidden = true),
              rxjs.concatMap(() => rxjs.timer(1000)),
              rxjs.tap(() => {

                foiLokacije.push(odgovor.podaci)
                document.getElementById("foi-lokacije-dropdown-lista-popis").insertAdjacentHTML("beforeend",
                  `<li class="foi-lokacije-popis"><a class="dropdown-item">${odgovor.podaci.naziv}</a></li>`)

                if (odabraneLokacije.length == 0) {
                  odabraneLokacije[0] = foiLokacije[0].naziv

                  odabranaLokacija = odabraneLokacije[0]
                  mapirajFoiLokacijeStranicenjeDropDown(odabraneLokacije)

                  generirajNovuLinijuUGrafu(odabraneLokacije[0])
                  usporediStanje()
                  dohvatiDane().subscribe()
                  dajMaxITrenutno().subscribe()
                }

                document.getElementById("naziv-nove-lokacije").textContent = "";
                document.getElementById("obavijest-radnja").hidden = true
                $('dodajLokacijuModal').modal('hide');
                document.getElementById("naziv-nove-lokacije").value = "";
                document.getElementById("naziv-nove-lokacije").hidden = false
                document.getElementById("odustani-gumb").disabled = false;
              })).subscribe()
          }() :
          function () {
            document.getElementById("obavijest-radnja").textContent = Object.values(odgovor.greske).join('\n');
            rxjs.timer(400).pipe(
              rxjs.tap(() => document.getElementById("spinner").hidden = true),
              rxjs.concatMap(() => rxjs.timer(800)),
              rxjs.tap(() => {
                document.getElementById("naziv-nove-lokacije").value = "";
                document.getElementById("naziv-nove-lokacije").hidden = false
                document.getElementById("odustani-gumb").disabled = false;
              })).subscribe()
          }()
      })
    ).subscribe();

    rxjs.fromEvent(document.getElementById('odustani-gumb'), 'click').pipe(
      rxjs.tap(() => {
        document.getElementById("naziv-nove-lokacije").value = "";
        document.getElementById("obavijest-radnja").hidden = true
      })
    ).subscribe()
  }

  const obrisiLokaciju = () => {
    if (document.getElementById('obrisi-lokaciju') == undefined)
      return
    let odabrani
    rxjs.fromEvent(document.getElementById('obrisi-lokaciju'), 'click')
      .pipe(

        rxjs.mergeMap(() => mapirajFoiLokacijeSelectBrisanje(foiLokacije)),
        rxjs.mergeMap(() => rxjs.fromEvent(document.getElementById('select-obrisi'), 'change').pipe(
          rxjs.map((event) => event.target.value),
          rxjs.map((value) => !!value && document.getElementById('select-obrisi').options[document.getElementById('select-obrisi').selectedIndex].text != "Odaberite lokaciju"),
          rxjs.startWith(false))
        )).subscribe(vrijednost => document.getElementById('obrisi-lokaciju-gumb').disabled = !vrijednost)

    rxjs.fromEvent(document.getElementById('obrisi-lokaciju-gumb'), 'click').pipe(
      rxjs.tap(() => {
        document.getElementById("spinner-brisanje").hidden = false;
        document.getElementById("obrisi-lokaciju-gumb").disabled = true
        document.getElementById("odustani-gumb-brisanje").disabled = true;
      }),
      rxjs.concatMap(() => {
        var idBrisanje = foiLokacije.filter(el => {
          return el.naziv == document.getElementById('select-obrisi').options[document.getElementById('select-obrisi').selectedIndex].text
        })[0]._id
        odabrani = foiLokacije.find(item => item._id == idBrisanje)

        return posaljiZahtjevSaTokenom(`/api/foiPodaci/${idBrisanje}/obrisi`, "DELETE").pipe(
          rxjs.map((odgovor) => ({ _id: idBrisanje, odg: odgovor })))
      }),
      rxjs.tap(odgovor => {
        document.getElementById("select-obrisi").hidden = true;
        document.getElementById("obavijest-radnja-brisanje").hidden = false

        odgovor.odg.statusniKod === 200 ?
          function () {
            document.getElementById("obavijest-radnja-brisanje").textContent = odgovor.odg.poruka

            const index = foiLokacije.findIndex(el => el._id == odabrani._id);

            if (index != -1) {
              foiLokacije.splice(index, 1)
            }

            mapirajFoiLokacijeSelectBrisanje(foiLokacije).subscribe()
            mapirajFoiLokacijeDropDown(foiLokacije).subscribe()

            const jeLiOdabranVecPrije = odabraneLokacije.find(item => item == odabrani.naziv)

            if (jeLiOdabranVecPrije != undefined) {
              izbrisiLokacijuIzOdabira(jeLiOdabranVecPrije)
              izbrisiLinijuIzGrafa(jeLiOdabranVecPrije)
              obrisiEmitiraneVrijednosti(jeLiOdabranVecPrije)
              dajMaxITrenutno().subscribe()

              if (odabraneLokacije.length == 0 && foiLokacije.length == 0) {
                kreirajPrazniGraf()
                resetirajPregledPoTjednuSucelje()
              }

              if (odabraneLokacije.length == 0 && foiLokacije.length > 0) {
                odabraneLokacije[0] = foiLokacije[0].naziv
                odabranaLokacija = odabraneLokacije[0]
                dohvatiDane().subscribe()

                generirajNovuLinijuUGrafu(foiLokacije[0].naziv)
              }

              if (odabraneLokacije.length > 0 && odabranaLokacija == jeLiOdabranVecPrije) {
                odabranaLokacija = odabraneLokacije[0]
                dohvatiDane().subscribe()
              }
              mapirajFoiLokacijeStranicenjeDropDown(odabraneLokacije)
            }

            usporediStanje()

            rxjs.timer(400).pipe(
              rxjs.tap(() => document.getElementById("spinner-brisanje").hidden = true),
              rxjs.concatMap(() => rxjs.timer(1000)),
              rxjs.tap(() => {
                document.getElementById("obavijest-radnja-brisanje").hidden = true
                $('obrisiLokacijuModal').modal('hide');
                document.getElementById("select-obrisi").value = "default";
                document.getElementById("select-obrisi").hidden = false
                document.getElementById("odustani-gumb-brisanje").disabled = false;
              })
            ).subscribe()
          }() :
          function () {
            document.getElementById("obavijest-radnja-brisanje").textContent = Object.values(odgovor.odg.greske).join('\n');
            rxjs.timer(400).pipe(
              rxjs.tap(() => document.getElementById("spinner-brisanje").hidden = true),
              rxjs.concatMap(() => rxjs.timer(600)),
              rxjs.tap(() => {
                document.getElementById("select-obrisi").value = "";
                document.getElementById("select-obrisi").hidden = false
                document.getElementById("odustani-gumb-brisanje").disabled = false;
              })).subscribe()
          }()
      })).subscribe();

    rxjs.fromEvent(document.getElementById('odustani-gumb-brisanje'), 'click').pipe(
      rxjs.tap(() => {
        document.getElementById("select-obrisi").value = "default"
      })
    ).subscribe()
  }

  const azurirajLokaciju = () => {
    if (document.getElementById('azuriraj-lokaciju') == undefined)
      return
    rxjs.fromEvent(document.getElementById('azuriraj-lokaciju'), 'click')
      .pipe(

        rxjs.mergeMap(() => mapirajFoiLokacijeSelectAzuriranje(foiLokacije)),
        rxjs.mergeMap(() => rxjs.combineLatest(
          rxjs.fromEvent(document.getElementById('select-azuriraj'), 'change').pipe(
            rxjs.map((event) => event.target.value),
            rxjs.map((value) => !!value && document.getElementById('select-azuriraj').options[document.getElementById('select-azuriraj').selectedIndex].text != "Odaberite lokaciju")
          ),
          rxjs.fromEvent(document.getElementById('novi-naziv-lokacije'), 'input').pipe(
            rxjs.map((event) => event.target.value),
            rxjs.map((value) => !!value)
          )
        ).pipe(
          rxjs.map(([selectValue, inputValue]) => selectValue && inputValue),
          rxjs.startWith(false)
        ))
      ).subscribe(vrijednost => document.getElementById('azuriraj-lokaciju-gumb').disabled = !vrijednost);

    rxjs.fromEvent(document.getElementById('azuriraj-lokaciju-gumb'), 'click').pipe(
      rxjs.tap(() => {
        document.getElementById("spinner-azuriranje").hidden = false;
        document.getElementById("azuriraj-lokaciju-gumb").disabled = true
        document.getElementById("odustani-gumb-azuriranje").disabled = true;
      }),
      rxjs.concatMap(() => {
        var idAzuriranje = foiLokacije.filter(el => {
          return el.naziv == document.getElementById('select-azuriraj').options[document.getElementById('select-azuriraj').selectedIndex].text
        })[0]._id
        return posaljiZahtjevSaTokenom(`/api/foiPodaci/${idAzuriranje}/azuriraj`, "PUT", {
          lokacija: document.getElementById("novi-naziv-lokacije").value
        }).pipe(
          rxjs.map((odgovor) => ({ _id: idAzuriranje, _naziv: document.getElementById("novi-naziv-lokacije").value, odg: odgovor })))
      }),
      rxjs.tap(odgovor => {

        document.getElementById("select-azuriraj").hidden = true;
        document.getElementById("novi-naziv-lokacije").hidden = true;
        document.getElementById("obavijest-radnja-azuriranje").hidden = false

        odgovor.odg.statusniKod == 200 ?
          function () {
            document.getElementById("obavijest-radnja-azuriranje").textContent = odgovor.odg.poruka

            const indeks = foiLokacije.findIndex(el => el._id == odgovor._id)
            const odabraneIndex = odabraneLokacije.findIndex(el => el == foiLokacije[indeks].naziv)
            const uGrafu = Object.keys(grafVrijednosti).find(el => el == foiLokacije[indeks].naziv)

            if (uGrafu != undefined) {
              const datasetIndex = trenutniGraf.data.datasets.findIndex(dataset => dataset.label == foiLokacije[indeks].naziv);
              trenutniGraf.data.datasets[datasetIndex].label = odgovor._naziv;
              trenutniGraf.update()

              Object.defineProperty(grafVrijednosti, odgovor._naziv,
                Object.getOwnPropertyDescriptor(grafVrijednosti, foiLokacije[indeks].naziv));
              obrisiEmitiraneVrijednosti(grafVrijednosti[foiLokacije[indeks].naziv])
            }

            if (odabranaLokacija == odabraneLokacije[odabraneIndex]) {
              odabranaLokacija = odgovor._naziv
              document.getElementById("stranicenje-naslov").textContent = "Povijest vremena - " + odabranaLokacija
            }

            odabraneLokacije[odabraneIndex] = odgovor._naziv;
            foiLokacije[indeks].naziv = odgovor._naziv;

            mapirajFoiLokacijeStranicenjeDropDown(foiLokacije.map(el => el.naziv))
            mapirajFoiLokacijeSelectAzuriranje(foiLokacije).subscribe()
            mapirajFoiLokacijeDropDown(foiLokacije).subscribe();

            rxjs.timer(400).pipe(
              rxjs.tap(() => document.getElementById("spinner-azuriranje").hidden = true),
              rxjs.concatMap(() => rxjs.timer(1000)),
              rxjs.tap(() => {
                document.getElementById("obavijest-radnja-azuriranje").hidden = true
                $('azurirajLokacijuModal').modal('hide');
                document.getElementById("select-azuriraj").value = "default";
                document.getElementById("novi-naziv-lokacije").value = "";
                document.getElementById("select-azuriraj").hidden = false
                document.getElementById("novi-naziv-lokacije").hidden = false
                document.getElementById("odustani-gumb-azuriranje").disabled = false;
              })
            ).subscribe()
          }() :
          function () {
            document.getElementById("obavijest-radnja-azuriranje").textContent = Object.values(odgovor.odg.greske).join('\n');
            rxjs.timer(400).pipe(
              rxjs.tap(() => document.getElementById("spinner-azuriranje").hidden = true),
              rxjs.concatMap(() => rxjs.timer(600)),
              rxjs.tap(() => {
                document.getElementById("select-azuriraj").value = "default";
                document.getElementById("novi-naziv-lokacije").value = "";
                document.getElementById("select-azuriraj").hidden = false
                document.getElementById("odustani-gumb-azuriranje").disabled = false;
              })).subscribe()
          }()
      })).subscribe();

    rxjs.fromEvent(document.getElementById('odustani-gumb-azuriranje'), 'click').pipe(
      rxjs.tap(() => {
        document.getElementById("select-azuriraj").value = "default"
      })
    ).subscribe()
  }

  const obrisiLokacije = () => {
    if (document.getElementById('obrisi-lokacije') == undefined)
      return
    let obrisaneLokacije = [];

    rxjs.fromEvent(document.getElementById('obrisi-lokacije'), 'click')
      .pipe(
        rxjs.concatMap(() => {
          return posaljiZahtjevSaTokenom(`/api/foiPodaci/nePostoje`, "GET")
        }),
        rxjs.tap((odgovor) => {
          if (odgovor.podaci == undefined) {
            document.getElementById("obrisi-lokacije-gumb").disabled = true;
            document.getElementById("biti-ce-obrisani").innerHTML += "Ne postoje lokacije ili sve lokacije imaju određene podatke.";
            document.getElementById("biti-ce-obrisani").hidden = false;
          }
          else {
            document.getElementById("obrisi-lokacije-gumb").disabled = false;
          }
        }),
        rxjs.filter(x => x.podaci != undefined),
        rxjs.tap((odgovor) => {
          obrisaneLokacije = odgovor.podaci
        }),
        rxjs.map(odgovor => (odgovor.podaci.map(obj => obj.naziv).join(','))),
      ).subscribe(x => { document.getElementById("biti-ce-obrisani").innerHTML += x; document.getElementById("biti-ce-obrisani").hidden = false; })

    rxjs.fromEvent(document.getElementById('obrisi-lokacije-gumb'), 'click').pipe(
      rxjs.tap(() => {
        document.getElementById("spinner-brisanje-sve").hidden = false;
        document.getElementById("obrisi-lokacije-gumb").disabled = true
        document.getElementById("odustani-gumb-brisanje-sve").disabled = true;
      }),
      rxjs.concatMap(() => {
        return posaljiZahtjevSaTokenom(`/api/foiPodaci/nePostoje`, "DELETE")
      }),
      rxjs.tap(odgovor => {
        document.getElementById("biti-ce-obrisani").hidden = false;
        document.getElementById("obavijest-radnja-brisanje").hidden = false
        odgovor.statusniKod == 200 ?
          function () {
            foiLokacije = foiLokacije.filter(item => !obrisaneLokacije.some(secondItem => secondItem._id == item._id));

            const odabraniVecPrije = odabraneLokacije.filter(item => obrisaneLokacije.some(secondItem => secondItem.naziv == item))

            mapirajFoiLokacijeDropDown(foiLokacije).subscribe();

            if (odabraniVecPrije.length != 0) {
              odabraniVecPrije.forEach(odabrani => {
                izbrisiLokacijuIzOdabira(odabrani)
                izbrisiLinijuIzGrafa(odabrani)
                obrisiEmitiraneVrijednosti(odabrani)
                dajMaxITrenutno().subscribe()
              })

              if (odabraneLokacije.length == 0 && foiLokacije.length == 0) {
                kreirajPrazniGraf()
                resetirajPregledPoTjednuSucelje()
              }

              if (odabraneLokacije.length == 0 && foiLokacije.length > 0) {
                odabraneLokacije[0] = foiLokacije[0].naziv

                odabranaLokacija = odabraneLokacije[0]
                dohvatiDane().subscribe()

                generirajNovuLinijuUGrafu(foiLokacije[0].naziv)
              }

              if (odabraneLokacije.length > 0 && odabraniVecPrije.includes(odabranaLokacija)) {
                odabranaLokacija = odabraneLokacije[0]
                dohvatiDane().subscribe()
              }
              mapirajFoiLokacijeStranicenjeDropDown(odabraneLokacije)
            }

            usporediStanje()

            rxjs.timer(400).pipe(
              rxjs.tap(() => document.getElementById("spinner-brisanje-sve").hidden = true),
              rxjs.concatMap(() => rxjs.timer(1000)),
              rxjs.tap(() => {
                document.getElementById("obavijest-radnja-brisanje-sve").hidden = true
                $('#obrisiLokacijeModal').modal('hide');
                document.getElementById("biti-ce-obrisani").innerHTML = "Navedene lokacije će biti izbrisane: \n"
                document.getElementById("biti-ce-obrisani").hidden = false
                document.getElementById("odustani-gumb-brisanje-sve").disabled = false;
              })
            ).subscribe()
          }() :
          function () {
            document.getElementById("obavijest-radnja-brisanje-sve").textContent = Object.values(odgovor.odg.greske).join('\n');
            rxjs.timer(400).pipe(
              rxjs.tap(() => document.getElementById("spinner-brisanje-sve").hidden = true),
              rxjs.concatMap(() => rxjs.timer(600)),
              rxjs.tap(() => {
                document.getElementById("biti-ce-obrisani").hidden = false
                document.getElementById("odustani-gumb-brisanje-sve").disabled = false;
              })).subscribe()
          }()
      })).subscribe();

    rxjs.fromEvent(document.getElementById('odustani-gumb-brisanje-sve'), 'click').pipe(
      rxjs.tap(() => {
        document.getElementById("biti-ce-obrisani").hidden = true;
        document.getElementById("biti-ce-obrisani").innerHTML = "Navedene lokacije će biti izbrisane: \n"
      })
    ).subscribe()
  }

  const ucitajDatoteku = () => {
    if (document.getElementById('upload-lokacije') == undefined)
      return

    rxjs.fromEvent(document.getElementById('upload-lokacije'), 'click')
      .pipe(
        rxjs.concatMap(() => rxjs.fromEvent(document.getElementById('formFile'), 'change').pipe(
          rxjs.map((event) => event.target.value),
          rxjs.map((value) => !!value),
          rxjs.startWith(false))
        )).subscribe(vrijednost => document.getElementById('ucitaj-lokacije-gumb').disabled = !vrijednost)

    let formData
    rxjs.fromEvent(document.getElementById('ucitaj-lokacije-gumb'), 'click').pipe(
      rxjs.tap(() => {
        formData = new FormData();
        document.getElementById("spinner-upload").hidden = false;
        document.getElementById("ucitaj-lokacije-gumb").disabled = true
        document.getElementById("odustani-gumb-upload").disabled = true;
      }),
      rxjs.concatMap(() => {
        formData.append('file', (document.getElementById("formFile")).files[0]);

        return posaljiZahtjevSaTokenom("/api/foiPodaci/ucitajDatoteku", "POST", formData)
      }),
      rxjs.tap(odgovor => {
        document.getElementById("formFile").hidden = true;
        document.getElementById("upload-datoteke-poruka").hidden = false
        odgovor.statusniKod === 200 ?
          function () {
            document.getElementById("upload-datoteke-poruka").textContent = odgovor.poruka
            rxjs.timer(400).pipe(
              rxjs.tap(() => document.getElementById("spinner-upload").hidden = true),
              rxjs.concatMap(() => rxjs.timer(1000)),
              rxjs.tap(() => {
                document.getElementById("upload-datoteke-poruka").hidden = true
                document.getElementById("formFile").hidden = false
                document.getElementById("formFile").value = ""
                formData = new FormData()
                $('uploadDatotekeModal').modal('hide');
                document.getElementById("upload-datoteke-poruka").hidden = false
                document.getElementById("odustani-gumb-upload").disabled = false;
              })).subscribe()
          }() :
          function () {
            document.getElementById("upload-datoteke-poruka").textContent = Object.values(odgovor.greske).join('\n');
            rxjs.timer(400).pipe(
              rxjs.tap(() => document.getElementById("spinner-upload").hidden = true),
              rxjs.concatMap(() => rxjs.timer(800)),
              rxjs.tap(() => {
                formData = new FormData()
                document.getElementById("formFile").value = ""
                document.getElementById("formFile").hidden = false
                document.getElementById("odustani-gumb-upload").disabled = false;
              })).subscribe()
          }()
      })).subscribe();

    rxjs.fromEvent(document.getElementById('odustani-gumb-upload'), 'click').pipe(
      rxjs.tap(() => {
        formData = new FormData()
      })
    ).subscribe()
  }

  dodajLokaciju()
  obrisiLokaciju()
  obrisiLokacije()
  azurirajLokaciju()
  ucitajDatoteku()

  mapirajFoiLokacijeUDropDownListu().pipe(
    rxjs.tap(() => {
      mapirajFoiLokacijeStranicenjeDropDown(odabraneLokacije)
      dajMaxITrenutno().subscribe()
      dohvatiDane().subscribe()
    }),
  ).subscribe()

  dohvatiKorisnika().subscribe(() => {
    pratiWebUtičnicu()
    registrirajSeNaSlusanje()
    zapocniSaSlusanjemFiltriranja()
    pratiStanjeGumba()
  })

  osvjeziPovijestLokacija()
  postaviPregledTjednaZaOdabranuLokaciju()
  promjenaPromjenePrikazaMjerenja()
  promjenaOdabranihLokacija()
  pripremiKlikNaSat()
  periodicnoAzurirajMaxITrenutno()
})