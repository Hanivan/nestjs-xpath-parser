import { Module } from '@nestjs/common';
import { CommonsService } from './commons.service';
import { ScraperHtmlModule } from './scraper-html/scraper-html.module';

@Module({
  providers: [CommonsService],
  exports: [CommonsService],
  imports: [ScraperHtmlModule],
})
export class CommonsModule {}
