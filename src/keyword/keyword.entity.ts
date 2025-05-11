// src/keyword/keyword.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('keywords')
export class Keyword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  word: string;
}
