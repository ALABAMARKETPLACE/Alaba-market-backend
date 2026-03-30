import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { TokenManagement } from "./entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class TokenManagementService {
  constructor(
    @Inject("TokenManagementRepository")
    private readonly tokenRepository: typeof TokenManagement,
    @Inject("createRefreshToken2")
    private readonly createRefreshToken: (
      data: TokenManagement,
    ) => Promise<string>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private jwtService: JwtService,
  ) {}

  async createToken(userId: number): Promise<[string, number]> {
    try {
      const created = await this.tokenRepository.create({
        userId,
      });
      const token = await this.createRefreshToken(created);
      return [token, created.fid];
    } catch (err) {
      return null;
    }
  }
  async deleteToken(fid: number) {
    try {
      const deleted = await this.tokenRepository.destroy({ where: { fid } });
      return true;
    } catch (err) {
      return false;
    }
  }
  async regenerateToken(otp: number, fid: number): Promise<[string, number]> {
    try {
      const user = await this.tokenRepository.findOne({ where: { otp } });
      if (!user) {
        await this.tokenRepository.destroy({ where: { fid } });
        await this.signOut(fid);
        throw new UnauthorizedException("Unauthorized Access.");
      }
      await this.tokenRepository.destroy({ where: { otp } });
      const created = await this.tokenRepository.create({
        userId: user.userId,
        fid,
      });
      const token = await this.createRefreshToken(created);
      return [token, user.userId];
    } catch (err) {
      throw err;
    }
  }

  async signOut(fid: number) {
    try {
      if (fid) {
        const blacklist = await this.cacheManager.set(String(fid), true);
        await this.deleteToken(fid);
        return new DataResponseDto({}, true, "Signed out successfully");
      }
      return new DataResponseDto({}, false, "failed to sigout");
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async signoutFromAll(userId: number) {
    try {
      const log = await this.tokenRepository.findAll({
        attributes: ["fid"],
        where: { userId },
      });
      for (const item of log) {
        const blacklist = await this.cacheManager.set(String(item?.fid), true);
      }
      await this.tokenRepository.destroy({ where: { userId } });
      return log;
    } catch (err) {
      throw err;
    }
  }
}
