import { IsNumberString, IsString } from "class-validator"

export class OauthQueries {
    @IsString()
    code: string

    @IsString()
    scope: string

    @IsNumberString()
    authuser: string

    @IsString()
    prompt: string
}

export class ExchangeSessionDto {
    @IsString()
    sessionKey: string;
}