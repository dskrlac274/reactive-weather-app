import { IsNotEmpty, IsDefined } from 'class-validator';

export class FileImportPodaciDTO {

  @IsDefined()
  @IsNotEmpty()
  datoteka: any;
}