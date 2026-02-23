import { IsString, IsNotEmpty } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  documentType: string; // 'ID', 'UNIVERSITY_ID', 'ADDRESS_PROOF', 'BANK_DETAILS'

  @IsString()
  @IsNotEmpty()
  documentUrl: string;
}

