import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
@Injectable()
export class PdfService {
  async PdfGen(data: any) {
    try {
      let Modal = data;
      const html = Buffer.from(Modal, 'utf-8');
      const convertedString = html.toString('utf-8');
      const browser = await puppeteer.launch({});
      const page = await browser.newPage();
      await page.setContent(convertedString);
      const pdfOptions: any = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      };
      const buffer: any = await page.pdf(pdfOptions);
      await browser.close();
      let obj = {
        status: true,
        data: buffer,
      };
      return obj;
    } catch (err) {
      console.log('err = = = >', err);
    }
  }

  
}
