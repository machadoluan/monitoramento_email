// src/keyword/keyword.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('blockwords')
export class BlockWord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  word: string;
}
