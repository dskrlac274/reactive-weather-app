export const konfiguracija = {
    bp: {
        tip_baze: 'mysql' as 'mysql',
        domacin: 'mysqldb',
        otvor: 3306,
        korisnico_ime: 'root',
        lozinka: 'password',
        ime_baze: 'zavrsni',
        broj_ponovnih_pokusaja: 10,
        automatsko_ucitavanje_entiteta: true,
        sinkronizacija: false,
        predmemoriranje: true
    },
    aut: {
        jwt_kljuc: "apiuwrqirdaksfaielwJFKasdasdasdwrgfvbgnn",
        api_kljuc: "supermegatajniultrazakonapikljucdadadada"
    },
    email: {
        transport: {
            host: 'smtp.mailtrap.io',
            port: 2525,
            debug: true,
            auth: {
                user: 'e12771c652075e',
                pass: '264babe9d106d5',
            },
        },
        zadano: {
            from: '',
        },
    },
    sesija: {
        secret: "DASDbvWREjkEASDztfSAGnbvcHTRehtzjTRfwfeQEWfwfeDSAwefFefwGefwefwHG",
        resave: false,
        saveUninitialized: false,
    },
    server: {
        port: 3000,
        domain: 'localhost'
    },
    vanjski_podaci: {
        api_kljuc: "57b8f40f9a8b0c79e8fd92aaf974cd5d"
    }
};