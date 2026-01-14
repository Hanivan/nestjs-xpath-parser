import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsEnum,
  IsObject,
} from 'class-validator';

export enum PatternType {
  XPATH = 'xpath',
}

export enum ReturnType {
  TEXT = 'text',
  RAW_HTML = 'rawHTML',
}

export class PatternMeta {
  @IsOptional()
  @IsBoolean()
  multiple?: boolean;

  @IsOptional()
  @IsBoolean()
  multiline?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alterPattern?: string[];

  @IsOptional()
  @IsBoolean()
  isContainer?: boolean;

  @IsOptional()
  @IsBoolean()
  isPage?: boolean;
}

export class CleanerRule {
  @IsString()
  from: string;

  @IsString()
  to: string;
}

export class CleanerStepRules {
  @IsOptional()
  @IsBoolean()
  trim?: boolean;

  @IsOptional()
  @IsBoolean()
  toLowerCase?: boolean;

  @IsOptional()
  @IsBoolean()
  toUpperCase?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CleanerRule)
  replace?: CleanerRule[];

  @IsOptional()
  @IsBoolean()
  decode?: boolean;
}

export class PatternField {
  @IsString()
  key: string;

  @IsEnum(PatternType)
  patternType: PatternType;

  @IsEnum(ReturnType)
  returnType: ReturnType;

  @IsArray()
  @IsString({ each: true })
  patterns: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PatternMeta)
  meta?: PatternMeta;

  @IsOptional()
  @ValidateNested()
  @Type(() => CleanerStepRules)
  pipes?: CleanerStepRules;
}

export class ParseHtmlDto {
  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PatternField)
  patterns: PatternField[];

  @IsOptional()
  @IsBoolean()
  useProxy?: boolean;
}
