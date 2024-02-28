const fs = require('fs');
const path = require('path');

const ucitajPodatkeStranice = (fileName: string) => fs.readFileSync(path.join(__dirname + "../../Pogledi", `./${fileName}.html`), 'utf-8');
export const zaglavlje = ucitajPodatkeStranice('./Okviri/zaglavlje')
export const podnozje = ucitajPodatkeStranice('./Okviri/podnozje')
export const bocnaNavigacijaGost = ucitajPodatkeStranice('./Okviri/bocnaNavigacijaGost')
export const bocnaNavigacijaKorisnik = ucitajPodatkeStranice('./Okviri/bocnaNavigacijaKorisnik')
export const bocnaNavigacijaProfesor = ucitajPodatkeStranice('./Okviri/bocnaNavigacijaProfesor')
export const bocnaNavigacijaAdmin = ucitajPodatkeStranice('./Okviri/bocnaNavigacijaAdmin')

const ucitajStranicu = (fileName: string) => ucitajPodatkeStranice(fileName)

export const foiLokacije = ucitajStranicu('./FoiLokacijePodaci/foiLokacijePodaci')
export const gradLokacije = ucitajStranicu('./GradLokacijePodaci/gradLokacijePodaci')
export const prijava = ucitajStranicu('./Prijava/prijava')
export const main = ucitajStranicu('./Main/main')
export const pocetna = ucitajStranicu('./Pocetna/pocetna')
export const registracija = ucitajStranicu('./Registracija/registracija')
export const profil = ucitajStranicu('./Profil/profil')
export const docs = ucitajStranicu('./Dokumentacija/docs')
export const korisnici = ucitajStranicu('./Korisnici/korisnici')
export const lokacije = ucitajStranicu('./Lokacije/lokacije')
export const profesor = ucitajStranicu('./Okviri/profesor')
export const profesorUcitavanje = ucitajStranicu('./Okviri/profesorUcitavanje')

export const pravoPristupa = ucitajStranicu('./Okviri/pravoPristupa')
export const aktivacija = ucitajStranicu('./Okviri/aktivacija')

export const testiranje = ucitajStranicu('./test')



