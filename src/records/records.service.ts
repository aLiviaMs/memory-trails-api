import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { Record } from './entities/record.entity';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(Record)
    private readonly recordRepository: Repository<Record>,
  ) {}

  async create(createRecordDto: CreateRecordDto): Promise<Record> {
    const newRecord = this.recordRepository.create({
      ...createRecordDto,
      datePublished: new Date(createRecordDto.datePublished),
      isFavorite: createRecordDto.isFavorite ?? false,
    });

    return this.recordRepository.save(newRecord);
  }

  async findAll(): Promise<Record[]> {
    return this.recordRepository.find();
  }

  async findOne(id: number): Promise<Record> {
    const record = await this.recordRepository.findOneBy({ id });

    if (!record) {
      throw new NotFoundException(`ID #${id} não encontrado.`);
    }

    return record;
  }

  async update(id: number, updateRecordDto: UpdateRecordDto): Promise<Record> {
    const record = await this.recordRepository.preload({
      id: id,
      ...(updateRecordDto.datePublished && {
        datePublished: new Date(updateRecordDto.datePublished),
      }),
      ...(updateRecordDto.title && { title: updateRecordDto.title }),
      ...(updateRecordDto.description && {
        description: updateRecordDto.description,
      }),
      ...(updateRecordDto.isFavorite !== undefined && {
        isFavorite: updateRecordDto.isFavorite,
      }),
    });

    if (!record) {
      throw new NotFoundException(`ID #${id} não encontrado para atualização.`);
    }

    return this.recordRepository.save(record);
  }

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.recordRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`ID #${id} não encontrado para remoção.`);
    }

    return { message: `ID #${id} removido com sucesso.` };
  }
}
