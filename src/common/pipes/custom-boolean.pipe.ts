import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class OptionalBooleanPipe implements PipeTransform {
  transform(value: any): boolean | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    
    if (value === 'true' || value === true) {
      return true;
    }
    
    if (value === 'false' || value === false) {
      return false;
    }
    
    throw new BadRequestException('isFavorite must be true, false, or omitted');
  }
}