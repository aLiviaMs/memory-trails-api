import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('records')
export class Record {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'timestamp with time zone', nullable: false })
  datePublished: Date;

  @Column({ type: 'boolean', default: false })
  isFavorite: boolean;
}
