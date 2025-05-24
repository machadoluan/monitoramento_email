// src/alert/alert.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('emailsBlock')
export class EmailBlockEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column() email: string;


    @CreateDateColumn() createdAt: Date;
}
