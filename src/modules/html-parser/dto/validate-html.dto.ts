import { IsString, IsOptional, IsArray } from 'class-validator';

export class ValidateHtmlDto {
  @IsString()
  html: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  xpathPatterns?: string[];
}
