import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HtmlParserModule } from './modules/html-parser/html-parser.module';

@Module({
  imports: [HtmlParserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
