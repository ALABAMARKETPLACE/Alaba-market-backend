import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { Observable, catchError, lastValueFrom, map } from "rxjs";
import { AxiosResponse } from "axios";
import { GooglePlacePickerDto } from "./dto/queryParams";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { AutoCompleteDto } from "./dto/autoComplete";

@Injectable()
export class GoogleProxyService {
  constructor(private readonly httpService: HttpService) {}
  async placePicker({ latitude, longitude, place_id }: GooglePlacePickerDto) {
    try {
      const url = place_id
        ? `${process.env.GOOGLE_API_GEOCODE}?place_id=${place_id}&key=${process.env.GGL_TOKEN}`
        : latitude && longitude
        ? `${process.env.GOOGLE_API_GEOCODE}?latlng=${latitude},${longitude}&key=${process.env.GGL_TOKEN}`
        : "";
      const response: any = this.httpService
        .get(url, {
          headers: {
            Accept: "application/json",
          },
        })
        .pipe(
          map((resp) => resp.data),
          catchError((e) => {
            throw new HttpException(e.response.data, e.response.status);
          })
        );
      const data = this.getProperties(await lastValueFrom(response));
      return new DataResponseDto(data);
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  getProperties(response: any) {
    try {
      const address: any = {};
      if (response?.status !== "OK" || !Array.isArray(response?.results))
        return null;
      for (const item of response.results) {
        if (!Array.isArray(item?.address_components)) continue;
        for (const address_component of item?.address_components) {
          const types = address_component.types;
          const long_name = address_component?.long_name;
          if (types.includes("plus_code")) address.plus_code = long_name;
          if (types.includes("country")) address.country = long_name;
          if (types.includes("postal_code")) address.postal_code = long_name;
          if (types.includes("administrative_area_level_1"))
            address.state = long_name;
          if (types.includes("administrative_area_level_4"))
            address.taluk = long_name;
          if (types.includes("street_address"))
            address.street_address = long_name;
          if (types.includes("administrative_area_level_3"))
            address.district = long_name;
          if (types.includes("route")) address.route = long_name;
          if (types.includes("locality")) address.locality = long_name;
          if (
            types.includes("sublocality") ||
            types.includes("sublocality_level_1")
          )
            address.subLocality = long_name;
        }
        if (item.types?.includes("premise"))
          address.premise = item?.formatted_address;
        if (item.types?.includes("street_address"))
          address.street_address = item?.formatted_address;
        address["place_id"] = item.place_id;
        address["latitude"] = item.geometry?.location?.lat;
        address["longitude"] = item.geometry?.location?.lng;
        address["full_address"] = item?.formatted_address;
        address["type"] = item?.geometry?.location_type;
        if (item?.geometry?.location_type == "GEOMETRIC_CENTER") break;
        if (item?.geometry?.location_type == "ROOFTOP") break;
      }
      return address;
    } catch (err) {
      return null;
    }
  }

  async autoComplete({ query }: AutoCompleteDto) {
    try {
      const response: any = this.httpService
        .get(
          `${process.env.GOOGLE_API_AUTOCOMPLETE}?input=${query}&key=${process.env.GGL_TOKEN}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        )
        .pipe(
          map((resp) => resp.data),
          catchError((e) => {
            throw new HttpException(e.response.data, e.response.status);
          })
        );
      const data: any = await lastValueFrom(response);
      if (data?.status !== "OK" || !Array.isArray(data?.predictions))
        throw new NotFoundException("Location is not found..");
      const predictions = data?.predictions?.reduce((acc, item) => {
        acc.push({
          value: item?.description,
          key: item?.place_id,
        });
        return acc;
      }, []);
      return new DataResponseDto(predictions);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException();
    }
  }
}
