import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min, IsArray, ValidateIf } from 'class-validator';
import { PostType } from '@prisma/client';

export class CreatePostDto {
    @IsEnum(PostType)
    @IsOptional() // inferred from role if missing
    type?: PostType;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    subject: string;

    // Student Request specific
    @IsString()
    @IsOptional()
    grade?: string;

    @IsString()
    @IsOptional()
    syllabus?: string;

    // Teacher Offering specific
    @IsNumber()
    @IsOptional()
    fee?: number;

    @IsNumber()
    @IsOptional()
    experience?: number;


}
