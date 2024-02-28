CREATE TABLE IF NOT EXISTS tip_korisnika (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  naziv VARCHAR(50) NOT NULL,
  opis TEXT NULL,
  UNIQUE (naziv));

 CREATE TABLE IF NOT EXISTS status_korisnika (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  naziv VARCHAR(50) NOT null UNIQUE,
  opis TEXT NULL,
  UNIQUE (naziv));
  
CREATE TABLE IF NOT EXISTS korisnik (
  id INTEGER PRIMARY KEY AUTO_INCREMENT NOT NULL,
  `ime` VARCHAR(50) not NULL,
  `prezime` VARCHAR(50) NOT NULL,
  `lozinka` VARCHAR(64) NOT NULL,
  `korime` VARCHAR(20) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `aktivacijski_kod` VARCHAR(6) NOT NULL,
  `adresa` TEXT NULL,
  `api_kljuc` VARCHAR(100) NULL,
  tip_korisnika_id INTEGER NOT NULL,
  status_korisnika_id INTEGER NOT NULL,
  FOREIGN KEY (status_korisnika_id) REFERENCES status_korisnika(id),
  FOREIGN KEY (tip_korisnika_id) REFERENCES tip_korisnika(id));
  
 CREATE TABLE IF NOT EXISTS grad (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  ime VARCHAR(50) NOT NULL,
  zemljopisna_sirina DECIMAL(16, 12) not null,
  zemljopisna_duzina DECIMAL(16, 12) not null,
  drzava_id INTEGER NOT NULL,
  FOREIGN KEY (drzava_id) REFERENCES drzava(id),
  UNIQUE (ime)
);

 CREATE TABLE IF NOT EXISTS drzava (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  oznaka VARCHAR(20) NOT null,
  UNIQUE (oznaka));

CREATE TABLE IF NOT EXISTS favoriti (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  korisnik_id INTEGER NOT NULL,
  grad_id INTEGER NOT NULL,
  FOREIGN KEY (korisnik_id) REFERENCES korisnik(id) on delete CASCADE,
  FOREIGN KEY (grad_id) REFERENCES grad(id) on delete CASCADE,
  UNIQUE (korisnik_id, grad_id)
);

 CREATE TABLE IF NOT EXISTS grad_podaci (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  grad_id INTEGER NOT NULL,
  vrijeme_mjerenja VARCHAR(50) NOT NULL,
  temperatura FLOAT NOT NULL,
  vlaga FLOAT NOT NULL,
  tlak FLOAT NOT null,
  prognoza BOOLEAN not null,
  FOREIGN KEY (grad_id) REFERENCES grad(id) on delete CASCADE
);
 
  INSERT INTO `tip_korisnika` (`id`, `naziv`, `opis`) VALUES
(1, 'admin', NULL);

 INSERT INTO `tip_korisnika` (`id`, `naziv`, `opis`) VALUES
(2, 'profesor', NULL);

 INSERT INTO `tip_korisnika` (`id`, `naziv`, `opis`) VALUES
(3, 'korisnik', NULL);

 INSERT INTO `tip_korisnika` (`id`, `naziv`, `opis`) VALUES
(4, 'gost', NULL);

 INSERT INTO `status_korisnika` (`id`, `naziv`, `opis`) VALUES
(1, 'aktiviran', NULL);

 INSERT INTO `status_korisnika` (`id`, `naziv`, `opis`) VALUES
(2, 'neaktiviran', NULL);

 INSERT INTO `status_korisnika` (`id`, `naziv`, `opis`) VALUES
(3, 'blokiran', NULL);
