import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import { InvoicesService } from "./invoices.service";
import { InvoicesController } from "./invoices.controller";
import { Invoice } from "./invoice.entity";
import { RiskModule } from "../risk/risk.module";
import { StellarModule } from "../stellar/stellar.module";
import { diskStorage } from "multer";
import { extname } from "path";

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice]), 
    RiskModule, 
    StellarModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/invoices';
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => (Math.round(Math.random() * 16)).toString(16))
            .join('');
          const fileExt = extname(file.originalname);
          cb(null, `${randomName}${fileExt}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPEG, and PNG files are allowed'), false);
        }
      },
    }),
  ],
  providers: [InvoicesService],
  controllers: [InvoicesController],
  exports: [InvoicesService],
})
export class InvoicesModule {}
