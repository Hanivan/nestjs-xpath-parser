import { ScraperHtmlModule } from '@commons/commons/scraper-html';
import { Module } from '@nestjs/common';
import { HtmlParserController } from './html-parser.controller';
import { HtmlParserService } from './html-parser.service';

@Module({
  imports: [ScraperHtmlModule],
  controllers: [HtmlParserController],
  providers: [HtmlParserService],
})
export class HtmlParserModule {}
