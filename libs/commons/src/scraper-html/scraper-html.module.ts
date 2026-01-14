import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScraperHtmlService } from './scraper-html.service';

@Module({
  imports: [HttpModule],
  providers: [ScraperHtmlService],
  exports: [ScraperHtmlService],
})
export class ScraperHtmlModule {}
