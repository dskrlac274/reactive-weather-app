import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [MongooseModule.forRoot("mongodb://mongodb/zavrsni?replicaSet=rs0", { directConnection: true })],
    controllers: [],
    providers: []
})
export class MongoBazaPodatakaModul { }
