import { createStructuredLogger } from "../shared/logger/structured-logger";
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import * as AWS from "aws-sdk";
import sharp from "sharp";
// import * as pdfjsLib from "pdfjs-dist";
// import { createCanvas } from "canvas";
// import { pdfToPng } from "pdf-to-png-converter";
import { PDFDocument } from "pdf-lib";

const appLog = createStructuredLogger("img_compress_service");

@Injectable()
export class ImgcompressService {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.ACCESSKEYID,
      secretAccessKey: process.env.SECRETKEYID,
      region: process.env.REGION,
    });
  }

  async imgCompressAndUpload(file: Express.Multer.File): Promise<any> {
    try {
      appLog.info(
        {
          event: "image_compression_started",
          mimeType: file?.mimetype,
          sizeBytes: file?.size,
        },
        "image compression started",
      );

      const outputSharp = sharp(file.buffer);
      if (file.mimetype == "image/png") {
        outputSharp.png({ compressionLevel: 9 });
      } else {
        outputSharp.webp({ quality: 80 });
      }

      const resizedImg = await outputSharp.toBuffer();

      const dirName = process.env.DIRECTORY;
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${dirName}/${Date.now()}.jpg`,
        Body: resizedImg,
        ContentType: "image/jpeg",
      };

      const data = await this.s3.upload(params).promise();
      appLog.info(
        {
          event: "image_upload_succeeded",
          mimeType: file?.mimetype,
          originalSizeBytes: file?.size,
          compressedSizeBytes: resizedImg.length,
        },
        "image upload succeeded",
      );

      return data;
    } catch (err) {
      // ✅ LOG THE ACTUAL ERROR
      appLog.error("[imgCompressAndUpload] Error details:", {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        stack: err.stack,
      });

      if (err instanceof HttpException) throw err;

      // ✅ Throw error with actual message
      throw new InternalServerErrorException(
        err.message || "Failed to compress and upload image",
      );
    }
  }

  async uploadToS3(file: Express.Multer.File): Promise<string> {
    try {
      const bucketName = process.env.BUCKET_NAME;
      const dirName = process.env.DIRECTORY;
      const timestamp = Date.now();

      const params = {
        Bucket: bucketName,
        Key: `${dirName}/${timestamp}_${file.originalname}`, // ✅ Add timestamp to avoid duplicates
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      appLog.info("🔍 [uploadToS3] Uploading:", params.Key);
      const data = await this.s3.upload(params).promise();
      appLog.info("✅ [uploadToS3] Success:", data.Location);

      return data.Location;
    } catch (error) {
      appLog.error("[uploadToS3] Error:", error);
      throw new InternalServerErrorException(
        error.message || "Failed to upload to S3",
      );
    }
  }

  async uploadMultipleColorAndBWToS3(files: Express.Multer.File[]): Promise<{
    status: Boolean;
    data: Array<{
      colorImageUrl?: string;
      bwImageUrl?: string;
      pdfUrl?: string;
      originalName: string;
    }>;
    errorFiles?: Array<{
      filename: string;
      error: string;
    }>;
    message: String;
  }> {
    try {
      const sharp = require("sharp");
      const bucketName = process.env.BUCKET_NAME;
      const dirName = process.env.DIRECTORY;
      // const fs = require("fs");
      // const path = require("path");
      // const pdf = require("pdf-poppler");
      // const os = require("os");

      // Allowed image MIME types
      const allowedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/tiff",
        "image/avif",
        "image/svg+xml",
      ];

      const results = [];
      const errorFiles = [];

      const uploadPromises = files.map(async (file) => {
        try {
          appLog.debug(
            {
              event: "media_upload_started",
              mimeType: file?.mimetype,
              sizeBytes: file?.size,
            },
            "media upload started",
          );
          const timestamp = Date.now();

          if (file.mimetype === "application/pdf") {
            const pdfDoc = await PDFDocument.load(file?.buffer);
            const pageCount = pdfDoc.getPageCount();

            const pdfParams = {
              Bucket: bucketName,
              Key: `${dirName}/${timestamp}_${file.originalname}`,
              Body: file.buffer,
              // ACL: "public-read",
              ContentType: "application/pdf",
            };

            const pdfData = await this.s3.upload(pdfParams).promise();

            // const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-conversion-'));
            // const tempPdfPath = path.join(tempDir, file.originalname);

            // fs.writeFileSync(tempPdfPath, file.buffer);

            // const basename = path.basename(file.originalname, path.extname(file.originalname));
            // const opts = {
            //   format: 'png',
            //   out_dir: tempDir,
            //   out_prefix: basename,
            //   page: 1,
            // };

            // await pdf.convert(tempPdfPath, opts);

            // const convertedImagePath = path.join(tempDir, `${basename}-1.png`);
            // const colorImageBuffer = fs.readFileSync(convertedImagePath);

            // const bwImageBuffer = await sharp(colorImageBuffer).grayscale().toBuffer();

            // const colorParams = {
            //   Bucket: bucketName,
            //   Key: `${dirName}/${timestamp}_color_${file.originalname.replace(
            //     ".pdf",
            //     ".png"
            //   )}`,
            //   Body: colorImageBuffer,
            //   ACL: "public-read",
            //   ContentType: "image/png",
            // };

            // const bwParams = {
            //   Bucket: bucketName,
            //   Key: `${dirName}/${timestamp}_bw_${file.originalname.replace(".pdf", ".png")}`,
            //   Body: bwImageBuffer,
            //   ACL: "public-read",
            //   ContentType: "image/png",
            // };

            // const [colorData, bwData] = await Promise.all([
            //   this.s3.upload(colorParams).promise(),
            //   this.s3.upload(bwParams).promise(),
            // ]);

            return {
              // colorImageUrl: colorData.Location,
              // bwImageUrl: bwData.Location,
              pdfUrl: pdfData.Location,
              originalName: file.originalname,
              pageCount: pageCount,
            };
          } else if (allowedImageTypes.includes(file.mimetype)) {
            const bwBuffer = await sharp(file.buffer).grayscale().toBuffer();

            const colorParams = {
              Bucket: bucketName,
              Key: `${dirName}/${timestamp}_color_${file.originalname}`,
              Body: file.buffer,
              ContentType: file.mimetype,
            };

            const bwParams = {
              Bucket: bucketName,
              Key: `${dirName}/${timestamp}_bw_${file.originalname}`,
              Body: bwBuffer,
              ContentType: file.mimetype,
            };

            const [colorData, bwData] = await Promise.all([
              this.s3.upload(colorParams).promise(),
              this.s3.upload(bwParams).promise(),
            ]);

            return {
              colorImageUrl: colorData.Location,
              bwImageUrl: bwData.Location,
              originalName: file.originalname,
              pageCount: 1,
            };
          } else {
            throw new Error(`Unsupported file type: ${file.mimetype}`);
          }
        } catch (error) {
          errorFiles.push({
            filename: file.originalname,
            error: error.message || "Unknown error",
          });
          return null;
        }
      });

      const uploadResults = await Promise.all(uploadPromises);

      const successfulResults = uploadResults.filter(
        (result) => result !== null,
      );

      const allFilesUploaded = errorFiles.length === 0;
      const someFilesUploaded = successfulResults.length > 0;

      return {
        status: true,
        data: successfulResults,
        ...(errorFiles.length > 0 && { errorFiles }),
        message: allFilesUploaded
          ? "All files uploaded successfully"
          : someFilesUploaded
          ? "Some files uploaded successfully"
          : "No files were uploaded successfully",
      };
    } catch (error) {
      appLog.error("Error processing files:", error);
      throw error;
    }
  }

  async deleteFromS3(key: string) {
    try {
      const bucketName = process.env.BUCKET_NAME;
      const params = {
        Bucket: bucketName,
        Key: key,
      };
      const deleted = await this.s3
        .deleteObject(params, (error, data) => {
          appLog.info(error);
        })
        .promise();
      return deleted;
    } catch (err) {
      throw new Error("@@Failed to Remove Image from S3");
    }
  }
}
