// src/alert/alert.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('emails')
export class EmailEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column() email: string;
    @Column() senha: string;
    @Column() chatId: string;


    @CreateDateColumn() createdAt: Date;

}
