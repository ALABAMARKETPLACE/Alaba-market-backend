import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiParam,
  ApiTags,
  ApiOkResponse,
} from "@nestjs/swagger";
import { UserService } from "./user.services";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { User } from "./user.entity";
import { UserEmailUpdateDto } from "./dto/user_email.update.dto";
import { UserPhoneUpdateDto } from "./dto/user_phone.update.dto";
import { UserNameUpdateDto } from "./dto/user_name.update.dto";
import { UserUpdateProfilePicture } from "./dto/user_update.dto";
import {
  UserAddPasswordUpdateDto,
  UserPasswordUpdateDto,
} from "./dto/updatePassword.dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { CheckUserExistDto } from "./dto/checkUserExist.dto";
import { PageOptionsForUsersAll } from "./dto/getUsersforAdmin.dto";
import { UserId } from "../shared/decorator/userId_decorator";
import { VerityDeactivateIdToken } from "./dto/verifyIdToken.dto";
import { RemovePasswordInterceptor } from "../shared/interceptor/remove-password.interceptor";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { UserDto } from "./dto/user.dto";
import { ApiPaginatedResponse } from "../shared/decorator/dto-paginated.decorator";

@Controller("user")
@ApiTags("user")
export class UserController {
  constructor(private readonly UserService: UserService) {}

  //to get list of all users on nextme only for admin.
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get()
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiPaginatedResponse(UserDto)
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(
    @Query() pageOptions: PageOptionsForUsersAll
  ): Promise<DataResponseDto> {
    return this.UserService.findAll(pageOptions);
  }

  //to refresh the user details at each time.
  @UseGuards(AuthGuard)
  @Get("refresh-user")
  @HttpCode(200)
  @ApiBearerAuth()
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiDataObjectResponse(UserDto)
  refresh(@UserId() userId: number): Promise<DataResponseDto> {
    return this.UserService.refreshUserData(userId);
  }

  //to get the currently logged-in user's details.
  @UseGuards(AuthGuard)
  @Get("me")
  @HttpCode(200)
  @ApiBearerAuth()
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiDataObjectResponse(UserDto)
  me(@UserId() userId: number): Promise<DataResponseDto> {
    return this.UserService.refreshUserData(userId);
  }

  //to get a user's details only for admin
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("details/:id")
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiDataObjectResponse(UserDto)
  @ApiParam({ name: "id", required: true })
  findOne(@Param("id", ParseIntPipe) userId: number): Promise<DataResponseDto> {
    return this.UserService.findOne(userId);
  }

  //to check if an email id or phone number already exist========================================need to remove
  @Post("check_user/validate")
  @ApiOkResponse({ type: User })
  @ApiBearerAuth()
  checkUser(@Body() data: CheckUserExistDto): Promise<DataResponseDto> {
    return this.UserService.checkUserExist(data);
  }

  //deactivate a user's account via phone number idToken needed
  @UseGuards(AuthGuard)
  @Put("deactivate")
  @ApiDataObjectResponse(UserDto)
  @ApiBearerAuth()
  deactivateUser(
    @UserId() userId: number,
    @Body() data: VerityDeactivateIdToken
  ): Promise<DataResponseDto> {
    return this.UserService.deactivateUser(userId, data);
  }

  //to update name(firstname,lastname)
  @UseGuards(AuthGuard)
  @Put("update-name")
  @ApiDataObjectResponse(UserDto)
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiBearerAuth()
  updateName(
    @UserId() userId: number,
    @Body() updateDto: UserNameUpdateDto
  ): Promise<DataResponseDto> {
    return this.UserService.updateName(userId, updateDto);
  }

  //to update existing password of a user(requires previous password)
  @UseGuards(AuthGuard)
  @Put("update-password")
  @ApiDataObjectResponse(UserDto)
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiBearerAuth()
  updatePassword(
    @UserId() UserId: number,
    @Body() updateDto: UserPasswordUpdateDto
  ): Promise<DataResponseDto> {
    return this.UserService.updatePassword(UserId, updateDto);
  }

  //to add new password for users without password(gmail signup)
  @UseGuards(AuthGuard)
  @Put("add-password")
  @ApiDataObjectResponse(UserDto)
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiBearerAuth()
  addPassword(
    @UserId() userId: number,
    @Body() updateDto: UserAddPasswordUpdateDto
  ): Promise<DataResponseDto> {
    return this.UserService.addPassword(userId, updateDto);
  }

  //to update user's email id
  @UseGuards(AuthGuard)
  @Put("update-email")
  @ApiDataObjectResponse(UserDto)
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiBearerAuth()
  updateEmail(
    @UserId() userId: number,
    @Body() updateDto: UserEmailUpdateDto
  ): Promise<DataResponseDto> {
    return this.UserService.updateEmail(userId, updateDto);
  }

  //to update user's profile picture
  @UseGuards(AuthGuard)
  @Put("update-photo")
  @ApiDataObjectResponse(UserDto)
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiBearerAuth()
  updatePhoto(
    @UserId() userId: number,
    @Body() updateDto: UserUpdateProfilePicture
  ): Promise<DataResponseDto> {
    return this.UserService.updatePhoto(userId, updateDto);
  }

  //to update phone number for a user
  @UseGuards(AuthGuard)
  @Put("update-Phone")
  @ApiDataObjectResponse(UserDto)
  @UseInterceptors(RemovePasswordInterceptor)
  @ApiBearerAuth()
  updatePhone(
    @UserId() userId: number,
    @Body() data: UserPhoneUpdateDto
  ): Promise<DataResponseDto> {
    return this.UserService.updatePhone(userId, data);
  }

  //to reactivate a user.. only for admin
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put("reactivate/:id")
  @ApiDataObjectResponse(class {})
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  reactivateUser(@Param("id") id: number): Promise<DataResponseDto> {
    return this.UserService.reactivateUser(id);
  }
}
