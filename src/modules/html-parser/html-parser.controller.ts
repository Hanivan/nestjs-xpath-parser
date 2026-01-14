import { Body, Controller, Post } from '@nestjs/common';
import { HtmlParserService } from './html-parser.service';
import { ParseHtmlDto } from './dto/parse-html.dto';
import { ValidateHtmlDto } from './dto/validate-html.dto';

@Controller('html')
export class HtmlParserController {
  constructor(private readonly htmlParserService: HtmlParserService) {}

  @Post('parse')
  async parse(@Body() parseHtmlDto: ParseHtmlDto) {
    return this.htmlParserService.parse(parseHtmlDto);
  }

  @Post('validate')
  async validate(@Body() validateHtmlDto: ValidateHtmlDto) {
    return this.htmlParserService.validate(validateHtmlDto);
  }
}
